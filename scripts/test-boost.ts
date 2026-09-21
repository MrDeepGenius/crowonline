import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import prisma from "@/lib/db";
import { BOOST_DURATION_MS, isBoostActive } from "@/lib/boost";
import { createBoostCheckout } from "@/server/services/boost";
import { confirmOrderPayment, markOrderFailed } from "@/server/services/settlement";
import { listFeaturedProducts, listCreatorProducts, listMarketplaceProducts } from "@/server/services/catalog";
import { listBuyerOrders } from "@/server/services/orders";

async function main() {
  const stamp = randomUUID();
  const user = await prisma.user.create({ data: {
    email: `boost-${stamp}@crow.test`, name: "Boost test", passwordHash: "no-login", roles: '["CREATOR"]',
  } });
  try {
    const product = await prisma.product.create({ data: {
      creatorId: user.id, slug: `boost-${stamp}`, title: "Boost test", shortDescription: "Test",
      description: "Test", type: "PDF", category: "Test", priceUsdt: 99, status: "DRAFT",
    } });
    const input = { creatorId: user.id, productId: product.id };
    await assert.rejects(createBoostCheckout(input));
    await prisma.product.update({ where: { id: product.id }, data: { status: "PUBLISHED" } });
    await assert.rejects(createBoostCheckout({ ...input, creatorId: "other-user" }));
    const [order, duplicate] = await Promise.all([createBoostCheckout(input), createBoostCheckout(input)]);
    assert.equal(order.id, duplicate.id, "concurrent checkout is reused");
    assert.equal(order.totalUsdt, 3);
    assert.equal(await prisma.transaction.count({ where: { orderId: order.id } }), 1);
    assert.equal(await prisma.orderItem.count({ where: { orderId: order.id } }), 0);
    let boost = await prisma.productBoost.findUniqueOrThrow({ where: { orderId: order.id } });
    assert.equal(boost.status, null);
    assert.equal(isBoostActive(boost), false, "pending payment gives no promotion");
    assert.equal((await listBuyerOrders(user.id)).length, 0, "Boost is not a library purchase");
    await assert.rejects(confirmOrderPayment({ orderId: order.id, confirmations: 0 }));
    await prisma.transaction.updateMany({ where: { orderId: order.id }, data: { amountUsdt: 2 } });
    await assert.rejects(confirmOrderPayment({ orderId: order.id }));
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status, "PENDING", "failure rolls back payment");
    await prisma.transaction.updateMany({ where: { orderId: order.id }, data: { amountUsdt: 3 } });
    const confirmations = await Promise.all([
      confirmOrderPayment({ orderId: order.id, txHash: `test-${stamp}` }),
      confirmOrderPayment({ orderId: order.id, txHash: `test-${stamp}` }),
    ]);
    assert.equal(confirmations.filter((result) => result.alreadyPaid).length, 1);
    boost = await prisma.productBoost.findUniqueOrThrow({ where: { orderId: order.id } });
    assert.equal(boost.status, "ACTIVE");
    assert.equal(boost.expiresAt!.getTime() - boost.startedAt!.getTime(), BOOST_DURATION_MS);
    assert.equal(isBoostActive(boost, boost.expiresAt!), false, "exact expiration boundary");
    assert.equal((await createBoostCheckout(input)).id, order.id, "active boost is not resold");
    await markOrderFailed({ orderId: order.id });
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status, "PAID", "late failure cannot undo payment");
    assert.equal((await prisma.payment.findUniqueOrThrow({ where: { orderId: order.id } })).status, "PAID");
    assert.equal((await prisma.transaction.findFirstOrThrow({ where: { orderId: order.id } })).status, "PAID");
    assert.equal(await prisma.commission.count({ where: { orderId: order.id } }), 0);
    assert.equal(await prisma.wallet.count({ where: { userId: user.id } }), 0);
    assert.equal(await prisma.enrollment.count({ where: { userId: user.id } }), 0);
    assert.equal(await prisma.creatorSubscription.count({ where: { userId: user.id } }), 0);
    const promoted = await listFeaturedProducts(10000);
    assert(promoted.some((row) => row.id === product.id && row.boosts.length === 1));
    const normal = await listMarketplaceProducts({ creatorId: user.id });
    assert.equal(normal[0].salesCount, 0, "promotion does not fake sales");
    const expiredAt = new Date(Date.now() - 1000);
    await prisma.productBoost.update({ where: { id: boost.id }, data: { expiresAt: expiredAt } });
    await confirmOrderPayment({ orderId: order.id });
    assert.equal((await prisma.productBoost.findUniqueOrThrow({ where: { id: boost.id } })).expiresAt!.getTime(), expiredAt.getTime(), "replayed payment never extends boost");
    const after = await listFeaturedProducts(10000);
    assert.equal(after.find((row) => row.id === product.id)?.boosts.length, 0);
    assert.equal((await listCreatorProducts(user.id))[0].boosts[0].status, "EXPIRED");
    const renewal = await createBoostCheckout(input);
    assert.notEqual(renewal.id, order.id);
    await markOrderFailed({ orderId: renewal.id });
    await assert.rejects(confirmOrderPayment({ orderId: renewal.id }));
    const retry = await createBoostCheckout(input);
    await confirmOrderPayment({ orderId: retry.id });
    assert.equal(await prisma.productBoost.count({ where: { productId: product.id, status: "ACTIVE" } }), 1);
    assert.equal(await prisma.productBoost.count({ where: { productId: product.id } }), 3, "history retained");
    console.log("ALL BOOST TESTS PASSED (checkout, concurrency, rollback, payment, expiration, renewal, isolation)");
  } finally {
    await prisma.transaction.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
