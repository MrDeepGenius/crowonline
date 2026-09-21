/**
 * Commission engine math tests — run: npm run test:commissions
 *
 * Verifies the fixed CROW commercial matrix, with CROW locked at exactly 10%
 * (it never absorbs a residual) and the Rewards Pool 2% as an explicit line:
 *
 *   CASO 1 normal (cadena completa)  45 + 10 + 30 + 5+3+2+2+1 + 2 = 100
 *   CASO 2 primer desbloqueo L1      45 + 10 + 30 + 2.5+2.5 + 3+2+2+1 + 2 = 100
 *   CASO 3 venta directa sin afiliado (conservacion del 100% sin inventar pagos)
 *   CASO 4 cadena corta (solo afiliado directo)
 *   CASO 5 escala y redondeo en varios montos
 *
 * No database needed: pure engine math.
 */
import {
  computeSplit,
  DEFAULT_SPLIT,
  REWARDS_POOL_RATE,
  splitPercent,
  type SplitResult,
  type SplitRole,
} from "@/lib/commissions";

let failures = 0;
function assert(condition: boolean, label: string) {
  if (condition) console.log("  PASS", label);
  else {
    failures += 1;
    console.error("  FAIL", label);
  }
}
const approx = (a: number, b: number) => Math.abs(a - b) < 1e-6;

const rateOf = (split: SplitResult, role: SplitRole) =>
  split.lines.find((line) => role === "REWARDS_POOL"
    ? line.role === "EMERGENCY_RESERVE" && line.level === undefined
    : role === "EMERGENCY_RESERVE" ? line.role === role && line.level === 1 : line.role === role)?.rate ?? 0;
const amountOf = (split: SplitResult, role: SplitRole) =>
  split.lines.find((line) => role === "REWARDS_POOL"
    ? line.role === "EMERGENCY_RESERVE" && line.level === undefined
    : role === "EMERGENCY_RESERVE" ? line.role === role && line.level === 1 : line.role === role)?.amount ?? 0;
const total = (split: SplitResult) =>
  split.lines.reduce((sum, line) => sum + line.amount, 0);

const treasuryAmount = (split: SplitResult) =>
  split.lines.filter((line) => line.role === "CROW_TREASURY").reduce((sum, line) => sum + line.amount, 0);

const CHAIN = ["U-DIRECT", "U-L1", "U-L2", "U-L3", "U-L4", "U-L5"];

function printMatrix(title: string, split: SplitResult) {
  console.log(`\n${title}`);
  split.lines.forEach((line) => {
    console.log(
      `   ${line.role.padEnd(18)} ${splitPercent(line.rate).padStart(7)}  ${line.amount}`,
    );
  });
  console.log(
    `   ${"TOTAL".padEnd(18)} ${splitPercent(split.totalRate).padStart(7)}  ${split.totalAmount}`,
  );
}

