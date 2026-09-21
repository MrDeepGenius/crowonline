import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { SectionTitle } from "@/components/ui/card";
import { MarketplaceFilters } from "@/components/marketplace/filters";
import {
  ProductCard,
  toCardData,
} from "@/components/marketplace/product-card";
import { ProductGrid } from "@/components/marketplace/product-grid";
import { Badge } from "@/components/ui/badge";
import {
  getMarketplaceFacets,
  listFeaturedProducts,
  listMarketplaceProducts,
  type MarketplaceSort,
} from "@/server/services/catalog";
import { PRODUCT_CATEGORIES, PRODUCT_TYPES } from "@/lib/domain";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Marketplace",
  description:
    "Descubrí productos digitales premium creados por creadores de CROW: cursos, ebooks, PDFs, webs interactivas y kits de recursos.",
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
  const sort = (params.sort as MarketplaceSort) ?? "recent";

  const [products, featured, facets] = await Promise.all([
    listMarketplaceProducts({
      q: params.q,
      category: params.category,
      type: params.type,
      sort,
    }),
    listFeaturedProducts(4),
    getMarketplaceFacets(),
  ]);

  const cards = products.map(toCardData);
  const featuredCards = featured.map(toCardData);

  return (
    <div className="mp-page flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-crow-black via-[#0A0A0F] to-crow-black py-20 sm:py-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 w-[900px] -translate-y-1/2 rounded-full bg-crow-violet/20 blur-[140px] shadow-glow" />
          <div className="pointer-events-none absolute -right-32 top-20 h-64 w-64 rounded-full bg-crow-violetDeep/30 blur-[120px]" />

          <div className="crow-container relative">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="violet" dot>
                  {facets.total} producto{facets.total === 1 ? "" : "s"} publicados
                </Badge>
                <Badge tone="default">
                  {PRODUCT_TYPES.length} formatos disponibles
                </Badge>
              </div>
              <Link
                href="/register"
                className="text-[12.5px] text-crow-glow transition hover:text-crow-text"
              >
                ¿Eres creator? Publica tu producto →
              </Link>
            </div>

            <div className="mt-6 text-center sm:text-left">
              <h1 className="text-balance text-[34px] font-semibold leading-tight tracking-tight sm:text-[46px]">
                El marketplace de productos{" "}
                <span className="crow-glow-text">digitales</span> de CROW
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-crow-muted mx-auto sm:mx-0">
                Descubrí cursos, ebooks, PDFs, webs interactivas y kits de recursos
                creados con el Creator Studio. Todo listo para aplicar, con
                certificado al completar y acceso de por vida.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-2.5">
              <Link
                href="/marketplace"
                className={cn(
                  "mp-chip rounded-full px-4 py-2 text-[13px] font-medium",
                  params.category ? "text-crow-muted" : "mp-chip-active",
                )}
              >
                Todos
              </Link>
              {PRODUCT_CATEGORIES.map((category) => {
                const count =
                  facets.categories.find((item) => item.value === category)?.count ?? 0;
                return (
                  <Link
                    key={category}
                    href={`/marketplace?category=${encodeURIComponent(category)}`}
                    className={cn(
                      "mp-chip rounded-full px-4 py-2 text-[13px] font-medium",
                      params.category === category ? "mp-chip-active" : "text-crow-muted",
                    )}
                  >
                    {category}
                    {count ? (
                      <span className="ml-1.5 opacity-70">({count})</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="crow-container py-12">
          <MarketplaceFilters
            categories={facets.categories}
            types={facets.types}
            total={facets.total}
          />

          <div className="mt-6 flex items-center justify-between">
            <p className="text-[12.5px] text-crow-muted">
              {cards.length} resultado{cards.length === 1 ? "" : "s"}
              {params.q ? ` para “${params.q}”` : ""}
              {params.category ? ` en ${params.category}` : ""}
            </p>
          </div>

          {featuredCards.length ? (
            <section className="mt-10">
              <SectionTitle
                eyebrow="Selección CROW"
                title="Destacados del marketplace"
                description="Selección según ventas y valoraciones, con espacios promocionales CROW BOOST. La promoción no garantiza ventas ni una posición exacta."
              />
              <div className="mp-hscroll -mx-5 mt-6 px-5 pb-2 sm:mx-0 sm:px-0">
                {featuredCards.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    className="w-[262px] shrink-0"
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-12">
            <SectionTitle
              eyebrow="Explorar"
              title="Todos los productos"
              description="Navegá por todo el catálogo publicado por creadores de CROW."
            />
            <div className="mt-6">
              <ProductGrid products={cards} columns={4} />
            </div>
          </section>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}