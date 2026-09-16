import prisma from "@/lib/db";
import { makeReference } from "@/server/services/wallet";

/** Withdrawals are manual in CROW: ADMIN approves, rejects or marks as paid. */
export async function reviewWithdrawal({
  withdrawalId,
  adminId,
  action,
  adminNote,
  txHash,
}: {
  withdrawalId: string;
  adminId: string;
  action: "APPROVE" | "REJECT" | "PAID";
  adminNote?: string;
  txHash?: string;
}) {
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
  });
  if (!withdrawal) throw new Error("Retiro no encontrado");

  const wallet = await prisma.wallet.findUnique({
    where: { id: withdrawal.walletId },
  });

  if (action === "APPROVE") {
    return prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: "APPROVED",
        reviewedById: adminId,
        reviewedAt: new Date(),
        adminNote: adminNote || null,
      },
    });
  }

  if (action === "PAID") {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          reviewedById: adminId,
          reviewedAt: withdrawal.reviewedAt ?? new Date(),
          txHash: txHash || null,
          adminNote: adminNote || null,
        },
      });

      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            pendingUsdt: Math.max(0, wallet.pendingUsdt - withdrawal.amountUsdt),
            totalWithdrawnUsdt: wallet.totalWithdrawnUsdt + withdrawal.amountUsdt,
          },
        });
      }

      await tx.walletTransaction.updateMany({
        where: { reference: `${withdrawal.reference}-HOLD` },
        data: { status: "COMPLETED" },
      });

      await tx.transaction.create({
        data: {
          reference: withdrawal.reference,
          kind: "WITHDRAWAL",
          status: "PAID",
          amountUsdt: withdrawal.netUsdt,
          userId: withdrawal.userId,
          metadata: JSON.stringify({ txHash, feeUsdt: withdrawal.feeUsdt }),
        },
      });

      return updated;
    });
  }

  // REJECT → refund the held amount back to the available balance.
  return prisma.$transaction(async (tx) => {
    const updated = await tx.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: "REJECTED",
        reviewedById: adminId,
        reviewedAt: new Date(),
        adminNote: adminNote || null,
      },
    });

    if (wallet) {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableUsdt: wallet.availableUsdt + withdrawal.amountUsdt,
          pendingUsdt: Math.max(0, wallet.pendingUsdt - withdrawal.amountUsdt),
        },
      });
    }

    await tx.walletTransaction.updateMany({
      where: { reference: `${withdrawal.reference}-HOLD` },
      data: { status: "REVERSED" },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: withdrawal.walletId,
        userId: withdrawal.userId,
        type: "WITHDRAWAL_REVERSAL",
        direction: "CREDIT",
        amountUsdt: withdrawal.amountUsdt,
        balanceAfterUsdt: (wallet?.availableUsdt ?? 0) + withdrawal.amountUsdt,
        status: "COMPLETED",
        reference: makeReference("CROW-REV"),
        description: `Retiro ${withdrawal.reference} rechazado — saldo devuelto`,
      },
    });

    return updated;
  });
}

export async function listWithdrawalsForAdmin(status?: string) {
  return prisma.withdrawal.findMany({
    where: status && status !== "all" ? { status } : {},
    orderBy: { requestedAt: "desc" },
    take: 100,
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}