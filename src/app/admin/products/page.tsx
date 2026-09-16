import { AdminProductTable } from "@/components/admin/admin-product-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/ui/card";
import { listProductsForAdmin } from "@/server/services/admin";
import { formatUsdt } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Admin · Productos" };

const FILTERS = ["all", "PUBLISHED", "DRAFT", "ARCHIVED"] as const;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";

  const [all, products] = await Promise.all([
    listProductsForAdmin("all"),
    listProductsForAdmin(status),
  ]);

  return (
    <DashboardShell
      title="Productos"
      description="Todo el catálogo de CROW con su creador, precio, ventas e ingresos generados."
      activePath="/admin/products"
      action={
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/creator/studio"
            className="inline-flex h-11 items-center rounded-xl border border-white/10 bg-white/[0.06] px-5 text-sm text-crow-text"
          >
            Creator Studio
          </Link>
        </div>
      }
    >
      {params.updated ? (
        <p className="mb-5 rounded-xl border border-crow-success/30 bg-crow-success/10 px-4 py-3 text-[12.5px] text-crow-success">
          Estado del producto actualizado a {params.updated.toUpperCase()}.
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Productos" value={all.length} />
        <StatCard
          label="Publicados"
          value={all.filter((product) => product.status === "PUBLISHED").length}
          tone="success"
        />
        <StatCard
          label="Borradores"
          value={all.filter((product) => product.status !== "PUBLISHED").length}
          tone="warn"
        />
        <StatCard
          label="Ingresos totales"
          value={formatUsdt(all.reduce((sum, product) => sum + product.revenueUsdt, 0))}
          tone="violet"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter}
            href={`/admin/products${filter === "all" ? "" : `?status=${filter}`}`}
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
        <AdminProductTable products={products} />
      </div>
    </DashboardShell>
  );
}