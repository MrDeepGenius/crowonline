import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { listCreatorsForAdmin } from "@/server/services/admin";
import { getCreatorPlan } from "@/lib/plans";
import { formatDate, formatUsdt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin · Creators" };

export default async function AdminCreatorsPage() {
  const creators = await listCreatorsForAdmin();

  return (
    <DashboardShell
      title="Creators"
      description="Suscripciones activas, límites de plan y catálogo publicado por cada creator."
      activePath="/admin/creators"
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Creators" value={creators.length} />
        <StatCard
          label="Activos"
          value={creators.filter((creator) => creator.status === "ACTIVE").length}
          tone="success"
        />
        <StatCard
          label="Productos creados"
          value={creators.reduce(
            (sum, creator) => sum + creator.user._count.products,
            0,
          )}
          tone="violet"
        />
        <StatCard
          label="Ingreso por planes"
          value={formatUsdt(
            creators.reduce((sum, creator) => sum + creator.priceUsdt, 0),
          )}
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Suscripciones creator"
          description="Plan, límites y consumo actual"
          action={<Badge tone="default">{creators.length} registros</Badge>}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="text-[11px] uppercase tracking-wider text-crow-muted">
              <tr>
                <th className="py-2">Creator</th>
                <th className="py-2">Plan</th>
                <th className="py-2">Límites</th>
                <th className="py-2">Productos</th>
                <th className="py-2">Estado</th>
                <th className="py-2 text-right">Desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {creators.map((creator) => {
                const plan = getCreatorPlan(creator.plan);
                return (
                  <tr key={creator.id}>
                    <td className="py-2.5">
                      <p className="text-crow-text">{creator.user.name}</p>
                      <p className="text-[11px] text-crow-muted">{creator.user.email}</p>
                    </td>
                    <td className="py-2.5">
                      <Badge tone="violet">
                        {plan.name} · {formatUsdt(plan.priceUsdt)}
                      </Badge>
                      <p className="mt-1 text-[10.5px] text-crow-muted">
                        {plan.durationLabel}
                      </p>
                    </td>
                    <td className="py-2.5 text-crow-muted">
                      {plan.productLimit} productos · {plan.publishedLimit} publicados
                    </td>
                    <td className="py-2.5 text-crow-muted">
                      {creator.user._count.products}
                    </td>
                    <td className="py-2.5">
                      <Badge tone={creator.status === "ACTIVE" ? "success" : "warn"}>
                        {creator.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right text-crow-muted">
                      {formatDate(creator.startedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!creators.length ? (
          <p className="py-6 text-center text-[12.5px] text-crow-muted">
            Todavía no hay creators con plan activo.
          </p>
        ) : null}
      </Card>
    </DashboardShell>
  );
}