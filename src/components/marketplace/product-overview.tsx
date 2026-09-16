import { Avatar, Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { coverGradientClass, type ProductType } from "@/lib/domain";
import { PRODUCT_TYPE_LABEL } from "@/lib/plans";
import { cn, formatNumber } from "@/lib/utils";

export function ProductCover({
  coverEmoji,
  coverGradient,
  type,
  category,
  durationMin,
}: {
  coverEmoji: string;
  coverGradient: string;
  type: string;
  category: string;
  durationMin?: number | null;
}) {
  return (
    <div
      className={cn(
        "relative flex h-64 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br sm:h-72",
        coverGradientClass(coverGradient),
      )}
    >
      <div className="absolute inset-0 grid-crow opacity-40" />
      <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <span className="relative text-6xl drop-shadow-lg">{coverEmoji || "◆"}</span>
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
        <Badge tone="outline" className="border-white/25 bg-black/40 backdrop-blur">
          {PRODUCT_TYPE_LABEL[type as ProductType] ?? type}
        </Badge>
        <Badge tone="outline" className="border-white/25 bg-black/40 backdrop-blur">
          {category}
        </Badge>
        {durationMin ? (
          <Badge tone="outline" className="border-white/25 bg-black/40 backdrop-blur">
            {Math.round(durationMin / 60)}h de contenido
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

export function ProductMeta({
  status,
  ratingAvg,
  ratingCount,
  salesCount,
}: {
  status: string;
  ratingAvg: number;
  ratingCount: number;
  salesCount: number;
}) {
  return (
    <div className="mt-7 flex flex-wrap items-center gap-3">
      <Badge tone={status === "PUBLISHED" ? "success" : "warn"}>
        {status === "PUBLISHED" ? "Publicado" : "Borrador"}
      </Badge>
      <span className="text-[12.5px] text-crow-muted">
        ★ {ratingAvg ? ratingAvg.toFixed(1) : "Nuevo"}
        {ratingCount ? ` · ${ratingCount} reviews` : ""}
      </span>
      <span className="text-[12.5px] text-crow-muted">
        {formatNumber(salesCount)} ventas
      </span>
    </div>
  );
}

export function CreatorBadge({
  name,
  since,
  isCourse,
  durationMin,
}: {
  name: string;
  since: number;
  isCourse: boolean;
  durationMin?: number | null;
}) {
  return (
    <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <Avatar name={name} size={40} />
      <div className="flex-1">
        <p className="text-[13px] font-medium text-crow-text">{name}</p>
        <p className="text-[11.5px] text-crow-muted">Creator en CROW desde {since}</p>
      </div>
      {isCourse && durationMin ? (
        <Badge tone="default">{Math.round(durationMin / 60)}h</Badge>
      ) : null}
    </div>
  );
}

export function IncludesGrid({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5"
        >
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-crow-violet" />
          <span className="text-[13px] leading-relaxed text-crow-text">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PreviewBlock({ lesson }: { lesson: { title: string; content: string } }) {
  return (
    <Card className="mt-4">
      <p className="text-[13px] font-medium text-crow-text">{lesson.title}</p>
      <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-crow-muted">
        {lesson.content}
      </p>
    </Card>
  );
}

export function DescriptionBlock({ description }: { description: string }) {
  return (
    <div className="mt-4 space-y-4 text-[14px] leading-relaxed text-crow-muted">
      {description
        .split("\n")
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
    </div>
  );
}