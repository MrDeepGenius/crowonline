import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/card";
import { CREATOR_PLANS } from "@/lib/plans";
import { cn, formatUsdt } from "@/lib/utils";

export function PlanCards({
  highlightPlan,
  ctaHref = "/register",
  ctaLabel = "Elegir plan",
}: {
  highlightPlan?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
      {CREATOR_PLANS.map((plan) => {
        const featured = highlightPlan ? plan.id === highlightPlan : plan.highlight;
        return (
          <article
            key={plan.id}
            className={cn(
              "relative flex flex-col overflow-hidden rounded-2xl border p-5 transition duration-300",
              featured
                ? "border-crow-violet/45 bg-gradient-to-b from-crow-violet/20 via-crow-violet/5 to-transparent shadow-glow"
                : "border-white/[0.07] bg-white/[0.02] hover:-translate-y-0.5 hover:border-crow-violet/30",
            )}
          >
            {featured ? (
              <span className="absolute right-4 top-4">
                <Badge tone="violet">Popular</Badge>
              </span>
            ) : null}

            <h3 className="text-[15px] font-semibold tracking-wide">{plan.name}</h3>
            <p className="mt-1 text-[11.5px] text-crow-muted">{plan.tagline}</p>

            <p className="mt-5 text-2xl font-semibold text-crow-text">
              {formatUsdt(plan.priceUsdt)}
            </p>
            <p className="mt-1 text-[11.5px] text-crow-muted">
              {plan.durationLabel} · pago único
            </p>

            <ul className="mt-5 flex-1 space-y-2 border-t border-white/[0.06] pt-4">
              <li className="text-[12.5px] text-crow-text">
                {plan.productLimit} infoproductos
              </li>
              <li className="text-[12.5px] text-crow-text">
                {plan.publishedLimit} publicados
              </li>
              {plan.features.slice(2).map((feature) => (
                <li key={feature} className="text-[12px] text-crow-muted">
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href={`${ctaHref}${ctaHref.includes("?") ? "&" : "?"}plan=${plan.id}`}
              className={cn(buttonClass(featured ? "primary" : "secondary", "sm"), "mt-5 w-full")}
            >
              {ctaLabel}
            </Link>
          </article>
        );
      })}
    </div>
  );
}

export function LandingPlans() {
  return (
    <section id="planes" className="crow-container scroll-mt-24 py-20">
      <SectionTitle
        eyebrow="Planes creator"
        title="Elige cuánto quieres construir"
        description="Los planes definen cuántos infoproductos puedes generar y cuántos mantener publicados en el marketplace."
      />
      <div className="mt-12">
        <PlanCards />
      </div>
    </section>
  );
}

export function LandingFinalCta() {
  return (
    <section className="crow-container py-20">
      <div className="relative overflow-hidden rounded-3xl border border-crow-violet/30 bg-gradient-to-br from-crow-violet/25 via-crow-violetDeep/15 to-transparent p-10 text-center sm:p-16">
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[700px] -translate-x-1/2 rounded-full bg-crow-violet/25 blur-[120px]" />
        <h2 className="relative text-balance text-3xl font-semibold tracking-tight sm:text-[40px]">
          Tu primera idea puede ser tu primer producto hoy
        </h2>
        <p className="relative mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-white/75">
          Crea tu cuenta, entra al Creator Studio, escribe una idea y publica en el
          marketplace en la misma sesión. Sin tarjetas, sin configuración técnica.
        </p>
        <div className="relative mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/register" className={buttonClass("primary", "lg")}>
            Crear mi cuenta gratis →
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 bg-white/[0.06] px-6 text-[15px] font-medium text-white transition hover:bg-white/[0.12]"
          >
            Ya tengo cuenta
          </Link>
        </div>
        <p className="relative mt-6 text-[12px] text-white/60">
          Pagos en USDT BEP-20 · Retiros desde 25 USDT · Aprobación manual segura
        </p>
      </div>
    </section>
  );
}