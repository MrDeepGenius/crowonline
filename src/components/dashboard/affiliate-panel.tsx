import Link from "next/link";

import { buttonClass } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { formatUsdt } from "@/lib/utils";

type AffiliateOverview = {
  affiliate: { referralCode: string };
  clicks: number;
  conversions: number;
  conversionRate: number;
  commissionTotal: number;
  team: { id: string }[];
};

export function AffiliatePanel({ data }: { data: AffiliateOverview }) {
  return (
    <Card>
      <CardHeader
        title="Afiliados"
        description={`Código ${data.affiliate.referralCode}`}
        action={
          <Link href="/affiliate" className="text-[12px] text-crow-glow hover:text-crow-text">
            Ver panel →
          </Link>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-crow-muted">Clics</p>
          <p className="mt-1 text-lg font-semibold">{data.clicks}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-crow-muted">Ventas</p>
          <p className="mt-1 text-lg font-semibold">{data.conversions}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-crow-muted">Conversión</p>
          <p className="mt-1 text-lg font-semibold">{data.conversionRate.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-crow-muted">Comisiones</p>
          <p className="mt-1 text-lg font-semibold text-crow-success">
            {formatUsdt(data.commissionTotal)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[11px] uppercase tracking-wider text-crow-muted">
          Tu enlace de referido
        </p>
        <p className="mt-2 break-all rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2.5 font-mono text-[12px] text-crow-glow">
          /r/{data.affiliate.referralCode}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2.5">
        <Link href="/affiliate/links" className={buttonClass("secondary", "sm")}>
          Enlaces y material
        </Link>
        <Link href="/affiliate/team" className={buttonClass("ghost", "sm")}>
          Equipo ({data.team.length})
        </Link>
      </div>
    </Card>
  );
}