/**
 * Attribution & commission regression tests (run: npm run test:attribution).
 * Covers the referral -> checkout -> PAID -> distribution -> wallet circuit:
 *   TEST 1  referred buyer purchase -> 30% direct + L1..L5 chain + 45% + 10%
 *   TEST 2  buyer without affiliate -> direct sale split, nothing invented
 *   TEST 3  creator as buyer -> attribution NOT cancelled
 *   TEST 4  creator buying own product -> blocked
 *   TEST 5  buyer registered with ?ref= but buys later without it -> attributed
 *   TEST 6  double PAID processing -> commissions only once (idempotent)
 * plus pure computeSplit unit assertions.
 */
import prisma from "@/lib/db";
import { computeSplit } from "@/lib/commissions";
import {
  ensureAffiliate,
  registerReferral,
} from "@/server/services/affiliate";
import {
  createOrderWithPayment,
  resolveSaleAttribution,
} from "@/server/services/orders";
import { confirmOrderPayment } from "@/server/services/settlement";
import { distributeCommissions } from "@/server/services/distribution";
import { ensureWallet, getWalletOverview } from "@/server/services/wallet";

let failures = 0;
function assert(condition: boolean, label: string) {
  if (condition) {
    console.log("  PASS", label);
  } else {
    failures += 1;
    console.error("  FAIL", label);
  }
}
const approx = (a: number, b: number) => Math.abs(a - b) < 1e-6;
const EMAIL = (n: string) => `testattr-${n}-${Date.now()}@crow.test`;

async function makeUser(name: string, roles: string) {
  return prisma.user.create({
    data: {
      name,
      email: EMAIL(name),
      passwordHash: "test-no-login",
      roles,
      profile: { create: {} },
    },
  });
}

const sumRole = (snapshot: { role: string; amount: number }[], role: string) =>
  snapshot.filter((l) => l.role === role).reduce((s, l) => s + l.amount, 0);

