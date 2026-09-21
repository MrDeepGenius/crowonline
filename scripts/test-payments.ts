import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import prisma, { paymentTransaction } from "@/lib/db";
import { createOrderWithPayment } from "@/server/services/orders";
import { confirmOrderPayment, markOrderFailed } from "@/server/services/settlement";
import { monitorPaymentsOnce } from "@/server/payments/monitor";
import { verifyPayment } from "@/server/payments/verify";
import { paymentConfig, atomicAmount, addressTopic } from "@/server/payments/config";
import { POST } from "@/app/api/webhooks/payments/route";
import { mockBlockchain } from "./helpers/mock-blockchain";

async function main() {
  const mock = mockBlockchain();
  const stamp = randomUUID();
  const users: string[] = [];
  const orders: string[] = [];
  async function user(name: string) {
    const row = await prisma.user.create({ data: { email: `${stamp}-${name}@crow.test`, name, passwordHash: "test-only" } });
    users.push(row.id);
    return row;
  }
  const creator = await user("creator");
  const buyer = await user("buyer");
  async function checkout() {
    const product = await prisma.product.create({ data: {
      creatorId: creator.id, slug: randomUUID(), title: "Payment test", description: "Test", shortDescription: "Test",
      type: "PDF", category: "Test", priceUsdt: 100, status: "PUBLISHED",
    } });
    const order = await createOrderWithPayment({ buyerId: buyer.id, productId: product.id });
    orders.push(order.orderId);
    const payment = await prisma.payment.findUniqueOrThrow({ where: { orderId: order.orderId } });
    return { ...order, product, payment };
  }
  try {
    process.env.PAYMENT_CHAIN_ID = "56";
    assert.throws(paymentConfig);
    process.env.PAYMENT_CHAIN_ID = "97";
    assert.equal(atomicAmount(0.1, 18), "100000000000000000");
    assert.throws(() => atomicAmount(0.001, 2));
    const first = await checkout();
    const tx = mock.mine(first.payment);
    const address = tx.log.address;
    tx.log.address = `0x${"44".repeat(20)}`;
    await assert.rejects(verifyPayment(first.payment, tx.hash));
    tx.log.address = address;
    const data = tx.log.data;
    tx.log.data = `0x${"0".repeat(64)}`;
    await assert.rejects(verifyPayment(first.payment, tx.hash));
    tx.log.data = data;
    const destination = tx.log.topics[2];
    tx.log.topics[2] = addressTopic(`0x${"44".repeat(20)}`);
    await assert.rejects(verifyPayment(first.payment, tx.hash));
    tx.log.topics[2] = destination;
    tx.receipt.status = "0x0";
    await assert.rejects(verifyPayment(first.payment, tx.hash));
    tx.receipt.status = "0x1";
    mock.state.chain = 56;
    await assert.rejects(verifyPayment(first.payment, tx.hash));
    mock.state.chain = 97;
    const oldHash = mock.state.blockHash;
    mock.state.blockHash = `0x${"cc".repeat(32)}`;
    await assert.rejects(verifyPayment(first.payment, tx.hash));
    mock.state.blockHash = oldHash;
    mock.state.unavailable = true;
    await assert.rejects(confirmOrderPayment({ orderId: first.orderId, txHash: tx.hash }));
    mock.state.unavailable = false;
    await monitorPaymentsOnce();
    let paid = await prisma.payment.findUniqueOrThrow({ where: { orderId: first.orderId } });
    assert.equal(paid.status, "PENDING");
    assert.equal(paid.confirmations, 1);
    assert.equal(paid.txHash, tx.hash);
    assert.equal(await prisma.commission.count({ where: { orderId: first.orderId } }), 0);
    mock.state.head += 3;
    await Promise.all([monitorPaymentsOnce(), monitorPaymentsOnce()]);
    paid = await prisma.payment.findUniqueOrThrow({ where: { orderId: first.orderId } });
    assert.equal(paid.status, "PAID");
    assert(paid.senderAddress && paid.blockHash && paid.raw);
    assert.equal(await prisma.enrollment.count({ where: { productId: first.product.id } }), 1);
    assert.equal((await prisma.wallet.findUniqueOrThrow({ where: { userId: creator.id } })).availableUsdt, 45);
    const count = await prisma.commission.count({ where: { orderId: first.orderId } });
    await confirmOrderPayment({ orderId: first.orderId, txHash: tx.hash });
    await markOrderFailed({ orderId: first.orderId });
    assert.equal(await prisma.commission.count({ where: { orderId: first.orderId } }), count);
    assert.equal((await prisma.payment.findUniqueOrThrow({ where: { orderId: first.orderId } })).status, "PAID");
    const second = await checkout();
    await assert.rejects(confirmOrderPayment({ orderId: second.orderId, txHash: tx.hash }));
    const tx2 = mock.mine(second.payment);
    mock.state.head += 3;
    await assert.rejects(paymentTransaction(async () => {
      await confirmOrderPayment({ orderId: second.orderId, txHash: tx2.hash });
      throw new Error("injected failure after commission writes");
    }));
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: second.orderId } })).status, "PENDING");
    assert.equal(await prisma.commission.count({ where: { orderId: second.orderId } }), 0);
    assert.equal(await prisma.walletTransaction.count({ where: { orderId: second.orderId } }), 0);
    assert.equal(await prisma.enrollment.count({ where: { productId: second.product.id } }), 0);
    assert.equal(await prisma.blockchainPaymentClaim.count({ where: { orderId: second.orderId } }), 0);
    await confirmOrderPayment({ orderId: second.orderId, txHash: tx2.hash });
    const expired = await checkout();
    const deadline = new Date(Date.now() - 1000);
    await prisma.order.update({ where: { id: expired.orderId }, data: { expiresAt: deadline } });
    await prisma.payment.update({ where: { orderId: expired.orderId }, data: { expiresAt: deadline } });
    const late = mock.mine(expired.payment);
    await assert.rejects(confirmOrderPayment({ orderId: expired.orderId, txHash: late.hash }));
    mock.state.transactions.delete(late.hash);
    mock.state.head += 3;
    await monitorPaymentsOnce();
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: expired.orderId } })).status, "EXPIRED");
    delete process.env.PAYMENT_WEBHOOK_SECRET;
    assert.equal((await POST(new Request("http://localhost/api/webhooks/payments", { method: "POST", body: "{}" }))).status, 401);
    console.log("ALL PAYMENT TESTS PASSED: monitor, confirmations, PAID, access, commissions/wallet, replay, concurrency, rollback, invalid transfers, expiry, auth");
  } finally {
    await prisma.blockchainPaymentClaim.deleteMany({ where: { orderId: { in: orders } } });
    await prisma.walletTransaction.deleteMany({ where: { userId: { in: users } } });
    await prisma.transaction.deleteMany({ where: { orderId: { in: orders } } });
    await prisma.order.deleteMany({ where: { id: { in: orders } } });
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    mock.restore();
    await prisma.$disconnect();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
