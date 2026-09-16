import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { formatUsdt } from "@/lib/utils";

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
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Clics" value={clicks} hint="Tracking de tu enlace" />
      <StatCard label="Ventas" value={conversions} hint="Conversiones atribuidas" tone="violet" />
      <StatCard label="Conversion rate" value={`${conversionRate.toFixed(1)}%`} hint="Clics → ventas" />
      <StatCard
        label="Comisiones"
        value={formatUsdt(commissionTotal)}
        hint="Directo + L1-L5"
        tone="success"
      />
      <StatCard
        label="Crow Points"
        value={crowPoints.toFixed(0)}
        hint={`1 CP = 1 punto · ${teamSize} afiliados`}
      />
    </div>
  );
}

export function ReferralLinkCard({ code, baseUrl }: { code: string; baseUrl: string }) {
  const link = `${baseUrl}/r/${code}`;

  return (
    <Card>
      <CardHeader
        title="Tu enlace de referido"
        description="Toda venta generada en 30 días desde este enlace te acredita comisión."
        action={<Badge tone="violet">{code}</Badge>}
      />
      <p className="break-all rounded-xl border border-white/[0.08] bg-black/40 px-3.5 py-3 font-mono text-[12.5px] text-crow-glow">
        {link}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Comisión directa", value: "30%" },
          { label: "L1-L5", value: "5/3/2/2/1%" },
          { label: "Cookie", value: "30 días" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white/[0.06] py-2.5 text-center"
          >
            <p className="text-[10px] uppercase tracking-wider text-crow-muted">
              {item.label}
            </p>
            <p className="mt-1 text-[14px] font-semibold text-crow-text">{item.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11.5px] leading-relaxed text-crow-muted">
        Los Crow Points miden volumen de red (1 CP = 1 punto de venta) y nunca se
        convierten en saldo de wallet.
      </p>
    </Card>
  );
}

export function AffiliateRulesCard() {
  return (
    <Card>
      <CardHeader
        title="Cómo se reparte una venta"
        description="Distribución fija de CROW"
        action={<Badge tone="success">100%</Badge>}
      />
      <ul className="space-y-2 text-[12.5px]">
        {[
          { role: "Creator", rate: "45%" },
          { role: "CROW", rate: "10%" },
          { role: "Afiliado directo", rate: "30%" },
          { role: "L1", rate: "5%" },
          { role: "L2", rate: "3%" },
          { role: "L3", rate: "2%" },
          { role: "L4", rate: "2%" },
          { role: "L5", rate: "1%" },
        ].map((row) => (
          <li key={row.role} className="flex items-center justify-between">
            <span className="text-crow-muted">{row.role}</span>
            <span className="text-crow-text">{row.rate}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-white/[0.06] pt-3 text-[11.5px] leading-relaxed text-crow-muted">
        Emergency Reserve no forma parte de la distribución permanente: solo existe
        en el primer desbloqueo de L1 (2.5% afiliado + 2.5% reserva).
      </p>
    </Card>
  );
}