async function main() {
  /* ---------- computeSplit unit tests ---------- */
  console.log("\n[UNIT] computeSplit");
  const chain = ["U-DIRECT", "U-L1", "U-L2", "U-L3", "U-L4", "U-L5"];
  const full = computeSplit({ amount: 100, creatorId: "U-CREATOR", affiliateUpline: chain });
  assert(approx(full.totalRate, 1), "split total = 100%");
  const direct = full.lines.find((l) => l.role === "DIRECT_AFFILIATE")!;
  assert(direct.userId === "U-DIRECT" && approx(direct.amount, 30), "direct affiliate 30%");
  assert(full.lines.find((l) => l.role === "L1")!.userId === "U-L1", "L1 va a upline[1]");
  assert(full.lines.find((l) => l.role === "L2")!.userId === "U-L2", "L2 va a upline[2]");
  assert(full.lines.find((l) => l.role === "L5")!.userId === "U-L5", "L5 va a upline[5]");
  assert(approx(full.lines.find((l) => l.role === "CREATOR")!.amount, 45), "creator 45%");
  assert(
    approx(full.lines.find((l) => l.role === "PLATFORM")!.amount, 12) &&
      approx(full.totalAmount, 100),
    "cadena completa -> platform absorbe residual (12%), total 100",
  );
  const solo = computeSplit({ amount: 100, creatorId: "U-CREATOR", affiliateUpline: [] });
  assert(approx(solo.lines.find((l) => l.role === "PLATFORM")!.amount, 55), "sin afiliado -> 55% platform");
  const firstUnlock = computeSplit({
    amount: 100,
    creatorId: "U-CREATOR",
    affiliateUpline: chain,
    isFirstL1Unlock: true,
  });
  assert(
    approx(firstUnlock.lines.find((l) => l.role === "L1")!.amount, 2.5) &&
      approx(firstUnlock.lines.find((l) => l.role === "EMERGENCY_RESERVE")!.amount, 2.5),
    "primer desbloqueo L1 -> 2.5% + 2.5% reserva",
  );

  /* ---------- fixtures ---------- */
  const creator = await makeUser("CreatorA", "BUYER,CREATOR");
  const rootU = await makeUser("RootAff", "BUYER,AFFILIATE");
  const midU = await makeUser("MidAff", "BUYER,AFFILIATE");
  const directU = await makeUser("DirectX", "BUYER,AFFILIATE");
  const buyerB = await makeUser("BuyerB", "BUYER");
  const creatorBuyer = await makeUser("CreatorB", "BUYER,CREATOR");
  for (const u of [buyerB, creatorBuyer, creator, directU]) await ensureWallet(u.id);

  const root = await ensureAffiliate(rootU.id);
  const mid = await ensureAffiliate(midU.id, root.id);
  const dx = await ensureAffiliate(directU.id, mid.id);

  const product = await prisma.product.create({
    data: {
      creatorId: creator.id,
      slug: `testattr-marketing-${Date.now()}`,
      title: "Curso Test - Marketing Digital",
      shortDescription: "Test",
      description: "Test",
      type: "EBOOK",
      category: "Ebook",
      priceUsdt: 100,
      status: "PUBLISHED",
    },
  });

  /* ---------- TEST 5: durable attribution from registration ---------- */
  console.log("\n[TEST 5] Buyer registrado con ?ref= compra despues sin el codigo");
  await registerReferral(dx.referralCode, buyerB.id);
  const order1 = await createOrderWithPayment({
    buyerId: buyerB.id,
    productId: product.id,
    referralCode: null,
  });
  const stored1 = await prisma.order.findUnique({
    where: { id: order1.orderId },
    select: { referralCode: true },
  });
  assert(stored1?.referralCode === dx.referralCode, "orden conserva la atribucion de X");

  /* ---------- TEST 1: distribution on PAID ---------- */
  console.log("\n[TEST 1] Venta atribuida -> comisiones 45/10/30/5/3");
  const res1 = await confirmOrderPayment({ orderId: order1.orderId });
  assert(res1.alreadyPaid === false && res1.snapshot.length > 0, "distribucion ejecutada");
  assert(approx(sumRole(res1.snapshot, "CREATOR"), 45), "creator recibe 45");
  assert(approx(sumRole(res1.snapshot, "PLATFORM"), 17), "CROW absorbe niveles faltantes -> 17");
  assert(approx(sumRole(res1.snapshot, "DIRECT_AFFILIATE"), 30), "afiliado directo X recibe 30");
  assert(
    approx(sumRole(res1.snapshot, "L1"), 2.5) &&
      approx(sumRole(res1.snapshot, "EMERGENCY_RESERVE"), 2.5),
    "primer desbloqueo L1 -> 2.5% affiliate + 2.5% reserva",
  );
  const unlocked = await prisma.affiliate.findUnique({ where: { id: dx.id } });
  assert(unlocked?.level1Unlocked === true, "flag level1Unlocked activado");
  assert(approx(res1.snapshot.reduce((s, l) => s + l.amount, 0), 100), "distribucion total = 100%");
  const l1User = res1.snapshot.find((l) => l.role === "L1")!.userId;
  const l2User = res1.snapshot.find((l) => l.role === "L2")!.userId;
  assert(l1User === midU.id && l2User === rootU.id, "cadena L1-L5 calculada desde X");
  const wDx = await getWalletOverview(directU.id);
  assert((wDx.commissionTotal ?? 0) > 0, "wallet de X acredita la comision");
  const wCreator = await getWalletOverview(creator.id);
  assert((wCreator.commissionTotal ?? 0) > 0, "wallet del creator acredita su 45%");

  /* ---------- TEST 6: idempotency ---------- */
  console.log("\n[TEST 6] Doble procesamiento PAID");
  const again = await confirmOrderPayment({ orderId: order1.orderId });
  assert(again.alreadyPaid === true, "segunda confirmacion -> alreadyPaid");
  const countAfter = await prisma.commission.count({ where: { orderId: order1.orderId } });
  await distributeCommissions(order1.orderId);
  const countAfterDouble = await prisma.commission.count({ where: { orderId: order1.orderId } });
  assert(countAfter === countAfterDouble && countAfter > 0, "las comisiones no se duplican");

  /* ---------- TEST 3: creator as buyer keeps attribution ---------- */
  console.log("\n[TEST 3] Creator compra producto de otro creator via afiliado X");
  await registerReferral(dx.referralCode, creatorBuyer.id);
  const order3 = await createOrderWithPayment({
    buyerId: creatorBuyer.id,
    productId: product.id,
    referralCode: null,
  });
  const stored3 = await prisma.order.findUnique({
    where: { id: order3.orderId },
    select: { referralCode: true },
  });
  assert(stored3?.referralCode === dx.referralCode, "atribucion no anulada por rol CREATOR");
  const res3 = await confirmOrderPayment({ orderId: order3.orderId });
  assert(approx(sumRole(res3.snapshot, "DIRECT_AFFILIATE"), 30), "X recibe 30% igualmente");
  assert(approx(sumRole(res3.snapshot, "CREATOR"), 45), "creator A recibe 45%");

  /* ---------- TEST 2: buyer without affiliate ---------- */
  console.log("\n[TEST 2] Compra directa sin afiliado");
  const anon = await makeUser("BuyerDirect", "BUYER");
  await ensureWallet(anon.id);
  const order2 = await createOrderWithPayment({
    buyerId: anon.id,
    productId: product.id,
    referralCode: null,
  });
  const stored2 = await prisma.order.findUnique({
    where: { id: order2.orderId },
    select: { referralCode: true },
  });
  assert(stored2?.referralCode === null, "no se inventa afiliado");
  const res2 = await confirmOrderPayment({ orderId: order2.orderId });
  assert(res2.snapshot.every((l) => l.role !== "DIRECT_AFFILIATE"), "sin comision de afiliado");
  assert(approx(sumRole(res2.snapshot, "CREATOR"), 45), "creator 45 en venta directa");
  assert(approx(sumRole(res2.snapshot, "PLATFORM"), 55), "platform 55 en venta directa");

  /* ---------- TEST 4 + rule 12: self purchase / self referral ---------- */
  console.log("\n[TEST 4/12] Auto-compra y auto-referencia bloqueadas");
  let blocked = false;
  try {
    await createOrderWithPayment({ buyerId: creator.id, productId: product.id, referralCode: null });
  } catch {
    blocked = true;
  }
  assert(blocked, "creator no puede comprar su propio producto");
  const selfAttribution = await resolveSaleAttribution(directU.id, dx.referralCode);
  assert(selfAttribution === null, "auto-referencia neutralizada");

  await cleanup([
    creator.id,
    rootU.id,
    midU.id,
    directU.id,
    buyerB.id,
    creatorBuyer.id,
    anon.id,
  ], creator.id);
  console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
}

