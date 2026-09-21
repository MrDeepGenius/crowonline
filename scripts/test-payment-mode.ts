import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import prisma from "@/lib/db";
import { createOrderWithPayment } from "@/server/services/orders";
import { requestWithdrawal } from "@/server/services/withdrawals";

async function main() {
  const env = { ...process.env };
  const fetch = globalThis.fetch;
  let rpcCalls = 0;
  globalThis.fetch = async () => { rpcCalls++; throw new Error("TEST must never use RPC"); };
  Object.assign(process.env, { NODE_ENV: "test", PAYMENTS_TEST_MODE: "true", PAYMENT_BSC_RPC_URL: "" });
  const stamp = randomUUID();
  const creator = await prisma.user.create({ data: { name: "Test creator", email: `${stamp}-creator@local.invalid`, passwordHash: "no-login" } });
  const buyer = await prisma.user.create({ data: { name: "Test buyer", email: `${stamp}-buyer@local.invalid`, passwordHash: "no-login" } });
  const product = await prisma.product.create({ data: {
    creatorId: creator.id, slug: stamp, title: "Local payment", description: "Test", shortDescription: "Test",
    type: "PDF", category: "Test", status: "PUBLISHED", priceUsdt: 100,
  } });
  const orderIds: string[] = [];
  try {
    const order = await createOrderWithPayment({ buyerId: buyer.id, productId: product.id });
    orderIds.push(order.orderId);
    const pending = await prisma.payment.findUniqueOrThrow({ where: { orderId: order.orderId } });
    assert.equal(pending.provider, "local_test");
    assert.equal(pending.status, "PENDING");
    assert.equal(pending.chainId, null);
    assert.equal(JSON.parse(pending.raw!).mode, "TEST");
    assert.equal(await prisma.enrollment.count({ where: { userId: buyer.id } }), 0);
    // Load only after checking the creation trigger, so the first RED failure
    // diagnoses the checkout path rather than a not-yet-implemented service.
    const { confirmLocalTestPayment } = await import("@/server/payments/test-settlement");
    const input = { orderId: order.orderId, buyerId: buyer.id };
    await assert.rejects(confirmLocalTestPayment({ ...input, buyerId: creator.id }));
    for (const flag of [undefined, "false", "TRUE"]) {
      if (flag === undefined) delete process.env.PAYMENTS_TEST_MODE;
      else process.env.PAYMENTS_TEST_MODE = flag;
      await assert.rejects(confirmLocalTestPayment(input));
      await assert.rejects(createOrderWithPayment({ buyerId: buyer.id, productId: product.id }));
    }
    process.env.PAYMENTS_TEST_MODE = "true";
    Object.assign(process.env, { NODE_ENV: "production" });
    await assert.rejects(confirmLocalTestPayment(input));
    await assert.rejects(createOrderWithPayment({ buyerId: buyer.id, productId: product.id }));
    Object.assign(process.env, { NODE_ENV: "test" });
    // A real intent must not become simulatable just because the flag is on.
    await prisma.payment.update({ where: { orderId: order.orderId }, data: { provider: "bsc_testnet", chainId: 97 } });
    await assert.rejects(confirmLocalTestPayment(input));
    await prisma.payment.update({ where: { orderId: order.orderId }, data: { provider: "local_test", chainId: null } });
    const future = new Date(Date.now() + 60000);
    await prisma.order.update({ where: { id: order.orderId }, data: { expiresAt: new Date(0) } });
    await assert.rejects(confirmLocalTestPayment(input));
    await prisma.order.update({ where: { id: order.orderId }, data: { expiresAt: future } });
    // Force a failure after PAID writes; transaction must roll everything back.
    await prisma.transaction.updateMany({ where: { orderId: order.orderId }, data: { amountUsdt: 99 } });
    await assert.rejects(confirmLocalTestPayment(input));
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.orderId } })).status, "PENDING");
    assert.equal(await prisma.blockchainPaymentClaim.count({ where: { orderId: order.orderId } }), 0);
    assert.equal(await prisma.commission.count({ where: { orderId: order.orderId } }), 0);
    await prisma.transaction.updateMany({ where: { orderId: order.orderId }, data: { amountUsdt: 100 } });
    await Promise.all([confirmLocalTestPayment(input), confirmLocalTestPayment(input)]);
    const paid = await prisma.payment.findUniqueOrThrow({ where: { orderId: order.orderId } });
    assert.equal(paid.status, "PAID");
    assert.equal(paid.txHash, `TEST:${order.orderId}`);
    assert.equal(JSON.parse(paid.raw!).mode, "TEST");
    assert.equal(await prisma.enrollment.count({ where: { userId: buyer.id, productId: product.id } }), 1);
    const commission = await prisma.commission.findFirstOrThrow({ where: { orderId: order.orderId, earnerId: creator.id } });
    assert.equal(commission.amountUsdt, 45);
    assert.equal(commission.status, "TEST");
    const ledger = await prisma.walletTransaction.findMany({ where: { orderId: order.orderId } });
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].status, "TEST");
    assert.equal(ledger[0].amountUsdt, 45);
    assert.equal(ledger[0].balanceAfterUsdt, 0);
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: creator.id } });
    assert.equal(wallet.availableUsdt, 0);
    assert.equal(wallet.pendingUsdt, 0);
    assert.equal(wallet.totalEarnedUsdt, 0);
    await confirmLocalTestPayment(input);
    assert.equal(await prisma.walletTransaction.count({ where: { orderId: order.orderId } }), 1);
    assert.equal(await prisma.commission.count({ where: { orderId: order.orderId } }), 1);
    const audit = await prisma.transaction.findMany({ where: { orderId: order.orderId } });
    assert(audit.length > 1);
    assert(audit.every((entry) => JSON.parse(entry.metadata).mode === "TEST"));
    assert(audit.filter((entry) => entry.kind !== "PAYMENT").every((entry) => entry.status === "TEST"));
    const stats = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    assert.equal(stats.salesCount, 0);
    assert.equal(stats.revenueUsdt, 0);
    delete process.env.PAYMENTS_TEST_MODE;
    Object.assign(process.env, { NODE_ENV: "production" });
    await assert.rejects(confirmLocalTestPayment(input));
    await assert.rejects(requestWithdrawal({ userId: creator.id, amountUsdt: 25, address: "unused-test-address" }), /Saldo insuficiente/);
    assert.equal(rpcCalls, 0);
    console.log("LOCAL TEST MODE PASSED: flag, production guard, no RPC, ownership, PAID/access, TEST commission/ledger, replay/concurrency, non-withdrawable after disabling flag");
  } finally {
    await prisma.blockchainPaymentClaim.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.transaction.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.commission.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.order.deleteMany({ where: { buyerId: buyer.id } });
    await prisma.user.deleteMany({ where: { id: { in: [creator.id, buyer.id] } } });
    globalThis.fetch = fetch;
    process.env = env;
    await prisma.$disconnect();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
