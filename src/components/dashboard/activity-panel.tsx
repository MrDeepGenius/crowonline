import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, EmptyState } from "@/components/ui/card";
import { formatDateTime, formatUsdt } from "@/lib/utils";

type Transaction = {
  id: string;
  description: string;
  typeLabel: string;
  reference: string;
  direction: string;
  amountUsdt: number;
  createdAt: Date;
};

export function ActivityPanel({
  transactions,
  limit = 6,
}: {
  transactions: Transaction[];
  limit?: number;
}) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader
        title="Actividad reciente"
        description="Últimos movimientos de tu wallet"
        action={
          <Link href="/wallet" className="text-[12px] text-crow-glow hover:text-crow-text">
            Ver historial →
          </Link>
        }
      />

      {transactions.length ? (
        <ul className="divide-y divide-white/[0.05]">
          {transactions.slice(0, limit).map((transaction) => (
            <li key={transaction.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] text-crow-text">
                  {transaction.description}
                </p>
                <p className="mt-0.5 text-[11px] text-crow-muted">
                  {transaction.typeLabel} · {formatDateTime(transaction.createdAt)}
                </p>
              </div>
              <span
                className={
                  transaction.direction === "CREDIT"
                    ? "shrink-0 text-[13px] font-medium text-crow-success"
                    : "shrink-0 text-[13px] font-medium text-crow-danger"
                }
              >
                {transaction.direction === "CREDIT" ? "+" : "−"}
                {formatUsdt(transaction.amountUsdt)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Sin movimientos todavía"
          description="Cuando vendas un producto o generes una comisión, aparecerá aquí."
          action={<ButtonLink href="/marketplace">Explorar marketplace</ButtonLink>}
        />
      )}
    </Card>
  );
}