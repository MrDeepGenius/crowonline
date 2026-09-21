import { z } from "zod";
import prisma, { paymentTransaction } from "@/lib/db";
import { computeFounderSplit } from "@/lib/founder-commissions";
import { creditWallet } from "@/server/services/wallet";

const metadataSchema = z.object({
  sellerId: z.string().min(1),
  sellerRole: z.enum(["AFFILIATE", "FOUNDER", "CREATOR"]),
  mode: z.enum(["TEST", "LIVE"]).default("LIVE"),
  founderDistribution: z.array(z.object({
    role: z.string(), userId: z.string().nullable(), level: z.number(), rate: z.number(), amount: z.number(),
  })).optional(),
});

/** Internal settlement boundary for a persisted PAID FOUNDER sale.
 * No public action/checkout is added. Seller attribution must be recorded by
 * the sales system, not supplied by a payment caller. Never resolves an upline.
 */
export async function distributeFounderSale(transactionId: string) {
  return paymentTransaction(async () => {
    // Acquire the write lock before reading the idempotency snapshot (SQLite).
    await prisma.transaction.updateMany({ where: { id: transactionId, kind: "FOUNDER", status: "PAID" }, data: { status: "PAID" } });
    const sale = await prisma.transaction.findUniqueOrThrow({ where: { id: transactionId } });
    if (sale.kind !== "FOUNDER" || !sale.userId || sale.currency !== "USDT") throw new Error("No es una venta Founder");
    if (sale.status !== "PAID") return [];
    const metadata = metadataSchema.parse(JSON.parse(sale.metadata));
    if (metadata.founderDistribution) return metadata.founderDistribution;
    if (metadata.sellerId === sale.userId) throw new Error("Auto-compra Founder no permitida");
    const seller = await prisma.user.findUniqueOrThrow({ where: { id: metadata.sellerId } });
    const roles: unknown = JSON.parse(seller.roles);
    if (seller.status !== "ACTIVE" || !Array.isArray(roles) || !roles.includes(metadata.sellerRole)) {
      throw new Error("Rol del vendedor Founder no válido; requiere revisión");
    }
    const split = computeFounderSplit({ amount: sale.amountUsdt, sellerId: seller.id, sellerRole: metadata.sellerRole });
    for (const line of split.lines) {
      const reference = `FOUNDER:${sale.id}:${line.userId ?? "CROW"}:${line.role}:0`;
      await prisma.transaction.create({ data: {
        reference, kind: "COMMISSION", status: metadata.mode === "TEST" ? "TEST" : "CONFIRMED",
        amountUsdt: line.amount, userId: line.userId,
        metadata: JSON.stringify({ saleId: sale.id, beneficiaryId: line.userId, commissionType: line.role, level: 0,
          sellerRole: metadata.sellerRole, mode: metadata.mode, rate: line.rate }),
      } });
      if (!line.userId) continue;
      if (metadata.mode === "TEST") {
        const wallet = await prisma.wallet.upsert({ where: { userId: line.userId }, create: { userId: line.userId }, update: {} });
        await prisma.walletTransaction.create({ data: {
          walletId: wallet.id, userId: line.userId, type: "DIRECT_AFFILIATE", direction: "CREDIT",
          amountUsdt: line.amount, balanceAfterUsdt: wallet.availableUsdt, status: "TEST",
          reference: `${reference}:W`, description: "TEST · Founder directo · NO RETIRABLE",
        } });
      } else {
        await creditWallet({ userId: line.userId, type: "DIRECT_AFFILIATE", amountUsdt: line.amount,
          reference: `${reference}:W`, description: `Founder · venta directa ${metadata.sellerRole} · ${line.rate * 100}%` });
      }
    }
    await prisma.transaction.update({ where: { id: sale.id }, data: {
      metadata: JSON.stringify({ ...JSON.parse(sale.metadata), founderDistribution: split.lines }),
    } });
    return split.lines;
  });
}
