import Link from "next/link";

import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
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

export function CommissionTable({
  commissions,
  title = "Comisiones",
  description = "Cada venta con su nivel y porcentaje",
}: {
  commissions: Commission[];
  title?: string;
  description?: string;
}) {
  const total = commissions.reduce((sum, item) => sum + item.amountUsdt, 0);

  return (
    <Card>
      <CardHeader
        title={title}
        description={description}
        action={<Badge tone="success">Total {formatUsdt(total)}</Badge>}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12.5px]">
          <thead className="text-[11px] uppercase tracking-wider text-crow-muted">
            <tr>
              <th className="py-2">Producto</th>
              <th className="py-2">Nivel</th>
              <th className="py-2">Fecha</th>
              <th className="py-2">Estado</th>
              <th className="py-2 text-right">Comisión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {commissions.map((commission) => (
              <tr key={commission.id}>
                <td className="max-w-[260px] truncate py-2.5">
                  <Link
                    href={`/marketplace/${commission.product.slug}`}
                    className="text-crow-text hover:text-crow-glow"
                  >
                    {commission.product.title}
                  </Link>
                </td>
                <td className="py-2.5">
                  <Badge tone="violet">
                    {commission.role} · {(commission.rate * 100).toFixed(1)}%
                  </Badge>
                </td>
                <td className="py-2.5 text-crow-muted">
                  {formatDateTime(commission.createdAt)}
                </td>
                <td className="py-2.5">
                  <StatusBadge status={commission.status} />
                </td>
                <td className="py-2.5 text-right font-medium text-crow-success">
                  +{formatUsdt(commission.amountUsdt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!commissions.length ? (
        <p className="py-6 text-center text-[12.5px] text-crow-muted">
          Sin comisiones todavía. Comparte tu enlace para generar las primeras ventas.
        </p>
      ) : null}
    </Card>
  );
}