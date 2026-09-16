import Link from "next/link";

import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { setProductStatusAction } from "@/server/actions/admin";
import { formatUsdt } from "@/lib/utils";

export function AdminProductTable({
  products,
}: {
  products: {
    id: string;
    title: string;
    slug: string;
    status: string;
    priceUsdt: number;
    qualityScore: number;
    salesCount: number;
    revenueUsdt: number;
    creator: { name: string; email: string };
    _count: { enrollments: number; reviews: number };
  }[];
}) {
  return (
    <Card>
      <CardHeader
        title="Productos"
        description="Catálogo completo con estado y rendimiento"
        action={<Badge tone="default">{products.length} productos</Badge>}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12.5px]">
          <thead className="text-[11px] uppercase tracking-wider text-crow-muted">
            <tr>
              <th className="py-2">Producto</th>
              <th className="py-2">Creator</th>
              <th className="py-2">Precio</th>
              <th className="py-2">Ventas</th>
              <th className="py-2">Ingresos</th>
              <th className="py-2">Estado</th>
              <th className="py-2">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="max-w-[280px] py-2.5">
                  <Link
                    href={`/marketplace/${product.slug}`}
                    className="text-crow-text hover:text-crow-glow"
                  >
                    {product.title}
                  </Link>
                  <p className="text-[10.5px] text-crow-muted">
                    quality {product.qualityScore}/100 · {product._count.enrollments}{" "}
                    alumnos · {product._count.reviews} reviews
                  </p>
                </td>
                <td className="py-2.5">
                  <p className="text-crow-text">{product.creator.name}</p>
                  <p className="text-[11px] text-crow-muted">{product.creator.email}</p>
                </td>
                <td className="py-2.5">{formatUsdt(product.priceUsdt)}</td>
                <td className="py-2.5 text-crow-muted">{product.salesCount}</td>
                <td className="py-2.5 text-crow-glow">{formatUsdt(product.revenueUsdt)}</td>
                <td className="py-2.5">
                  <StatusBadge status={product.status} />
                </td>
                <td className="py-2.5">
                  <form action={setProductStatusAction}>
                    <input type="hidden" name="productId" value={product.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={product.status === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED"}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant={product.status === "PUBLISHED" ? "danger" : "secondary"}
                    >
                      {product.status === "PUBLISHED" ? "Archivar" : "Publicar"}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!products.length ? (
        <p className="py-6 text-center text-[12.5px] text-crow-muted">
          Sin productos con este filtro.
        </p>
      ) : null}
    </Card>
  );
}