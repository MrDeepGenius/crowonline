import Link from "next/link";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { publishProductAction, revalidateQualityAction } from "@/server/actions/creator";
import { PRODUCT_STATUS_LABEL, type ProductStatus } from "@/lib/domain";

export function PublishPanel({
  productId,
  status,
  slug,
  qualityScore,
  includes,
}: {
  productId: string;
  status: string;
  slug: string;
  qualityScore: number;
  includes: string[];
}) {
  return (
    <>
      <Card id="publish">
        <CardHeader
          title="Publish"
          description="Draft → Preview → Quality Check → Publish"
        />
        <div className="space-y-3 text-[12.5px] text-crow-muted">
          <p>
            Estado actual:{" "}
            <span className="text-crow-text">
              {PRODUCT_STATUS_LABEL[status as ProductStatus] ?? status}
            </span>
          </p>
          <p>
            Slug público:{" "}
            <span className="text-crow-glow">/marketplace/{slug}</span>
          </p>
          <p>
            Quality score: <span className="text-crow-text">{qualityScore}/100</span>
          </p>

          <form action={revalidateQualityAction}>
            <input type="hidden" name="productId" value={productId} />
            <Button type="submit" variant="secondary" size="sm">
              Recalcular quality check
            </Button>
          </form>

          <form action={publishProductAction}>
            <input type="hidden" name="productId" value={productId} />
            <Button type="submit" size="sm" className="w-full">
              {status === "PUBLISHED" ? "Republicar en marketplace" : "Publicar en marketplace"}
            </Button>
          </form>

          <p className="border-t border-white/[0.06] pt-3 text-[11.5px]">
            Al publicar se crea un ProductPublication con slug único. Si el producto
            ya estaba publicado no se duplica.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Qué incluye" description="Listado mostrado en la ficha" />
        <ul className="space-y-2">
          {includes.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[12.5px] text-crow-muted">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-crow-violet" />
              {item}
            </li>
          ))}
          {!includes.length ? (
            <li className="text-[12.5px] text-crow-muted">Sin elementos definidos.</li>
          ) : null}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <ButtonLink href={`/marketplace/${slug}`} variant="secondary" size="sm">
            Ver ficha pública
          </ButtonLink>
          <Link
            href="/creator/products"
            className="inline-flex h-9 items-center text-[12px] text-crow-muted hover:text-crow-text"
          >
            ← Mis productos
          </Link>
        </div>
      </Card>
    </>
  );
}