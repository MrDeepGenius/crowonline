import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { PaymentSummary } from "@/components/checkout/payment-summary";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { cancelOrderAction, confirmPaymentDemoAction } from "@/server/actions/payments";
import prisma from "@/lib/db";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/domain";
import { formatDateTime, formatUsdt } from "@/lib/utils";

type Params = Promise<{ reference: string }>;

export const metadata = { title: "Pago USDT" };

export default async function CheckoutPage({ params }: { params: Params }) {
  const { reference } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const order = await prisma.order.findFirst({
    where: { reference, buyerId: user.id },
    include: {
      items: { include: { product: { select: { title: true, slug: true } } } },
      payment: true,
    },
  });
  if (!order) notFound();

  const payment = order.payment;
  const isPending = order.status === "PENDING";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="crow-container max-w-4xl py-14">
          <Badge tone={isPending ? "warn" : "success"} dot>
            {ORDER_STATUS_LABEL[order.status as OrderStatus] ?? order.status}
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Completa tu pago en USDT
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-crow-muted">
            Envía exactamente el monto indicado a la dirección BEP-20. La orden se
            confirma al detectar la transacción con las confirmaciones requeridas.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-crow-muted">
                  Monto exacto
                </p>
                <p className="mt-1 text-3xl font-semibold text-crow-glow">
                  {formatUsdt(order.totalUsdt)}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4">
                <p className="text-[11px] uppercase tracking-wider text-crow-muted">
                  Dirección {payment?.network ?? "BEP20"}
                </p>
                <p className="mt-2 break-all font-mono text-[13px] text-crow-text">
                  {payment?.address ?? "No configurada en ENV"}
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-4 text-[12.5px]">
                <div>
                  <dt className="text-crow-muted">Referencia</dt>
                  <dd className="mt-0.5 font-medium text-crow-text">
                    {order.reference}
                  </dd>
                </div>
                <div>
                  <dt className="text-crow-muted">Red</dt>
                  <dd className="mt-0.5 font-medium text-crow-text">
                    {payment?.network ?? "BEP20"}
                  </dd>
                </div>
                <div>
                  <dt className="text-crow-muted">Confirmaciones</dt>
                  <dd className="mt-0.5 font-medium text-crow-text">
                    {payment?.confirmations ?? 0} /{" "}
                    {payment?.requiredConfirmations ?? 12}
                  </dd>
                </div>
                <div>
                  <dt className="text-crow-muted">Expira</dt>
                  <dd className="mt-0.5 font-medium text-crow-text">
                    {formatDateTime(order.expiresAt)}
                  </dd>
                </div>
              </dl>

              {isPending ? (
                <div className="space-y-3 border-t border-white/[0.06] pt-5">
                  <form action={confirmPaymentDemoAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <Button type="submit" className="w-full">
                      Simular confirmación de pago (modo dev)
                    </Button>
                  </form>
                  <form action={cancelOrderAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <Button type="submit" variant="ghost" className="w-full">
                      Cancelar orden
                    </Button>
                  </form>
                  <p className="text-[11.5px] leading-relaxed text-crow-muted">
                    En producción la confirmación llega desde el watcher de blockchain
                    o el webhook{" "}
                    <code className="text-crow-glow">/api/webhooks/payments</code>.
                  </p>
                </div>
              ) : (
                <Link href="/library" className={buttonClass("primary", "md", "w-full")}>
                  Ir a mi biblioteca
                </Link>
              )}
            </Card>

            <PaymentSummary
              total={order.totalUsdt}
              referralCode={order.referralCode}
              items={order.items.map((item) => ({
                id: item.id,
                title: item.title,
                priceUsdt: item.priceUsdt,
                slug: item.product.slug,
              }))}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}