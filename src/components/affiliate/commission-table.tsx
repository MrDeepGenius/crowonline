import Link from "next/link";

import { formatDateTime, formatUsdt } from "@/lib/utils";

type Commission = {
  id: string;
  role: string;
  rate: number;
  amountUsdt: number;
  status: string;
  createdAt: Date;
  product: { title: string; slug: string };
};

function TypeBadge({ role, rate }: { role: string; rate: number }) {
  const isDirect = role === "DIRECT" || role === "AFFILIATE";
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold",
        isDirect
          ? "bg-crow-violet/12 text-[#C4A3FF]"
          : "bg-crow-violetDeep/20 text-[#B487FF]",
      ].join(" ")}
    >
      {isDirect ? "Direct" : `Residual ${role}`}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const confirmed = status === "PAID" || status === "CONFIRMED" || status === "APPROVED";
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold",
        confirmed
          ? "bg-crow-success/12 text-crow-success"
          : "bg-crow-warn/12 text-crow-warn",
      ].join(" ")}
    >
      {confirmed && (
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
      {confirmed ? "Confirmed" : "Pending"}
    </span>
  );
}

export function CommissionTable({
  commissions,
  title = "Últimas ventas",
  description,
}: {
  commissions: Commission[];
  title?: string;
  description?: string;
}) {
  const total = commissions.reduce((s, c) => s + c.amountUsdt, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.015] backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/[0.07] px-5 py-5 sm:px-6">
        <div>
          <h2 className="font-sans text-[17px] font-semibold text-crow-text">{title}</h2>
          {description && <p className="mt-0.5 text-[12.5px] text-crow-muted">{description}</p>}
        </div>
        {total > 0 && (
          <span className="text-[17px] font-semibold text-crow-success">
            +{formatUsdt(total)}
          </span>
        )}
      </div>

      {commissions.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.07] text-[11px] uppercase tracking-wider text-crow-muted">
                  <th className="py-3 pl-5 pr-4 font-medium sm:pl-6">Producto</th>
                  <th className="py-3 px-4 font-medium">Fecha</th>
                  <th className="py-3 px-4 font-medium">Tipo</th>
                  <th className="py-3 px-4 font-medium">Precio</th>
                  <th className="py-3 px-4 font-medium">Comisión</th>
                  <th className="py-3 pl-4 pr-5 font-medium sm:pr-6">Estado</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-white/[0.05] last:border-0 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="py-3.5 pl-5 pr-4 sm:pl-6">
                      <Link
                        href={`/marketplace/${c.product.slug}`}
                        className="text-[13px] font-medium text-crow-text transition hover:text-crow-glow"
                      >
                        {c.product.title}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-[13px] text-crow-muted">
                      {formatDateTime(c.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <TypeBadge role={c.role} rate={c.rate} />
                    </td>
                    <td className="py-3.5 px-4 text-[13px] text-crow-text">
                      {formatUsdt(c.amountUsdt / c.rate)}
                    </td>
                    <td className="py-3.5 px-4 text-[13px] font-medium text-crow-success">
                      +{formatUsdt(c.amountUsdt)}
                    </td>
                    <td className="py-3.5 pl-4 pr-5 sm:pr-6">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile feed */}
          <div className="divide-y divide-white/[0.05] sm:hidden">
            {commissions.map((c) => (
              <div key={c.id} className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/marketplace/${c.product.slug}`}
                    className="text-[13.5px] font-medium text-crow-text transition hover:text-crow-glow"
                  >
                    {c.product.title}
                  </Link>
                  <span className="text-[13px] font-semibold text-crow-success">
                    +{formatUsdt(c.amountUsdt)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px] text-crow-muted">
                  <span>{formatDateTime(c.createdAt)}</span>
                  <StatusBadge status={c.status} />
                </div>
                <TypeBadge role={c.role} rate={c.rate} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-crow-glow">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2.6 6.9L22 10l-5.5 4.8L18 22l-6-3.6L6 22l1.5-7.2L2 10l7.4-1.1z" />
            </svg>
          </span>
          <p className="text-[13px] font-medium text-crow-text">Tu primera venta está más cerca de lo que pensás</p>
          <p className="mt-1.5 max-w-xs text-[12px] text-crow-muted">
            Compartí tu enlace de referido para generar tus primeras comisiones.
          </p>
        </div>
      )}
    </div>
  );
}
