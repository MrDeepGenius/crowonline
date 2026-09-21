/**
 * Creator License engine tests. Run: npm run test:licenses
 *
 * Regla única de licencias CROW:
 *   Afiliado directo (referente real registrado)  15%
 *   CROW                                          85%
 * Sin L1..L5, sin residual, sin apertura de niveles, sin redistribución.
 * Una solicitud PENDING no es una venta: no acredita comisiones.
 *
 * [CASO 1] matemática pura con referente: 15 + 85 = 100, cero niveles
 * [CASO 2] sin referente: 15% → CROW_TREASURY (MISSING_BENEFICIARY) + 85% CROW
 * [CASO 3] referente inactivo: 15% → CROW_TREASURY (INACTIVE_USER)
 * [CASO 4] conservación en varios montos
 * [TEST 5/8] regresión con DB: venta PAID paga 15% una sola vez; PENDING no paga
 */
import prisma from "@/lib/db";
import {
  computeCreatorLicenseSplit,
  CREATOR_LICENSE_DIRECT_RATE,
  CREATOR_LICENSE_PLATFORM_RATE,
  splitPercent,
} from "@/lib/commissions";
import { ensureAffiliate, registerReferral } from "@/server/services/affiliate";
import { distributeCreatorLicenseSale } from "@/server/services/license-distribution";
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
const EMAIL = (n: string) => `testlic-${n}-${Date.now()}@crow.test`;
const createdTxIds: string[] = [];

const total = (lines: { amount: number }[]) =>
  lines.reduce((sum, line) => sum + line.amount, 0);

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

function casePureWithReferrer() {
  console.log("\n[CASO 1] Matriz con referente — 15 + 85 = 100");
  const split = computeCreatorLicenseSplit({ amount: 100, referrerUserId: "U-REF" });

  const direct = split.lines.find((line) => line.role === "LICENSE_DIRECT_AFFILIATE");
  const platform = split.lines.find((line) => line.role === "CROW_PLATFORM_LICENSE");

  assert(!!direct && approx(direct.rate, CREATOR_LICENSE_DIRECT_RATE), "afiliado directo 15%");
  assert(!!platform && approx(platform.rate, CREATOR_LICENSE_PLATFORM_RATE), "CROW 85%");
  assert(!!direct && approx(direct.amount, 15), "afiliado cobra 15 sobre 100");
  assert(!!platform && approx(platform.amount, 85), "CROW cobra 85 sobre 100");
  const licenseRoles = split.lines.map((line) => line.role as string);
  assert(
    licenseRoles.every(
      (role) => !/^L[1-5]$/.test(role) && role !== "REWARDS_POOL" && role !== "EMERGENCY_RESERVE",
    ),
    "NO existe residual/apertura: ninguna línea del motor de licencias pertenece a la matriz de productos",
  );
  assert(
    split.lines.every((line) => line.role !== "CROW_TREASURY"),
    "con referente válido nada va a Treasury",
  );
  assert(approx(split.totalRate, 1) && approx(split.totalAmount, 100), "reparte exactamente 100%");
  console.log(
    `   ${split.lines
      .map((line) => `${line.role} ${splitPercent(line.rate)} = ${line.amount}`)
      .join(" | ")}`,
  );
}

function casePureWithoutReferrer() {
  console.log("\n[CASO 2] Sin referente — 15% a Treasury, CROW 85%");
  const split = computeCreatorLicenseSplit({ amount: 100, referrerUserId: null });

  const treasury = split.lines.find((line) => line.role === "CROW_TREASURY");
  const platform = split.lines.find((line) => line.role === "CROW_PLATFORM_LICENSE");

  assert(
    split.lines.every((line) => line.role !== "LICENSE_DIRECT_AFFILIATE"),
    "no se inventa afiliado directo",
  );
  assert(!!treasury && approx(treasury.amount, 15), "los 15% van a CROW_TREASURY");
  assert(treasury?.reason === "MISSING_BENEFICIARY", "motivo preservado: MISSING_BENEFICIARY");
  assert(!!platform && approx(platform.amount, 85), "CROW mantiene sus 85%");
  assert(approx(split.totalRate, 1) && approx(total(split.lines), 100), "reparte exactamente 100%");
}

