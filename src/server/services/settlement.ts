import prisma from "@/lib/db";
import { distributeCommissions } from "@/server/services/distribution";

/**
 * Payment confirmation entry point (called by the blockchain webhook).
 * Kept provider-agnostic: swap the confirmation source without touching the
 * commission engine.
 */
export async function confirmOrderPayment({
  orderId,
  txHash,
  confirmations,
}: {
  orderId: string;
  txHash?: string;
  confirmations?: number;
}) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Orden no encontrada");
  if (order.status === "PAID") return { alreadyPaid: true, snapshot: [] };

  const required = Number(process.env.PAYMENT_REQUIRED_CONFIRMATIONS ?? 12);
  const confirmed = confirmations ?? required;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID", paidAt: new Date() },
    }),
    prisma.payment.updateMany({
      where: { orderId },
      data: {
        status: "PAID",
        txHash: txHash ?? null,
        confirmations: confirmed,
        confirmedAt: new Date(),
      },
    }),
    prisma.transaction.updateMany({
      where: { orderId, kind: "PAYMENT" },
      data: { status: "PAID" },
    }),
  ]);

  const snapshot = await distributeCommissions(orderId);
  return { alreadyPaid: false, snapshot };
}

export async function markOrderFailed({
  orderId,
  reason,
}: {
  orderId: string;
  reason?: string;
}) {
  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: "FAILED" } }),
    prisma.payment.updateMany({
      where: { orderId },
      data: { status: "FAILED", raw: reason ?? null },
    }),
    prisma.transaction.updateMany({
      where: { orderId, kind: "PAYMENT" },
      data: { status: "FAILED" },
    }),
  ]);
}

export async function expirePendingOrders() {
  const count = await prisma.order.count({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
  });
  await prisma.order.updateMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
  await prisma.payment.updateMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
  return count;
}

export async function listOrdersForAdmin(status?: string) {
  return prisma.order.findMany({
    where: status && status !== "all" ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      items: { select: { id: true, title: true, priceUsdt: true } },
      payment: true,
    },
  });
}

export async function listPaymentsForAdmin(status?: string) {
  return prisma.payment.findMany({
    where: status && status !== "all" ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true, email: true } },
      order: { select: { reference: true, totalUsdt: true } },
    },
  });
}