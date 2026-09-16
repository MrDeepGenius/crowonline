import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { PRODUCT_TYPE_LABEL } from "@/lib/plans";
import { coverGradientClass, type ProductType } from "@/lib/domain";
import { cn, formatNumber, formatUsdt } from "@/lib/utils";

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  type: string;
  category: string;
  priceUsdt: number;
  coverEmoji: string;
  coverGradient: string;
  ratingAvg: number;
  ratingCount: number;
  salesCount: number;
  creator?: { name: string } | null;
  course?: { durationMin: number } | null;
};

export function ProductCard({
  product,
  className,
}: {
  product: ProductCardData;
  className?: string;
}) {
  return (
    <Link
      href={`/marketplace/${product.slug}`}
      className={cn("crow-card crow-card-hover group flex flex-col overflow-hidden p-0", className)}
    >
      <div
        className={cn(
          "relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br",
          coverGradientClass(product.coverGradient),
        )}
      >
        <div className="absolute inset-0 grid-crow opacity-40" />
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <span className="relative text-4xl drop-shadow-lg transition duration-500 group-hover:scale-110">
          {product.coverEmoji || "◆"}
        </span>
        <span className="absolute left-3 top-3">
          <Badge tone="outline" className="border-white/25 bg-black/40 backdrop-blur">
            {PRODUCT_TYPE_LABEL[product.type as ProductType] ?? product.type}
          </Badge>
        </span>
        {product.course?.durationMin ? (
          <span className="absolute bottom-3 right-3 rounded-full border border-white/20 bg-black/45 px-2.5 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur">
            {Math.round(product.course.durationMin / 60)}h {product.course.durationMin % 60}m
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-crow-muted">
            {product.category}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-crow-warn">
            ★ {product.ratingAvg ? product.ratingAvg.toFixed(1) : "Nuevo"}
            {product.ratingCount ? (
              <span className="text-crow-muted">({product.ratingCount})</span>
            ) : null}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 text-[15px] font-semibold leading-snug text-crow-text transition group-hover:text-crow-glow">
          {product.title}
        </h3>

        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-crow-muted">
          {product.shortDescription}
        </p>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/[0.06] pt-3.5">
          <div>
            <p className="text-[11px] text-crow-muted">
              {product.creator?.name ?? "CROW Creator"}
            </p>
            <p className="mt-0.5 text-[15px] font-semibold text-crow-text">
              {formatUsdt(product.priceUsdt)}
            </p>
          </div>
          <span className="text-[11px] text-crow-muted">
            {formatNumber(product.salesCount)} ventas
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="crow-card flex flex-col overflow-hidden p-0">
      <div className="h-40 animate-pulse bg-white/[0.04]" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-20 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-4 w-full animate-pulse rounded bg-white/[0.06]" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.05]" />
        <div className="h-5 w-24 animate-pulse rounded bg-white/[0.06]" />
      </div>
    </div>
  );
}