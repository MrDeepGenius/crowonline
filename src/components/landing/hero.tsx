import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudioPreviewPanel } from "@/components/landing/preview-panel";

const STATS = [
  { label: "Creadores activos", value: "1.240+" },
  { label: "Productos publicados", value: "3.870" },
  { label: "Comisiones repartidas", value: "412.9K" },
  { label: "Red de afiliados", value: "5 niveles" },
];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-16 sm:pt-24">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-crow-violet/20 blur-[140px]" />
      <div className="crow-container grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="animate-fade-up">
          <Badge tone="violet" dot className="mb-5">
            IA + Marketplace + Afiliados en una sola plataforma
          </Badge>

          <h1 className="text-balance text-[36px] font-semibold leading-[1.08] tracking-tight sm:text-[52px]">
            Bienvenido a la nueva generación de{" "}
            <span className="crow-glow-text">afiliados y creadores con IA</span>
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-crow-muted">
            Escribe una idea y CROW la convierte en un producto digital completo:
            estructura, módulos, lecciones, ejercicios y estrategia comercial.
            Publícalo en el marketplace y deja que tu red de afiliados lo venda por ti.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/register" size="lg">
              Crear mi cuenta gratis →
            </ButtonLink>
            <Link
              href="/marketplace"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-6 text-[15px] font-medium text-crow-text transition hover:bg-white/[0.1]"
            >
              Explorar marketplace
            </Link>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="text-[11px] uppercase tracking-wider text-crow-muted">
                  {stat.label}
                </dt>
                <dd className="mt-1.5 text-lg font-semibold text-crow-text">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <StudioPreviewPanel />
      </div>
    </section>
  );
}