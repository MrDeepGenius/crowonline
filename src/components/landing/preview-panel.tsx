import { Badge } from "@/components/ui/badge";
import { formatUsdt } from "@/lib/utils";

const PIPELINE = [
  "Analizando nicho y público objetivo…",
  "Diseñando 3 módulos y 9 lecciones…",
  "Definiendo ejercicios y recursos…",
  "Calculando precio y estrategia comercial…",
];

const MODULES = [
  "Fundamentos: nicho, oferta y público",
  "Embudo mínimo viable",
  "Contenido con intención de venta",
];

export function StudioPreviewPanel() {
  return (
    <div className="relative animate-fade-up [animation-delay:120ms]">
      <div className="absolute -inset-6 -z-10 rounded-[32px] bg-gradient-to-br from-crow-violet/25 via-transparent to-transparent blur-2xl" />
      <div className="crow-card overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <span className="flex items-center gap-2 text-[12px] text-crow-muted">
            <span className="h-2 w-2 rounded-full bg-crow-danger/70" />
            <span className="h-2 w-2 rounded-full bg-crow-warn/70" />
            <span className="h-2 w-2 rounded-full bg-crow-success/70" />
            <span className="ml-2">crow.market/creator/studio</span>
          </span>
          <Badge tone="violet">CROW IA</Badge>
        </div>

        <div className="grid gap-0 sm:grid-cols-2">
          <div className="border-b border-white/[0.06] p-4 sm:border-b-0 sm:border-r">
            <p className="text-[11px] uppercase tracking-wider text-crow-muted">
              Tu idea
            </p>
            <div className="mt-3 rounded-xl border border-white/[0.07] bg-black/40 p-3 text-[12.5px] leading-relaxed text-crow-text">
              Quiero crear un curso para aprender marketing digital desde cero.
            </div>

            <div className="mt-3 space-y-2.5">
              {PIPELINE.map((line, index) => (
                <div
                  key={line}
                  className="flex items-center gap-2 text-[11.5px] text-crow-muted"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-crow-violet" />
                  {line}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="crow-chip border-crow-violet/30 text-crow-glow">
                Groq · rápido
              </span>
              <span className="crow-chip">NVIDIA · alternativo</span>
              <span className="crow-chip">Leonardo · multimedia</span>
            </div>
          </div>

          <div className="p-4">
            <p className="text-[11px] uppercase tracking-wider text-crow-muted">
              Live product blueprint
            </p>
            <p className="mt-3 text-[13.5px] font-semibold leading-snug text-crow-text">
              Marketing Digital desde Cero: Sistema de Ventas en 30 Días
            </p>

            <div className="mt-3 space-y-2">
              {MODULES.map((module, index) => (
                <div
                  key={module}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11.5px] text-crow-muted"
                >
                  <span className="truncate">
                    {index + 1}. {module}
                  </span>
                  <span className="ml-2 shrink-0 text-crow-glow">3 lecciones</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-crow-violet/25 bg-crow-violet/10 px-3 py-2.5">
              <span className="text-[11.5px] text-crow-muted">Precio sugerido</span>
              <span className="text-[15px] font-semibold text-crow-glow">
                {formatUsdt(49)}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="crow-chip border-crow-success/30 text-crow-success">
                Quality 92/100
              </span>
              <span className="crow-chip">Listo para publicar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}