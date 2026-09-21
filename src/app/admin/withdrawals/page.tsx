import { AdminWithdrawalTable } from "@/components/admin/withdrawal-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { listWithdrawalsForAdmin } from "@/server/services/withdrawal-review";
import { formatUsdt } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin · Retiros" };

const FILTERS = ["all", "PENDING", "APPROVED", "PAID", "REJECTED"] as const;

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const withdrawals = await listWithdrawalsForAdmin(status);

  const pending = withdrawals.filter((item) => item.status === "PENDING");
  const total = withdrawals.reduce((sum, item) => sum + item.amountUsdt, 0);

  return (
    <DashboardShell
      title="Retiros"
      description="Aprueba, rechaza o marca como pagado cada solicitud. Los retiros son manuales por diseño."
      activePath="/admin/withdrawals"
      action={<Badge tone="warn">{pending.length} pendientes</Badge>}
    >
      {params.updated ? (
        <p className="mb-5 rounded-xl border border-crow-success/30 bg-crow-success/10 px-4 py-3 text-[12.5px] text-crow-success">
          Acción aplicada: {params.updated.toUpperCase()}.
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard label="Solicitudes (filtro)" value={withdrawals.length} />
        <StatCard label="Pendientes" value={pending.length} tone="warn" />
        <StatCard label="Monto total" value={formatUsdt(total)} tone="violet" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter}
            href={`/admin/withdrawals${filter === "all" ? "" : `?status=${filter}`}`}
            className={
              status === filter
                ? "rounded-full border border-crow-violet/50 bg-crow-violet/15 px-3.5 py-1.5 text-[12.5px] text-crow-glow"
                : "rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 py-1.5 text-[12.5px] text-crow-muted hover:text-crow-text"
            }
          >
            {filter}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <AdminWithdrawalTable withdrawals={withdrawals} />
      </div>

      <Card className="mt-6">
        <CardHeader title="Política de retiros" description="Configuración activa" />
        <ul className="space-y-2.5 text-[12.5px] text-crow-muted">
          <li>Mínimo: 25 USDT</li>
          <li>Fee retiro diario: 3%</li>
          <li>Fee retiro mensual: 2% (una vez cada 30 días)</li>
          <li>Red: USDT BEP-20 · confirmaciones requeridas definidas en ENV</li>
          <li>Al rechazar un retiro el saldo vuelve automáticamente a la wallet</li>
        </ul>
      </Card>
    </DashboardShell>
  );
}