import { ProductCard, type ProductCardData } from "@/components/marketplace/product-card";
import { EmptyState } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export function ProductGrid({
  products,
  columns = 3,
}: {
  products: ProductCardData[];
  columns?: 2 | 3 | 4;
}) {
  const gridClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3";

  if (!products.length) {
    return (
      <EmptyState
        icon="◈"
        title="Todavía no hay productos aquí"
        description="Cuando se publique el primer producto en esta categoría aparecerá en el marketplace."
        action={<ButtonLink href="/register">Crear mi cuenta gratis →</ButtonLink>}
      />
    );
  }

  return (
    <div className={`grid gap-5 ${gridClass}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}