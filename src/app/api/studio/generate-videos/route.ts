import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/db";
import { getVideoProvider } from "@/lib/ai/providers/video";
import {
  generateLessonVideos,
  retryLessonVideo,
  maxVideosPerRun,
} from "@/lib/ai/video-generation";

const bodySchema = z.object({
  /** Generate videos for all eligible lessons in a product. */
  productId: z.string().optional(),
  /** Generate/retry video for a single lesson. */
  lessonId: z.string().optional(),
  /** Max lessons to process when productId is provided. */
  maxLessons: z.number().int().min(1).max(10).default(5),
  /** Explicit creator confirmation (§9) — required for product-wide runs. */
  confirm: z.boolean().optional(),
});

/**
 * POST /api/studio/generate-videos
 *
 * Explicit creator action only — videos are NEVER generated automatically
 * on course edits. Requires `confirm: true` for product-wide runs so the
 * creator has seen "Este producto generará X videos".
 *
 * Jobs are persisted as GENERATING in DB immediately; completion is
 * recovered via GET /api/studio/video-status (reconcile), so a dropped
 * background task never loses work.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload", details: parsed.error.flatten() }, { status: 422 });
  }

  const { productId, lessonId, maxLessons, confirm } = parsed.data;

  if (!productId && !lessonId) {
    return NextResponse.json({ error: "productId or lessonId required" }, { status: 400 });
  }

  const provider = getVideoProvider();
  if (!provider) {
    return NextResponse.json({
      ok: false,
      status: "NOT_CONFIGURED",
      message: "Proveedor de video no configurado. Agregá LEONARDO_API_KEY al .env para activar la generación.",
    });
  }

  // Verify ownership
  if (productId) {
    const product = await prisma.product.findFirst({
      where: { id: productId, creatorId: session.userId },
      select: { id: true, title: true },
    });
    if (!product) return NextResponse.json({ error: "product not found" }, { status: 404 });

    if (!confirm) {
      const modules = await prisma.module.findMany({
        where: { course: { productId } },
        select: {
          lessons: {
            where: {
              videoGenerationStatus: { not: "GENERATING" },
              AND: [
                { OR: [{ videoSource: null }, { videoSource: { not: "CREATOR" } }] },
                { OR: [{ videoRequired: true }, { videoEnabled: true }] },
              ],
            },
            select: { id: true },
          },
        },
      });
      const flagged = modules.flatMap((m) => m.lessons).length;
      const willGenerate = Math.min(flagged, maxVideosPerRun(maxLessons));
      return NextResponse.json({
        ok: false,
        status: "CONFIRM_REQUIRED",
        eligibleLessons: flagged,
        willGenerate,
        message: `Este producto generará ${willGenerate} video${willGenerate === 1 ? "" : "s"}. Reenviá con { confirm: true } para iniciar.`,
      });
    }

    const cap = maxVideosPerRun(maxLessons);

    // Persist-first: run in background, reconcile via video-status.
    setImmediate(() => {
      generateLessonVideos(productId, { maxLessons: cap })
        .catch((err) => console.error("[generate-videos] product error:", err));
    });

    return NextResponse.json({
      ok: true,
      status: "STARTED",
      maxLessons: cap,
      provider: provider.id,
      message: `Generando hasta ${cap} videos con ${provider.label} en background. Consultá /api/studio/video-status?productId=${productId} para el progreso.`,
    });
  }

  // Single lesson retry
  if (lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        videoUrl: true,
        videoSource: true,
        imageGenerationId: true,
        imageId: true,
        module: {
          select: { course: { select: { product: { select: { creatorId: true } } } } },
        },
      },
    });

    if (!lesson) return NextResponse.json({ error: "lesson not found" }, { status: 404 });
    if (lesson.module?.course?.product?.creatorId !== session.userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (lesson.videoSource === "CREATOR" && lesson.videoUrl) {
      return NextResponse.json({
        ok: false,
        status: "CREATOR_VIDEO",
        message: "Esta lección usa un video propio del creador. No se reemplaza automáticamente.",
      });
    }
    if (!lesson.imageGenerationId && !lesson.imageId) {
      return NextResponse.json({
        ok: false,
        status: "NO_IMAGE",
        message: "La lección no tiene imagen generada. Generá la imagen primero.",
      });
    }

    setImmediate(() => {
      retryLessonVideo(lessonId)
        .catch((err) => console.error("[generate-videos] lesson error:", err));
    });

    return NextResponse.json({
      ok: true,
      status: "STARTED",
      lessonId,
      provider: provider.id,
      message: "Generando video. Consultá el estado en unos momentos.",
    });
  }

  return NextResponse.json({ error: "unreachable" }, { status: 500 });
}
