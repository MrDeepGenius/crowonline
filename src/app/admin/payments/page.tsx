import { AdminPaymentTable } from "@/components/admin/admin-payment-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { listPaymentsForAdmin } from "@/server/services/settlement";
import { formatUsdt } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Admin · Pagos" };

const FILTERS = ["all", "PAID", "PENDING", "EXPIRED", "FAILED"] as const;

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";

  const [all, payments] = await Promise.all([
    listPaymentsForAdmin("all"),
    listPaymentsForAdmin(status),
  ]);

  const required = Number(process.env.PAYMENT_REQUIRED_CONFIRMATIONS ?? 12);

  return (
    <DashboardShell
      title="Pagos"
      description="Primera versión: USDT BEP-20. Los pagos se confirman con el webhook o el watcher de blockchain."
      activePath="/admin/payments"
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Payment intents" value={all.length} />
        <StatCard
          label="Confirmados"
          value={all.filter((payment) => payment.status === "PAID").length}
          tone="success"
        />
        <StatCard
          label="Pendientes"
          value={all.filter((payment) => payment.status === "PENDING").length}
          tone="warn"
        />
        <StatCard
          label="Recaudado"
          value={formatUsdt(
            all
              .filter((payment) => payment.status === "PAID")
              .reduce((sum, payment) => sum + payment.amountUsdt, 0),
          )}
          tone="violet"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter}
            href={`/admin/payments${filter === "all" ? "" : `?status=${filter}`}`}
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
        <AdminPaymentTable payments={payments} />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Configuración de pagos"
          description="Todo lo sensible vive en variables de entorno"
        />
        <ul className="space-y-2 text-[12.5px] text-crow-muted">
          <li>
            Provider: <span className="text-crow-text">{process.env.PAYMENT_PROVIDER ?? "usdt_bep20"}</span>
          </li>
          <li>
            Red: <span className="text-crow-text">BEP-20</span> · Confirmaciones
            requeridas: <span className="text-crow-text">{required}</span>
          </li>
          <li>
            Webhook: <code className="text-crow-glow">POST /api/webhooks/payments</code>{" "}
            (cabecera <code className="text-crow-glow">x-crow-signature</code>)
          </li>
          <li>
            Dirección receptora:{" "}
            <span className="font-mono text-crow-text">
              {process.env.PAYMENT_USDT_BEP20_ADDRESS ?? "no configurada"}
            </span>
          </li>
          <li>CROW no almacena claves privadas en ningún momento.</li>
        </ul>
      </Card>
    </DashboardShell>
  );
}