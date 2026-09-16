import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { formatUsdt } from "@/lib/utils";

export function WalletBalanceCards({
  available,
  pending,
  totalEarned,
  totalWithdrawn,
}: {
  available: number;
  pending: number;
  totalEarned: number;
  totalWithdrawn: number;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Available balance"
        value={formatUsdt(available)}
        hint="Listo para retirar"
        tone="violet"
      />
      <StatCard label="Pending" value={formatUsdt(pending)} hint="Retiros en revisión" />
      <StatCard label="Total earned" value={formatUsdt(totalEarned)} hint="Histórico acumulado" />
      <StatCard
        label="Total withdrawals"
        value={formatUsdt(totalWithdrawn)}
        hint="Enviado a tu wallet externa"
      />
    </div>
  );
}

export function WithdrawalRulesCard({ minWithdrawal }: { minWithdrawal: number }) {
  return (
    <Card>
      <CardHeader
        title="Reglas de retiro"
        description="Retiros manuales con aprobación de ADMIN"
        action={<Badge tone="warn">Manual</Badge>}
      />
      <ul className="space-y-3 text-[12.5px] text-crow-muted">
        <li className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-crow-violet" />
          Mínimo de retiro: <span className="text-crow-text">{formatUsdt(minWithdrawal)}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-crow-violet" />
          Retiro diario: fee del 3%, disponible cuando quieras.
        </li>
        <li className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-crow-violet" />
          Retiro mensual: fee del 2%, una vez cada 30 días.
        </li>
        <li className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-crow-violet" />
          Red de pago: USDT BEP-20. Verifica la dirección antes de enviar.
        </li>
        <li className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-crow-violet" />
          CROW nunca solicita claves privadas ni frases semilla.
        </li>
      </ul>
    </Card>
  );
}