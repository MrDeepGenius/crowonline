import prisma from "@/lib/db";
import { WALLET_TYPE_LABEL, type WalletTransactionType } from "@/lib/domain";

export const MIN_WITHDRAWAL_USDT = 25;
export const DAILY_FEE_RATE = 0.03;
export const MONTHLY_FEE_RATE = 0.02;

export type WithdrawalMode = "DAILY" | "MONTHLY";

export function makeReference(prefix: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}${random}`;
}

export async function ensureWallet(userId: string) {
  const existing = await prisma.wallet.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.wallet.create({ data: { userId } });
}

type LedgerInput = {
  userId: string;
  type: WalletTransactionType;
  amountUsdt: number;
  description: string;
  orderId?: string | null;
  reference?: string;
};

async function applyLedgerEntry(
  input: LedgerInput,
  direction: "CREDIT" | "DEBIT",
  status: "PENDING" | "COMPLETED" = "COMPLETED",
) {
  const wallet = await ensureWallet(input.userId);
  const amount = Math.abs(Number(input.amountUsdt) || 0);
  if (amount <= 0) return { wallet, transaction: null };

  const delta = direction === "CREDIT" ? amount : -amount;
  const available = Math.max(0, wallet.availableUsdt + delta);
  const totalEarned =
    direction === "CREDIT" ? wallet.totalEarnedUsdt + amount : wallet.totalEarnedUsdt;

  const updated = await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      availableUsdt: available,
      totalEarnedUsdt: totalEarned,
      totalWithdrawnUsdt:
        direction === "DEBIT" && status === "COMPLETED"
          ? wallet.totalWithdrawnUsdt + amount
          : wallet.totalWithdrawnUsdt,
    },
  });

  const transaction = await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      userId: input.userId,
      type: input.type,
      direction,
      amountUsdt: amount,
      balanceAfterUsdt: updated.availableUsdt,
      status,
      reference: input.reference ?? makeReference("CROW-TX"),
      description: input.description,
      orderId: input.orderId ?? null,
    },
  });

  return { wallet: updated, transaction };
}

export async function creditWallet(input: LedgerInput) {
  return applyLedgerEntry(input, "CREDIT", "COMPLETED");
}

export async function debitWallet(input: LedgerInput) {
  return applyLedgerEntry(input, "DEBIT", "COMPLETED");
}

export async function getWalletOverview(userId: string) {
  const wallet = await ensureWallet(userId);
  const [transactions, withdrawals, commissions] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { requestedAt: "desc" },
      take: 25,
    }),
    prisma.commission.findMany({
      where: { earnerId: userId },
      select: { amountUsdt: true, role: true },
    }),
  ]);

  return {
    wallet,
    transactions: transactions.map((transaction) => ({
      ...transaction,
      typeLabel:
        WALLET_TYPE_LABEL[transaction.type as WalletTransactionType] ??
        transaction.type,
    })),
    withdrawals,
    pendingWithdrawals: withdrawals
      .filter((item) => item.status === "PENDING")
      .reduce((sum, item) => sum + item.amountUsdt, 0),
    commissionTotal: commissions.reduce((sum, item) => sum + item.amountUsdt, 0),
    minWithdrawal: MIN_WITHDRAWAL_USDT,
  };
}