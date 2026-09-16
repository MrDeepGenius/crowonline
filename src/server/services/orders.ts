import prisma from "@/lib/db";
import { makeReference } from "@/server/services/wallet";

export type CheckoutResult = {
  orderId: string;
  reference: string;
  amountUsdt: number;
  address: string;
  network: string;
  expiresAt: Date;
  productTitle: string;
};

/**
 * Creates a PENDING order + USDT BEP-20 payment intent.
 * Blockchain confirmation is handled by /api/webhooks/payments (see
 * confirmOrderPayment) so no private keys are ever required here.
 */
export async function createOrderWithPayment({
  buyerId,
  productId,
  referralCode,
}: {
  buyerId: string;
  productId: string;
  referralCode?: string | null;
}): Promise<CheckoutResult> {
  const product = await prisma.product.findFirst({
    where: { id: productId, status: "PUBLISHED" },
  });
  if (!product) throw new Error("Producto no disponible");

  const existing = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { buyerId, status: "PAID" },
    },
    select: { id: true },
  });
  if (existing) throw new Error("Ya tienes este producto en tu biblioteca");

  const address =
    process.env.PAYMENT_USDT_BEP20_ADDRESS ?? "0x0000000000000000000000000000000000000000";
  const requiredConfirmations = Number(process.env.PAYMENT_REQUIRED_CONFIRMATIONS ?? 12);
  const expiresAt = new Date(Date.now() + 45 * 60 * 1000);
  const reference = makeReference("CROW-ORD");

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        reference,
        buyerId,
        status: "PENDING",
        subtotalUsdt: product.priceUsdt,
        totalUsdt: product.priceUsdt,
        currency: "USDT",
        referralCode: referralCode ?? null,
        expiresAt,
        items: {
          create: {
            productId: product.id,
            title: product.title,
            priceUsdt: product.priceUsdt,
            creatorId: product.creatorId,
          },
        },
      },
    });

    await tx.payment.create({
      data: {
        orderId: created.id,
        userId: buyerId,
        provider: process.env.PAYMENT_PROVIDER ?? "usdt_bep20",
        network: "BEP20",
        address,
        amountUsdt: product.priceUsdt,
        status: "PENDING",
        requiredConfirmations,
        expiresAt,
      },
    });

    await tx.transaction.create({
      data: {
        reference,
        kind: "PAYMENT",
        status: "PENDING",
        amountUsdt: product.priceUsdt,
        userId: buyerId,
        orderId: created.id,
        metadata: JSON.stringify({ productId: product.id, network: "BEP20" }),
      },
    });

    return created;
  });

  return {
    orderId: order.id,
    reference: order.reference,
    amountUsdt: product.priceUsdt,
    address,
    network: "BEP20",
    expiresAt,
    productTitle: product.title,
  };
}

export async function listBuyerOrders(buyerId: string) {
  return prisma.order.findMany({
    where: { buyerId },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: { select: { slug: true, coverEmoji: true, coverGradient: true } } } },
      payment: true,
    },
  });
}