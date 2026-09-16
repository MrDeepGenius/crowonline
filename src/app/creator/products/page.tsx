import Link from "next/link";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge, ProgressBar } from "@/components/ui/badge";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { listCreatorProducts } from "@/server/services/catalog";
import { getPlanUsage } from "@/server/services/creator";
import { PRODUCT_STATUS_LABEL, type ProductStatus } from "@/lib/domain";
import { PRODUCT_TYPE_LABEL } from "@/lib/plans";
import { formatDate, formatNumber, formatUsdt } from "@/lib/utils";
import type { ProductType } from "@/lib/domain";

export const metadata = { title: "Mis productos" };

export default async function CreatorProductsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [products, usage] = await Promise.all([
    listCreatorProducts(user.id),
    getPlanUsage(user.id),
  ]);

  return (
    <DashboardShell
      title="Mis productos"
      description="Todos tus infoproductos: borradores, publicados y archivados."
      activePath="/creator/products"
      action={
        <ButtonLink href="/creator/studio">Crear producto con IA</ButtonLink>
      }
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge tone="violet">
          {usage.used}/{usage.plan.productLimit} productos del plan {usage.plan.name}
        </Badge>
        <Badge tone="default">
          {usage.published}/{usage.plan.publishedLimit} publicados
        </Badge>
      </div>

      {products.length ? (
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-crow-violet/30 to-transparent text-xl">
                  {product.coverEmoji}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/creator/products/${product.id}`}
                      className="truncate text-[14px] font-medium text-crow-text hover:text-crow-glow"
                    >
                      {product.title}
                    </Link>
                    <Badge tone={product.status === "PUBLISHED" ? "success" : "warn"}>
                      {PRODUCT_STATUS_LABEL[product.status as ProductStatus] ?? product.status}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-1 text-[12px] text-crow-muted">
                    {product.shortDescription}
                  </p>
                  <p className="mt-1.5 text-[11px] text-crow-muted">
                    {PRODUCT_TYPE_LABEL[product.type as ProductType] ?? product.type} ·{" "}
                    {product.category} · actualizado {formatDate(product.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="grid shrink-0 grid-cols-4 gap-5 text-center sm:w-[360px]">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-crow-muted">Precio</p>
                  <p className="mt-1 text-[13px] font-medium">{formatUsdt(product.priceUsdt)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-crow-muted">Ventas</p>
                  <p className="mt-1 text-[13px] font-medium">
                    {formatNumber(product.salesCount)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-crow-muted">Ingresos</p>
                  <p className="mt-1 text-[13px] font-medium text-crow-glow">
                    {formatUsdt(product.revenueUsdt)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-crow-muted">Quality</p>
                  <p className="mt-1 text-[13px] font-medium">{product.qualityScore}/100</p>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  href={`/creator/products/${product.id}`}
                  className={buttonClass("secondary", "sm")}
                >
                  Editar
                </Link>
                {product.status === "PUBLISHED" ? (
                  <Link
                    href={`/marketplace/${product.publication?.slug ?? product.slug}`}
                    className={buttonClass("ghost", "sm")}
                  >
                    Ver en marketplace
                  </Link>
                ) : (
                  <Link
                    href={`/creator/products/${product.id}#publish`}
                    className={buttonClass("primary", "sm")}
                  >
                    Publicar
                  </Link>
                )}
              </div>

              <ProgressBar value={product.qualityScore} className="sm:hidden" />
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Todavía no tienes productos"
          description="Usa el Creator Studio para transformar una idea en un producto completo con módulos, lecciones y ejercicios."
          action={<ButtonLink href="/creator/studio">Crear mi primer producto →</ButtonLink>}
        />
      )}
    </DashboardShell>
  );
}