function casePureInactiveReferrer() {
  console.log("\n[CASO 3] Referente inactivo — 15% a Treasury con motivo");
  const split = computeCreatorLicenseSplit({
    amount: 100,
    referrerUserId: "U-REF",
    beneficiaryIssues: { "U-REF": "INACTIVE_USER" },
  });

  const treasury = split.lines.find((line) => line.role === "CROW_TREASURY");
  assert(!!treasury && approx(treasury.amount, 15), "15% a CROW_TREASURY");
  assert(treasury?.reason === "INACTIVE_USER", "motivo preservado: INACTIVE_USER");
  assert(treasury?.beneficiaryId === "U-REF", "beneficiario original preservado en la línea");
}

function casePureScaling() {
  console.log("\n[CASO 4] Escala y conservación del 100%");
  for (const amount of [20, 50, 100, 300, 500, 1000, 1234.56]) {
    const withRef = computeCreatorLicenseSplit({ amount, referrerUserId: "U-REF" });
    const noRef = computeCreatorLicenseSplit({ amount });
    assert(
      approx(total(withRef.lines), amount) && approx(withRef.totalRate, 1),
      `monto ${amount}: con referente suma 100% exacto`,
    );
    assert(
      approx(total(noRef.lines), amount),
      `monto ${amount}: sin referente también conserva el 100%`,
    );
    assert(
      approx(
        withRef.lines.find((line) => line.role === "LICENSE_DIRECT_AFFILIATE")?.amount ?? 0,
        amount * 0.15,
      ),
      `monto ${amount}: comisión directa = 15% exacto`,
    );
  }
}

