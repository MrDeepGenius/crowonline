import prisma from "@/lib/db";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCode(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 5)
    .toUpperCase();
  let suffix = "";
  for (let index = 0; index < 4; index += 1) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${base || "CROW"}${suffix}`;
}

export async function ensureAffiliate(userId: string, parentAffiliateId?: string | null) {
  const existing = await prisma.affiliate.findUnique({
    where: { userId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (existing) return existing;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  let code = generateReferralCode(user?.name ?? "CROW");
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const clash = await prisma.affiliate.findUnique({ where: { referralCode: code } });
    if (!clash) break;
    code = generateReferralCode(user?.name ?? "CROW");
  }

  return prisma.affiliate.create({
    data: { userId, referralCode: code, parentAffiliateId: parentAffiliateId ?? null },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function findAffiliateByCode(code: string) {
  if (!code) return null;
  return prisma.affiliate.findUnique({
    where: { referralCode: code.trim().toUpperCase() },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

/**
 * Resolves the 5-level upline (User ids) starting at the direct affiliate.
 * Returns [] when there is no affiliate behind the sale.
 */
export async function resolveUpline(code: string | null | undefined) {
  if (!code) return { affiliate: null, upline: [] as string[] };

  const direct = await findAffiliateByCode(code);
  if (!direct) return { affiliate: null, upline: [] as string[] };

  const upline: string[] = [direct.userId];
  let cursor = direct.parentAffiliateId;

  for (let level = 0; level < 5 && cursor; level += 1) {
    const parent = await prisma.affiliate.findUnique({
      where: { id: cursor },
      select: { userId: true, parentAffiliateId: true },
    });
    if (!parent) break;
    upline.push(parent.userId);
    cursor = parent.parentAffiliateId;
  }

  return { affiliate: direct, upline };
}

export async function registerReferral(code: string, referredUserId: string) {
  const affiliate = await findAffiliateByCode(code);
  if (!affiliate) return null;

  const existing = await prisma.referral.findFirst({
    where: { affiliateId: affiliate.id, referredUserId },
  });
  if (existing) return existing;

  return prisma.referral.create({
    data: {
      affiliateId: affiliate.id,
      referredUserId,
      code: affiliate.referralCode,
      level: 1,
    },
  });
}

/**
 * Durable attribution: the affiliate code a user was referred by at
 * registration, so checkout can attribute the sale even when the buyer no
 * longer carries the ?ref= query param. Returns null when the user was not
 * referred or the code matches the user's own affiliate account.
 */
export async function getReferredAffiliateCode(userId: string) {
  const referral = await prisma.referral.findFirst({
    where: { referredUserId: userId },
    orderBy: { createdAt: "asc" },
    include: { affiliate: { select: { referralCode: true, userId: true } } },
  });
  if (!referral) return null;
  if (referral.affiliate.userId === userId) return null;
  return referral.affiliate.referralCode;
}

export async function trackReferralClick(code: string, productId?: string) {
  const affiliate = await findAffiliateByCode(code);
  if (!affiliate) return null;

  await prisma.$transaction([
    prisma.referralEvent.create({
      data: { affiliateId: affiliate.id, code: affiliate.referralCode, kind: "CLICK", productId },
    }),
    prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { clicks: { increment: 1 }, crowPoints: { increment: 1 } },
    }),
  ]);

  return affiliate;
}

export async function getAffiliateOverview(userId: string) {
  const affiliate = await ensureAffiliate(userId);

  const [commissions, referrals, timeline, team] = await Promise.all([
    prisma.commission.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { product: { select: { title: true, slug: true } } },
    }),
    prisma.referral.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: "desc" },
      include: { owner: { select: { id: true, name: true, email: true, createdAt: true } } },
    }),
    prisma.referralEvent.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.affiliate.findMany({
      where: { parentAffiliateId: affiliate.id },
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } },
        referrals: { select: { id: true } },
      },
    }),
  ]);

  const clicks = timeline.filter((event) => event.kind === "CLICK").length;
  const conversions = referrals.length;

  return {
    affiliate,
    commissions,
    commissionTotal: commissions.reduce((sum, item) => sum + item.amountUsdt, 0),
    referrals,
    clicks: Math.max(affiliate.clicks, clicks),
    conversions,
    conversionRate: clicks ? (conversions / clicks) * 100 : 0,
    team: team.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      joinedAt: member.user.createdAt,
      code: member.referralCode,
      referrals: member.referrals.length,
      crowPoints: member.crowPoints,
    })),
    crowPoints: affiliate.crowPoints,
  };
}

export async function getAffiliateByUserId(userId: string) {
  return prisma.affiliate.findUnique({
    where: { userId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function listAffiliatesForAdmin() {
  return prisma.affiliate.findMany({
    orderBy: { totalCommissionUsdt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
      _count: { select: { referrals: true, commissions: true } },
    },
  });
}