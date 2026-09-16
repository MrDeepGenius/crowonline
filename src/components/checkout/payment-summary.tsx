import Link from "next/link";

import { Card } from "@/components/ui/card";
import { formatUsdt } from "@/lib/utils";

export function PaymentSummary({
  items,
  total,
  referralCode,
}: {
  items: { id: string; title: string; priceUsdt: number; slug: string }[];
  total: number;
  referralCode?: string | null;
}) {
  return (
    <Card>
      <h2 className="text-[15px] font-semibold">Resumen de la orden</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3 text-[13px] last:border-0"
          >
            <Link
              href={`/marketplace/${item.slug}`}
              className="min-w-0 flex-1 truncate text-crow-text hover:text-crow-glow"
            >
              {item.title}
            </Link>
            <span className="shrink-0 text-crow-muted">
              {formatUsdt(item.priceUsdt)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between text-[14px]">
        <span className="text-crow-muted">Total</span>
        <span className="font-semibold text-crow-text">{formatUsdt(total)}</span>
      </div>
      {referralCode ? (
        <p className="mt-4 rounded-lg border border-crow-violet/25 bg-crow-violet/10 px-3 py-2 text-[11.5px] text-crow-glow">
          Referido por {referralCode.toUpperCase()} · su comisión se acredita al
          confirmarse el pago.
        </p>
      ) : null}
      <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-4 text-[11.5px] leading-relaxed text-crow-muted">
        <p>Los pagos se confirman en la red BEP-20 (USDT).</p>
        <p>CROW nunca almacena claves privadas ni pide firma de wallet.</p>
      </div>
    </Card>
  );
}