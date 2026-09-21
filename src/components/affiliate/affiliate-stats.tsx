"use client";

import { Badge } from "@/components/ui/badge";
import { formatUsdt } from "@/lib/utils";

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ values }: { values: number[] }) {
  const W = 100, H = 30;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const stepX = W / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = i * stepX;
    const y = H - ((v - min) / (max - min || 1)) * H;
    return [x, y] as [number, number];
  });
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-20 h-7 opacity-70" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  delta,
  deltaLabel,
  spark,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: string;
  deltaLabel?: string;
  spark: number[];
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-5 backdrop-blur-sm transition-all duration-400 hover:-translate-y-[3px] hover:border-[rgba(168,85,247,0.4)] hover:shadow-[0_20px_50px_-20px_rgba(106,0,255,0.4)]">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-crow-violet/20 bg-crow-violet/10 text-crow-glow">
          <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.6 6.9L22 10l-5.5 4.8L18 22l-6-3.6L6 22l1.5-7.2L2 10l7.4-1.1z" />
          </svg>
        </div>
        <Sparkline values={spark} />
      </div>
      <p className="mb-1 text-[11.5px] text-crow-muted">{label}</p>
      <p className="font-sans text-[24px] font-semibold leading-tight tracking-tight text-crow-text">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-[12px]">
        {delta ? (
          <>
            <span className="inline-flex items-center gap-0.5 font-medium text-emerald-400">
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
              +{delta}
            </span>
            <span className="text-crow-muted">{deltaLabel ?? "vs. período anterior"}</span>
          </>
        ) : (
          <span className="text-crow-muted">{sub}</span>
        )}
      </div>
    </div>
  );
}

// ─── AffiliateStats (5 KPIs) ──────────────────────────────────────────────────
const SPARK_CLICKS     = [4, 6, 5, 8, 7, 10, 9, 12, 11, 14, 13, 16];
const SPARK_SALES      = [3, 4, 3, 5, 6,  5,  7,  6,  8,  7,  9,  8];
const SPARK_CONV       = [5, 4, 6, 5, 7,  6,  8,  7,  9,  8, 10,  9];
const SPARK_COMMISSION = [3, 4, 3, 5, 3,  4,  2,  3,  4,  2,  3,  2];
const SPARK_POINTS     = [4, 6, 5, 8, 7, 10,  9, 12, 11, 14, 13, 16];

export function AffiliateStats({
  clicks,
  conversions,
  conversionRate,
  commissionTotal,
  crowPoints,
  teamSize,
}: {
  clicks: number;
  conversions: number;
  conversionRate: number;
  commissionTotal: number;
  crowPoints: number;
  teamSize: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <KpiCard label="Clics" value={clicks.toLocaleString("es")} sub="Tracking de enlace" spark={SPARK_CLICKS} />
      <KpiCard label="Ventas" value={conversions.toString()} delta={conversions > 0 ? conversions.toString() : undefined} deltaLabel="conversiones" spark={SPARK_SALES} />
      <KpiCard label="Conversión" value={`${conversionRate.toFixed(1)}%`} sub="Clics → ventas" spark={SPARK_CONV} />
      <KpiCard label="Comisiones" value={formatUsdt(commissionTotal)} delta={commissionTotal > 0 ? "18.4%" : undefined} spark={SPARK_COMMISSION} />
      <KpiCard label="CROW Points" value={crowPoints.toFixed(0)} sub={`${teamSize} afiliados en red`} spark={SPARK_POINTS} />
    </div>
  );
}

// ─── Tu negocio ───────────────────────────────────────────────────────────────
export function AffiliateBusinessCard({
  conversions,
  commissionTotal,
  conversionRate,
  teamSize,
}: {
  conversions: number;
  commissionTotal: number;
  conversionRate: number;
  teamSize: number;
}) {
  const items = [
    { label: "Ventas directas",    value: conversions.toString() },
    { label: "Comisión directa",   value: formatUsdt(commissionTotal) },
    { label: "Tasa de conversión", value: `${conversionRate.toFixed(1)}%` },
    { label: "Red activa",         value: teamSize.toString() },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.015] backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div>
          <p className="text-[14px] font-semibold text-crow-text">Tu negocio</p>
          <p className="mt-0.5 text-[11.5px] text-crow-muted">Resumen de tu actividad como afiliado</p>
        </div>
        <Badge tone="success" dot>Activo</Badge>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.05] sm:grid-cols-4 sm:divide-y-0">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-1 px-5 py-4">
            <span className="text-[10.5px] uppercase tracking-[0.12em] text-crow-muted">{item.label}</span>
            <span className="font-sans text-[18px] font-semibold text-crow-text">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Barra de comisiones ──────────────────────────────────────────────────────
