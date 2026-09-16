/**
 * CROW commission engine.
 *
 * Permanent distribution (100%):
 *   Creator            45%
 *   Crow platform      10%
 *   Direct affiliate   30%
 *   L1 5% · L2 3% · L3 2% · L4 2% · L5 1%  (affiliate team)
 *
 * Emergency Reserve is NOT part of the permanent distribution. It only exists
 * as the documented exception of the very first L1 unlock: when a referral
 * unlocks L1 for the first time, that 5% is split as
 *   2.5% Affiliate + 2.5% Emergency Reserve.
 *
 * Rewards Pool: 2% of licence sales (tracked separately, never mixed with the
 * product split above).
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
  | "EMERGENCY_RESERVE";

export type SplitConfig = {
  creator: number;
  platform: number;
  directAffiliate: number;
  levels: [number, number, number, number, number];
  firstL1EmergencyReserve: number;
};

export const DEFAULT_SPLIT: SplitConfig = {
  creator: 0.45,
  platform: 0.1,
  directAffiliate: 0.3,
  levels: [0.05, 0.03, 0.02, 0.02, 0.01],
  firstL1EmergencyReserve: 0.025,
};

export const REWARDS_POOL_RATE = 0.02;

export type SplitLine = {
  role: SplitRole;
  level?: number;
  rate: number;
  amount: number;
  userId?: string | null;
};

export type SplitInput = {
  amount: number;
  config?: SplitConfig;
  creatorId: string;
  /** Upline of the direct affiliate, index 0 = direct affiliate. */
  affiliateUpline?: (string | null | undefined)[];
  /** True only for the very first L1 unlock of the downline. */
  isFirstL1Unlock?: boolean;
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
 * Computes the full 100% distribution of a sale.
 * Never throws on rounding — the residual is absorbed by the platform line.
 */
export function computeSplit({
  amount,
  config = DEFAULT_SPLIT,
  creatorId,
  affiliateUpline = [],
  isFirstL1Unlock = false,
}: SplitInput): SplitResult {
  const base = Math.max(0, Number(amount) || 0);
  const lines: SplitLine[] = [];

  const levelRates = config.levels;
  const direct = affiliateUpline[0] ?? null;

  lines.push({
    role: "CREATOR",
    rate: config.creator,
    amount: round(base * config.creator),
    userId: creatorId,
  });

  if (direct) {
    lines.push({
      role: "DIRECT_AFFILIATE",
      rate: config.directAffiliate,
      amount: round(base * config.directAffiliate),
      userId: direct,
    });

    levelRates.forEach((rate, index) => {
      const userId = affiliateUpline[index];
      if (!userId || rate <= 0) return;

      if (index === 0 && isFirstL1Unlock) {
        const affiliateRate = round(rate - config.firstL1EmergencyReserve);
        const reserveRate = round(config.firstL1EmergencyReserve);
        lines.push({
          role: "L1",
          level: 1,
          rate: affiliateRate,
          amount: round(base * affiliateRate),
          userId,
        });
        lines.push({
          role: "EMERGENCY_RESERVE",
          level: 1,
          rate: reserveRate,
          amount: round(base * reserveRate),
          userId: null,
        });
        return;
      }

      lines.push({
        role: `L${index + 1}` as SplitRole,
        level: index + 1,
        rate,
        amount: round(base * rate),
        userId,
      });
    });
  }

  const allocated = round(lines.reduce((sum, line) => sum + line.rate, 0));
  const platformRate = direct ? round(Math.max(0, 1 - allocated)) : round(1 - config.creator);
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
    rewardsPool: round(base * REWARDS_POOL_RATE),
  };
}

export function splitPercent(rate: number) {
  return `${Math.round(rate * 10000) / 100}%`;
}

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
  ] as { role: string; rate: number }[];
}