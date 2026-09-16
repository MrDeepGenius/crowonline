import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ReferralLinkCard } from "@/components/affiliate/affiliate-stats";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { getAffiliateOverview } from "@/server/services/affiliate";
import { listMarketplaceProducts } from "@/server/services/catalog";
import { PRODUCT_TYPE_LABEL } from "@/lib/plans";
import { formatUsdt } from "@/lib/utils";
import type { ProductType } from "@/lib/domain";

export const metadata = { title: "Mis enlaces" };

export default async function AffiliateLinksPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [overview, products] = await Promise.all([
    getAffiliateOverview(user.id),
    listMarketplaceProducts({ limit: 60 }),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const code = overview.affiliate.referralCode;

  return (
    <DashboardShell
      title="Mis enlaces"
      description="Tu enlace principal y enlaces directos a cada producto del marketplace."
      activePath="/affiliate/links"
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <ReferralLinkCard code={code} baseUrl={baseUrl} />

          <Card>
            <CardHeader
              title="Enlaces por producto"
              description="Envía tráfico directo a la ficha del producto"
              action={<Badge tone="default">{products.length} productos</Badge>}
            />
            <ul className="divide-y divide-white/[0.05]">
              {products.map((product) => (
                <li key={product.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-crow-text">
                        {product.coverEmoji} {product.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-crow-muted">
                        {PRODUCT_TYPE_LABEL[product.type as ProductType] ?? product.type} ·{" "}
                        {formatUsdt(product.priceUsdt)} · comisión directa{" "}
                        {(product.priceUsdt * 0.3).toFixed(2)} USDT
                      </p>
                    </div>
                    <code className="w-full shrink-0 break-all rounded-lg border border-white/[0.08] bg-black/40 px-2.5 py-1.5 font-mono text-[11px] text-crow-glow sm:w-auto">
                      {baseUrl}/marketplace/{product.slug}?ref={code}
                    </code>
                  </div>
                </li>
              ))}
              {!products.length ? (
                <li className="py-5 text-center text-[12.5px] text-crow-muted">
                  Todavía no hay productos publicados en el marketplace.
                </li>
              ) : null}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Kit de promoción"
              description="Material recomendado para vender sin inventar"
            />
            <ul className="space-y-3 text-[12.5px] text-crow-muted">
              <li className="rounded-xl border border-white/[0.06] p-3.5">
                <span className="text-crow-text">Mensaje corto:</span> “Acabo de
                encontrar {products[0]?.title ?? "un curso en CROW"} — módulos
                prácticos, ejercicios y certificado. Te dejo mi enlace con acceso
                directo.”
              </li>
              <li className="rounded-xl border border-white/[0.06] p-3.5">
                <span className="text-crow-text">Historia/Reel:</span> muestra el
                resultado final del producto (plantilla, certificado o lección) antes
                de poner el enlace.
              </li>
              <li className="rounded-xl border border-white/[0.06] p-3.5">
                <span className="text-crow-text">Email:</span> 3 párrafos — problema,
                mecanismo del producto, enlace con escasez real (cupón 7 días).
              </li>
            </ul>
          </Card>

          <Card>
            <CardHeader title="Reglas de atribución" description="Cómo se cuenta tu venta" />
            <ul className="space-y-2.5 text-[12.5px] text-crow-muted">
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-crow-violet" />
                La cookie de referido dura 30 días desde el primer clic.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-crow-violet" />
                La comisión se acredita cuando el pago se confirma en BEP-20.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-crow-violet" />
                Un creator no puede generar comisiones de afiliado por sus propios
                productos.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-crow-violet" />
                1 Crow Point = 1 punto de volumen de venta (no es dinero).
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}