async function caseDatabaseFlow() {
  console.log("\n[TEST 5/8] Regresión con DB — venta PAID paga 15% una vez; PENDING no paga");
  const stamp = Date.now();

  // Afiliado referente + buyer referido en el alta (referral real registrado).
  const referrerUser = await makeUser("LicRef", '["BUYER","AFFILIATE"]');
  const affiliate = await ensureAffiliate(referrerUser.id);
  const buyer = await makeUser("LicBuyer", '["BUYER"]');
  await registerReferral(affiliate.referralCode, buyer.id);
  await ensureWallet(referrerUser.id);

  const licenseTx = await prisma.transaction.create({
    data: {
      reference: `CROW-PLAN-T${stamp.toString(36).toUpperCase()}`,
      kind: "PLAN",
      status: "PAID",
      amountUsdt: 300,
      userId: buyer.id,
      metadata: JSON.stringify({ plan: "BUSINESS", mode: "manual_approval" }),
    },
  });
  createdTxIds.push(licenseTx.id);

  const snapshot = await distributeCreatorLicenseSale({
    transactionId: licenseTx.id,
    planId: "BUSINESS",
    amountUsdt: 300,
  });

  const directLine = snapshot.find((line) => line.role === "LICENSE_DIRECT_AFFILIATE");
  const platformLine = snapshot.find((line) => line.role === "CROW_PLATFORM_LICENSE");

  assert(!!directLine && directLine.userId === referrerUser.id, "el referente registrado cobra la directa");
  assert(!!directLine && approx(directLine.amount, 45), "15% de 300 = 45 al referente");
  assert(!!platformLine && approx(platformLine?.amount ?? 0, 255), "85% de 300 = 255 a CROW");
  assert(approx(total(snapshot), 300), "snapshot conserva el 100%");

  const overview = await getWalletOverview(referrerUser.id);
  assert(
    approx(overview.wallet.availableUsdt, 45) &&
      overview.transactions.some(
        (tx) => tx.type === "DIRECT_AFFILIATE" && approx(tx.amountUsdt, 45),
      ),
    "wallet del referente acredita exactamente 45 (una sola vez)",
  );
  const affiliateAfter = await prisma.affiliate.findUnique({ where: { id: affiliate.id } });
  assert(approx(affiliateAfter?.totalCommissionUsdt ?? 0, 45), "totalCommissionUsdt del afiliado = 45");

  // Idempotencia: re-ejecutar no duplica pagos ni snapshot.
  const second = await distributeCreatorLicenseSale({
    transactionId: licenseTx.id,
    planId: "BUSINESS",
    amountUsdt: 300,
  });
  assert(second.length === snapshot.length, "re-ejecución devuelve el snapshot guardado");
  const overviewAfterRetry = await getWalletOverview(referrerUser.id);
  assert(
    approx(overviewAfterRetry.wallet.availableUsdt, 45),
    "re-ejecución NO vuelve a acreditar la comisión",
  );

  // PENDING no es venta: no acredita nada a nadie.
  const pendingBuyer = await makeUser("PendingBuyer", '["BUYER"]');
  const pendingTx = await prisma.transaction.create({
    data: {
      reference: `CROW-PLAN-T${(stamp + 2).toString(36).toUpperCase()}`,
      kind: "PLAN",
      status: "PENDING",
      amountUsdt: 100,
      userId: pendingBuyer.id,
      metadata: JSON.stringify({ plan: "PRO" }),
    },
  });
  createdTxIds.push(pendingTx.id);
  const pendingSnapshot = await distributeCreatorLicenseSale({
    transactionId: pendingTx.id,
    planId: "PRO",
    amountUsdt: 100,
  });
  assert(
    pendingSnapshot.length === 0,
    "solicitud PENDING no distribuye comisiones (solo ventas reales pagadas)",
  );

  // Venta sin referente: 15% a Treasury, nada a wallets.
  const loneBuyer = await makeUser("LoneBuyer", '["BUYER"]');
  const loneTx = await prisma.transaction.create({
    data: {
      reference: `CROW-PLAN-T${(stamp + 3).toString(36).toUpperCase()}`,
      kind: "PLAN",
      status: "PAID",
      amountUsdt: 50,
      userId: loneBuyer.id,
      metadata: JSON.stringify({ plan: "BASIC" }),
    },
  });
  createdTxIds.push(loneTx.id);
  const loneSnapshot = await distributeCreatorLicenseSale({
    transactionId: loneTx.id,
    planId: "BASIC",
    amountUsdt: 50,
  });
  const loneTreasury = loneSnapshot.find((line) => line.role === "CROW_TREASURY");
  assert(
    loneSnapshot.every((line) => line.role !== "LICENSE_DIRECT_AFFILIATE") &&
      !!loneTreasury &&
      approx(loneTreasury.amount, 7.5),
    "venta sin referente: 15% (7.5 de 50) a Treasury, 0 a wallets",
  );
  const treasuryTx = await prisma.transaction.findFirst({
    where: { kind: "ADJUSTMENT", metadata: { contains: loneTx.id } },
  });
  assert(
    treasuryTx?.reference.startsWith("CROW-TRY") ?? false,
    "Treasury registrado como Transaction de plataforma (CROW-TRY), nunca wallet",
  );
}

async function cleanup() {
  const users = await prisma.user.findMany({
    where: { email: { contains: "testlic-" } },
    select: { id: true },
  });
  if (users.length) {
    const userIds = users.map((user) => user.id);
    await prisma.walletTransaction.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.wallet.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.referral.deleteMany({
      where: {
        OR: [{ referredUserId: { in: userIds } }, { affiliate: { userId: { in: userIds } } }],
      },
    });
    await prisma.affiliate.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
  if (createdTxIds.length) {
    await prisma.transaction.deleteMany({
      where: { OR: [{ id: { in: createdTxIds } }, { metadata: { contains: "testlic" } }] },
    });
  }
}

async function main() {
  console.log("CROW creator license matrix — 15% afiliado directo + 85% CROW, sin niveles");
  assert(
    approx(CREATOR_LICENSE_DIRECT_RATE + CREATOR_LICENSE_PLATFORM_RATE, 1),
    "la matriz de licencias suma exactamente 100%",
  );

  casePureWithReferrer();
  casePureWithoutReferrer();
  casePureInactiveReferrer();
  casePureScaling();

  try {
    await caseDatabaseFlow();
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  console.log(failures === 0 ? "\nALL LICENSE TESTS PASSED" : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
