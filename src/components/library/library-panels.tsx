import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/domain";
import { formatDate, formatUsdt } from "@/lib/utils";

export function PendingOrdersCard({
  orders,
}: {
  orders: { id: string; reference: string; totalUsdt: number; status: string; items: { title: string }[] }[];
}) {
  if (!orders.length) return null;

  return (
    <Card className="mb-6 border-crow-warn/30 bg-crow-warn/[0.06]">
      <CardHeader
        title="Tienes pagos pendientes"
        description="Completa el pago en USDT para desbloquear el contenido."
      />
      <ul className="space-y-2.5">
        {orders.map((order) => (
          <li
            key={order.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-black/25 px-3.5 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-[13px] text-crow-text">
                {order.items.map((item) => item.title).join(", ")}
              </p>
              <p className="mt-0.5 text-[11px] text-crow-muted">
                Ref {order.reference} · {formatUsdt(order.totalUsdt)} ·{" "}
                {ORDER_STATUS_LABEL[order.status as OrderStatus] ?? order.status}
              </p>
            </div>
            <Link
              href={`/checkout/${order.reference}`}
              className="shrink-0 rounded-lg border border-crow-violet/40 px-3 py-2 text-[12px] text-crow-glow transition hover:bg-crow-violet/10"
            >
              Completar pago
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function CertificatesCard({
  certificates,
}: {
  certificates: { id: string; serial: string; courseTitle: string; issuedAt: Date }[];
}) {
  return (
    <Card>
      <CardHeader title="Certificados" description="Cursos completados al 100%" />
      <ul className="space-y-3">
        {certificates.map((certificate) => (
          <li
            key={certificate.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] px-3.5 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-[12.5px] text-crow-text">
                {certificate.courseTitle}
              </p>
              <p className="mt-0.5 text-[11px] text-crow-muted">
                {certificate.serial} · {formatDate(certificate.issuedAt)}
              </p>
            </div>
            <Link
              href={`/certificates/${certificate.serial}`}
              className="shrink-0 text-[12px] text-crow-glow hover:text-crow-text"
            >
              Ver certificado →
            </Link>
          </li>
        ))}
        {!certificates.length ? (
          <li className="text-[12.5px] text-crow-muted">
            Aún no tienes certificados. Completa un curso al 100% para emitir el primero.
          </li>
        ) : null}
      </ul>
    </Card>
  );
}

export function PurchaseHistoryCard({
  orders,
}: {
  orders: {
    id: string;
    reference: string;
    totalUsdt: number;
    status: string;
    createdAt: Date;
    items: { title: string }[];
  }[];
}) {
  return (
    <Card>
      <CardHeader title="Historial de compras" description="Órdenes y su estado" />
      <ul className="divide-y divide-white/[0.05]">
        {orders.slice(0, 8).map((order) => (
          <li key={order.id} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[12.5px] text-crow-text">
                {order.items.map((item) => item.title).join(", ")}
              </p>
              <p className="mt-0.5 text-[11px] text-crow-muted">
                {order.reference} · {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[12.5px] text-crow-text">{formatUsdt(order.totalUsdt)}</p>
              <Badge tone={order.status === "PAID" ? "success" : "warn"}>
                {ORDER_STATUS_LABEL[order.status as OrderStatus] ?? order.status}
              </Badge>
            </div>
          </li>
        ))}
        {!orders.length ? (
          <li className="py-4 text-[12.5px] text-crow-muted">Sin compras todavía.</li>
        ) : null}
      </ul>
    </Card>
  );
}