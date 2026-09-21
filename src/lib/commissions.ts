/**
 * CROW commission engine — fixed, auditable commercial matrix.
 *
 * Permanent distribution of every sale (exactly 100%):
 *   Creator            45%
 *   Crow platform      10%
 *   Direct affiliate   30%
 *   L1 5% · L2 3% · L3 2% · L4 2% · L5 1%   (affiliate team, 13% total)
 *   Emergency Reserve   2%
 *
 * CROW always keeps its configured share (10%): the matrix above totals exactly
 * 100% on its own (45 + 10 + 30 + 13 + 2), so no line ever absorbs a residual.
 *
 * Emergency Reserve is a permanent 2% of PRODUCT sales, independent of the
 * first L1 unlock: that L1 5% is split as 2.5% Affiliate + 2.5% additional Reserve.
 * The permanent reserve has no level; the unlock reserve has level=1.
 * Founder sales must NEVER use this engine: direct seller only (affiliate 10%,
 * founder 15%, creator 10%), with no network or level unlock. No Founder checkout
 * exists in this codebase yet; documenting that rule does not implement it.
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
  const seen = new Set([creatorId]);
  if (direct) seen.add(direct);
  assign("DIRECT_AFFILIATE", config.directAffiliate, direct === creatorId ? null : direct);
  config.levels.forEach((rate, index) => {
    const userId = affiliateUpline[index + 1];
    if (userId && seen.has(userId)) beneficiaryIssues = { ...beneficiaryIssues, [userId]: "INELIGIBLE_BENEFICIARY" };
    if (userId) seen.add(userId);
    // An invalid L1 goes wholly to Treasury: no unlock and no additional reserve.
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

  // Permanent Emergency Reserve (2%). Legacy config/export names are retained
  // temporarily for callers; this is NOT a rewards pool or license commission.
  const rewardsPoolRate = round(config.rewardsPool);
  lines.push({
    role: "EMERGENCY_RESERVE",
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

// ---------------------------------------------------------------------------
// CREATOR LICENSES — regla única y cerrada
// ---------------------------------------------------------------------------
// Una licencia Creator vendida se reparte SIEMPRE así:
//   Afiliado directo (referente real registrado)  15%
//   CROW                                          85%
//
// NO existen L1..L5, residual, apertura de niveles ni redistribución para
// licencias Creator: la matriz multinivel de PRODUCTOS (computeSplit) nunca
// aplica aquí. Las líneas Brian/Guille y el beneficio empresarial 50/50 son
// contabilidad de CROW, no comisiones de usuario (no se calculan en este motor).

export const CREATOR_LICENSE_DIRECT_RATE = 0.15;
export const CREATOR_LICENSE_PLATFORM_RATE = 0.85;

export type LicenseSplitLine = {
  role: "LICENSE_DIRECT_AFFILIATE" | "CROW_PLATFORM_LICENSE" | "CROW_TREASURY";
  rate: number;
  amount: number;
  userId?: string | null;
  sourceRole?: "LICENSE_DIRECT_AFFILIATE";
  reason?: TreasuryReason;
  beneficiaryId?: string | null;
};

export type LicenseSplitResult = {
  lines: LicenseSplitLine[];
  totalRate: number;
  totalAmount: number;
};

export type LicenseSplitInput = {
  amount: number;
  /** UserId of the referring affiliate (real, registered referral). */
  referrerUserId?: string | null;
  /** Rejections resolved by the service; absent IDs are always missing. */
  beneficiaryIssues?: Record<string, TreasuryReason>;
};

/**
 * Computes the fixed 100% distribution of a Creator license sale.
 * 15% direct to the referring affiliate + 85% CROW. With no valid referrer the
 * 15% goes to CROW_TREASURY (preserving role/reason) — it never redistributes
 * into downline levels and never inflates the 85% platform line.
 */
export function computeCreatorLicenseSplit({
  amount,
  referrerUserId = null,
  beneficiaryIssues = {},
}: LicenseSplitInput): LicenseSplitResult {
  const base = Math.max(0, Number(amount) || 0);
  const directRate = CREATOR_LICENSE_DIRECT_RATE;
  const platformRate = CREATOR_LICENSE_PLATFORM_RATE;

  if (
    Math.abs(directRate + platformRate - 1) > 1e-10 ||
    directRate < 0 ||
    platformRate < 0
  ) {
    throw new Error("La matriz de licencias Creator debe sumar 100% con porcentajes válidos");
  }

  const lines: LicenseSplitLine[] = [];
  const reason = referrerUserId ? beneficiaryIssues[referrerUserId] : "MISSING_BENEFICIARY";

  lines.push(
    reason
      ? {
          role: "CROW_TREASURY" as const,
          sourceRole: "LICENSE_DIRECT_AFFILIATE" as const,
          reason,
          beneficiaryId: referrerUserId ?? null,
          userId: null,
          rate: directRate,
          amount: round(base * directRate),
        }
      : {
          role: "LICENSE_DIRECT_AFFILIATE" as const,
          rate: directRate,
          amount: round(base * directRate),
          userId: referrerUserId,
        },
  );

  lines.push({
    role: "CROW_PLATFORM_LICENSE",
    rate: platformRate,
    amount: round(base * platformRate),
    userId: null,
  });

  return {
    lines,
    totalRate: round(lines.reduce((sum, line) => sum + line.rate, 0)),
    totalAmount: round(lines.reduce((sum, line) => sum + line.amount, 0)),
  };
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
    { role: "Emergency Reserve", rate: config.rewardsPool },
  ] as { role: string; rate: number }[];
}