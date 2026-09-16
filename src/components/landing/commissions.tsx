import { SectionTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_SPLIT, REWARDS_POOL_RATE, splitPercent } from "@/lib/commissions";

const LEVEL_COPY: Record<string, string> = {
  Creator: "Pago base por cada venta de su producto",
  Crow: "Comisión de plataforma",
  "Afiliado directo": "Quien generó la venta",
  L1: "Primer nivel de tu red",
  L2: "Segundo nivel",
  L3: "Tercer nivel",
  L4: "Cuarto nivel",
  L5: "Quinto nivel",
};

const AFFILIATE_FLOW = [
  { label: "Enlace de referido", detail: "/r/TUCODIGO · cookie de 30 días" },
  { label: "Clic registrado", detail: "Tracking en tiempo real + Crow Points" },
  { label: "Venta convertida", detail: "Comisión acreditada al confirmar pago" },
  { label: "Wallet", detail: "Saldo disponible y retiro desde 25 USDT" },
];

export function LandingCommissions() {
  const rows: { role: string; rate: number }[] = [
    { role: "Creator", rate: DEFAULT_SPLIT.creator },
    { role: "Crow", rate: DEFAULT_SPLIT.platform },
    { role: "Afiliado directo", rate: DEFAULT_SPLIT.directAffiliate },
    { role: "L1", rate: DEFAULT_SPLIT.levels[0] },
    { role: "L2", rate: DEFAULT_SPLIT.levels[1] },
    { role: "L3", rate: DEFAULT_SPLIT.levels[2] },
    { role: "L4", rate: DEFAULT_SPLIT.levels[3] },
    { role: "L5", rate: DEFAULT_SPLIT.levels[4] },
  ];

  return (
    <section id="afiliados" className="crow-container scroll-mt-24 py-20">
      <SectionTitle
        eyebrow="Distribución comercial"
        title="Comisiones transparentes de 5 niveles"
        description="Cada venta se reparte con una matriz fija y auditable. CROW Points mide volumen de red, nunca se convierte en dinero."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="crow-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold">Matriz de reparto</h3>
            <Badge tone="success">Total 100%</Badge>
          </div>

          <div className="mt-5 space-y-2.5">
            {rows.map((row) => (
              <div key={row.role} className="flex items-center gap-4">
                <span className="w-32 shrink-0 text-[13px] text-crow-text">
                  {row.role}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-crow-violet to-crow-glow"
                    style={{ width: `${Math.min(100, row.rate * 200)}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-[13px] font-medium text-crow-glow">
                  {splitPercent(row.rate)}
                </span>
                <span className="hidden w-52 shrink-0 text-[11.5px] text-crow-muted xl:block">
                  {LEVEL_COPY[row.role]}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 border-t border-white/[0.06] pt-5 text-[12.5px] leading-relaxed text-crow-muted">
            <p>
              <span className="text-crow-text">Emergency Reserve:</span> no forma parte
              de la distribución permanente. Solo existe como excepción del primer
              desbloqueo de L1 — 2.5% para el afiliado y 2.5% a reserva.
            </p>
            <p>
              <span className="text-crow-text">Rewards Pool:</span>{" "}
              {splitPercent(REWARDS_POOL_RATE)} proveniente de ventas de licencias.
            </p>
            <p>
              <span className="text-crow-text">Crow Points (CP):</span> 1 CP = 1 punto
              de volumen. Nunca se trata como dinero ni entra en la wallet.
            </p>
          </div>
        </div>

        <div className="crow-card p-6">
          <h3 className="text-[15px] font-semibold">Cómo gana un afiliado</h3>
          <ol className="mt-5 space-y-4">
            {AFFILIATE_FLOW.map((step, index) => (
              <li key={step.label} className="flex gap-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-crow-violet/30 bg-crow-violet/10 text-[12px] font-medium text-crow-glow">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[13px] font-medium text-crow-text">
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-[12px] text-crow-muted">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-xl border border-crow-violet/25 bg-crow-violet/10 p-4">
            <p className="text-[12.5px] leading-relaxed text-white/85">
              Un creator nunca vende como afiliado sus propios productos, y un
              afiliado no puede crear productos. Las reglas de rol se aplican en
              el servidor, no solo en la interfaz.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}