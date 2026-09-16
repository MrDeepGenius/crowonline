import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { reviewWithdrawalAction } from "@/server/actions/admin";
import { formatDateTime, formatUsdt } from "@/lib/utils";

type Withdrawal = {
  id: string;
  reference: string;
  amountUsdt: number;
  feeUsdt: number;
  netUsdt: number;
  feeRate: number;
  address: string;
  status: string;
  requestedAt: Date;
  note: string | null;
  adminNote: string | null;
  user: { id: string; name: string; email: string };
};

export function AdminWithdrawalTable({ withdrawals }: { withdrawals: Withdrawal[] }) {
  return (
    <Card>
      <CardHeader
        title="Solicitudes de retiro"
        description="Aprobación manual: APPROVE → PAID cuando se envía el USDT."
        action={<Badge tone="warn">{withdrawals.length} solicitudes</Badge>}
      />
      <div className="space-y-3">
        {withdrawals.map((withdrawal) => (
          <div
            key={withdrawal.id}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-[13px] font-medium text-crow-text">
                    {withdrawal.user.name}
                  </p>
                  <StatusBadge status={withdrawal.status} />
                  <Badge tone="default">{(withdrawal.feeRate * 100).toFixed(0)}% fee</Badge>
                </div>
                <p className="mt-1 text-[11.5px] text-crow-muted">
                  {withdrawal.user.email} · {withdrawal.reference} ·{" "}
                  {formatDateTime(withdrawal.requestedAt)}
                </p>
                <p className="mt-1.5 break-all font-mono text-[11px] text-crow-glow">
                  {withdrawal.address}
                </p>
                {withdrawal.note ? (
                  <p className="mt-1.5 text-[11.5px] text-crow-muted">
                    Nota del usuario: {withdrawal.note}
                  </p>
                ) : null}
                {withdrawal.adminNote ? (
                  <p className="mt-1 text-[11.5px] text-crow-muted">
                    Nota admin: {withdrawal.adminNote}
                  </p>
                ) : null}
              </div>

              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-crow-muted">
                  Monto
                </p>
                <p className="mt-0.5 text-[16px] font-semibold text-crow-text">
                  {formatUsdt(withdrawal.amountUsdt)}
                </p>
                <p className="mt-0.5 text-[11.5px] text-crow-success">
                  Neto {formatUsdt(withdrawal.netUsdt)}
                </p>
              </div>
            </div>

            {withdrawal.status !== "PAID" ? (
              <div className="mt-4 grid gap-3 border-t border-white/[0.06] pt-4 lg:grid-cols-2">
                <form action={reviewWithdrawalAction} className="space-y-2.5">
                  <input type="hidden" name="withdrawalId" value={withdrawal.id} />
                  <input type="hidden" name="action" value="APPROVE" />
                  <Input name="adminNote" placeholder="Nota interna (opcional)" />
                  <Button type="submit" size="sm" variant="secondary" className="w-full">
                    Aprobar solicitud
                  </Button>
                </form>

                <div className="space-y-2.5">
                  <form action={reviewWithdrawalAction} className="space-y-2.5">
                    <input type="hidden" name="withdrawalId" value={withdrawal.id} />
                    <input type="hidden" name="action" value="PAID" />
                    <Input name="txHash" placeholder="Tx hash del envío BEP-20" />
                    <Button type="submit" size="sm" className="w-full">
                      Marcar como pagado
                    </Button>
                  </form>

                  <form action={reviewWithdrawalAction}>
                    <input type="hidden" name="withdrawalId" value={withdrawal.id} />
                    <input type="hidden" name="action" value="REJECT" />
                    <input
                      type="hidden"
                      name="adminNote"
                      value="Solicitud rechazada — revisa tu dirección BEP-20"
                    />
                    <Button type="submit" size="sm" variant="danger" className="w-full">
                      Rechazar y devolver saldo
                    </Button>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {!withdrawals.length ? (
          <p className="py-6 text-center text-[12.5px] text-crow-muted">
            No hay solicitudes de retiro con este filtro.
          </p>
        ) : null}
      </div>
    </Card>
  );
}