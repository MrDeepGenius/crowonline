import { AdminOrderTable } from "@/components/admin/admin-order-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/ui/card";
import { listOrdersForAdmin } from "@/server/services/settlement";
import { formatUsdt } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Admin · Órdenes" };

const FILTERS = ["all", "PAID", "PENDING", "EXPIRED", "FAILED"] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";

  const [all, orders] = await Promise.all([
    listOrdersForAdmin("all"),
    listOrdersForAdmin(status),
  ]);

  return (
    <DashboardShell
      title="Órdenes"
      description="Revisa el ciclo completo de compra: creación, pago, expiración y fallo."
      activePath="/admin/orders"
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Órdenes" value={all.length} />
        <StatCard
          label="Pagadas"
          value={all.filter((order) => order.status === "PAID").length}
          tone="success"
        />
        <StatCard
          label="Pendientes"
          value={all.filter((order) => order.status === "PENDING").length}
          tone="warn"
        />
        <StatCard
          label="Volumen pagado"
          value={formatUsdt(
            all
              .filter((order) => order.status === "PAID")
              .reduce((sum, order) => sum + order.totalUsdt, 0),
          )}
          tone="violet"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter}
            href={`/admin/orders${filter === "all" ? "" : `?status=${filter}`}`}
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
        <AdminOrderTable orders={orders} />
      </div>
    </DashboardShell>
  );
}