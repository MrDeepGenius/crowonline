import type { PrismaClient } from "@prisma/client";

import { computeSplit } from "../src/lib/commissions";
import { reference } from "./seed-helpers";

type SaleInput = {
  buyerId: string;
  productId: string;
  productTitle: string;
  price: number;
  creatorId: string;
  upline: string[];
  referralCode?: string | null;
};

/**
 * Simulates a paid sale using the real CROW distribution engine so demo wallets,
 * commissions and affiliate stats stay consistent with production logic.
 */
export async function simulateSale(prisma: PrismaClient, input: SaleInput) {
  const { buyerId, productId, productTitle, price, creatorId, upline, referralCode } = input;

  const order = await prisma.order.create({
    data: {
      reference: reference("CROW-ORD"),
      buyerId,
      status: "PAID",
      subtotalUsdt: price,
      totalUsdt: price,
      paidAt: new Date(),
      referralCode: referralCode ?? null,
      items: { create: { productId, title: productTitle, priceUsdt: price, creatorId } },
      payment: {
        create: {
          userId: buyerId,
          address: process.env.PAYMENT_USDT_BEP20_ADDRESS ?? "0xSeedAddress",
          amountUsdt: price,
          status: "PAID",
          confirmations: 12,
          requiredConfirmations: 12,
          confirmedAt: new Date(),
          txHash: `0x${Math.random().toString(16).slice(2).padEnd(40, "0")}`,
        },
      },
    },
  });

  const split = computeSplit({ amount: price, creatorId, affiliateUpline: upline });
  let directEarnings = 0;

  for (const line of split.lines) {
    if (line.role === "PLATFORM" || !line.userId) continue;

    await prisma.commission.create({
      data: {
        orderId: order.id,
        productId,
        earnerId: line.userId,
        role: line.role,
        level: line.level ?? null,
        rate: line.rate,
        amountUsdt: line.amount,
        status: "AVAILABLE",
        reference: reference("CROW-CM"),
      },
    });

    const wallet = await prisma.wallet.findUnique({ where: { userId: line.userId } });
    if (wallet) {
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          availableUsdt: wallet.availableUsdt + line.amount,
          totalEarnedUsdt: wallet.totalEarnedUsdt + line.amount,
        },
      });
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: line.userId,
          type:
            line.role === "CREATOR"
              ? "CREATOR_EARNING"
              : line.role === "DIRECT_AFFILIATE"
                ? "DIRECT_AFFILIATE"
                : "LEVEL_BONUS",
          direction: "CREDIT",
          amountUsdt: line.amount,
          balanceAfterUsdt: wallet.availableUsdt + line.amount,
          reference: reference("CROW-TX"),
          description: `Comisión ${line.role} · ${productTitle}`,
        },
      });
    }

    if (line.userId === upline[0]) directEarnings += line.amount;
  }

  if (upline[0]) {
    const affiliate = await prisma.affiliate.findUnique({ where: { userId: upline[0] } });
    if (affiliate) {
      await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: {
          conversions: { increment: 1 },
          clicks: { increment: 12 },
          totalSalesUsdt: { increment: price },
          totalCommissionUsdt: { increment: directEarnings },
          crowPoints: { increment: price },
        },
      });
    }
  }

  await prisma.enrollment.upsert({
    where: { userId_productId: { userId: buyerId, productId } },
    create: { userId: buyerId, productId, progressPct: 25 },
    update: {},
  });

  return order;
}

/** Creates a few reviews plus the pending withdrawal used by the admin demo. */
export async function seedReviewsAndWithdrawal(
  prisma: PrismaClient,
  {
    productIds,
    buyers,
    withdrawalUserId,
  }: {
    productIds: string[];
    buyers: { id: string; name: string }[];
    withdrawalUserId: string;
  },
) {
  const comments = [
    "Contenido directo y aplicable desde el primer módulo.",
    "Las plantillas me ahorraron semanas de trabajo.",
    "Muy claro, sin relleno. Ya lo implementé en mi negocio.",
  ];

  for (let index = 0; index < productIds.length; index += 1) {
    const buyer = buyers[index % buyers.length];
    await prisma.review.create({
      data: {
        productId: productIds[index],
        userId: buyer.id,
        rating: index % 3 === 0 ? 5 : 4,
        comment: comments[index % comments.length],
      },
    });
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: withdrawalUserId } });
  if (!wallet) return null;

  const amount = Math.min(40, Math.floor(wallet.availableUsdt));
  if (amount < 25) return null;

  const feeRate = 0.03;
  const feeUsdt = Math.round(amount * feeRate * 1e6) / 1e6;

  const withdrawal = await prisma.withdrawal.create({
    data: {
      reference: reference("CROW-WD"),
      userId: withdrawalUserId,
      walletId: wallet.id,
      amountUsdt: amount,
      feeRate,
      feeUsdt,
      netUsdt: Math.round((amount - feeUsdt) * 1e6) / 1e6,
      address: "0x9F2b4C7dE1a3B5c8D0e2F4a6B8c0D2e4F6a8B0c2",
      status: "PENDING",
      note: "Retiro de prueba del seed de desarrollo",
      method: "USDT_BEP20",
    },
  });

  // Mirror the production behaviour: the amount moves to pending.
  await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      availableUsdt: Math.max(0, wallet.availableUsdt - amount),
      pendingUsdt: wallet.pendingUsdt + amount,
    },
  });

  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      userId: withdrawalUserId,
      type: "WITHDRAWAL",
      direction: "DEBIT",
      amountUsdt: amount,
      balanceAfterUsdt: Math.max(0, wallet.availableUsdt - amount),
      status: "PENDING",
      reference: `${withdrawal.reference}-HOLD`,
      description: `Solicitud de retiro ${withdrawal.reference} · fee 3%`,
    },
  });

  return withdrawal;
}