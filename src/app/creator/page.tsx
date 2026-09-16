import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { getCreatorMetrics, listCreatorProducts } from "@/server/services/catalog";
import { getPlanUsage } from "@/server/services/creator";
import { PRODUCT_STATUS_LABEL, type ProductStatus } from "@/lib/domain";
import { formatNumber, formatUsdt } from "@/lib/utils";

export const metadata = { title: "Creator" };

export default async function CreatorHomePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [metrics, usage, products] = await Promise.all([
    getCreatorMetrics(user.id),
    getPlanUsage(user.id),
    listCreatorProducts(user.id),
  ]);

  return (
    <DashboardShell
      title="Creator"
      description="Tu catálogo, tus ingresos y la capacidad de tu plan en CROW."
      activePath="/creator"
      action={
        <div className="flex flex-wrap gap-2.5">
          <ButtonLink href="/creator/studio">Creator Studio</ButtonLink>
          <ButtonLink href="/creator/plans" variant="secondary">
            Planes
          </ButtonLink>
        </div>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Productos" value={metrics.products.length} hint={`${metrics.published} publicados`} />
        <StatCard
          label="Ingresos"
          value={formatUsdt(metrics.revenue)}
          hint={`Ticket medio ${formatUsdt(metrics.avgTicket)}`}
          tone="violet"
        />
        <StatCard label="Alumnos" value={formatNumber(metrics.enrollments)} hint="Matrículas totales" />
        <StatCard
          label="Plan"
          value={usage.plan.name}
          hint={`${usage.used}/${usage.plan.productLimit} productos · ${usage.published}/${usage.plan.publishedLimit} publicados`}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Tus últimos productos"
            description="Estado y rendimiento"
            action={
              <ButtonLink href="/creator/products" variant="ghost" size="sm">
                Ver todos
              </ButtonLink>
            }
          />
          <ul className="divide-y divide-white/[0.05]">
            {products.slice(0, 5).map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-crow-text">{product.title}</p>
                  <p className="mt-0.5 text-[11px] text-crow-muted">
                    {PRODUCT_STATUS_LABEL[product.status as ProductStatus] ?? product.status} ·{" "}
                    {product.salesCount} ventas
                  </p>
                </div>
                <span className="shrink-0 text-[13px] font-medium text-crow-muted">
                  {formatUsdt(product.revenueUsdt)}
                </span>
              </li>
            ))}
            {!products.length ? (
              <li className="py-6 text-center text-[12.5px] text-crow-muted">
                Aún no tienes productos. Genera el primero con IA.
              </li>
            ) : null}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Capacidad del plan"
            description={`${usage.plan.name} · ${usage.plan.durationLabel}`}
            action={<Badge tone="violet">{formatUsdt(usage.plan.priceUsdt)}</Badge>}
          />
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-crow-muted">Infoproductos</span>
                <span className="text-crow-text">
                  {usage.used}/{usage.plan.productLimit}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-crow-violet to-crow-glow"
                  style={{
                    width: `${Math.min(100, (usage.used / usage.plan.productLimit) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-crow-muted">Publicados</span>
                <span className="text-crow-text">
                  {usage.published}/{usage.plan.publishedLimit}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-crow-violet to-crow-glow"
                  style={{
                    width: `${Math.min(
                      100,
                      (usage.published / usage.plan.publishedLimit) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-crow-muted">
              La distribución de cada venta es fija: 45% creator · 10% CROW · 30%
              afiliado directo · L1-L5 (5/3/2/2/1%).
            </p>
            <ButtonLink href="/creator/plans" variant="secondary" size="sm">
              Mejorar plan
            </ButtonLink>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}