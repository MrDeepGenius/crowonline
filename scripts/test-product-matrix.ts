import assert from "node:assert/strict";
import { computeSplit } from "@/lib/commissions";

// tsx compiles and executes the actual TypeScript engine; no mocked split.
const input = {
  amount: 100,
  creatorId: "creator",
  affiliateUpline: ["direct", "l1", "l2", "l3", "l4", "l5"],
};
const normal = computeSplit(input);
const expected: Record<string, number> = {
  CREATOR: 45, DIRECT_AFFILIATE: 30,
  L1: 5, L2: 3, L3: 2, L4: 2, L5: 1,
  PLATFORM: 10, EMERGENCY_RESERVE: 2,
};
assert.equal(normal.lines.length, 9);
for (const [role, percentage] of Object.entries(expected)) {
  const lines = normal.lines.filter((line) => line.role === role);
  assert.equal(lines.length, 1, `${role}: exactly one line`);
  assert.equal(lines[0].rate, percentage / 100, `${role}: exact rate`);
  assert.equal(lines[0].amount, percentage, `${role}: amount on sale of 100`);
}
assert.equal(normal.lines.reduce((sum, line) => sum + line.amount, 0), 100);
assert.equal(normal.totalRate, 1);
assert.equal(normal.totalAmount, 100);
assert(!normal.lines.some((line) => line.role === "REWARDS_POOL"));
assert.equal(normal.lines.find((line) => line.role === "EMERGENCY_RESERVE")?.userId, null);
console.log("PASS normal: 45/30/5/3/2/2/1/10/2 = 100%; permanent 2% is EMERGENCY_RESERVE");

const first = computeSplit({ ...input, isFirstL1Unlock: true });
const l1 = first.lines.find((line) => line.role === "L1")!;
assert.equal(l1.userId, "l1");
assert.equal(l1.rate, 0.025);
assert.equal(l1.amount, 2.5);
const reserves = first.lines.filter((line) => line.role === "EMERGENCY_RESERVE");
assert.equal(reserves.length, 2);
assert.equal(reserves.find((line) => line.level === 1)?.amount, 2.5);
assert.equal(reserves.find((line) => line.level === 1)?.rate, 0.025);
assert.equal(reserves.find((line) => line.level === undefined)?.amount, 2);
assert.equal(reserves.find((line) => line.level === undefined)?.rate, 0.02);
assert(reserves.every((line) => line.userId === null));
assert.equal(reserves.reduce((sum, line) => sum + line.amount, 0), 4.5);
for (const [role, amount] of Object.entries(expected)) {
  if (role === "L1" || role === "EMERGENCY_RESERVE") continue;
  assert.equal(first.lines.find((line) => line.role === role)?.amount, amount);
}
assert.equal(first.lines.reduce((sum, line) => sum + line.amount, 0), 100);
assert.equal(first.totalRate, 1);
assert.equal(first.totalAmount, 100);
console.log("PASS first L1: affiliate 2.5% + additional reserve 2.5%; permanent reserve 2%; total 100%");

const absent = computeSplit({ ...input, affiliateUpline: ["direct"], isFirstL1Unlock: true });
assert.equal(absent.lines.find((line) => line.sourceRole === "L1")?.amount, 5);
assert.equal(absent.lines.find((line) => line.sourceRole === "L1")?.role, "CROW_TREASURY");
assert.equal(absent.lines.filter((line) => line.role === "EMERGENCY_RESERVE").length, 1);
assert.equal(absent.lines.find((line) => line.role === "EMERGENCY_RESERVE")?.amount, 2);
assert.equal(absent.totalAmount, 100);
console.log("PASS missing L1: 5% to Treasury, no fictitious beneficiary; permanent reserve remains 2%");

const repeated = computeSplit({ ...input, affiliateUpline: ["direct", "direct", "l2", "l2", "creator", "l5"] });
const beneficiaries = repeated.lines.filter((line) => line.userId).map((line) => line.userId);
assert.equal(new Set(beneficiaries).size, beneficiaries.length);
assert.equal(repeated.totalAmount, 100);
assert(repeated.lines.some((line) => line.role === "CROW_TREASURY" && line.sourceRole === "L1"));
console.log("PASS duplicate beneficiaries: Treasury receives rejected slots, total remains 100%");