const COMMISSION_ROWS = [
  { label: "Directa",    pct: 30, direct: true  },
  { label: "Nivel 1",   pct: 5,  direct: false },
  { label: "Nivel 2",   pct: 3,  direct: false },
  { label: "Nivel 3",   pct: 2,  direct: false },
  { label: "Nivel 4",   pct: 2,  direct: false },
  { label: "Nivel 5",   pct: 1,  direct: false },
];

export function AffiliateRulesCard() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-5 sm:p-6 backdrop-blur-sm">
      <h2 className="font-sans text-[17px] font-semibold text-crow-text">Tu estructura de comisiones</h2>
      <p className="mt-1 mb-6 text-[13px] text-crow-muted">Porcentajes de distribución por venta. No representan montos fijos.</p>
      <div className="space-y-3.5">
        {COMMISSION_ROWS.map((row) => (
          <div key={row.label} className="flex items-center gap-4">
            <div className={`w-20 shrink-0 text-[13px] font-medium ${row.direct ? "text-crow-text" : "text-crow-muted"}`}>
              {row.label}
            </div>
            <div className="h-[10px] flex-1 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(row.pct / 30) * 100}%`,
                  background: row.direct
                    ? "linear-gradient(90deg,#6A00FF,#A855F7)"
                    : "linear-gradient(90deg,#5B18C4,#8B5CF6)",
                }}
              />
            </div>
            <div className={`w-10 text-right text-[15px] font-semibold ${row.direct ? "text-crow-glow" : "text-crow-text"}`}>
              {row.pct}%
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 border-t border-white/[0.06] pt-3.5 text-[11.5px] leading-relaxed text-crow-muted">
        Emergency Reserve solo existe en el primer desbloqueo de L1 (2.5% afiliado + 2.5% reserva). No forma parte de la distribución permanente.
      </p>
    </div>
  );
}

// ─── Referral link card ───────────────────────────────────────────────────────
export function ReferralLinkCard({ code, baseUrl }: { code: string; baseUrl: string }) {
  const link = `${baseUrl}/r/${code}`;
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-5 sm:p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-crow-text">Tu enlace de referido</h3>
          <p className="mt-0.5 text-[11.5px] text-crow-muted">
            Toda venta generada en 30 días desde este enlace te acredita comisión.
          </p>
        </div>
        <Badge tone="violet">{code}</Badge>
      </div>

      {/* URL box */}
      <div className="flex items-center gap-2 rounded-xl border border-crow-violet/20 bg-crow-violet/[0.05] px-3.5 py-2.5 mb-4">
        <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-crow-glow">{link}</code>
        <span className="shrink-0 cursor-pointer select-none rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-crow-muted transition hover:border-crow-violet/30 hover:text-crow-text">
          Copiar
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Comisión directa", value: "30%", color: "text-crow-glow" },
          { label: "Niveles L1–L5",    value: "5/3/2/2/1%", color: "text-crow-text" },
          { label: "Cookie",           value: "30 días", color: "text-crow-text" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col gap-1 rounded-xl border border-white/[0.06] bg-white/[0.015] py-3 text-center">
            <span className="text-[9.5px] uppercase tracking-[0.12em] text-crow-muted">{item.label}</span>
            <span className={`text-[15px] font-semibold ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11.5px] leading-relaxed text-crow-muted">
        Los Crow Points miden volumen de red (1 CP = 1 punto de venta) y nunca se convierten en saldo de wallet.
      </p>
    </div>
  );
}

// ─── Network summary ──────────────────────────────────────────────────────────
export function AffiliateNetworkSummary({
  teamSize,
  referralsTotal,
  level1Unlocked,
  emergencyReserve,
}: {
  teamSize: number;
  referralsTotal: number;
  level1Unlocked: boolean;
  emergencyReserve: number;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-5 sm:p-6 backdrop-blur-sm">
      <h3 className="mb-1 text-[14px] font-semibold text-crow-text">Resumen de red</h3>
      <p className="mb-4 text-[11.5px] text-crow-muted">Estado de tu estructura residual</p>
      <ul className="space-y-2.5">
        {[
          { label: "Afiliados directos",  value: teamSize,                                              hint: "en tu equipo" },
          { label: "Referidos totales",   value: referralsTotal,                                        hint: "registros con tu código" },
          { label: "Nivel 1",             value: level1Unlocked ? "Desbloqueado" : "Pendiente",         hint: level1Unlocked ? "5% activo" : "Necesita primera venta", accent: level1Unlocked },
          { label: "Emergency Reserve",  value: formatUsdt(emergencyReserve),                           hint: "primer desbloqueo L1" },
        ].map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-3.5 py-3"
          >
            <div>
              <p className="text-[12.5px] text-crow-text">{row.label}</p>
              <p className="text-[11px] text-crow-muted">{row.hint}</p>
            </div>
            <span className={`text-[13px] font-semibold ${"accent" in row && row.accent ? "text-crow-success" : "text-crow-text"}`}>
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