function caseNormal() {
  console.log("\n[CASO 1] Normal — 45 + 10 + 30 + 13 niveles + 2 rewards = 100");
  const split = computeSplit({ amount: 100, creatorId: "U-CREATOR", affiliateUpline: CHAIN });
  printMatrix("  Matriz normal", split);

  assert(approx(rateOf(split, "CREATOR"), DEFAULT_SPLIT.creator), "creator 45%");
  assert(approx(rateOf(split, "PLATFORM"), DEFAULT_SPLIT.platform), "CROW/PLATFORM exactamente 10%");
  assert(approx(rateOf(split, "DIRECT_AFFILIATE"), DEFAULT_SPLIT.directAffiliate), "afiliado directo 30%");
  assert(approx(rateOf(split, "L1"), 0.05), "L1 5%");
  assert(approx(rateOf(split, "L2"), 0.03), "L2 3%");
  assert(approx(rateOf(split, "L3"), 0.02), "L3 2%");
  assert(approx(rateOf(split, "L4"), 0.02), "L4 2%");
  assert(approx(rateOf(split, "L5"), 0.01), "L5 1%");
  assert(approx(rateOf(split, "REWARDS_POOL"), REWARDS_POOL_RATE), "Rewards Pool 2% explicito");

  assert(approx(amountOf(split, "CREATOR"), 45), "creator cobra 45 sobre 100");
  assert(approx(amountOf(split, "PLATFORM"), 10), "CROW cobra 10 sobre 100 (sin residual)");
  assert(approx(amountOf(split, "DIRECT_AFFILIATE"), 30), "afiliado directo cobra 30 sobre 100");
  assert(approx(amountOf(split, "REWARDS_POOL"), 2), "rewards pool cobra 2 sobre 100");

  assert(approx(split.totalRate, 1), "totalRate = 100%");
  assert(approx(split.totalAmount, 100) && approx(total(split), 100), "reparte exactamente 100");
  assert(
    approx(
      ["CREATOR", "PLATFORM", "DIRECT_AFFILIATE", "L1", "L2", "L3", "L4", "L5", "REWARDS_POOL"]
        .map((role) => rateOf(split, role as SplitRole))
        .reduce((sum, rate) => sum + rate, 0),
      1,
    ),
    "45 + 10 + 30 + 5+3+2+2+1 + 2 = 100",
  );
  assert(
    split.lines.filter((line) => line.role === "EMERGENCY_RESERVE").length === 1 &&
      split.lines.find((line) => line.role === "EMERGENCY_RESERVE")?.amount === 2,
    "la reserva permanente de 2% siempre existe; no hay reserva adicional sin apertura",
  );
}

function caseFirstL1Unlock() {
  console.log("\n[CASO 2] Primer desbloqueo L1 — 45 + 10 + 30 + 2.5+2.5 + 3+2+2+1 + 2 = 100");
  const split = computeSplit({
    amount: 100,
    creatorId: "U-CREATOR",
    affiliateUpline: CHAIN,
    isFirstL1Unlock: true,
  });
  printMatrix("  Matriz primer desbloqueo", split);

  assert(approx(rateOf(split, "CREATOR"), 0.45), "creator 45%");
  assert(approx(rateOf(split, "PLATFORM"), 0.1), "CROW/PLATFORM exactamente 10%");
  assert(approx(rateOf(split, "DIRECT_AFFILIATE"), 0.3), "afiliado directo 30%");
  assert(approx(rateOf(split, "L1"), 0.025), "L1 2.5%");
  assert(approx(rateOf(split, "EMERGENCY_RESERVE"), 0.025), "Emergency Reserve 2.5%");
  assert(approx(rateOf(split, "L2"), 0.03), "L2 3%");
  assert(approx(rateOf(split, "L3"), 0.02), "L3 2%");
  assert(approx(rateOf(split, "L4"), 0.02), "L4 2%");
  assert(approx(rateOf(split, "L5"), 0.01), "L5 1%");
  assert(approx(rateOf(split, "REWARDS_POOL"), 0.02), "Rewards Pool 2%");

  assert(approx(amountOf(split, "L1"), 2.5), "L1 cobra 2.5 sobre 100");
  assert(approx(amountOf(split, "EMERGENCY_RESERVE"), 2.5), "reserva cobra 2.5 sobre 100");
  assert(approx(amountOf(split, "PLATFORM"), 10), "CROW cobra 10 sobre 100");

  assert(approx(split.totalRate, 1), "totalRate = 100%");
  assert(approx(total(split), 100), "suma de lineas = 100");
  assert(
    approx(
      ["CREATOR", "PLATFORM", "DIRECT_AFFILIATE", "L1", "EMERGENCY_RESERVE", "L2", "L3", "L4", "L5", "REWARDS_POOL"]
        .map((role) => rateOf(split, role as SplitRole))
        .reduce((sum, rate) => sum + rate, 0),
      1,
    ),
    "45 + 10 + 30 + 2.5 + 2.5 + 3 + 2 + 2 + 1 + 2 = 100",
  );
}

