import { Badge, ProgressBar } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRODUCT_TYPE_LABEL } from "@/lib/plans";
import type { ProductType } from "@/lib/domain";
import { formatDate } from "@/lib/utils";

export type EnrollmentCardData = {
  id: string;
  progressPct: number;
  createdAt: Date;
  product: {
    slug: string;
    title: string;
    type: string;
    shortDescription: string;
    coverEmoji: string;
    creator: { name: string };
  };
};

const ACCESS_ROUTE: Record<string, (slug: string) => string> = {
  COURSE: (slug) => `/learn/${slug}`,
  EBOOK: (slug) => `/access/${slug}`,
  PDF: (slug) => `/access/${slug}`,
  INTERACTIVE_WEB: (slug) => `/access/${slug}`,
  RESOURCE_KIT: (slug) => `/access/${slug}`,
};

const CTA_LABEL: Record<string, { start: string; resume: string }> = {
  COURSE: { start: "Empezar curso", resume: "Continuar curso" },
  EBOOK: { start: "Leer ebook", resume: "Continuar lectura" },
  PDF: { start: "Abrir PDF", resume: "Continuar lectura" },
  INTERACTIVE_WEB: { start: "Abrir web", resume: "Continuar" },
  RESOURCE_KIT: { start: "Abrir kit", resume: "Continuar" },
};

export function EnrollmentCard({ enrollment }: { enrollment: EnrollmentCardData }) {
  const isCourse = enrollment.product.type === "COURSE";
  const accessHref =
    ACCESS_ROUTE[enrollment.product.type]?.(enrollment.product.slug) ??
    `/learn/${enrollment.product.slug}`;
  const cta = CTA_LABEL[enrollment.product.type] ?? {
    start: "Continuar",
    resume: "Continuar",
  };

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
            {isCourse ? (
              <Badge tone={enrollment.progressPct >= 100 ? "success" : "violet"}>
                {enrollment.progressPct}%
              </Badge>
            ) : (
              <Badge tone="violet">
                {PRODUCT_TYPE_LABEL[enrollment.product.type as ProductType] ??
                  enrollment.product.type}
              </Badge>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-[12px] text-crow-muted">
            {enrollment.product.shortDescription}
          </p>
          <p className="mt-1.5 text-[11px] text-crow-muted">
            Por {enrollment.product.creator.name} · comprado el{" "}
            {formatDate(enrollment.createdAt)}
          </p>
        </div>
      </div>

      {isCourse ? <ProgressBar value={enrollment.progressPct} className="mt-4" /> : null}

      <div className="mt-4 flex flex-wrap gap-2.5">
        <ButtonLink href={accessHref} size="sm">
          {enrollment.progressPct ? cta.resume : cta.start}
        </ButtonLink>
        <ButtonLink href={`/marketplace/${enrollment.product.slug}`} variant="ghost" size="sm">
          Ver ficha
        </ButtonLink>
      </div>
    </Card>
  );
}