async function cleanup(userIds: string[], creatorId: string) {
  const ids = userIds;
  const orders = await prisma.order.findMany({
    where: { buyerId: { in: ids } },
    select: { id: true },
  });
  const orderIds = orders.map((o) => o.id);
  const products = await prisma.product.findMany({
    where: { creatorId },
    select: { id: true },
  });
  const productIds = products.map((p) => p.id);
  const affiliates = await prisma.affiliate.findMany({
    where: { userId: { in: ids } },
    select: { id: true },
  });
  const affiliateIds = affiliates.map((a) => a.id);

  await prisma.commission.deleteMany({
    where: { OR: [{ earnerId: { in: ids } }, { orderId: { in: orderIds } }] },
  });
  await prisma.transaction.deleteMany({
    where: { OR: [{ userId: { in: ids } }, { orderId: { in: orderIds } }] },
  });
  await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.enrollment.deleteMany({ where: { productId: { in: productIds } } });
  await prisma.review.deleteMany({ where: { productId: { in: productIds } } });
  await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  await prisma.affiliate.deleteMany({
    where: { OR: [{ userId: { in: ids } }, { parentAffiliateId: { in: affiliateIds } }] },
  });
  await prisma.referral.deleteMany({
    where: { OR: [{ affiliateId: { in: affiliateIds } }, { referredUserId: { in: ids } }] },
  });
  await prisma.referralEvent.deleteMany({ where: { userId: { in: ids } } });
  await prisma.walletTransaction.deleteMany({ where: { userId: { in: ids } } });
  await prisma.wallet.deleteMany({ where: { userId: { in: ids } } });
  await prisma.profile.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
