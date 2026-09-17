/**
 * CROW commission engine — fixed, auditable commercial matrix.
 *
 * Permanent distribution of every sale (exactly 100%):
 *   Creator            45%
 *   Crow platform      10%
 *   Direct affiliate   30%
 *   L1 5% · L2 3% · L3 2% · L4 2% · L5 1%   (affiliate team, 13% total)
 *   Rewards Pool        2%
 *
 * CROW always keeps its configured share (10%): the matrix above totals exactly
 * 100% on its own (45 + 10 + 30 + 13 + 2), so no line ever absorbs a residual.
 *
 * Emergency Reserve is NOT part of the permanent distribution. It only exists
 * as the documented exception of the very first L1 unlock: that L1 5% is split as
 *   2.5% Affiliate + 2.5% Emergency Reserve   (matrix still totals exactly 100%).
 *
 * Unassignable commissions go permanently to CROW Treasury, separately from
 * PLATFORM's fixed 10%, with their original role and reason preserved.
 * Missing or inactive ancestors never compress the five-level chain.
 *
 * Crow Points: 1 CP = 1 volume point. CP is NOT money and must never be
 * converted into a wallet balance by this engine.
 */

export type SplitRole =
  | "CREATOR"
  | "PLATFORM"
  | "DIRECT_AFFILIATE"
  | "L1"
  | "L2"
  | "L3"
  | "L4"
  | "L5"
  | "REWARDS_POOL"
  | "CROW_TREASURY"
  | "EMERGENCY_RESERVE";

export type TreasuryReason = "MISSING_BENEFICIARY" | "INACTIVE_USER" | "INACTIVE_AFFILIATE" | "INELIGIBLE_BENEFICIARY";

export type SplitConfig = {
  creator: number;
  platform: number;
  directAffiliate: number;
  /** Rewards Pool is a permanent line of the matrix, not a separate calculation. */
  rewardsPool: number;
  levels: [number, number, number, number, number];
  firstL1EmergencyReserve: number;
};

export const REWARDS_POOL_RATE = 0.02;

export const DEFAULT_SPLIT: SplitConfig = {
  creator: 0.45,
  platform: 0.1,
  directAffiliate: 0.3,
  rewardsPool: REWARDS_POOL_RATE,
  levels: [0.05, 0.03, 0.02, 0.02, 0.01],
  firstL1EmergencyReserve: 0.025,
};

export type SplitLine = {
  role: SplitRole;
  level?: number;
  rate: number;
  amount: number;
  userId?: string | null;
  sourceRole?: SplitRole;
  reason?: TreasuryReason;
  beneficiaryId?: string | null;
};

export type SplitInput = {
  amount: number;
  config?: SplitConfig;
  creatorId: string;
  /** Upline of the direct affiliate, index 0 = direct affiliate. */
  affiliateUpline?: (string | null | undefined)[];
  /** True only for the very first L1 unlock of the downline. */
  isFirstL1Unlock?: boolean;
  /** Rejections resolved by the service; absent IDs are always missing. */
  beneficiaryIssues?: Record<string, TreasuryReason>;
};

export type SplitResult = {
  lines: SplitLine[];
  totalRate: number;
  totalAmount: number;
  crowPoints: number;
  rewardsPool: number;
};

const round = (value: number) => Math.round(value * 1e6) / 1e6;

/**
 * Computes the fixed 100% distribution of a sale.
 *
 * PLATFORM is always config.platform (10%). Treasury receives each unassignable
 * commission explicitly, never a calculated residual. The matrix itself must
 * sum to 100%, including Rewards Pool; invalid configurations are rejected.
 */
export function computeSplit({
  amount,
  config = DEFAULT_SPLIT,
  creatorId,
  affiliateUpline = [],
  isFirstL1Unlock = false,
  beneficiaryIssues = {},
}: SplitInput): SplitResult {
  const base = Math.max(0, Number(amount) || 0);
  const rates = [config.creator, config.platform, config.directAffiliate, config.rewardsPool, ...config.levels];
  if (rates.some((rate) => !Number.isFinite(rate) || rate < 0) ||
      Math.abs(rates.reduce((sum, rate) => sum + rate, 0) - 1) > 1e-10 ||
      !Number.isFinite(config.firstL1EmergencyReserve) ||
      config.firstL1EmergencyReserve < 0 || config.firstL1EmergencyReserve > config.levels[0]) {
    throw new Error("La matriz de comisiones debe sumar 100% y contener porcentajes válidos");
  }
  const lines: SplitLine[] = [];
  const direct = affiliateUpline[0] ?? null;
  const issueFor = (id: string | null | undefined) =>
    id ? beneficiaryIssues[id] : "MISSING_BENEFICIARY" as const;

  // Every user commission passes through this routing rule, including future roles.
  const assign = (role: SplitRole, rate: number, userId?: string | null, level?: number) => {
    const reason = issueFor(userId);
    lines.push(reason ? {
      role: "CROW_TREASURY", sourceRole: role, reason,
      beneficiaryId: userId ?? null, userId: null,
      rate, amount: round(base * rate), level,
    } : { role, rate, amount: round(base * rate), userId, level });
  };

  assign("CREATOR", config.creator, creatorId);
  assign("DIRECT_AFFILIATE", config.directAffiliate, direct);
  config.levels.forEach((rate, index) => {
    const userId = affiliateUpline[index + 1];
    // An invalid L1 goes wholly to Treasury: no unlock and no emergency reserve.
    if (index === 0 && isFirstL1Unlock && !issueFor(direct) && !issueFor(userId)) {
      assign("L1", round(rate - config.firstL1EmergencyReserve), userId, 1);
      lines.push({
        role: "EMERGENCY_RESERVE", level: 1,
        rate: config.firstL1EmergencyReserve,
        amount: round(base * config.firstL1EmergencyReserve), userId: null,
      });
    } else {
      assign(`L${index + 1}` as SplitRole, rate, userId, index + 1);
    }
  });

  // Rewards Pool: permanent 2% line of the matrix, part of the 100%.
  const rewardsPoolRate = round(config.rewardsPool);
  lines.push({
    role: "REWARDS_POOL",
    rate: rewardsPoolRate,
    amount: round(base * rewardsPoolRate),
    userId: null,
  });

  // Base platform commission is never computed by subtraction.
  const platformRate = config.platform;
  lines.push({
    role: "PLATFORM",
    rate: platformRate,
    amount: round(base * platformRate),
    userId: null,
  });

  return {
    lines,
    totalRate: round(lines.reduce((sum, line) => sum + line.rate, 0)),
    totalAmount: round(lines.reduce((sum, line) => sum + line.amount, 0)),
    crowPoints: base,
    rewardsPool: round(base * rewardsPoolRate),
  };
}

export function splitPercent(rate: number) {
  return `${Math.round(rate * 10000) / 100}%`;
}

/** Documents the fixed matrix (each row is a share of the sale, totals 100%). */
export function describeSplit(config: SplitConfig = DEFAULT_SPLIT) {
  return [
    { role: "Creator", rate: config.creator },
    { role: "Crow", rate: config.platform },
    { role: "Afiliado directo", rate: config.directAffiliate },
    { role: "L1", rate: config.levels[0] },
    { role: "L2", rate: config.levels[1] },
    { role: "L3", rate: config.levels[2] },
    { role: "L4", rate: config.levels[3] },
    { role: "L5", rate: config.levels[4] },
    { role: "Rewards Pool", rate: config.rewardsPool },
  ] as { role: string; rate: number }[];
}