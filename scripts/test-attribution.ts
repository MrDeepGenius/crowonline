/**
 * Attribution & commission regression tests. Run: npm run test:attribution
 * Matrix is fixed: CROW 10% + Rewards Pool 2%, no line absorbs a residual.
 * Fixture includes the direct affiliate plus all five ancestors.
 * Missing/inactive beneficiaries route to Treasury, never PLATFORM or pending balances.
 * TEST 1 referred sale -> first L1 unlock, all five levels, total 100%
 * TEST 2 direct sale -> 45 creator + 10 PLATFORM + 2 rewards + 43 Treasury
 * TEST 3 creator as buyer -> attribution kept
 * TEST 4/12 self purchase & self referral blocked
 * TEST 5 ?ref= at registration survives until purchase
 * TEST 6 double PAID -> commissions once (idempotent)
 */
import { mockBlockchain } from "./helpers/mock-blockchain";
import prisma from "@/lib/db";
import { computeSplit } from "@/lib/commissions";
import { ensureAffiliate, registerReferral } from "@/server/services/affiliate";
import { createOrderWithPayment, resolveSaleAttribution } from "@/server/services/orders";
import { confirmOrderPayment as verifyOrderPayment } from "@/server/services/settlement";
const blockchain = mockBlockchain();
async function confirmOrderPayment({ orderId }: { orderId: string }) {
  const payment = await prisma.payment.findUniqueOrThrow({ where: { orderId } });
  const txHash = payment.txHash ?? blockchain.mine(payment).hash;
  blockchain.state.head += 3;
  return verifyOrderPayment({ orderId, txHash });
}
import { distributeCommissions } from "@/server/services/distribution";
import { ensureWallet, getWalletOverview } from "@/server/services/wallet";

let failures = 0;
function assert(condition: boolean, label: string) {
  if (condition) console.log("  PASS", label);
  else {
    failures += 1;
    console.error("  FAIL", label);
  }
}
const approx = (a: number, b: number) => Math.abs(a - b) < 1e-6;
const EMAIL = (n: string) => `testattr-${n}-${Date.now()}@crow.test`;

const sumRole = (snapshot: { role: string; amount: number }[], role: string) =>
  snapshot.filter((l) => l.role === role).reduce((s, l) => s + l.amount, 0);

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

