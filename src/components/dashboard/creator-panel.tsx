import Link from "next/link";

import { ProgressBar } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { formatUsdt } from "@/lib/utils";

type Metrics = {
  products: { id: string; title: string; salesCount: number; revenueUsdt: number; status: string }[];
  published: number;
  revenue: number;
  orders: number;
  enrollments: number;
  topProducts: { id: string; title: string; salesCount: number; revenueUsdt: number }[];
};

export function CreatorPanel({ metrics }: { metrics: Metrics }) {
  return (
    <Card>
      <CardHeader
        title="Creator"
        description="Rendimiento de tu catálogo"
        action={
          <Link href="/creator/analytics" className="text-[12px] text-crow-glow hover:text-crow-text">
            Analytics →
          </Link>
        }
      />
      <div className="grid grid-cols-4 gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-crow-muted">Productos</p>
          <p className="mt-1 text-lg font-semibold">{metrics.products.length}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-crow-muted">Publicados</p>
          <p className="mt-1 text-lg font-semibold">{metrics.published}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-crow-muted">Alumnos</p>
          <p className="mt-1 text-lg font-semibold">{metrics.enrollments}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-crow-muted">Ingresos</p>
          <p className="mt-1 text-lg font-semibold text-crow-glow">
            {formatUsdt(metrics.revenue)}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {metrics.topProducts.slice(0, 3).map((product) => (
          <div key={product.id} className="rounded-xl border border-white/[0.06] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-[12.5px] text-crow-text">{product.title}</p>
              <span className="shrink-0 text-[12px] text-crow-muted">
                {formatUsdt(product.revenueUsdt)}
              </span>
            </div>
            <ProgressBar className="mt-2.5" value={Math.min(100, product.salesCount * 10)} />
          </div>
        ))}
        {!metrics.topProducts.length ? (
          <p className="text-[12.5px] text-crow-muted">
            Todavía no tienes productos publicados.
          </p>
        ) : null}
      </div>

      <Link href="/creator/studio" className={`${buttonClass("primary", "sm")} mt-5 w-full`}>
        Crear producto con IA
      </Link>
    </Card>
  );
}