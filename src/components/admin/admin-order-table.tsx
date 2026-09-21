import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/domain";
import { confirmPaymentAdminAction } from "@/server/actions/payments";
import { formatDateTime, formatUsdt } from "@/lib/utils";

type AdminOrder = {
  id: string;
  reference: string;
  status: string;
  totalUsdt: number;
  createdAt: Date;
  referralCode: string | null;
  buyer: { name: string; email: string };
  items: { id: string; title: string; priceUsdt: number }[];
  payment: { txHash: string | null; confirmations: number } | null;
};

export function AdminOrderTable({ orders }: { orders: AdminOrder[] }) {
  return (
    <Card>
      <CardHeader
        title="Órdenes"
        description="Estados PENDING → PAID → EXPIRED / FAILED"
        action={<Badge tone="default">{orders.length} órdenes</Badge>}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12.5px]">
          <thead className="text-[11px] uppercase tracking-wider text-crow-muted">
            <tr>
              <th className="py-2">Referencia</th>
              <th className="py-2">Comprador</th>
              <th className="py-2">Items</th>
              <th className="py-2">Fecha</th>
              <th className="py-2">Estado</th>
              <th className="py-2 text-right">Total</th>
              <th className="py-2 text-right">Confirmación blockchain</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="py-2.5">
                  <p className="font-mono text-[11px] text-crow-text">{order.reference}</p>
                  {order.referralCode ? (
                    <p className="text-[10.5px] text-crow-glow">ref {order.referralCode}</p>
                  ) : null}
                  {order.payment?.txHash ? (
                    <p className="max-w-[180px] truncate text-[10.5px] text-crow-muted">
                      {order.payment.txHash}
                    </p>
                  ) : null}
                </td>
                <td className="py-2.5">
                  <p className="text-crow-text">{order.buyer.name}</p>
                  <p className="text-[11px] text-crow-muted">{order.buyer.email}</p>
                </td>
                <td className="max-w-[260px] py-2.5 text-crow-muted">
                  {order.items.map((item) => item.title).join(", ")}
                </td>
                <td className="py-2.5 text-crow-muted">{formatDateTime(order.createdAt)}</td>
                <td className="py-2.5">
                  <StatusBadge
                    status={order.status}
                    label={ORDER_STATUS_LABEL[order.status as OrderStatus] ?? order.status}
                  />
                </td>
                <td className="py-2.5 text-right font-medium text-crow-text">
                  {formatUsdt(order.totalUsdt)}
                </td>
                <td className="py-2.5 text-right">
                  {order.status === "PENDING" ? (
                    <form action={confirmPaymentAdminAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input name="txHash" placeholder="TX hash (0x…)" className="bg-black/30 p-2" />
                      <Button type="submit" size="sm" variant="secondary">
                        Verificar por RPC
                      </Button>
                    </form>
                  ) : (
                    <span className="text-[11px] text-crow-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!orders.length ? (
        <p className="py-6 text-center text-[12.5px] text-crow-muted">
          Sin órdenes con este filtro.
        </p>
      ) : null}
    </Card>
  );
}