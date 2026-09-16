import { AdminOrderTable } from "@/components/admin/admin-order-table";
import { AdminWithdrawalTable } from "@/components/admin/withdrawal-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { TimelineChart } from "@/components/creator/bar-chart";
import { formatNumber, formatUsdt } from "@/lib/utils";
import {
  getAdminMetrics,
  getRevenueTimeline,
  listOrdersForAdmin,
} from "@/server/services";
import { listWithdrawalsForAdmin } from "@/server/services/withdrawal-review";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const [metrics, timeline, withdrawals, orders] = await Promise.all([
    getAdminMetrics(),
    getRevenueTimeline(30),
    listWithdrawalsForAdmin("PENDING"),
    listOrdersForAdmin("all"),
  ]);

  return (
    <DashboardShell
      title="Panel de administración"
      description="Usuarios, productos, órdenes, pagos, retiros y métricas globales de CROW MARKET."
      activePath="/admin"
      action={
        <div className="flex flex-wrap gap-2.5">
          <ButtonLink href="/admin/withdrawals">Retiros ({metrics.pendingWithdrawalCount})</ButtonLink>
          <ButtonLink href="/admin/orders" variant="secondary">
            Órdenes
          </ButtonLink>
        </div>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Usuarios" value={formatNumber(metrics.users)} hint={`${metrics.creators} creators · ${metrics.affiliates} afiliados`} />
        <StatCard label="Productos" value={formatNumber(metrics.products)} hint={`${metrics.published} publicados · ${metrics.drafts} borradores`} />
        <StatCard label="GMV" value={formatUsdt(metrics.gmv)} hint={`${metrics.paidCount} órdenes pagadas`} tone="violet" />
        <StatCard label="Ingreso plataforma" value={formatUsdt(metrics.platformRevenue)} hint="10% de cada venta" tone="success" />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pagos a creators" value={formatUsdt(metrics.creatorPayouts)} hint="45% distribuido" />
        <StatCard label="Pagos a afiliados" value={formatUsdt(metrics.affiliatePayouts)} hint="Directo + L1-L5" />
        <StatCard label="Emergency Reserve" value={formatUsdt(metrics.emergencyReserve)} hint="Excepción primer L1" tone="warn" />
        <StatCard
          label="Retiros pendientes"
          value={formatNumber(metrics.pendingWithdrawalCount)}
          hint={formatUsdt(metrics.pendingWithdrawalAmount)}
          tone="warn"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardHeader title="Ingresos últimos 30 días" description="Órdenes pagadas por día" />
          <TimelineChart data={timeline} label="USDT" />
        </Card>
        <Card>
          <CardHeader title="Estados de pago" description="Payment intents por estado" />
          <ul className="space-y-2.5">
            {metrics.paymentStatuses.map((row) => (
              <li key={row.status} className="flex items-center justify-between text-[12.5px]">
                <span className="text-crow-muted">{row.status}</span>
                <span className="text-crow-text">{row.count}</span>
              </li>
            ))}
            {!metrics.paymentStatuses.length ? (
              <li className="text-[12.5px] text-crow-muted">Sin pagos registrados.</li>
            ) : null}
          </ul>
          <div className="mt-5 border-t border-white/[0.06] pt-4">
            <p className="text-[11px] uppercase tracking-wider text-crow-muted">
              Distribución por rol
            </p>
            <ul className="mt-2.5 space-y-1.5 text-[12px]">
              {Object.entries(metrics.commissionByRole).map(([role, amount]) => (
                <li key={role} className="flex items-center justify-between">
                  <span className="text-crow-muted">{role}</span>
                  <span className="text-crow-text">{formatUsdt(amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="mt-8 space-y-6">
        <AdminWithdrawalTable withdrawals={withdrawals.slice(0, 4)} />
        <AdminOrderTable orders={orders.slice(0, 8)} />
      </div>
    </DashboardShell>
  );
}