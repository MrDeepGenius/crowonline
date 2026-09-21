import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { LessonForms } from "@/components/creator/lesson-forms";
import { ProductBriefForm } from "@/components/creator/product-brief-form";
import { PublishPanel } from "@/components/creator/publish-panel";
import { CoverManager } from "@/components/creator/cover-manager";
import { LessonImageManager } from "@/components/creator/lesson-image-manager";
import { LessonVideoManager } from "@/components/creator/lesson-video-manager";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { redirect } from "next/navigation";
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
  if (!user) redirect("/login");

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

          {/* Cover image manager */}
          <CoverManager
            productId={product.id}
            currentUrl={product.coverImageUrl}
            coverGradient={product.coverGradient}
            coverEmoji={product.coverEmoji}
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

          {/* Lesson image managers */}
          {product.course && product.course.modules.length > 0 ? (
            <Card>
              <CardHeader
                title="Imágenes de lecciones"
                description="Generá con CROW o subí tu propia imagen para cada lección."
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {product.course.modules.flatMap((mod) =>
                  mod.lessons.map((lesson) => (
                    <LessonImageManager
                      key={lesson.id}
                      lessonId={lesson.id}
                      lessonTitle={lesson.title}
                      currentUrl={(lesson as { imageUrl?: string | null }).imageUrl}
                      currentStatus={(lesson as { imageGenerationStatus?: string | null }).imageGenerationStatus}
                      imagePrompt={(lesson as { imagePrompt?: string | null }).imagePrompt}
                    />
                  ))
                )}
              </div>
            </Card>
          ) : null}

          {/* Lesson video managers */}
          {product.course && product.course.modules.length > 0 ? (
            <Card>
              <CardHeader
                title="Videos de introducción"
                description="Generá con CROW, subí tu propio video o elegí de tu biblioteca. Los videos propios nunca se reemplazan automáticamente."
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {product.course.modules.flatMap((mod) =>
                  mod.lessons.map((lesson) => {
                    const l = lesson as {
                      id: string;
                      title: string;
                      videoUrl?: string | null;
                      videoGenerationStatus?: string | null;
                      videoSource?: string | null;
                      imageGenerationId?: string | null;
                      imageId?: string | null;
                    };
                    return (
                      <LessonVideoManager
                        key={l.id}
                        lessonId={l.id}
                        lessonTitle={l.title}
                        currentVideoUrl={l.videoUrl}
                        currentStatus={l.videoGenerationStatus}
                        currentSource={l.videoSource}
                        hasImage={Boolean(l.imageGenerationId ?? l.imageId)}
                      />
                    );
                  })
                )}
              </div>
            </Card>
          ) : null}
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