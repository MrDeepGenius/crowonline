import { Badge, ProgressBar } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export type EnrollmentCardData = {
  id: string;
  progressPct: number;
  createdAt: Date;
  product: {
    slug: string;
    title: string;
    shortDescription: string;
    coverEmoji: string;
    creator: { name: string };
  };
};

export function EnrollmentCard({ enrollment }: { enrollment: EnrollmentCardData }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-start gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-crow-violet/30 to-transparent text-2xl">
          {enrollment.product.coverEmoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[14px] font-semibold text-crow-text">
              {enrollment.product.title}
            </h3>
            <Badge tone={enrollment.progressPct >= 100 ? "success" : "violet"}>
              {enrollment.progressPct}%
            </Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-[12px] text-crow-muted">
            {enrollment.product.shortDescription}
          </p>
          <p className="mt-1.5 text-[11px] text-crow-muted">
            Por {enrollment.product.creator.name} · desde{" "}
            {formatDate(enrollment.createdAt)}
          </p>
        </div>
      </div>

      <ProgressBar value={enrollment.progressPct} className="mt-4" />

      <div className="mt-4 flex flex-wrap gap-2.5">
        <ButtonLink href={`/learn/${enrollment.product.slug}`} size="sm">
          {enrollment.progressPct ? "Continuar curso" : "Empezar curso"}
        </ButtonLink>
        <ButtonLink href={`/marketplace/${enrollment.product.slug}`} variant="ghost" size="sm">
          Ver ficha
        </ButtonLink>
      </div>
    </Card>
  );
}