import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CommissionTable } from "@/components/affiliate/commission-table";
import { AffiliateStats } from "@/components/affiliate/affiliate-stats";
import { ButtonLink } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAffiliateOverview } from "@/server/services/affiliate";

export const metadata = { title: "Ventas de afiliado" };

export default async function AffiliateSalesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const overview = await getAffiliateOverview(user.id);

  return (
    <DashboardShell
      title="Mis ventas"
      description="Detalle de cada venta atribuida a tu código, con nivel, porcentaje y estado de la comisión."
      activePath="/affiliate/sales"
      action={<ButtonLink href="/affiliate/links">Conseguir más ventas</ButtonLink>}
    >
      <AffiliateStats
        clicks={overview.clicks}
        conversions={overview.conversions}
        conversionRate={overview.conversionRate}
        commissionTotal={overview.commissionTotal}
        crowPoints={overview.crowPoints}
        teamSize={overview.team.length}
      />

      <div className="mt-8">
        <CommissionTable
          commissions={overview.commissions}
          title="Historial de comisiones"
          description="Incluye afiliación directa y bonos de nivel L1-L5"
        />
      </div>
    </DashboardShell>
  );
}