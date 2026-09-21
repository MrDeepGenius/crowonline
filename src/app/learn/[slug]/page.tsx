import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { CoursePlayer } from "@/components/course/course-player";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { getProductBySlug } from "@/server/services/catalog";
import { getCourseProgress, isEnrolled } from "@/server/services/learning";
import { parseJson } from "@/lib/utils";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Aula" };

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const [{ slug }, query, user] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
  ]);

  const product = await getProductBySlug(slug);
  if (!product || !product.course) notFound();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="crow-container flex flex-1 items-center justify-center py-20">
          <Card className="max-w-md p-8 text-center">
            <h1 className="text-lg font-semibold">Inicia sesión para estudiar</h1>
            <p className="mt-2 text-[13px] text-crow-muted">
              Necesitas una cuenta CROW con este producto en tu biblioteca.
            </p>
            <ButtonLink href="/login" className="mt-6">
              Iniciar sesión
            </ButtonLink>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const enrolled = await isEnrolled(user.id, product.id);

  if (!enrolled) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="crow-container flex flex-1 items-center justify-center py-20">
          <Card className="max-w-lg p-8 text-center">
            <h1 className="text-lg font-semibold">Este curso no está en tu biblioteca</h1>
            <p className="mt-2 text-[13px] text-crow-muted">
              Compra {product.title} para desbloquear todas las lecciones, el progreso
              guardado y el certificado.
            </p>
            <div className="mt-6 flex justify-center gap-2.5">
              <ButtonLink href={`/marketplace/${product.slug}`}>
                Ver el producto
              </ButtonLink>
              <Link
                href="/library"
                className="inline-flex h-11 items-center rounded-xl border border-white/10 bg-white/[0.05] px-5 text-[13px] text-crow-text"
              >
                Mi biblioteca
              </Link>
            </div>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const [{ completedIds, pct, certificate }, modules, resources] = await Promise.all([
    getCourseProgress(user.id, product.id),
    prisma.module.findMany({
      where: { courseId: product.course.id },
      orderBy: { position: "asc" },
      include: {
        lessons: {
          orderBy: { position: "asc" },
          include: { exercises: { orderBy: { position: "asc" } } },
        },
      },
    }),
    prisma.resource.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const activeLessonId = query.lesson ?? modules[0]?.lessons[0]?.id ?? "";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="crow-container flex-1 py-10">
        <Link
          href="/library"
          className="text-[12px] text-crow-muted transition hover:text-crow-text"
        >
          ← Mi biblioteca
        </Link>
        <div className="mt-5">
          <CoursePlayer
            productSlug={product.slug}
            courseTitle={product.title}
            creatorName={product.creator.name}
            progressPct={pct}
            certificateSerial={certificate?.serial ?? null}
            completedIds={Array.from(completedIds)}
            activeLessonId={activeLessonId}
            resources={resources.map((r) => ({
              id: r.id,
              title: r.title,
              content: r.content,
              url: r.url,
              kind: r.kind,
            }))}
            modules={modules.map((module) => ({
              id: module.id,
              title: module.title,
              summary: module.summary,
              imageUrl: module.imageUrl,
              lessons: module.lessons.map((lesson) => ({
                id: lesson.id,
                title: lesson.title,
                content: lesson.content,
                durationMin: lesson.durationMin,
                videoUrl: lesson.videoUrl,
                videoGenerationStatus: lesson.videoGenerationStatus,
                videoSource: lesson.videoSource,
                imageUrl: lesson.imageUrl,
                exercises: lesson.exercises.map((exercise) => ({
                  id: exercise.id,
                  title: exercise.title,
                  instructions: exercise.instructions,
                  kind: exercise.kind,
                  options: parseJson<string[]>(exercise.options, []),
                  correctAnswer: exercise.correctAnswer,
                  explanation: exercise.explanation,
                })),
              })),
            }))}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
