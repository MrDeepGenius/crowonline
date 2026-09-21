import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { BOOST_DURATION_MS, BOOST_PRICE_USDT } from "@/lib/boost";
import { makeReference } from "@/server/services/wallet";

/** Retries only rolled-back transactions / unique checkout-slot races. */
async function atomic<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(work);
    } catch (error) {
      if (attempt >= 3 || !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          !["P2002", "P2034", "P1008"].includes(error.code)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }
}

/** One pending checkout per product; price and ownership are server-controlled. */
export async function createBoostCheckout({ creatorId, productId }: {
  creatorId: string; productId: string;
}) {
  return atomic(async (tx) => {
    const now = new Date();
    const product = await tx.product.findFirst({
      where: { id: productId, creatorId, status: "PUBLISHED" },
    });
    if (!product) throw new Error("Solo puedes impulsar tus productos publicados.");
    const active = await tx.productBoost.findFirst({
      where: { productId, status: "ACTIVE", expiresAt: { gt: now } },
      include: { order: true },
    });
    if (active) return active.order;
    const pending = await tx.productBoost.findUnique({
      where: { pendingKey: productId }, include: { order: true },
    });
    if (pending?.order.status === "PENDING" && pending.order.expiresAt && pending.order.expiresAt > now) {
      return pending.order;
    }
    if (pending) {
      await tx.productBoost.update({ where: { id: pending.id }, data: { pendingKey: null } });
    }
    const reference = makeReference("CROW-BST");
    const expiresAt = new Date(now.getTime() + 45 * 60 * 1000);
    const order = await tx.order.create({ data: {
      reference, buyerId: creatorId, subtotalUsdt: BOOST_PRICE_USDT,
      totalUsdt: BOOST_PRICE_USDT, expiresAt,
      boost: { create: { productId, pendingKey: productId, priceUsdt: BOOST_PRICE_USDT } },
      payment: { create: {
        userId: creatorId, provider: process.env.PAYMENT_PROVIDER ?? "usdt_bep20",
        network: "BEP20", address: process.env.PAYMENT_USDT_BEP20_ADDRESS ?? "0x0000000000000000000000000000000000000000",
        amountUsdt: BOOST_PRICE_USDT, status: "PENDING", expiresAt,
        requiredConfirmations: Number(process.env.PAYMENT_REQUIRED_CONFIRMATIONS ?? 12),
      } },
    } });
    await tx.transaction.create({ data: {
      reference, orderId: order.id, userId: creatorId, kind: "PAYMENT",
      status: "PENDING", amountUsdt: BOOST_PRICE_USDT,
      metadata: JSON.stringify({ boost: true, productId, network: "BEP20" }),
    } });
    return order;
  });
}

/** Exclusive settlement branch: no commission, wallet or enrollment writes. */
export async function confirmBoostPayment({ orderId, txHash, confirmations }: {
  orderId: string; txHash?: string; confirmations?: number;
}) {
  return atomic(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId }, include: { boost: { include: { product: true } }, payment: true },
    });
    if (!order?.boost) return null;
    const { boost, payment } = order;
    if (order.status === "PAID") return { alreadyPaid: true, snapshot: [] };
    const now = new Date();
    if (order.status !== "PENDING" || !order.expiresAt || order.expiresAt <= now) {
      throw new Error("La orden Boost no está pendiente o ha vencido.");
    }
    if (boost.product.creatorId !== order.buyerId || boost.product.status !== "PUBLISHED") {
      throw new Error("El producto Boost debe seguir publicado y pertenecer al comprador.");
    }
    if (!payment || payment.status !== "PENDING" || payment.amountUsdt !== BOOST_PRICE_USDT ||
        order.totalUsdt !== BOOST_PRICE_USDT || boost.priceUsdt !== BOOST_PRICE_USDT) {
      throw new Error("Pago Boost inválido.");
    }
    const confirmed = confirmations ?? payment.requiredConfirmations;
    if (confirmed < payment.requiredConfirmations) throw new Error("Confirmaciones insuficientes.");
    await tx.order.update({ where: { id: orderId }, data: { status: "PAID", paidAt: now } });
    await tx.payment.update({ where: { id: payment.id }, data: {
      status: "PAID", txHash: txHash ?? null, confirmations: confirmed, confirmedAt: now,
    } });
    const ledger = await tx.transaction.updateMany({
      where: { orderId, kind: "PAYMENT", status: "PENDING", amountUsdt: BOOST_PRICE_USDT },
      data: { status: "PAID" },
    });
    if (ledger.count !== 1) throw new Error("Registro de pago Boost inválido.");
    await tx.productBoost.update({ where: { id: boost.id }, data: {
      status: "ACTIVE", pendingKey: null, startedAt: now,
      expiresAt: new Date(now.getTime() + BOOST_DURATION_MS),
    } });
    return { alreadyPaid: false, snapshot: [] };
  });
}

export async function expireBoosts() {
  return prisma.productBoost.updateMany({
    where: { status: "ACTIVE", expiresAt: { lte: new Date() } }, data: { status: "EXPIRED" },
  });
}
