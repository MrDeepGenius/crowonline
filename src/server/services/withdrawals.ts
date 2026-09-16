import prisma from "@/lib/db";
import {
  DAILY_FEE_RATE,
  MIN_WITHDRAWAL_USDT,
  MONTHLY_FEE_RATE,
  ensureWallet,
  makeReference,
  type WithdrawalMode,
} from "@/server/services/wallet";

/** Daily = 3% fee, Monthly = 2% and only available once every 30 days. */
export async function resolveWithdrawalFee(userId: string, mode: WithdrawalMode) {
  const last = await prisma.withdrawal.findFirst({
    where: { userId, status: { in: ["PENDING", "APPROVED", "PAID"] } },
    orderBy: { requestedAt: "desc" },
  });

  if (mode === "MONTHLY") {
    const eligible =
      !last ||
      Date.now() - new Date(last.requestedAt).getTime() > 30 * 24 * 60 * 60 * 1000;
    return {
      eligible,
      feeRate: MONTHLY_FEE_RATE,
      blockedReason: eligible
        ? null
        : "El retiro mensual (2%) solo puede solicitarse una vez cada 30 días. Usa el retiro diario (3%).",
    };
  }

  return { eligible: true, feeRate: DAILY_FEE_RATE, blockedReason: null };
}

export async function requestWithdrawal({
  userId,
  amountUsdt,
  address,
  note,
  mode = "DAILY",
}: {
  userId: string;
  amountUsdt: number;
  address: string;
  note?: string;
  mode?: WithdrawalMode;
}) {
  const wallet = await ensureWallet(userId);
  const amount = Number(amountUsdt);

  if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL_USDT) {
    throw new Error(`El mínimo de retiro es ${MIN_WITHDRAWAL_USDT} USDT.`);
  }
  if (amount > wallet.availableUsdt) {
    throw new Error("Saldo insuficiente en tu wallet.");
  }
  if (!address || address.trim().length < 10) {
    throw new Error("Dirección BEP-20 inválida.");
  }

  const fee = await resolveWithdrawalFee(userId, mode);
  if (!fee.eligible) throw new Error(fee.blockedReason ?? "Retiro no disponible.");

  const feeUsdt = Math.round(amount * fee.feeRate * 1e6) / 1e6;
  const netUsdt = Math.round((amount - feeUsdt) * 1e6) / 1e6;
  const reference = makeReference("CROW-WD");

  return prisma.$transaction(async (tx) => {
    const created = await tx.withdrawal.create({
      data: {
        reference,
        userId,
        walletId: wallet.id,
        amountUsdt: amount,
        feeRate: fee.feeRate,
        feeUsdt,
        netUsdt,
        address: address.trim(),
        status: "PENDING",
        note: note || null,
        method: "USDT_BEP20",
      },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableUsdt: Math.max(0, wallet.availableUsdt - amount),
        pendingUsdt: wallet.pendingUsdt + amount,
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: "WITHDRAWAL",
        direction: "DEBIT",
        amountUsdt: amount,
        balanceAfterUsdt: Math.max(0, wallet.availableUsdt - amount),
        status: "PENDING",
        reference: `${reference}-HOLD`,
        description: `Solicitud de retiro ${reference} · fee ${(fee.feeRate * 100).toFixed(0)}%`,
      },
    });

    return created;
  });
}