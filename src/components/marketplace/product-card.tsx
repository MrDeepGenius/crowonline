import Link from "next/link";

import { Badge, Avatar } from "@/components/ui/badge";
import { coverGradientClass } from "@/lib/domain";
import { isBoostActive } from "@/lib/boost";
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
  coverImageUrl?: string | null;
  ratingAvg: number;
  ratingCount: number;
  salesCount: number;
  boostExpiresAt?: string | null;
  createdAt: string;
  creator?: { name: string } | null;
  course?: { durationMin: number } | null;
};

/**
 * Card contract source: database rows carry `createdAt` as a Date, while the
 * card component is also rendered from serialized (ISO string) payloads.
 */
export type ProductCardSource = Omit<ProductCardData, "createdAt"> & {
  createdAt: string | Date;
  boosts?: { status: string | null; expiresAt: Date | string | null }[];
};

/** Normalizes a Prisma row / serialized product into the card contract. */
export function toCardData(product: ProductCardSource): ProductCardData {
  const active = product.boosts?.find((boost) => isBoostActive(boost));
  return {
    ...product,
    boostExpiresAt: active?.expiresAt ? new Date(active.expiresAt).toISOString() : product.boostExpiresAt,
    createdAt:
      product.createdAt instanceof Date
        ? product.createdAt.toISOString()
        : product.createdAt,
  };
}

const NEW_WINDOW_MS = 1000 * 60 * 60 * 24 * 21;

/**
 * Badge derived strictly from REAL product data (never invented):
 *  - BEST SELLER : real sales count in the top tier
 *  - TRENDING    : recently published AND already has real sales
 *  - NEW         : published within the last `NEW_WINDOW_MS`
 */
function computeBadge(product: ProductCardData): { label: string; tone: "best" | "trend" | "new" } | null {
  const ageMs = Date.now() - new Date(product.createdAt).getTime();
  const isNew = ageMs > 0 && ageMs <= NEW_WINDOW_MS;
  if (product.salesCount >= 10) return { label: "BEST SELLER", tone: "best" };
  if (isNew && product.salesCount > 0) return { label: "TRENDING", tone: "trend" };
  if (isNew) return { label: "NEW", tone: "new" };
  return null;
}

const BADGE_CLASS = {
  best: "mp-badge-best",
  trend: "mp-badge-trend",
  new: "mp-badge-new",
} as const;

export function ProductCard({
  product,
  className,
}: {
  product: ProductCardData;
  className?: string;
}) {
  const badge = computeBadge(product);
  const formattedPrice = formatUsdt(product.priceUsdt);
  const hasSales = product.salesCount > 0;

  return (
    <Link
      href={`/marketplace/${product.slug}`}
      className={cn(
        "mp-card mp-card-hover group flex flex-col overflow-hidden rounded-2xl p-0",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex h-40 items-center justify-center overflow-hidden rounded-t-2xl bg-gradient-to-br",
          coverGradientClass(product.coverGradient),
        )}
      >
        {product.coverImageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.coverImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
        ) : (
          <>
            <div className="absolute inset-0 grid-crow opacity-40" />
            <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <span className="mp-cover-zoom relative text-4xl drop-shadow-lg transition-transform">
              {product.coverEmoji || "◆"}
            </span>
          </>
        )}

        {isBoostActive({ status: "ACTIVE", expiresAt: product.boostExpiresAt ?? null }) ? (
          <Badge tone="violet" className="absolute bottom-3 left-3 bg-black/80">CROW BOOST</Badge>
        ) : null}
        {badge ? <span className={cn("mp-badge-pill", BADGE_CLASS[badge.tone])}>{badge.label}</span> : null}

        {product.course?.durationMin ? (
          <Badge
            tone="outline"
            className="absolute bottom-3 right-3 border-white/25 bg-black/40 backdrop-blur"
          >
            {Math.round(product.course.durationMin / 60)}h {product.course.durationMin % 60}m
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between text-[11px] text-crow-muted uppercase tracking-wide">
          <span>{product.category}</span>
          <span className="flex items-center gap-1 normal-case text-crow-warn">
            ★ {product.ratingAvg ? product.ratingAvg.toFixed(1) : "Nuevo"}
            {product.ratingCount ? <span className="text-crow-muted">({product.ratingCount})</span> : null}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 text-[15px] font-medium leading-snug text-crow-text mp-display transition group-hover:text-crow-glow">
          {product.title}
        </h3>

        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-crow-muted">
          {product.shortDescription}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <Avatar name={product.creator?.name ?? "CROW Creator"} size={20} className="!border-crow-violet/40" />
          <span className="text-[12px] text-crow-muted">
            {product.creator?.name ?? "CROW Creator"}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/[0.06] pt-3.5">
          <p className="text-[15px] font-semibold text-crow-text">{formattedPrice}</p>
          {hasSales ? (
            <span className="flex items-center gap-1 text-[11px] text-crow-muted">
              <span className="h-1 w-1 rounded-full bg-crow-violet" />
              {formatNumber(product.salesCount)} ventas
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="mp-card mp-card-hover flex flex-col overflow-hidden rounded-2xl p-0">
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