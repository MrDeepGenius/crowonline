import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { PaymentSummary } from "@/components/checkout/payment-summary";
import { CheckoutPoller } from "@/components/checkout/checkout-poller";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRODUCT_TYPE_LABEL } from "@/lib/plans";
import { getCurrentUser } from "@/lib/auth/session";
import { cancelOrderAction } from "@/server/actions/payments";
import { confirmLocalTestPaymentAction } from "@/server/actions/test-payments";
import { paymentsTestModeEnabled, TEST_PAYMENT_PROVIDER } from "@/server/payments/test-mode";
import { TestnetPayment } from "@/components/checkout/testnet-payment";
import prisma from "@/lib/db";
import { ORDER_STATUS_LABEL, type OrderStatus, type ProductType } from "@/lib/domain";
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
      boost: { include: { product: true } },
      buyer: { select: { name: true, email: true } },
      items: {
        include: {
          product: { select: { title: true, slug: true, type: true, coverEmoji: true } },
        },
      },
      payment: true,
    },
  });
  if (!order) notFound();

  const payment = order.payment;
  const isTest = payment?.provider === TEST_PAYMENT_PROVIDER;
  const isPending = order.status === "PENDING";
  const isPaid = order.status === "PAID";
  const item = order.items[0];

  // For poller: slug + type of first product item (not boost)
  const productSlug = item?.product.slug ?? null;
  const productType = item?.product.type ?? null;

  // Access path after purchase
  const accessPath =
    productSlug
      ? productType === "COURSE"
        ? `/learn/${productSlug}`
        : `/access/${productSlug}`
      : "/library";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="crow-container max-w-4xl py-14">

          {/* Status badge */}
          <Badge tone={isPending ? "warn" : isPaid ? "success" : "default"} dot>
            {ORDER_STATUS_LABEL[order.status as OrderStatus] ?? order.status}
          </Badge>

          {/* TEST MODE banner */}
          {isTest && (
            <p
              className="my-4 rounded-xl border border-crow-warn/40 bg-crow-warn/10 px-4 py-3 text-[12.5px] text-crow-warn"
              role="status"
            >
              <strong>TEST MODE</strong> · Simulación local sin USDT real, sin RPC ni wallets externas.
              Las comisiones se calculan con el motor real pero quedan marcadas como NO RETIRABLES.
            </p>
          )}

          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Checkout ·{" "}
            {order.boost
              ? `CROW BOOST · ${order.boost.product.title}`
              : item?.title ?? "Orden CROW"}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-crow-muted">
            {isTest
              ? "Confirma esta compra de prueba para verificar el acceso, las comisiones y el ledger TEST. No envíes fondos reales."
              : order.boost
                ? "CROW BOOST: 3 USDT por producto / 30 días desde la confirmación del pago. Mayor exposición en Destacados."
                : "Revisa tu compra y envía exactamente el monto indicado a la dirección BEP-20. Al confirmarse el pago se desbloquea en tu biblioteca."}
          </p>

          {/* Product card */}
          {item && (
            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-crow-violet/30 to-transparent text-2xl">
                {item.product.coverEmoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{item.title}</p>
                <p className="mt-0.5 text-[12px] text-crow-muted">
                  {PRODUCT_TYPE_LABEL[item.product.type as ProductType] ?? item.product.type} ·{" "}
                  {formatUsdt(item.priceUsdt)}
                </p>
              </div>
              <span className="shrink-0 rounded-xl bg-crow-violet/12 px-3 py-1.5 text-[13px] font-semibold text-crow-glow">
                Total {formatUsdt(order.totalUsdt)}
              </span>
            </div>
          )}

          {/* Meta chips */}
          <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-crow-muted">
            <span className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-1.5">
              Comprador: {order.buyer.name} · {order.buyer.email}
            </span>
            <span className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-1.5">
              Método: {isTest ? "TEST MODE · LOCAL" : "USDT BEP-20"}
            </span>
            <span className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-1.5">
              Referencia {order.reference}
            </span>
          </div>

          {/* Live status poller — only for pending product orders (not boost) */}
          {!order.boost && (
            <div className="mt-6">
              <CheckoutPoller
                reference={reference}
                initialStatus={order.status as OrderStatus}
                productSlug={productSlug}
                productType={productType}
              />
            </div>
          )}

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
                  <dd className="mt-0.5 font-medium text-crow-text">{order.reference}</dd>
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
                    {payment?.confirmations ?? 0} / {payment?.requiredConfirmations ?? 12}
                  </dd>
                </div>
                <div>
                  <dt className="text-crow-muted">Expira</dt>
                  <dd className="mt-0.5 font-medium text-crow-text">
                    {formatDateTime(order.expiresAt)}
                  </dd>
                </div>
              </dl>

              <p className="break-all text-xs text-crow-muted">
                Order ID: {order.id} · Moneda: {order.currency}
                <br />
                Token: {payment?.tokenAddress ?? "—"}
                <br />
                TX: {payment?.txHash ?? "Pendiente de detección"}
              </p>

              {payment?.verificationError && (
                <p className="text-crow-warn text-[12.5px]">{payment.verificationError}</p>
              )}

              {/* ── PENDING: show confirm button ── */}
              {isPending && (
                <div className="space-y-3 border-t border-white/[0.06] pt-5">
                  {isTest ? (
                    paymentsTestModeEnabled() ? (
                      <form action={confirmLocalTestPaymentAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <Button type="submit" className="w-full">
                          TEST MODE · Confirmar pago simulado
                        </Button>
                      </form>
                    ) : (
                      <p className="text-[12.5px] text-crow-warn">
                        Simulación deshabilitada. Solo disponible en development con
                        PAYMENTS_TEST_MODE=true.
                      </p>
                    )
                  ) : payment?.chainId === 97 &&
                    payment.tokenAddress &&
                    payment.transferData &&
                    order.expiresAt ? (
                    <>
                      {payment.txHash && (
                        <p className="text-[12.5px] text-crow-warn">
                          TX detectada. Esperando confirmaciones; no vuelvas a pagar.
                        </p>
                      )}
                      <TestnetPayment
                        token={payment.tokenAddress}
                        data={payment.transferData}
                        expiresAt={order.expiresAt.toISOString()}
                        detected={Boolean(payment.txHash)}
                      />
                    </>
                  ) : (
                    <p className="text-[12.5px] text-crow-warn">
                      Esta orden no está habilitada para el piloto testnet de productos.
                    </p>
                  )}

                  <form action={cancelOrderAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <Button type="submit" variant="ghost" className="w-full">
                      Cancelar orden
                    </Button>
                  </form>

                  <p className="text-[11.5px] leading-relaxed text-crow-muted">
                    {isTest ? (
                      "TEST MODE · Confirmación interna; sin blockchain ni USDT real."
                    ) : (
                      <>
                        En producción la confirmación llega desde el watcher de blockchain o el
                        webhook{" "}
                        <code className="text-crow-glow">/api/webhooks/payments</code>.
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* ── PAID: direct access link ── */}
              {isPaid && (
                <div className="space-y-3 border-t border-white/[0.06] pt-5">
                  <p className="text-[13px] font-medium text-crow-success">
                    ✓ Pago confirmado · Acceso desbloqueado
                  </p>
                  <Link
                    href={accessPath}
                    className={buttonClass("primary", "md", "w-full")}
                  >
                    {productType === "COURSE" ? "Ir al aula →" : "Acceder al producto →"}
                  </Link>
                  <Link
                    href="/library"
                    className={buttonClass("secondary", "md", "w-full")}
                  >
                    Mi biblioteca
                  </Link>
                </div>
              )}

              {/* ── BOOST PAID ── */}
              {isPaid && order.boost && (
                <Link
                  href="/creator/products"
                  className={buttonClass("primary", "md", "w-full")}
                >
                  Ver estado de CROW BOOST
                </Link>
              )}

              {/* ── TERMINAL (not paid) ── */}
              {!isPending && !isPaid && (
                <p className="text-[12.5px] text-crow-muted">
                  Esta orden no está activa. Crea un nuevo checkout para comprar.
                </p>
              )}
            </Card>

            <PaymentSummary
              total={order.totalUsdt}
              referralCode={order.referralCode}
              items={
                order.boost
                  ? [
                      {
                        id: order.boost.id,
                        title: `CROW BOOST · ${order.boost.product.title}`,
                        priceUsdt: order.boost.priceUsdt,
                        slug: order.boost.product.slug,
                      },
                    ]
                  : order.items.map((i) => ({
                      id: i.id,
                      title: i.title,
                      priceUsdt: i.priceUsdt,
                      slug: i.product.slug,
                    }))
              }
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
