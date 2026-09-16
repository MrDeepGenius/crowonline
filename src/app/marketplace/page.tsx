import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { MarketplaceFilters } from "@/components/marketplace/filters";
import { ProductGrid } from "@/components/marketplace/product-grid";
import { Badge } from "@/components/ui/badge";
import { getMarketplaceFacets, listMarketplaceProducts } from "@/server/services/catalog";
import { PRODUCT_TYPES } from "@/lib/domain";

export const metadata = {
  title: "Marketplace",
  description:
    "Explora cursos, ebooks, PDFs, webs interactivas y kits de recursos creados con el Creator Studio de CROW.",
};

type SearchParams = Promise<{
  q?: string;
  category?: string;
  type?: string;
  sort?: string;
  ref?: string;
}>;

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const [products, facets] = await Promise.all([
    listMarketplaceProducts({
      q: params.q,
      category: params.category,
      type: params.type,
      sort: (params.sort as "recent" | "price-asc" | "price-desc" | "rating") ?? "recent",
    }),
    getMarketplaceFacets(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-white/[0.06] py-14">
          <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[800px] -translate-x-1/2 rounded-full bg-crow-violet/15 blur-[120px]" />
          <div className="crow-container relative">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="violet" dot>
                {facets.total} productos publicados
              </Badge>
              <Badge tone="default">{PRODUCT_TYPES.length} formatos disponibles</Badge>
            </div>
            <h1 className="mt-5 text-balance text-[34px] font-semibold leading-tight tracking-tight sm:text-[44px]">
              El marketplace de productos digitales de{" "}
              <span className="crow-glow-text">CROW</span>
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-crow-muted">
              Cada producto se creó con el Creator Studio: estructura real, contenido
              aplicable y certificado al completar.
            </p>
            {params.ref ? (
              <p className="mt-4 text-[12.5px] text-crow-glow">
                Estás navegando con el referido {params.ref.toUpperCase()}.
              </p>
            ) : null}
          </div>
        </section>

        <section className="crow-container py-10">
          <MarketplaceFilters
            categories={facets.categories}
            types={facets.types}
            total={facets.total}
          />

          <div className="mt-8 flex items-center justify-between">
            <p className="text-[12.5px] text-crow-muted">
              {products.length} resultado{products.length === 1 ? "" : "s"}
              {params.q ? ` para “${params.q}”` : ""}
            </p>
            <Link
              href="/register"
              className="text-[12.5px] text-crow-glow transition hover:text-crow-text"
            >
              ¿Eres creator? Publica tu producto →
            </Link>
          </div>

          <div className="mt-6">
            <ProductGrid products={products} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}