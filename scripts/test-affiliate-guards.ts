import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import prisma from "@/lib/db";
import { ensureAffiliate, registerReferral, resolveUpline } from "@/server/services/affiliate";

async function main() {
  const ids: string[] = [];
  try {
    for (let i = 0; i < 3; i++) {
      const user = await prisma.user.create({ data: { name: "Cycle test", email: `${randomUUID()}@cycle.invalid`, passwordHash: "test" } });
      ids.push(user.id);
    }
    const a = await ensureAffiliate(ids[0]);
    const b = await ensureAffiliate(ids[1], a.id);
    await assert.rejects(registerReferral(a.referralCode, ids[0]), /Ciclo/);
    await registerReferral(a.referralCode, ids[1]);
    await assert.rejects(registerReferral(b.referralCode, ids[0]), /Ciclo/);
    // Simulate corrupt legacy ancestry: resolver must terminate and never duplicate beneficiaries.
    await prisma.affiliate.update({ where: { id: a.id }, data: { parentAffiliateId: b.id } });
    const chain = await resolveUpline(a.referralCode);
    assert.deepEqual(chain.upline, [ids[0], ids[1]]);
    await assert.rejects(ensureAffiliate(ids[2], b.id), /Ciclo/);
    assert.equal(await prisma.walletTransaction.count({ where: { userId: { in: ids } } }), 0, "No commissions for recruitment");
    console.log("AFFILIATE GUARD TESTS PASSED: free registration, no recruitment payouts, self-referral/cycles rejected, corrupt chain bounded");
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
