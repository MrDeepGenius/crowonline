import { StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { WITHDRAWAL_STATUS_LABEL, type WithdrawalStatus } from "@/lib/domain";
import { formatDateTime, formatUsdt } from "@/lib/utils";

type Transaction = {
  id: string;
  typeLabel: string;
  direction: string;
  amountUsdt: number;
  status: string;
  reference: string;
  description: string;
  createdAt: Date;
};

export function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card>
      <CardHeader
        title="Historial de movimientos"
        description="Tipo, monto, fecha, estado y referencia"
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-[12.5px]">
          <thead className="text-[11px] uppercase tracking-wider text-crow-muted">
            <tr>
              <th className="py-2">Tipo</th>
              <th className="py-2 hidden sm:table-cell">Detalle</th>
              <th className="py-2 hidden md:table-cell">Fecha</th>
              <th className="py-2 hidden sm:table-cell">Estado</th>
              <th className="py-2 hidden lg:table-cell">Referencia</th>
              <th className="py-2 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="py-2.5 text-crow-text">
                  {transaction.typeLabel}
                  {/* Detail + date inline on xs */}
                  <p className="mt-0.5 text-[11px] text-crow-muted sm:hidden line-clamp-1">{transaction.description}</p>
                </td>
                <td className="max-w-[200px] truncate py-2.5 text-crow-muted hidden sm:table-cell">{transaction.description}</td>
                <td className="py-2.5 text-crow-muted hidden md:table-cell">{formatDateTime(transaction.createdAt)}</td>
                <td className="py-2.5 hidden sm:table-cell"><StatusBadge status={transaction.status} /></td>
                <td className="py-2.5 font-mono text-[11px] text-crow-muted hidden lg:table-cell">{transaction.reference}</td>
                <td className={transaction.direction === "CREDIT" ? "py-2.5 text-right font-medium text-crow-success" : "py-2.5 text-right font-medium text-crow-danger"}>
                  {transaction.direction === "CREDIT" ? "+" : "−"}{formatUsdt(transaction.amountUsdt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!transactions.length ? (
        <p className="py-6 text-center text-[12.5px] text-crow-muted">
          Sin movimientos todavía.
        </p>
      ) : null}
    </Card>
  );
}

export function WithdrawalHistory({
  withdrawals,
  showAdminNote = true,
}: {
  withdrawals: {
    id: string;
    reference: string;
    amountUsdt: number;
    feeUsdt: number;
    netUsdt: number;
    feeRate: number;
    address: string;
    status: string;
    requestedAt: Date;
    adminNote: string | null;
    txHash?: string | null;
  }[];
  showAdminNote?: boolean;
}) {
  return (
    <Card>
      <CardHeader title="Mis retiros" description="Solicitudes y su estado" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px] text-left text-[12.5px]">
          <thead className="text-[11px] uppercase tracking-wider text-crow-muted">
            <tr>
              <th className="py-2">Referencia</th>
              <th className="py-2 hidden sm:table-cell">Fecha</th>
              <th className="py-2 hidden md:table-cell">Fee</th>
              <th className="py-2 hidden sm:table-cell">Neto</th>
              <th className="py-2">Estado</th>
              <th className="py-2 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {withdrawals.map((withdrawal) => (
              <tr key={withdrawal.id}>
                <td className="py-2.5 font-mono text-[11px] text-crow-text">
                  {withdrawal.reference}
                  <p className="mt-0.5 text-[10.5px] font-sans text-crow-muted sm:hidden">{formatDateTime(withdrawal.requestedAt)}</p>
                </td>
                <td className="py-2.5 text-crow-muted hidden sm:table-cell">{formatDateTime(withdrawal.requestedAt)}</td>
                <td className="py-2.5 text-crow-muted hidden md:table-cell">{(withdrawal.feeRate * 100).toFixed(0)}% ({formatUsdt(withdrawal.feeUsdt)})</td>
                <td className="py-2.5 text-crow-success hidden sm:table-cell">{formatUsdt(withdrawal.netUsdt)}</td>
                <td className="py-2.5">
                  <StatusBadge status={withdrawal.status} label={WITHDRAWAL_STATUS_LABEL[withdrawal.status as WithdrawalStatus] ?? withdrawal.status} />
                  {showAdminNote && withdrawal.adminNote ? (
                    <span className="ml-2 text-[10.5px] text-crow-muted">{withdrawal.adminNote}</span>
                  ) : null}
                </td>
                <td className="py-2.5 text-right font-medium text-crow-text">{formatUsdt(withdrawal.amountUsdt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!withdrawals.length ? (
        <p className="py-6 text-center text-[12.5px] text-crow-muted">
          Todavía no has solicitado retiros.
        </p>
      ) : null}
    </Card>
  );
}