import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CommissionTable } from "@/components/affiliate/commission-table";
import { ReferralLinkCard, AffiliateStats, AffiliateRulesCard } from "@/components/affiliate/affiliate-stats";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { getAffiliateOverview } from "@/server/services/affiliate";
import { getWalletOverview } from "@/server/services/wallet";
import { formatUsdt } from "@/lib/utils";

export const metadata = { title: "Afiliados" };

export default async function AffiliatePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [overview, wallet] = await Promise.all([
    getAffiliateOverview(user.id),
    getWalletOverview(user.id),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <DashboardShell
      title="Panel de afiliados"
      description="Ventas, clics, conversión, comisiones y equipo. Todo lo que genera tu red de referidos."
      activePath="/affiliate"
      action={
        <div className="flex flex-wrap gap-2.5">
          <ButtonLink href="/affiliate/links">Mis enlaces</ButtonLink>
          <ButtonLink href="/wallet" variant="secondary">
            Wallet {formatUsdt(wallet.wallet.availableUsdt)}
          </ButtonLink>
        </div>
      }
    >
      <AffiliateStats
        clicks={overview.clicks}
        conversions={overview.conversions}
        conversionRate={overview.conversionRate}
        commissionTotal={overview.commissionTotal}
        crowPoints={overview.crowPoints}
        teamSize={overview.team.length}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <ReferralLinkCard code={overview.affiliate.referralCode} baseUrl={baseUrl} />
          <CommissionTable commissions={overview.commissions} />
        </div>
        <div className="space-y-6">
          <AffiliateRulesCard />
          <div className="crow-card p-5">
            <p className="text-[11px] uppercase tracking-wider text-crow-muted">
              Resumen de red
            </p>
            <ul className="mt-3 space-y-2.5 text-[12.5px]">
              <li className="flex items-center justify-between">
                <span className="text-crow-muted">Afiliados directos</span>
                <span className="text-crow-text">{overview.team.length}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-crow-muted">Referidos totales</span>
                <span className="text-crow-text">{overview.referrals.length}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-crow-muted">Nivel L1 desbloqueado</span>
                <span className="text-crow-text">
                  {overview.affiliate.level1Unlocked ? "Sí" : "Pendiente"}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-crow-muted">Emergency Reserve</span>
                <span className="text-crow-text">
                  {formatUsdt(overview.affiliate.emergencyReserveUsdt)}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}