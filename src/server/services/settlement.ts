import prisma, { paymentTransaction } from "@/lib/db";
import { verifyPayment } from "@/server/payments/verify";
import { distributeCommissions } from "@/server/services/distribution";
import { confirmBoostPayment } from "@/server/services/boost";

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
  const original = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true, boost: true } });
  if (!original) throw new Error("Orden no encontrada");
  // Boost's commercial service remains untouched and is not enrolled in this
  // product-payment testnet rollout. Public actions never simulate payments.
  if (original.boost) return confirmBoostPayment({ orderId, txHash, confirmations }).then((r) => r!);
  if (original.status === "PAID") return { alreadyPaid: true, snapshot: parseSnapshot(original.commissionSnapshot) };
  if (original.status !== "PENDING" || !original.payment || original.payment.status !== "PENDING") {
    throw new Error("Orden no pagable");
  }
  const evidence = await verifyPayment(original.payment, txHash ?? original.payment.txHash ?? "");
  if (!evidence) return { alreadyPaid: false, snapshot: [], pending: true };
  return paymentTransaction(async () => {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { payment: true } });
    if (order.status === "PAID") return { alreadyPaid: true, snapshot: parseSnapshot(order.commissionSnapshot) };
    if (order.status !== "PENDING" || order.payment?.status !== "PENDING" ||
        !order.expiresAt || evidence.blockTime >= order.expiresAt ||
        order.totalUsdt !== order.payment.amountUsdt) throw new Error("Orden no pagable");
    const key = `97:${evidence.txHash}`;
    const claim = await prisma.blockchainPaymentClaim.findUnique({ where: { key } });
    if (claim && claim.orderId !== orderId) throw new Error("TX ya asignada a otra orden");
    const previous = await prisma.blockchainPaymentClaim.findUnique({ where: { orderId } });
    if (previous && previous.key !== key) throw new Error("La orden ya tiene una TX asignada");
    if (!claim) await prisma.blockchainPaymentClaim.create({ data: { key, orderId } });
    await prisma.payment.update({ where: { orderId }, data: { ...evidence, verificationError: null } });
    if (evidence.confirmations < order.payment.requiredConfirmations) {
      return { alreadyPaid: false, snapshot: [], pending: true };
    }
    const now = new Date();
    await prisma.order.update({ where: { id: orderId }, data: { status: "PAID", paidAt: now } });
    await prisma.payment.update({ where: { orderId }, data: { status: "PAID", confirmedAt: now } });
    const updated = await prisma.transaction.updateMany({
      where: { orderId, kind: "PAYMENT", status: "PENDING", amountUsdt: order.totalUsdt },
      data: { status: "PAID" },
    });
    if (updated.count !== 1) throw new Error("Registro de pago inválido");
    const snapshot = await distributeCommissions(orderId);
    await prisma.order.update({ where: { id: orderId }, data: { settledAt: now } });
    return { alreadyPaid: false, snapshot };
  });
}

function parseSnapshot(raw: string | null) {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as { role: string; amount: number; userId: string | null }[];
  } catch {
    return [];
  }
}

export async function markOrderFailed({
  orderId,
  reason,
}: {
  orderId: string;
  reason?: string;
}) {
  const boost = await prisma.productBoost.findUnique({ where: { orderId } });
  if (boost) {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: { id: orderId, status: "PENDING" }, data: { status: "FAILED" },
      });
      if (!claimed.count) return;
      await tx.payment.updateMany({ where: { orderId }, data: { status: "FAILED", raw: reason ?? null } });
      await tx.transaction.updateMany({ where: { orderId, kind: "PAYMENT" }, data: { status: "FAILED" } });
      await tx.productBoost.update({ where: { orderId }, data: { pendingKey: null } });
    });
    return;
  }
  await paymentTransaction(async () => {
    const claimed = await prisma.order.updateMany({ where: { id: orderId, status: "PENDING", payment: { txHash: null } }, data: { status: "FAILED" } });
    if (!claimed.count) return;
    await prisma.payment.updateMany({ where: { orderId, status: "PENDING" }, data: { status: "FAILED", verificationError: reason } });
    await prisma.transaction.updateMany({ where: { orderId, kind: "PAYMENT", status: "PENDING" }, data: { status: "FAILED" } });
  });
}

export async function expirePendingOrders() {
  const count = await prisma.order.count({
    where: { status: "PENDING", payment: { chainId: null }, expiresAt: { lt: new Date() } },
  });
  await prisma.order.updateMany({
    where: { status: "PENDING", payment: { chainId: null }, expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
  await prisma.payment.updateMany({
    where: { status: "PENDING", chainId: null, expiresAt: { lt: new Date() } },
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