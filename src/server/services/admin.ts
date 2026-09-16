import prisma from "@/lib/db";
import { normalizeRoles } from "@/lib/auth/session";

export async function getAdminMetrics() {
  const [
    users,
    creators,
    affiliates,
    products,
    published,
    orders,
    paidOrders,
    pendingWithdrawals,
    payments,
    commissions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.creatorSubscription.count(),
    prisma.affiliate.count(),
    prisma.product.count(),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.order.count(),
    prisma.order.findMany({
      where: { status: "PAID" },
      select: { totalUsdt: true, createdAt: true },
    }),
    prisma.withdrawal.findMany({
      where: { status: "PENDING" },
      select: { amountUsdt: true },
    }),
    prisma.payment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.commission.groupBy({
      by: ["role"],
      _sum: { amountUsdt: true },
    }),
  ]);

  const gmv = paidOrders.reduce((sum, order) => sum + order.totalUsdt, 0);
  const byRole = Object.fromEntries(
    commissions.map((row) => [row.role, row._sum.amountUsdt ?? 0]),
  );

  return {
    users,
    creators,
    affiliates,
    products,
    published,
    drafts: products - published,
    orders,
    paidCount: paidOrders.length,
    gmv,
    platformRevenue: byRole.PLATFORM ?? 0,
    creatorPayouts: byRole.CREATOR ?? 0,
    affiliatePayouts:
      (byRole.DIRECT_AFFILIATE ?? 0) +
      (byRole.L1 ?? 0) +
      (byRole.L2 ?? 0) +
      (byRole.L3 ?? 0) +
      (byRole.L4 ?? 0) +
      (byRole.L5 ?? 0),
    emergencyReserve: byRole.EMERGENCY_RESERVE ?? 0,
    pendingWithdrawalCount: pendingWithdrawals.length,
    pendingWithdrawalAmount: pendingWithdrawals.reduce(
      (sum, item) => sum + item.amountUsdt,
      0,
    ),
    paymentStatuses: payments.map((row) => ({
      status: row.status,
      count: row._count._all,
    })),
    commissionByRole: byRole,
  };
}

export async function listUsersForAdmin(query?: string, role?: string) {
  const users = await prisma.user.findMany({
    where: {
      ...(query
        ? {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      wallet: { select: { availableUsdt: true } },
      affiliate: { select: { referralCode: true, clicks: true } },
      creatorPlan: { select: { plan: true, status: true } },
      _count: { select: { products: true, orders: true } },
    },
  });

  const mapped = users.map((user) => ({ ...user, roleList: normalizeRoles(user.roles) }));
  if (!role || role === "all") return mapped;
  return mapped.filter((user) => user.roleList.includes(role as never));
}

export async function listProductsForAdmin(status?: string) {
  return prisma.product.findMany({
    where: status && status !== "all" ? { status } : {},
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      creator: { select: { id: true, name: true, email: true } },
      publication: { select: { slug: true, publishedAt: true } },
      _count: { select: { enrollments: true, reviews: true } },
    },
  });
}

export async function listCreatorsForAdmin() {
  return prisma.creatorSubscription.findMany({
    orderBy: { startedAt: "desc" },
    take: 100,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          _count: { select: { products: true } },
        },
      },
    },
  });
}

export async function getRevenueTimeline(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const orders = await prisma.order.findMany({
    where: { status: "PAID", paidAt: { gte: since } },
    select: { totalUsdt: true, paidAt: true },
    orderBy: { paidAt: "asc" },
  });

  const buckets = new Map<string, number>();
  for (let index = days; index >= 0; index -= 1) {
    const date = new Date(Date.now() - index * 24 * 60 * 60 * 1000);
    buckets.set(date.toISOString().slice(0, 10), 0);
  }

  orders.forEach((order) => {
    const key = (order.paidAt ?? new Date()).toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + order.totalUsdt);
  });

  return Array.from(buckets.entries()).map(([date, total]) => ({ date, total }));
}

export async function updateUserStatus(userId: string, status: string) {
  return prisma.user.update({ where: { id: userId }, data: { status } });
}

export async function updateProductStatus(productId: string, status: string) {
  return prisma.product.update({ where: { id: productId }, data: { status } });
}