function caseNoAffiliate() {
  console.log("\n[CASO 3] Venta directa sin afiliado (conservacion del 100%)");
  const split = computeSplit({ amount: 100, creatorId: "U-CREATOR", affiliateUpline: [] });
  printMatrix("  Matriz sin afiliado", split);

  assert(approx(rateOf(split, "CREATOR"), 0.45), "creator sigue en 45%");
  assert(approx(rateOf(split, "REWARDS_POOL"), 0.02), "rewards pool sigue en 2%");
  assert(
    split.lines.every((line) => line.role !== "DIRECT_AFFILIATE"),
    "no se inventa afiliado directo",
  );
  assert(
    split.lines.every((line) => !/^L[1-5]$/.test(line.role)),
    "no se inventan niveles 1-5",
  );
  assert(
    approx(rateOf(split, "PLATFORM"), 0.1) && approx(treasuryAmount(split), 43),
    "CROW base 10% + Treasury separado 43%",
  );
  assert(
    approx(split.totalRate, 1) && approx(total(split), 100),
    "el total sigue siendo 100% (nada se pierde)",
  );
}

function caseShortUpline() {
  console.log("\n[CASO 4] Cadena corta (solo afiliado directo)");
  const split = computeSplit({
    amount: 100,
    creatorId: "U-CREATOR",
    affiliateUpline: ["U-DIRECT"],
  });
  printMatrix("  Matriz cadena corta", split);

  assert(approx(rateOf(split, "DIRECT_AFFILIATE"), 0.3), "afiliado directo 30%");
  assert(approx(rateOf(split, "PLATFORM"), 0.1) && approx(treasuryAmount(split), 13), "CROW base 10% + Treasury separado 13%");
  assert(approx(split.totalRate, 1), "el total sigue siendo 100%");
}

function caseScaling() {
  console.log("\n[CASO 5] Escala y redondeo");
  for (const amount of [20, 250, 600, 1234.56, 33.33]) {
    const normal = computeSplit({ amount, creatorId: "U-CREATOR", affiliateUpline: CHAIN });
    const unlock = computeSplit({
      amount,
      creatorId: "U-CREATOR",
      affiliateUpline: CHAIN,
      isFirstL1Unlock: true,
    });
    assert(approx(normal.totalRate, 1), `monto ${amount}: normal suma 100%`);
    assert(approx(unlock.totalRate, 1), `monto ${amount}: primer desbloqueo suma 100%`);
    assert(approx(total(normal), amount), `monto ${amount}: normal reparte el 100% exacto`);
    assert(approx(total(unlock), amount), `monto ${amount}: desbloqueo reparte el 100% exacto`);
    assert(
      approx(amountOf(normal, "PLATFORM"), amount * DEFAULT_SPLIT.platform) &&
        approx(amountOf(unlock, "PLATFORM"), amount * DEFAULT_SPLIT.platform),
      `monto ${amount}: CROW = 10% exacto en ambos escenarios`,
    );
    assert(
      approx(amountOf(normal, "REWARDS_POOL"), amount * REWARDS_POOL_RATE),
      `monto ${amount}: rewards pool = 2%`,
    );
  }
}

function main() {
  console.log("CROW commission matrix — CROW fijo 10%, Rewards Pool 2% explicito, total 100%");
  console.log(
    `config: creator ${splitPercent(DEFAULT_SPLIT.creator)} · platform ${splitPercent(
      DEFAULT_SPLIT.platform,
    )} · direct ${splitPercent(DEFAULT_SPLIT.directAffiliate)} · levels ${DEFAULT_SPLIT.levels
      .map((rate) => splitPercent(rate))
      .join("/")} · rewards ${splitPercent(DEFAULT_SPLIT.rewardsPool)}`,
  );

  assert(
    approx(
      DEFAULT_SPLIT.creator +
        DEFAULT_SPLIT.platform +
        DEFAULT_SPLIT.directAffiliate +
        DEFAULT_SPLIT.levels.reduce((sum, rate) => sum + rate, 0) +
        DEFAULT_SPLIT.rewardsPool,
      1,
    ),
    "la matriz configurada suma exactamente 100%",
  );

  caseNormal();
  caseFirstL1Unlock();
  caseNoAffiliate();
  caseShortUpline();
  caseScaling();

  console.log(failures === 0 ? "\nALL COMMISSION TESTS PASSED" : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
