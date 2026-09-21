import prisma, { paymentTransaction } from "@/lib/db";
import {
  computeCreatorLicenseSplit,
  type TreasuryReason,
} from "@/lib/commissions";
import { findAffiliateByCode, getReferredAffiliateCode } from "@/server/services/affiliate";
import { creditWallet, makeReference } from "@/server/services/wallet";

/**
 * CREATOR LICENSES — distribución única y cerrada.
 *
 *   Afiliado directo (referente real registrado)  15%
 *   CROW                                          85%
 *
 * Sin L1..L5, sin residual, sin apertura de niveles y sin redistribución a
 * ninguna red. La atribución usa únicamente el referral real registrado en el
 * alta del comprador (durable, no posición visual en ningún árbol). Las líneas
 * Brian/Guille y el beneficio empresarial 50/50 son contabilidad de CROW y
 * nunca tocan wallets de usuario.
 *
 * Idempotente por transacción de licencia: el snapshot queda guardado en
 * Transaction.metadata.licenseDistribution, así que una re-ejecución (doble
 * confirmación o reintento del webhook) nunca paga dos veces.
 *
 * En este proyecto la venta de la licencia se registra con la transacción
 * kind=PLAN de selectCreatorPlanAction; en producción este servicio debe
 * invocarse también desde la confirmación real de pago (webhook/watcher).
 */

export type LicenseDistributionLine = {
  role: string;
  amount: number;
  userId: string | null;
  sourceRole?: string;
  reason?: TreasuryReason;
  beneficiaryId?: string | null;
};

type LicenseMetadata = {
  plan?: string;
  mode?: string;
  licenseDistribution?: LicenseDistributionLine[];
};

function parseMetadata(raw: string | null): LicenseMetadata {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as LicenseMetadata;
  } catch {
    return {};
  }
}

export async function distributeCreatorLicenseSale({
  transactionId,
  planId,
  amountUsdt,
}: {
  transactionId: string;
  planId: string;
  amountUsdt: number;
}): Promise<LicenseDistributionLine[]> {
  return paymentTransaction(async () => {
  await prisma.transaction.updateMany({ where: { id: transactionId, kind: "PLAN", status: "PAID" }, data: { status: "PAID" } });
  const licenseTx = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });
  if (!licenseTx) throw new Error("Transacción de licencia no encontrada");
  if (licenseTx.kind !== "PLAN" || licenseTx.amountUsdt !== amountUsdt || licenseTx.currency !== "USDT") {
    throw new Error("La venta no corresponde al motor de licencias");
  }
  if (!licenseTx.userId) return [];

  const stored = parseMetadata(licenseTx.metadata).licenseDistribution;
  if (Array.isArray(stored)) return stored;

  // Solo una venta REAL pagada distribuye comisiones: una solicitud PENDING
  // no acredita nada (la comisión nace con la confirmación del pago).
  if (licenseTx.status !== "PAID") return [];

  // Durable attribution: the affiliate who referred the buyer at registration.
  const referrerCode = await getReferredAffiliateCode(licenseTx.userId);
  const referrerAffiliate = referrerCode ? await findAffiliateByCode(referrerCode) : null;
  const referrerUserId = referrerAffiliate?.userId ?? null;

  const beneficiaryIssues: Record<string, TreasuryReason> = {};
  if (referrerUserId && referrerAffiliate) {
    const referrerUser = await prisma.user.findUnique({
      where: { id: referrerUserId },
      select: { status: true },
    });
    if (!referrerUser) beneficiaryIssues[referrerUserId] = "MISSING_BENEFICIARY";
    else if (referrerUser.status !== "ACTIVE") beneficiaryIssues[referrerUserId] = "INACTIVE_USER";
    else if (referrerAffiliate.status !== "ACTIVE")
      beneficiaryIssues[referrerUserId] = "INACTIVE_AFFILIATE";
  }

  const split = computeCreatorLicenseSplit({
    amount: amountUsdt,
    referrerUserId,
    beneficiaryIssues,
  });

  const snapshot: LicenseDistributionLine[] = [];

  for (const line of split.lines) {
    if (line.role === "LICENSE_DIRECT_AFFILIATE" && line.userId) {
      await creditWallet({
        userId: line.userId,
        type: "DIRECT_AFFILIATE",
        amountUsdt: line.amount,
        description: `Comisión directa 15% · licencia Creator ${planId}`,
        reference: `LICENSE:${transactionId}:${line.userId}:LICENSE_DIRECT_AFFILIATE:0`,
      });

      await prisma.affiliate.update({
        where: { userId: line.userId },
        data: {
          totalCommissionUsdt: { increment: line.amount },
          conversions: { increment: 1 },
        },
      });
    } else {
      // CROW_PLATFORM_LICENSE o CROW_TREASURY: dinero de plataforma, nunca wallet.
      const isTreasury = line.role === "CROW_TREASURY";
      await prisma.transaction.create({
        data: {
          reference: makeReference(isTreasury ? "CROW-TRY" : "CROW-LIC"),
          kind: "ADJUSTMENT",
          status: "COMPLETED",
          amountUsdt: line.amount,
          metadata: JSON.stringify({
            bucket: line.role,
            reason: isTreasury ? line.reason : "creator_license",
            sourceRole: line.sourceRole ?? null,
            beneficiaryId: line.beneficiaryId ?? null,
            licenseTransactionId: transactionId,
            planId,
            rate: line.rate,
          }),
        },
      });
    }

    snapshot.push({
      role: line.role,
      amount: line.amount,
      userId: line.userId ?? null,
      sourceRole: line.sourceRole,
      reason: line.reason,
      beneficiaryId: line.beneficiaryId ?? null,
    });
  }

  const metadata = parseMetadata(licenseTx.metadata);
  metadata.licenseDistribution = snapshot;
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { metadata: JSON.stringify(metadata) },
  });

  return snapshot;
  });
}