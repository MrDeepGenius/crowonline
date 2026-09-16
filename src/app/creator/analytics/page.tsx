import { BarChart } from "@/components/creator/bar-chart";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProgressBar } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { getCreatorMetrics } from "@/server/services/catalog";
import { PRODUCT_TYPE_LABEL } from "@/lib/plans";
import { formatNumber, formatUsdt } from "@/lib/utils";
import type { ProductType } from "@/lib/domain";

export const metadata = { title: "Analytics" };

export default async function CreatorAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const metrics = await getCreatorMetrics(user.id);

  const byType = metrics.products.reduce<Record<string, number>>((acc, product) => {
    acc[product.type] = (acc[product.type] ?? 0) + product.revenueUsdt;
    return acc;
  }, {});

  return (
    <DashboardShell
      title="Analytics"
      description="Rendimiento de tu catálogo: ingresos, ventas, alumnos y calidad de cada producto."
      activePath="/creator/analytics"
      action={
        <ButtonLink href="/creator/products" variant="secondary">
          Ver productos
        </ButtonLink>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ingresos"
          value={formatUsdt(metrics.revenue)}
          tone="violet"
          hint={`${metrics.orders} órdenes pagadas`}
        />
        <StatCard label="Ticket medio" value={formatUsdt(metrics.avgTicket)} hint="Por orden" />
        <StatCard label="Alumnos" value={formatNumber(metrics.enrollments)} hint="Matrículas totales" />
        <StatCard
          label="Comisión creator"
          value={formatUsdt(metrics.commissionTotal)}
          hint="45% de cada venta"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Ingresos por formato" description="Distribución de tus ventas" />
          <BarChart
            label="USDT acumulados"
            data={Object.entries(byType).map(([type, value]) => ({
              label: PRODUCT_TYPE_LABEL[type as ProductType] ?? type,
              value: Math.round(value * 100) / 100,
            }))}
          />
        </Card>

        <Card>
          <CardHeader
            title="Top productos"
            description={`${metrics.published} publicados de ${metrics.products.length}`}
          />
          <ul className="space-y-3">
            {metrics.topProducts.map((product) => (
              <li key={product.id}>
                <div className="flex items-center justify-between gap-4">
                  <p className="truncate text-[12.5px] text-crow-text">{product.title}</p>
                  <span className="shrink-0 text-[12px] text-crow-glow">
                    {formatUsdt(product.revenueUsdt)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <ProgressBar value={Math.min(100, product.salesCount * 10)} className="flex-1" />
                  <span className="shrink-0 text-[11px] text-crow-muted">
                    {product.salesCount} ventas
                  </span>
                </div>
              </li>
            ))}
            {!metrics.topProducts.length ? (
              <li className="text-[12.5px] text-crow-muted">
                Sin ventas todavía. Publica tu primer producto para empezar a medir.
              </li>
            ) : null}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Detalle por producto" description="Precio, ventas y calidad" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="text-[11px] uppercase tracking-wider text-crow-muted">
              <tr>
                <th className="py-2">Producto</th>
                <th className="py-2">Estado</th>
                <th className="py-2">Precio</th>
                <th className="py-2">Ventas</th>
                <th className="py-2">Ingresos</th>
                <th className="py-2">Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {metrics.products.map((product) => (
                <tr key={product.id}>
                  <td className="max-w-[280px] truncate py-2.5 text-crow-text">
                    {product.title}
                  </td>
                  <td className="py-2.5 text-crow-muted">{product.status}</td>
                  <td className="py-2.5">{formatUsdt(product.priceUsdt)}</td>
                  <td className="py-2.5">{product.salesCount}</td>
                  <td className="py-2.5 text-crow-glow">{formatUsdt(product.revenueUsdt)}</td>
                  <td className="py-2.5">{product.qualityScore}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardShell>
  );
}