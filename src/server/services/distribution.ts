import prisma from "@/lib/db";
import { computeSplit, DEFAULT_SPLIT, type TreasuryReason, type SplitLine } from "@/lib/commissions";
import { creditWallet, makeReference } from "@/server/services/wallet";
import { resolveUpline } from "@/server/services/affiliate";
import { enrollUser } from "@/server/services/learning";

export type CommissionSnapshotLine = {
  role: string;
  amount: number;
  userId: string | null;
  sourceRole?: SplitLine["sourceRole"];
  reason?: TreasuryReason;
  beneficiaryId?: string | null;
};

function parseSnapshot(raw: string | null): CommissionSnapshotLine[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CommissionSnapshotLine[];
  } catch {
    return [];
  }
}

/**
 * Distributes one paid order across the CROW commercial matrix (exactly 100%):
 * Creator 45% · CROW 10% · Direct affiliate 30% · L1 5% · L2 3% · L3 2% ·
 * L4 2% · L5 1% · Rewards Pool 2%.
 *
 * PLATFORM is always 10%. Unassignable commissions are recorded separately as
 * CROW_TREASURY with the original role, beneficiary, reason and sale reference.
 * Treasury is a definitive destination, never a pending user balance.
 *
 * Idempotent by orderId: if any Commission already exists for the order the
 * distribution is skipped and the stored snapshot is returned, so a retried
 * webhook or a double admin confirmation can never pay out twice.
 *
 * Emergency Reserve is only used in the first-L1-unlock exception
 * (2.5% affiliate + 2.5% reserve) and never forms part of the permanent split.
 * Rewards Pool and Emergency Reserve are CROW buckets: they are recorded as
 * Transactions (never as user commissions or wallet balances).
 * Crow Points are volume points, not money: they stay on the Affiliate record.
 */
export async function distributeCommissions(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error("Orden no encontrada");

  const alreadyDistributed = await prisma.commission.findFirst({
    where: { orderId },
    select: { id: true },
  });
  if (alreadyDistributed) {
    return parseSnapshot(order.commissionSnapshot);
  }

  const { affiliate, upline } = await resolveUpline(order.referralCode);
  const snapshot: CommissionSnapshotLine[] = [];

  for (const item of order.items) {
    // A creator never earns affiliate commission on their own product.
    const directAffiliate =
      affiliate && affiliate.userId !== item.creatorId ? affiliate : null;
    const activeUpline = directAffiliate ? upline : [];
    const users = await prisma.user.findMany({
      where: { id: { in: [item.creatorId, ...activeUpline] } },
      select: { id: true, status: true, affiliate: { select: { status: true } } },
    });
    const beneficiaryIssues: Record<string, TreasuryReason> = {};
    for (const id of [item.creatorId, ...activeUpline]) {
      const user = users.find((candidate) => candidate.id === id);
      if (!user) beneficiaryIssues[id] = "MISSING_BENEFICIARY";
      else if (user.status !== "ACTIVE") beneficiaryIssues[id] = "INACTIVE_USER";
      else if (id !== item.creatorId && !user.affiliate) beneficiaryIssues[id] = "INELIGIBLE_BENEFICIARY";
      else if (id !== item.creatorId && user.affiliate?.status !== "ACTIVE") beneficiaryIssues[id] = "INACTIVE_AFFILIATE";
    }

    const isFirstL1Unlock = Boolean(
      directAffiliate && activeUpline.length > 1 && !directAffiliate.level1Unlocked,
    );

    const split = computeSplit({
      amount: item.priceUsdt,
      config: DEFAULT_SPLIT,
      creatorId: item.creatorId,
      affiliateUpline: activeUpline,
      isFirstL1Unlock,
      beneficiaryIssues,
    });

    for (const line of split.lines) {
      snapshot.push({
        role: line.role,
        amount: line.amount,
        userId: line.userId ?? null,
        ...(line.role === "CROW_TREASURY" ? {
          sourceRole: line.sourceRole, reason: line.reason, beneficiaryId: line.beneficiaryId,
        } : {}),
      });

      if (line.role === "PLATFORM") continue;

      // CROW buckets: platform-level money that never belongs to a user wallet.
      if (line.role === "EMERGENCY_RESERVE" || line.role === "REWARDS_POOL" || line.role === "CROW_TREASURY") {
        const isReserve = line.role === "EMERGENCY_RESERVE";
        const isTreasury = line.role === "CROW_TREASURY";
        await prisma.transaction.create({
          data: {
            reference: makeReference(isReserve ? "CROW-RSV" : isTreasury ? "CROW-TRY" : "CROW-RWP"),
            kind: "ADJUSTMENT",
            status: "COMPLETED",
            amountUsdt: line.amount,
            orderId: order.id,
            metadata: JSON.stringify({
              bucket: line.role,
              reason: isTreasury ? line.reason : isReserve ? "first_l1_unlock" : "product_sale",
              sourceRole: line.sourceRole,
              beneficiaryId: line.beneficiaryId,
              rate: line.rate,
              level: line.level,
              saleReference: order.reference,
              orderItemId: item.id,
              productId: item.productId,
            }),
          },
        });

        if (isReserve && directAffiliate) {
          await prisma.affiliate.update({
            where: { id: directAffiliate.id },
            data: {
              emergencyReserveUsdt: directAffiliate.emergencyReserveUsdt + line.amount,
              level1Unlocked: true,
            },
          });
        }
        continue;
      }

      const commission = await prisma.commission.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          affiliateId: directAffiliate?.id ?? null,
          earnerId: line.userId as string,
          role: line.role,
          level: line.level ?? null,
          rate: line.rate,
          amountUsdt: line.amount,
          status: "AVAILABLE",
          reference: makeReference("CROW-CM"),
        },
      });

      const type =
        line.role === "CREATOR"
          ? "CREATOR_EARNING"
          : line.role === "DIRECT_AFFILIATE"
            ? "DIRECT_AFFILIATE"
            : "LEVEL_BONUS";

      await creditWallet({
        userId: line.userId as string,
        type,
        amountUsdt: line.amount,
        description: `Comisión ${line.role} · ${item.title}`,
        orderId: order.id,
        reference: `${commission.reference}-W`,
      });
    }

    if (directAffiliate) {
      const directEarnings = split.lines
        .filter((line) => line.userId === directAffiliate.userId)
        .reduce((sum, line) => sum + line.amount, 0);

      await prisma.affiliate.update({
        where: { id: directAffiliate.id },
        data: {
          conversions: { increment: 1 },
          totalSalesUsdt: { increment: item.priceUsdt },
          totalCommissionUsdt: { increment: directEarnings },
          crowPoints: { increment: split.crowPoints },
        },
      });
    }

    await prisma.product.update({
      where: { id: item.productId },
      data: {
        salesCount: { increment: 1 },
        revenueUsdt: { increment: item.priceUsdt },
      },
    });

    await enrollUser({ userId: order.buyerId, productId: item.productId });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { commissionSnapshot: JSON.stringify(snapshot) },
  });

  return snapshot;
}