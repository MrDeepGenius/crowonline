import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TeamTable } from "@/components/affiliate/team-table";
import { StatCard } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { getAffiliateOverview } from "@/server/services/affiliate";
import { formatUsdt } from "@/lib/utils";

export const metadata = { title: "Mi equipo" };

export default async function AffiliateTeamPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const overview = await getAffiliateOverview(user.id);

  return (
    <DashboardShell
      title="Mi equipo"
      description="Tu downline de afiliados. Ganas 5/3/2/2/1% en los cinco niveles de profundidad."
      activePath="/affiliate/team"
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Afiliados directos" value={overview.team.length} tone="violet" />
        <StatCard label="Referidos totales" value={overview.referrals.length} />
        <StatCard
          label="Comisiones de red"
          value={formatUsdt(
            overview.commissions
              .filter((commission) => commission.role.startsWith("L"))
              .reduce((sum, commission) => sum + commission.amountUsdt, 0),
          )}
          tone="success"
        />
        <StatCard
          label="L1 desbloqueado"
          value={overview.affiliate.level1Unlocked ? "Sí" : "No"}
          hint="Primer desbloqueo: 2.5% afiliado + 2.5% reserva"
        />
      </div>

      <div className="mt-8">
        <TeamTable
          team={overview.team}
          referrals={overview.referrals.map((referral) => ({
            id: referral.id,
            code: referral.code,
            invitedEmail: referral.invitedEmail,
            createdAt: referral.createdAt,
          }))}
        />
      </div>
    </DashboardShell>
  );
}