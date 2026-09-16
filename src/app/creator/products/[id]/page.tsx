import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { LessonForms } from "@/components/creator/lesson-forms";
import { ProductBriefForm } from "@/components/creator/product-brief-form";
import { PublishPanel } from "@/components/creator/publish-panel";
import { Button, ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { getCreatorProduct } from "@/server/services/catalog";
import { PRODUCT_STATUS_LABEL, type ProductStatus } from "@/lib/domain";
import { publishProductAction } from "@/server/actions/creator";

export const metadata = { title: "Editar producto" };

export default async function CreatorProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; quality?: string; lessonSaved?: string }>;
}) {
  const [{ id }, query, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  if (!user) return null;

  const product = await getCreatorProduct(id, user.id);
  if (!product) notFound();

  const slug = product.publication?.slug ?? product.slug;

  return (
    <DashboardShell
      title={product.title}
      description={`${PRODUCT_STATUS_LABEL[product.status as ProductStatus] ?? product.status} · ${product.category} · quality ${product.qualityScore}/100`}
      activePath="/creator/products"
      action={
        <div className="flex flex-wrap gap-2.5">
          <ButtonLink href={`/marketplace/${slug}`} variant="secondary">
            Preview público
          </ButtonLink>
          <form action={publishProductAction}>
            <input type="hidden" name="productId" value={product.id} />
            <Button type="submit">
              {product.status === "PUBLISHED" ? "Republicar" : "Publish"}
            </Button>
          </form>
        </div>
      }
    >
      {query.saved || query.lessonSaved || query.quality ? (
        <p className="mb-5 rounded-xl border border-crow-success/30 bg-crow-success/10 px-4 py-3 text-[12.5px] text-crow-success">
          {query.saved
            ? "Cambios guardados."
            : query.lessonSaved
              ? "Lección actualizada."
              : `Quality score recalculado: ${query.quality}/100.`}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <ProductBriefForm
            product={{
              id: product.id,
              title: product.title,
              shortDescription: product.shortDescription,
              description: product.description,
              priceUsdt: product.priceUsdt,
              category: product.category,
              coverEmoji: product.coverEmoji,
              coverGradient: product.coverGradient,
            }}
          />
          <LessonForms
            productId={product.id}
            modules={(product.course?.modules ?? []).map((module) => ({
              id: module.id,
              title: module.title,
              lessons: module.lessons.map((lesson) => ({
                id: lesson.id,
                title: lesson.title,
                content: lesson.content,
                durationMin: lesson.durationMin,
                videoUrl: lesson.videoUrl,
                isFreePreview: lesson.isFreePreview,
              })),
            }))}
          />
        </div>

        <div className="space-y-6">
          <PublishPanel
            productId={product.id}
            status={product.status}
            slug={slug}
            qualityScore={product.qualityScore}
            includes={product.includes}
          />
        </div>
      </div>
    </DashboardShell>
  );
}