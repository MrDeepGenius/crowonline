import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { listAffiliatesForAdmin } from "@/server/services/affiliate";
import { formatDate, formatUsdt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin · Afiliados" };

export default async function AdminAffiliatesPage() {
  const affiliates = await listAffiliatesForAdmin();

  const totalCommissions = affiliates.reduce(
    (sum, affiliate) => sum + affiliate.totalCommissionUsdt,
    0,
  );
  const totalClicks = affiliates.reduce((sum, affiliate) => sum + affiliate.clicks, 0);

  return (
    <DashboardShell
      title="Afiliados"
      description="Red completa de afiliados: clics, conversiones, comisiones y Crow Points."
      activePath="/admin/affiliates"
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Afiliados" value={affiliates.length} />
        <StatCard label="Clics totales" value={totalClicks} />
        <StatCard label="Comisiones pagadas" value={formatUsdt(totalCommissions)} tone="success" />
        <StatCard
          label="L1 desbloqueado"
          value={affiliates.filter((affiliate) => affiliate.level1Unlocked).length}
          hint="Excepción Emergency Reserve"
          tone="violet"
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Ranking de afiliados"
          description="Ordenado por comisión acumulada"
          action={<Badge tone="default">{affiliates.length} registros</Badge>}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="text-[11px] uppercase tracking-wider text-crow-muted">
              <tr>
                <th className="py-2">Afiliado</th>
                <th className="py-2">Código</th>
                <th className="py-2">Clics</th>
                <th className="py-2">Conversiones</th>
                <th className="py-2">Equipo</th>
                <th className="py-2">CP</th>
                <th className="py-2">Comisiones</th>
                <th className="py-2 text-right">Desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {affiliates.map((affiliate) => (
                <tr key={affiliate.id}>
                  <td className="py-2.5">
                    <p className="text-crow-text">{affiliate.user.name}</p>
                    <p className="text-[11px] text-crow-muted">{affiliate.user.email}</p>
                  </td>
                  <td className="py-2.5 font-mono text-[11px] text-crow-glow">
                    {affiliate.referralCode}
                  </td>
                  <td className="py-2.5 text-crow-muted">{affiliate.clicks}</td>
                  <td className="py-2.5 text-crow-muted">{affiliate.conversions}</td>
                  <td className="py-2.5 text-crow-muted">
                    {affiliate._count.referrals} referidos
                  </td>
                  <td className="py-2.5 text-crow-muted">
                    {affiliate.crowPoints.toFixed(0)}
                  </td>
                  <td className="py-2.5 text-crow-success">
                    {formatUsdt(affiliate.totalCommissionUsdt)}
                  </td>
                  <td className="py-2.5 text-right text-crow-muted">
                    {formatDate(affiliate.user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!affiliates.length ? (
          <p className="py-6 text-center text-[12.5px] text-crow-muted">
            Todavía no hay afiliados registrados.
          </p>
        ) : null}
      </Card>
    </DashboardShell>
  );
}