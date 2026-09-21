import prisma, { paymentTransaction } from "@/lib/db";
import { distributeCommissions } from "@/server/services/distribution";
import { requirePaymentsTestMode, TEST_PAYMENT_PROVIDER } from "./test-mode";

/** Internal, authenticated-owner simulation. Never accepts a client TX/amount. */
export async function confirmLocalTestPayment({ orderId, buyerId }: { orderId: string; buyerId: string }) {
  requirePaymentsTestMode();
  return paymentTransaction(async () => {
    requirePaymentsTestMode();
    const order = await prisma.order.findFirst({
      where: { id: orderId, buyerId }, include: { payment: true, items: true, boost: true },
    });
    if (!order || order.boost || !order.items.length || order.payment?.provider !== TEST_PAYMENT_PROVIDER ||
        order.payment.chainId !== null) throw new Error("Solo se pueden simular tus compras TEST de productos.");
    const payment = order.payment;
    const txHash = `TEST:${order.id}`;
    if (order.status === "PAID" && payment.status === "PAID" && payment.txHash === txHash && order.settledAt) {
      return { alreadyPaid: true, status: "PAID" };
    }
    if (order.status !== "PENDING" || payment.status !== "PENDING" || !order.expiresAt ||
        order.expiresAt <= new Date() || !payment.expiresAt || payment.expiresAt <= new Date() ||
        order.totalUsdt <= 0 || order.totalUsdt !== payment.amountUsdt ||
        (payment.txHash !== null && payment.txHash !== txHash)) throw new Error("Orden TEST inválida o vencida.");
    const now = new Date();
    await prisma.blockchainPaymentClaim.create({ data: { key: txHash, orderId } });
    await prisma.order.update({ where: { id: orderId }, data: { status: "PAID", paidAt: now } });
    await prisma.payment.update({ where: { orderId }, data: {
      status: "PAID", txHash, confirmations: 1, confirmedAt: now,
      raw: JSON.stringify({ mode: "TEST", source: "internal_owner_confirmation", actorId: buyerId, withdrawable: false, txHash, confirmedAt: now }),
    } });
    const ledger = await prisma.transaction.updateMany({
      where: { orderId, kind: "PAYMENT", status: "PENDING", amountUsdt: order.totalUsdt },
      data: { status: "PAID", metadata: JSON.stringify({ mode: "TEST", txHash, actorId: buyerId, withdrawable: false }) },
    });
    if (ledger.count !== 1) throw new Error("Registro de pago TEST inválido.");
    await distributeCommissions(orderId);
    return { alreadyPaid: false, status: "PAID" };
  });
}
