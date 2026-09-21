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
        <table className="w-full min-w-[600px] text-left text-[12.5px]">
          <thead className="text-[11px] uppercase tracking-wider text-crow-muted">
            <tr>
              <th className="py-2">Referencia</th>
              <th className="py-2 hidden sm:table-cell">Comprador</th>
              <th className="py-2 hidden lg:table-cell">Items</th>
              <th className="py-2 hidden md:table-cell">Fecha</th>
              <th className="py-2">Estado</th>
              <th className="py-2 text-right">Total</th>
              <th className="py-2 text-right hidden lg:table-cell">Confirmación blockchain</th>
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
                    <p className="max-w-[160px] truncate text-[10.5px] text-crow-muted">{order.payment.txHash}</p>
                  ) : null}
                  {/* Buyer inline on xs */}
                  <div className="mt-1 sm:hidden">
                    <p className="text-[12px] text-crow-text">{order.buyer.name}</p>
                    <p className="text-[10.5px] text-crow-muted">{order.buyer.email}</p>
                  </div>
                </td>
                <td className="py-2.5 hidden sm:table-cell">
                  <p className="text-crow-text">{order.buyer.name}</p>
                  <p className="text-[11px] text-crow-muted">{order.buyer.email}</p>
                </td>
                <td className="max-w-[220px] py-2.5 text-crow-muted hidden lg:table-cell">
                  {order.items.map((item) => item.title).join(", ")}
                </td>
                <td className="py-2.5 text-crow-muted hidden md:table-cell">{formatDateTime(order.createdAt)}</td>
                <td className="py-2.5">
                  <StatusBadge status={order.status} label={ORDER_STATUS_LABEL[order.status as OrderStatus] ?? order.status} />
                </td>
                <td className="py-2.5 text-right font-medium text-crow-text">{formatUsdt(order.totalUsdt)}</td>
                <td className="py-2.5 text-right hidden lg:table-cell">
                  {order.status === "PENDING" ? (
                    <form action={confirmPaymentAdminAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input name="txHash" placeholder="TX hash (0x…)" className="bg-black/30 p-2 text-[12px] w-full max-w-[180px] rounded" />
                      <Button type="submit" size="sm" variant="secondary" className="mt-1">Verificar por RPC</Button>
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