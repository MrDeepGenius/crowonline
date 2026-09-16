import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { LandingHero } from "@/components/landing/hero";
import { LandingPillars } from "@/components/landing/pillars";
import { LandingCommissions } from "@/components/landing/commissions";
import { LandingFinalCta, LandingPlans } from "@/components/landing/plans-grid";
import { StudioPreviewPanel } from "@/components/landing/preview-panel";
import { ProductGrid } from "@/components/marketplace/product-grid";
import { ButtonLink } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/card";
import { listMarketplaceProducts } from "@/server/services/catalog";

const STUDIO_STEPS = [
  {
    title: "1 · Draft",
    detail: "Escribe la idea en lenguaje natural. CROW la interpreta como brief comercial.",
  },
  {
    title: "2 · Generate",
    detail: "Groq o NVIDIA generan el blueprint: promesa, público, módulos, lecciones y recursos.",
  },
  {
    title: "3 · Edit",
    detail: "Todo el blueprint es editable: título, precio, módulos, lecciones y ejercicios.",
  },
  {
    title: "4 · Preview",
    detail: "Revisa la página del producto y el Course Player antes de exponerlo al público.",
  },
  {
    title: "5 · Quality Check",
    detail: "Un score de calidad valida estructura, ejercicios, recursos y promesa.",
  },
  {
    title: "6 · Publish",
    detail: "Se crea el ProductPublication con slug único y aparece en el marketplace.",
  },
];

export default async function LandingPage() {
  const featured = await listMarketplaceProducts({ limit: 6, sort: "recent" });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingPillars />

        <section id="creator-studio" className="crow-container scroll-mt-24 py-20">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <SectionTitle
                eyebrow="Creator Studio"
                title="IDEA → IA → PRODUCTO"
                description="El componente principal de CROW. Un chat premium a la izquierda y un Live Product Blueprint editable a la derecha que se actualiza mientras conversas."
              />
              <ul className="mt-8 space-y-4">
                {STUDIO_STEPS.map((step) => (
                  <li
                    key={step.title}
                    className="flex gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-crow-violet/30"
                  >
                    <span className="shrink-0 text-[12px] font-semibold uppercase tracking-wider text-crow-glow">
                      {step.title}
                    </span>
                    <span className="text-[12.5px] leading-relaxed text-crow-muted">
                      {step.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <StudioPreviewPanel />
          </div>
        </section>

        <section className="crow-container py-20">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionTitle
              eyebrow="Marketplace"
              title="Productos publicados en CROW"
              description="Cursos, ebooks, PDFs, webs interactivas y kits de recursos creados con el Creator Studio."
            />
            <ButtonLink href="/marketplace" variant="secondary">
              Ver todo el catálogo
            </ButtonLink>
          </div>
          <div className="mt-12">
            <ProductGrid products={featured} />
          </div>
        </section>

        <LandingCommissions />
        <LandingPlans />
        <LandingFinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

export function generateMetadata() {
  return {
    title: "CROW MARKET · Crea, vende y escala productos digitales con IA",
    description:
      "Marketplace de productos digitales + Creator Studio con IA + afiliados de 5 niveles + wallet USDT.",
    alternates: { canonical: "/" },
  };
}

export const revalidate = 0;