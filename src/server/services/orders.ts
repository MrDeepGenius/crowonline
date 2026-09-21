import prisma from "@/lib/db";
import { localTestIntent, paymentsTestModeEnabled, TEST_PAYMENT_PROVIDER } from "@/server/payments/test-mode";
import { paymentIntent } from "@/server/payments/intent";
import { makeReference } from "@/server/services/wallet";
import { findAffiliateByCode, getReferredAffiliateCode } from "@/server/services/affiliate";

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
 * Resolves the affiliate attribution for a purchase. Priority:
 *   1. explicit referral code (e.g. ?ref= on the buy panel)
 *   2. the code the buyer was referred by at registration (durable)
 * A user can never attribute a sale to their own affiliate account
 * (self-referral is neutralized), and a valid explicit code always wins.
 */
export async function resolveSaleAttribution(
  buyerId: string,
  referralCode?: string | null,
): Promise<string | null> {
  const explicit = referralCode ? (await findAffiliateByCode(referralCode)) ?? null : null;
  if (explicit && explicit.userId !== buyerId) {
    return explicit.referralCode;
  }

  const durable = await getReferredAffiliateCode(buyerId);
  if (durable) {
    const affiliate = await findAffiliateByCode(durable);
    if (affiliate && affiliate.userId !== buyerId) return durable;
  }
  return null;
}

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

  // ADMIN (el dueño del sistema) puede comprar cualquier producto.
  // Un creador normal nunca puede comprar su propio producto (antifraud).
  const buyer = await prisma.user.findUnique({
    where: { id: buyerId },
    select: { roles: true },
  });
  const buyerRoles: string[] = JSON.parse(buyer?.roles ?? "[]");
  const buyerIsAdmin = buyerRoles.includes("ADMIN");

  if (!buyerIsAdmin && product.creatorId === buyerId) {
    throw new Error("No puedes comprar tu propio producto.");
  }

  const existing = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { buyerId, status: "PAID" },
    },
    select: { id: true },
  });
  if (existing) throw new Error("Ya tienes este producto en tu biblioteca");

  // Durable affiliate attribution (registration referral wins when the URL
  // code is absent). Self-referral is neutralized inside the resolver.
  const attribution = await resolveSaleAttribution(buyerId, referralCode);

  const reference = makeReference(paymentsTestModeEnabled() ? "CROW-TEST" : "CROW-ORD");
  const intent = paymentsTestModeEnabled() ? localTestIntent() : await paymentIntent(reference, product.priceUsdt);
  const address = intent.address;
  const expiresAt = new Date(Date.now() + 45 * 60 * 1000);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        reference,
        buyerId,
        status: "PENDING",
        subtotalUsdt: product.priceUsdt,
        totalUsdt: product.priceUsdt,
        currency: "USDT",
        referralCode: attribution,
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
        ...intent,
        amountUsdt: product.priceUsdt,
        status: "PENDING",
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
        metadata: JSON.stringify({ productId: product.id, network: intent.network, mode: intent.provider === TEST_PAYMENT_PROVIDER ? "TEST" : "BLOCKCHAIN" }),
      },
    });

    return created;
  });

  return {
    orderId: order.id,
    reference: order.reference,
    amountUsdt: product.priceUsdt,
    address,
    network: intent.network,
    expiresAt,
    productTitle: product.title,
  };
}

export async function listBuyerOrders(buyerId: string) {
  return prisma.order.findMany({
    where: { buyerId, boost: { is: null } },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: { select: { slug: true, coverEmoji: true, coverGradient: true } } } },
      payment: true,
    },
  });
}