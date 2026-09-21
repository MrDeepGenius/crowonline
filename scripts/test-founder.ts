import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import prisma, { paymentTransaction } from "@/lib/db";
import { computeFounderSplit, FOUNDER_PRICES, type FounderSellerRole } from "@/lib/founder-commissions";
import { distributeFounderSale } from "@/server/services/founder-distribution";

async function main() {
  const stamp = randomUUID();
  const users: string[] = [];
  const sales: string[] = [];
  async function user(role: string) {
    const row = await prisma.user.create({ data: { name: role, email: `${randomUUID()}@founder.invalid`, passwordHash: "test-only", roles: JSON.stringify([role]) } });
    users.push(row.id);
    return row;
  }
  async function sale(buyer: string, seller: string, role: string, amount = 2000, status = "PAID", mode = "LIVE") {
    const row = await prisma.transaction.create({ data: { reference: `${stamp}:${sales.length}`, kind: "FOUNDER", status,
      userId: buyer, amountUsdt: amount, metadata: JSON.stringify({ sellerId: seller, sellerRole: role, mode }) } });
    sales.push(row.id);
    return row.id;
  }
  try {
    const buyer = await user("USER");
    const ancestor = await user("AFFILIATE");
    const parent = await prisma.affiliate.create({ data: { userId: ancestor.id, referralCode: stamp } });
    const expected = { AFFILIATE: 0.10, FOUNDER: 0.15, CREATOR: 0.10 };
    for (const role of Object.keys(expected) as FounderSellerRole[]) {
      const seller = await user(role);
      const affiliate = await prisma.affiliate.create({ data: { userId: seller.id, referralCode: `${stamp}-${role}`, parentAffiliateId: parent.id } });
      for (const amount of FOUNDER_PRICES) {
        const split = computeFounderSplit({ amount, sellerId: seller.id, sellerRole: role });
        assert.deepEqual(split.lines.map((line) => line.role), ["FOUNDER_DIRECT", "CROW_PLATFORM_FOUNDER"]);
        assert.equal(split.lines[0].amount, amount * expected[role]);
        assert.equal(split.lines.reduce((sum, line) => sum + line.amount, 0), amount);
        assert(split.lines.every((line) => line.level === 0));
        const id = await sale(buyer.id, seller.id, role, amount);
        await Promise.all([distributeFounderSale(id), distributeFounderSale(id)]);
        await distributeFounderSale(id);
        assert.equal(await prisma.transaction.count({ where: { reference: { startsWith: `FOUNDER:${id}:` } } }), 2);
        assert.equal(await prisma.walletTransaction.count({ where: { reference: { startsWith: `FOUNDER:${id}:` } } }), 1);
      }
      assert.equal((await prisma.wallet.findUniqueOrThrow({ where: { userId: seller.id } })).availableUsdt, 7500 * expected[role]);
      assert.deepEqual(await prisma.affiliate.findUnique({ where: { id: affiliate.id } }), affiliate, "Founder no abre niveles ni suma CP/residual");
      const pending = await sale(buyer.id, seller.id, role, 2000, "PENDING");
      assert.deepEqual(await distributeFounderSale(pending), []);
      await assert.rejects(distributeFounderSale(await sale(seller.id, seller.id, role)), /Auto-compra/);
      await assert.rejects(distributeFounderSale(await sale(buyer.id, seller.id, role, 100)));
      await assert.rejects(distributeFounderSale(await sale(buyer.id, seller.id, role === "FOUNDER" ? "CREATOR" : "FOUNDER")));
      const rollback = await sale(buyer.id, seller.id, role);
      await assert.rejects(paymentTransaction(async () => {
        await distributeFounderSale(rollback);
        throw new Error("rollback after ledger");
      }));
      assert.equal(await prisma.transaction.count({ where: { reference: { startsWith: `FOUNDER:${rollback}:` } } }), 0);
      const test = await sale(buyer.id, seller.id, role, 2000, "PAID", "TEST");
      await distributeFounderSale(test);
      assert.equal((await prisma.wallet.findUniqueOrThrow({ where: { userId: seller.id } })).availableUsdt, 7500 * expected[role]);
      console.log(`PASS Founder ${role}: ${expected[role] * 100}% en 2000/2500/3000; replay, concurrencia, rollback, TEST no retirable`);
    }
    assert.equal(await prisma.walletTransaction.count({ where: { userId: ancestor.id } }), 0);
    assert.equal(await prisma.commission.count({ where: { earnerId: { in: users } } }), 0);
    assert.deepEqual(await prisma.affiliate.findUnique({ where: { id: parent.id } }), parent);
    console.log("ALL FOUNDER TESTS PASSED: sin red, sin residual, sin L1-L5 ni aperturas");
  } finally {
    await prisma.transaction.deleteMany({ where: { OR: [{ id: { in: sales } }, { reference: { startsWith: "FOUNDER:" }, userId: { in: users } }, ...sales.map((id) => ({ reference: { startsWith: `FOUNDER:${id}:` } }))] } });
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    await prisma.$disconnect();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