async function cleanup() {
  const users = await prisma.user.findMany({
    where: { email: { contains: "@crow.test" } },
    select: { id: true },
  });
  if (!users.length) return;
  const userIds = users.map((user) => user.id);

  // OrderItem.product is `onDelete: Restrict`, so orders (which cascade to
  // items + payments) must go before the creator → product cascade runs.
  await prisma.order.deleteMany({
    where: {
      OR: [
        { buyerId: { in: userIds } },
        { items: { some: { creatorId: { in: userIds } } } },
      ],
    },
  });
  await prisma.commission.deleteMany({ where: { earnerId: { in: userIds } } });
  await prisma.product.deleteMany({ where: { creatorId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

async function unitTests() {
  console.log("\n[UNIT] computeSplit");
  const chain = ["U-DIRECT", "U-L1", "U-L2", "U-L3", "U-L4", "U-L5"];
  const full = computeSplit({ amount: 100, creatorId: "U-CREATOR", affiliateUpline: chain });
  assert(approx(full.totalRate, 1), "split total = 100%");
  const direct = full.lines.find((l) => l.role === "DIRECT_AFFILIATE")!;
  assert(direct.userId === "U-DIRECT" && approx(direct.amount, 30), "afiliado directo 30%");
  assert(full.lines.find((l) => l.role === "L1")!.userId === "U-L1", "L1 va a upline[1]");
  assert(full.lines.find((l) => l.role === "L5")!.userId === "U-L5", "L5 va a upline[5]");
  assert(approx(full.lines.find((l) => l.role === "CREATOR")!.amount, 45), "creator 45%");
  assert(
    approx(full.lines.find((l) => l.role === "PLATFORM")!.amount, 10),
    "CROW 10% fijo (no absorbe residual)",
  );
  assert(
    approx(full.lines.find((l) => l.role === "EMERGENCY_RESERVE" && l.level === undefined)!.amount, 2),
    "Rewards Pool 2% explicito dentro del split",
  );
  assert(approx(full.totalAmount, 100), "distribucion total = 100%");
  const solo = computeSplit({ amount: 100, creatorId: "U-CREATOR", affiliateUpline: [] });
  assert(
    approx(solo.lines.find((l) => l.role === "CREATOR")!.amount, 45) &&
      approx(solo.lines.find((l) => l.role === "EMERGENCY_RESERVE" && l.level === undefined)!.amount, 2) &&
      approx(solo.lines.find((l) => l.role === "PLATFORM")!.amount, 10) &&
      approx(sumRole(solo.lines, "CROW_TREASURY"), 43) &&
      approx(solo.totalAmount, 100),
    "venta sin afiliado: creator 45 + rewards 2 + PLATFORM 10 + Treasury 43",
  );
  const firstUnlock = computeSplit({
    amount: 100,
    creatorId: "U-CREATOR",
    affiliateUpline: chain,
    isFirstL1Unlock: true,
  });
  assert(
    approx(firstUnlock.lines.find((l) => l.role === "L1")!.amount, 2.5) &&
      approx(firstUnlock.lines.find((l) => l.role === "EMERGENCY_RESERVE")!.amount, 2.5) &&
      approx(firstUnlock.lines.find((l) => l.role === "PLATFORM")!.amount, 10) &&
      approx(firstUnlock.totalAmount, 100),
    "primer desbloqueo L1 -> 2.5% + 2.5% reserva, CROW 10%, total 100%",
  );
}

type Fx = Awaited<ReturnType<typeof fixtures>>;

async function fixtures() {
  const creator = await makeUser("CreatorA", "BUYER,CREATOR");
  const rootU = await makeUser("RootAff", "BUYER,AFFILIATE");
  const midU = await makeUser("MidAff", "BUYER,AFFILIATE");
  const directU = await makeUser("DirectX", "BUYER,AFFILIATE");
  const buyerB = await makeUser("BuyerB", "BUYER");
  const creatorBuyer = await makeUser("CreatorB", "BUYER,CREATOR");
  const anonBuyer = await makeUser("BuyerDirect", "BUYER");
  for (const u of [creator, rootU, midU, directU, buyerB, creatorBuyer, anonBuyer]) {
    await ensureWallet(u.id);
  }
  const l5U = await makeUser("L5", "BUYER,AFFILIATE");
  const l4U = await makeUser("L4", "BUYER,AFFILIATE");
  const l3U = await makeUser("L3", "BUYER,AFFILIATE");
  const l5 = await ensureAffiliate(l5U.id);
  const l4 = await ensureAffiliate(l4U.id, l5.id);
  const l3 = await ensureAffiliate(l3U.id, l4.id);
  const root = await ensureAffiliate(rootU.id, l3.id);
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
  return { creator, rootU, midU, directU, buyerB, creatorBuyer, anonBuyer, root, mid, dx, product, l3U, l4U, l5U };
}

async function test5to6(fx: Fx) {
  const { directU, midU, rootU, buyerB, creator, dx, product } = fx;

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
  assert(stored1?.referralCode === dx.referralCode, "la orden conserva la atribucion de X");

  console.log("\n[TEST 1] Venta atribuida: cadena completa, primer desbloqueo L1");
  const res1 = await confirmOrderPayment({ orderId: order1.orderId });
  assert(res1.alreadyPaid === false, "distribucion ejecutada en PAID");
  assert(approx(sumRole(res1.snapshot, "CREATOR"), 45), "creator recibe 45");
  assert(approx(sumRole(res1.snapshot, "PLATFORM"), 10), "CROW base exactamente 10%");
  assert(approx(sumRole(res1.snapshot, "CROW_TREASURY"), 0), "cadena completa sin Treasury");
  for (const [role, user, amount] of [["L3", fx.l3U, 2], ["L4", fx.l4U, 2], ["L5", fx.l5U, 1]] as const) {
    assert(res1.snapshot.some((line) => line.role === role && line.userId === user.id && approx(line.amount, amount)), `${role} cobra ${amount}% al beneficiario correcto`);
  }
  assert(approx(sumRole(res1.snapshot, "DIRECT_AFFILIATE"), 30), "afiliado X recibe 30");
  assert(approx(sumRole(res1.snapshot, "EMERGENCY_RESERVE"), 4.5), "Reserva permanente 2 + apertura 2.5 = 4.5");
  assert(
    approx(sumRole(res1.snapshot, "L1"), 2.5) &&
      approx(sumRole(res1.snapshot, "EMERGENCY_RESERVE"), 4.5),
    "primer desbloqueo L1: L1 2.5 + reserva 2.5 (excepcion documentada)",
  );
  assert(approx(sumRole(res1.snapshot, "L2"), 3), "L2 recibe 3");
  assert(approx(res1.snapshot.reduce((s, l) => s + l.amount, 0), 100), "total distribuido = 100");
  const l1User = res1.snapshot.find((l) => l.role === "L1")!.userId;
  const l2User = res1.snapshot.find((l) => l.role === "L2")!.userId;
  assert(l1User === midU.id && l2User === rootU.id, "cadena L1/L2 calculada desde X");
  assert(
    res1.snapshot.find((l) => l.role === "DIRECT_AFFILIATE")!.userId === directU.id,
    "la comision 30% es para X (no para otro)",
  );
  const wCreator = await getWalletOverview(creator.id);
  assert(wCreator.commissionTotal > 0, "wallet del creator acredita su 45%");

  console.log("\n[TEST 6] Doble procesamiento PAID");
  const again = await confirmOrderPayment({ orderId: order1.orderId });
  assert(again.alreadyPaid === true, "segunda confirmacion -> alreadyPaid");
  const countAfter = await prisma.commission.count({ where: { orderId: order1.orderId } });
  await distributeCommissions(order1.orderId);
  const countDouble = await prisma.commission.count({ where: { orderId: order1.orderId } });
  assert(countAfter === countDouble, "comisiones generadas una sola vez");
}

async function test3to4(fx: Fx) {
  const { creator, directU, dx, creatorBuyer, anonBuyer, product } = fx;

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
  assert(stored3?.referralCode === dx.referralCode, "rol CREATOR del comprador no anula la atribucion");
  const res3 = await confirmOrderPayment({ orderId: order3.orderId });
  assert(approx(sumRole(res3.snapshot, "DIRECT_AFFILIATE"), 30), "X recibe 30% igualmente");
  assert(approx(sumRole(res3.snapshot, "CREATOR"), 45), "creator A recibe 45%");
  assert(approx(sumRole(res3.snapshot, "L1"), 5), "L1 recibe 5% (ya no es primer desbloqueo)");
  assert(
    approx(sumRole(res3.snapshot, "PLATFORM"), 10),
    "CROW base exactamente 10% en venta normal",
  );
  assert(
    approx(res3.snapshot.reduce((s, l) => s + l.amount, 0), 100),
    "venta posterior: total 100%",
  );

  console.log("\n[TEST 2] Compra directa sin afiliado");
  const order2 = await createOrderWithPayment({
    buyerId: anonBuyer.id,
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
  assert(approx(sumRole(res2.snapshot, "EMERGENCY_RESERVE"), 2), "Reserva permanente 2% en venta directa");
  assert(
    approx(sumRole(res2.snapshot, "PLATFORM"), 10) && approx(sumRole(res2.snapshot, "CROW_TREASURY"), 43),
    "CROW base 10% y Treasury 43% separados en venta directa",
  );
  assert(
    approx(res2.snapshot.reduce((s, l) => s + l.amount, 0), 100),
    "venta directa: total 100% (nada se pierde)",
  );

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
}

async function main() {
  await cleanup();
  await unitTests();
  const fx = await fixtures();
  await test5to6(fx);
  await test3to4(fx);
  await cleanup();
  console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
