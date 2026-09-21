export const FOUNDER_PRICES = [2000, 2500, 3000] as const;
export const FOUNDER_DIRECT_RATES = { AFFILIATE: 0.10, FOUNDER: 0.15, CREATOR: 0.10 } as const;
export type FounderSellerRole = keyof typeof FOUNDER_DIRECT_RATES;

/** Founder ONLY: exactly one direct seller. No upline, levels, CP or unlocks. */
export function computeFounderSplit({ amount, sellerId, sellerRole }: {
  amount: number; sellerId: string; sellerRole: FounderSellerRole;
}) {
  if (!(FOUNDER_PRICES as readonly number[]).includes(amount) || !sellerId ||
      !Object.hasOwn(FOUNDER_DIRECT_RATES, sellerRole)) throw new Error("Venta Founder inválida");
  const rate = FOUNDER_DIRECT_RATES[sellerRole];
  return {
    lines: [
      { role: "FOUNDER_DIRECT", userId: sellerId, level: 0, rate, amount: amount * rate },
      { role: "CROW_PLATFORM_FOUNDER", userId: null, level: 0, rate: 1 - rate, amount: amount - amount * rate },
    ],
    totalRate: 1, totalAmount: amount,
  };
}
