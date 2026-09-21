import { TEST_PAYMENT_PROVIDER } from "@/server/payments/test-mode";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { formatDateTime, formatUsdt } from "@/lib/utils";

type AdminPayment = {
  id: string;
  provider: string;
  network: string;
  address: string;
  amountUsdt: number;
  status: string;
  confirmations: number;
  requiredConfirmations: number;
  senderAddress: string | null;
  tokenAddress: string | null;
  blockNumber: number | null;
  blockTime: Date | null;
  verificationError: string | null;
  txHash: string | null;
  createdAt: Date;
  user: { name: string; email: string };
  order: { reference: string; totalUsdt: number };
};

export function AdminPaymentTable({ payments }: { payments: AdminPayment[] }) {
  return (
    <Card>
      <CardHeader
        title="Pagos"
        description="Payment intents USDT BEP-20 y confirmaciones on-chain"
        action={<Badge tone="default">{payments.length} pagos</Badge>}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[12.5px]">
          <thead className="text-[11px] uppercase tracking-wider text-crow-muted">
            <tr>
              <th className="py-2">Orden</th>
              <th className="py-2 hidden sm:table-cell">Usuario</th>
              <th className="py-2 hidden lg:table-cell">Wallet</th>
              <th className="py-2 hidden md:table-cell">Confirmaciones</th>
              <th className="py-2 hidden md:table-cell">Fecha</th>
              <th className="py-2">Estado</th>
              <th className="py-2 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="py-2.5 font-mono text-[11px] text-crow-text">
                  {payment.order.reference}
                  {payment.provider === TEST_PAYMENT_PROVIDER ? <div className="mt-0.5"><Badge tone="warn">TEST</Badge></div> : null}
                  {/* User inline on xs */}
                  <div className="mt-1 sm:hidden">
                    <p className="text-[12px] font-sans font-normal text-crow-text">{payment.user.name}</p>
                    <p className="text-[10.5px] font-sans text-crow-muted">{payment.user.email}</p>
                  </div>
                </td>
                <td className="py-2.5 hidden sm:table-cell">
                  <p className="text-crow-text">{payment.user.name}</p>
                  <p className="text-[11px] text-crow-muted">{payment.user.email}</p>
                </td>
                <td className="py-2.5 hidden lg:table-cell">
                  <p className="text-crow-muted">{payment.provider} · {payment.network}</p>
                  <p className="max-w-[240px] break-all font-mono text-[10.5px] text-crow-glow">
                    {payment.address}
                  </p>
                </td>
                <td className="py-2.5 text-crow-muted hidden md:table-cell">
                  {payment.confirmations}/{payment.requiredConfirmations}
                  {payment.txHash ? (
                    <p className="max-w-[200px] break-all font-mono text-[10.5px]">{payment.txHash}</p>
                  ) : null}
                </td>
                <td className="py-2.5 text-crow-muted hidden md:table-cell">
                  {formatDateTime(payment.blockTime ?? payment.createdAt)}
                </td>
                <td className="py-2.5">
                  <StatusBadge status={payment.status} />
                  {payment.verificationError ? <p className="max-w-[140px] text-[10.5px] text-crow-warn">{payment.verificationError}</p> : null}
                </td>
                <td className="py-2.5 text-right font-medium text-crow-text">{formatUsdt(payment.amountUsdt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!payments.length ? (
        <p className="py-6 text-center text-[12.5px] text-crow-muted">
          Sin pagos con este filtro.
        </p>
      ) : null}
    </Card>
  );
}