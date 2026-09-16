import prisma from "@/lib/db";
import { computeSplit, DEFAULT_SPLIT } from "@/lib/commissions";
import { creditWallet, makeReference } from "@/server/services/wallet";
import { resolveUpline } from "@/server/services/affiliate";
import { enrollUser } from "@/server/services/learning";

/**
 * Distributes one paid order across the CROW commercial matrix:
 * Creator 45% · Crow 10% · Direct affiliate 30% · L1 5% · L2 3% · L3 2% · L4 2% · L5 1%.
 *
 * Emergency Reserve is only used in the first-L1-unlock exception
 * (2.5% affiliate + 2.5% reserve) and never forms part of the permanent split.
 * Crow Points are volume points, not money: they stay on the Affiliate record.
 */
export async function distributeCommissions(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error("Orden no encontrada");

  const { affiliate, upline } = await resolveUpline(order.referralCode);
  const snapshot: { role: string; amount: number; userId: string | null }[] = [];

  for (const item of order.items) {
    // A creator never earns affiliate commission on their own product.
    const directAffiliate =
      affiliate && affiliate.userId !== item.creatorId ? affiliate : null;
    const activeUpline = directAffiliate ? upline : [];

    const isFirstL1Unlock = Boolean(
      directAffiliate && activeUpline.length > 1 && !directAffiliate.level1Unlocked,
    );

    const split = computeSplit({
      amount: item.priceUsdt,
      config: DEFAULT_SPLIT,
      creatorId: item.creatorId,
      affiliateUpline: activeUpline,
      isFirstL1Unlock,
    });

    for (const line of split.lines) {
      snapshot.push({
        role: line.role,
        amount: line.amount,
        userId: line.userId ?? null,
      });

      if (line.role === "PLATFORM") continue;

      if (line.role === "EMERGENCY_RESERVE") {
        await prisma.transaction.create({
          data: {
            reference: makeReference("CROW-RSV"),
            kind: "ADJUSTMENT",
            status: "COMPLETED",
            amountUsdt: line.amount,
            orderId: order.id,
            metadata: JSON.stringify({
              bucket: "EMERGENCY_RESERVE",
              reason: "first_l1_unlock",
              productId: item.productId,
            }),
          },
        });
        if (directAffiliate) {
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