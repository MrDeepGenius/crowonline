export const BOOST_PRICE_USDT = 3;
export const BOOST_DURATION_DAYS = 30;
export const BOOST_DURATION_MS = BOOST_DURATION_DAYS * 24 * 60 * 60 * 1000;

export function isBoostActive(
  boost: { status: string | null; expiresAt: Date | string | null } | null | undefined,
  now = new Date(),
) {
  return boost?.status === "ACTIVE" && !!boost.expiresAt && new Date(boost.expiresAt) > now;
}
