import Link from "next/link";
import type { ReactNode } from "react";

import { CrowMark } from "@/components/brand/crow-mark";
import { formatUsdt } from "@/lib/utils";

const HIGHLIGHTS = [
  {
    title: "Creator Studio con IA",
    detail: "Convierte una idea en un producto completo en minutos.",
  },
  {
    title: "Afiliados de 5 niveles",
    detail: "30% directo + L1-L5 sobre tu red.",
  },
  {
    title: "Wallet USDT",
    detail: `Retiros desde ${formatUsdt(25)} con aprobación manual.`,
  },
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  badge,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  badge?: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-[#0A0A0C] p-12 lg:flex">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-crow-violet/25 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 grid-crow opacity-30" />

        <Link href="/" className="relative flex items-center gap-3">
          <CrowMark size={34} />
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-[0.2em]">CROW</span>
            <span className="mt-0.5 text-[9px] uppercase tracking-[0.3em] text-crow-muted">
              Market
            </span>
          </span>
        </Link>

        <div className="relative">
          <h2 className="text-balance text-[32px] font-semibold leading-tight tracking-tight">
            La nueva generación de{" "}
            <span className="crow-glow-text">afiliados y creadores con IA</span>
          </h2>
          <ul className="mt-8 space-y-5">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-3.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-crow-violet" />
                <div>
                  <p className="text-[13.5px] font-medium text-crow-text">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-crow-muted">
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11.5px] text-crow-muted">
          Distribución 45% creator · 10% CROW · 30% afiliado directo · 5 niveles de red
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-14 sm:px-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <CrowMark size={30} />
            <span className="text-sm font-semibold tracking-[0.18em]">CROW</span>
          </Link>

          {badge ? (
            <span className="crow-chip mb-4 border-crow-violet/30 text-crow-glow">
              {badge}
            </span>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-crow-muted">
            {subtitle}
          </p>

          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}