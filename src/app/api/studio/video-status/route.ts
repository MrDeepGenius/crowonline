import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/db";
import { getVideoProvider, isVideoCompleted } from "@/lib/ai/providers/video";
import { reconcilePendingVideos } from "@/lib/ai/video-generation";

/**
 * GET /api/studio/video-status?productId=xxx[&reconcile=1]
 * GET /api/studio/video-status?lessonId=xxx[&reconcile=1]
 *
 * Reads job state from DB (persistent). With `reconcile=1` (default for
 * product queries) it first asks the provider for the current state of
 * every GENERATING job and persists it — so pending work is recovered
 * even if a background task was dropped. This is the retryable polling
 * mechanism (§6): state lives in DB, not in a timer.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const productId = req.nextUrl.searchParams.get("productId");
  const lessonId  = req.nextUrl.searchParams.get("lessonId");
  const reconcile = req.nextUrl.searchParams.get("reconcile") !== "0";

  const provider = getVideoProvider();
  const providerConfigured = provider !== null;

  if (productId) {
    const product = await prisma.product.findFirst({
      where: { id: productId, creatorId: session.userId },
      select: { id: true },
    });
    if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });

    if (reconcile && providerConfigured) {
      await reconcilePendingVideos(productId).catch((err) =>
        console.error("[video-status] reconcile error:", err),
      );
    }

    const lessons = await prisma.lesson.findMany({
      where: { module: { course: { productId } } },
      select: {
        id: true,
        title: true,
        videoUrl: true,
        videoGenerationId: true,
        videoGenerationStatus: true,
        videoProvider: true,
        videoEnabled: true,
        videoRequired: true,
        videoSource: true,
        imageGenerationId: true,
        imageId: true,
      },
      orderBy: [{ module: { position: "asc" } }, { position: "asc" }],
    });

    const completed  = lessons.filter((l) =>
      isVideoCompleted({
        videoGenerationId: l.videoGenerationId,
        videoProvider: l.videoProvider,
        videoGenerationStatus: l.videoGenerationStatus,
        videoUrl: l.videoUrl,
      }),
    ).length;
    const generating = lessons.filter((l) => l.videoGenerationStatus === "GENERATING").length;
    const failed     = lessons.filter((l) => l.videoGenerationStatus === "FAILED").length;
    const enabled    = lessons.filter((l) => l.videoEnabled || l.videoRequired).length;
    const eligible   = lessons.filter(
      (l) => (l.imageGenerationId ?? l.imageId) && !l.videoUrl && l.videoSource !== "CREATOR",
    ).length;

    return NextResponse.json({
      productId,
      total: lessons.length,
      enabled,
      completed,
      generating,
      failed,
      eligible,
      allDone: generating === 0,
      provider: provider?.id ?? null,
      providerConfigured,
      providerMessage: providerConfigured
        ? null
        : "Proveedor de video no configurado. Agregá LEONARDO_API_KEY al .env para activar la generación.",
      sample: lessons
        .filter((l) => l.videoUrl)
        .slice(0, 4)
        .map((l) => ({ id: l.id, title: l.title, videoUrl: l.videoUrl, generationId: l.videoGenerationId })),
    });
  }

  if (lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        title: true,
        videoUrl: true,
        videoGenerationId: true,
        videoGenerationStatus: true,
        videoProvider: true,
        videoSource: true,
        module: { select: { course: { select: { product: { select: { creatorId: true } } } } } },
      },
    });
    if (!lesson) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (lesson.module?.course?.product?.creatorId !== session.userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (reconcile && providerConfigured && lesson.videoGenerationStatus === "GENERATING") {
      await reconcilePendingVideos(undefined, lessonId).catch(() => {});
      const fresh = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { videoUrl: true, videoGenerationId: true, videoGenerationStatus: true, videoProvider: true },
      });
      const ready = isVideoCompleted({
        videoGenerationId: fresh?.videoGenerationId ?? null,
        videoProvider: fresh?.videoProvider ?? null,
        videoGenerationStatus: fresh?.videoGenerationStatus ?? null,
        videoUrl: fresh?.videoUrl ?? null,
      });
      return NextResponse.json({
        lessonId,
        videoUrl: fresh?.videoUrl ?? null,
        generationId: fresh?.videoGenerationId ?? null,
        provider: fresh?.videoProvider ?? null,
        status: fresh?.videoGenerationStatus ?? "PENDING",
        ready,
        providerConfigured,
      });
    }

    const ready = isVideoCompleted({
      videoGenerationId: lesson.videoGenerationId,
      videoProvider: lesson.videoProvider,
      videoGenerationStatus: lesson.videoGenerationStatus,
      videoUrl: lesson.videoUrl,
    });

    return NextResponse.json({
      lessonId,
      videoUrl: lesson.videoUrl,
      generationId: lesson.videoGenerationId,
      provider: lesson.videoProvider,
      status: lesson.videoGenerationStatus ?? "PENDING",
      ready,
      providerConfigured,
    });
  }

  return NextResponse.json({ error: "productId or lessonId required" }, { status: 400 });
}
