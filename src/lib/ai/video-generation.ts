/**
 * CROW — video generation orchestration (spec §5, §6, §9, §10, §14).
 *
 * Flow per lesson with video enabled:
 *   1. derive prompt from real content → 2. provider.generateVideo()
 *   3. persist generationId + status GENERATING + provider + prompt
 *   4. reconcile later via getVideoStatus() → 5. real videoUrl → COMPLETED
 *
 * A lesson is NEVER marked done just for having a generationId —
 * COMPLETED requires a real, valid videoUrl (isVideoCompleted).
 *
 * Polling is persistent/retryable: job state lives in DB (Lesson row),
 * and `reconcilePendingVideos()` can recover pending work at any time
 * (called by /api/studio/video-status). No setTimeout/Promise.race is
 * used to decide completion — those only bound single HTTP polls.
 *
 * Cost control (§9): quota = min(maxLessons, VIDEO_MAX_PER_PRODUCT),
 * explicit creator action only, never on every course edit.
 */

import prisma from "@/lib/db";
import {
  getVideoProvider,
  isVideoCompleted,
  type VideoStatus,
} from "@/lib/ai/providers/video";
import { deriveVideoPrompt } from "@/lib/ai/video-decision";

export type VideoJobResult = {
  lessonId: string;
  status: "COMPLETED" | "FAILED" | "SKIPPED";
  videoUrl?: string;
  generationId?: string;
  promptUsed?: string;
  error?: string;
};

export function maxVideosPerRun(requested?: number): number {
  const envCap = Number(process.env.VIDEO_MAX_PER_PRODUCT ?? "5");
  const cap = Number.isFinite(envCap) && envCap > 0 ? Math.min(envCap, 10) : 5;
  const want = requested && Number.isFinite(requested) ? requested : cap;
  return Math.max(1, Math.min(want, cap, 10));
}

type EligibleLesson = {
  id: string;
  title: string;
  content: string;
  imageGenerationId: string | null;
  imageId: string | null;
  videoUrl: string | null;
  videoEnabled: boolean | null;
  videoRequired: boolean | null;
  videoGenerationStatus: string | null;
  videoSource: string | null;
  videoPrompt: string | null;
  videoDuration: number | null;
  videoStyle: string | null;
};

async function loadEligibleLessons(
  productId: string,
  limit: number,
): Promise<{ lessons: EligibleLesson[]; courseTitle: string | null; audience: string | null }> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      title: true,
      shortDescription: true,
      course: {
        select: {
          modules: {
            orderBy: { position: "asc" },
            select: {
              lessons: {
                orderBy: { position: "asc" },
                select: {
                  id: true,
                  title: true,
                  content: true,
                  imageGenerationId: true,
                  imageId: true,
                  videoUrl: true,
                  videoEnabled: true,
                  videoRequired: true,
                  videoGenerationStatus: true,
                  videoSource: true,
                  videoPrompt: true,
                  videoDuration: true,
                  videoStyle: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const all = product?.course?.modules.flatMap((m) => m.lessons) ?? [];
  const eligible = all
    .filter(
      (l) =>
        // Never auto-overwrite a creator-uploaded video.
        l.videoSource !== "CREATOR" &&
        // Needs a Leonardo image id to animate.
        (l.imageGenerationId ?? l.imageId) &&
        // Not already completed with a real URL.
        !isVideoCompleted({
          videoGenerationId: (l as { videoGenerationId?: string | null }).videoGenerationId ?? null,
          videoProvider: (l as { videoProvider?: string | null }).videoProvider ?? null,
          videoGenerationStatus: l.videoGenerationStatus,
          videoUrl: l.videoUrl,
        }) &&
        l.videoGenerationStatus !== "GENERATING" &&
        // videoEnabled gate: required lessons always run; enabled lessons run;
        // lessons never flagged run only when nothing was ever flagged
        // (backwards compat with courses created before the video spec).
        (l.videoRequired === true ||
          l.videoEnabled === true ||
          (l.videoEnabled !== false && all.every((x) => x.videoEnabled !== true))),
    )
    .slice(0, limit);

  return {
    lessons: eligible as EligibleLesson[],
    courseTitle: product?.title ?? null,
    audience: product?.shortDescription ?? null,
  };
}

/** Starts jobs (persist GENERATING) then reconciles — never throws. */
export async function generateLessonVideos(
  productId: string,
  options: { maxLessons?: number } = {},
): Promise<VideoJobResult[]> {
  const provider = getVideoProvider();
  if (!provider) return [];

  const limit = maxVideosPerRun(options.maxLessons);
  const { lessons, courseTitle, audience } = await loadEligibleLessons(productId, limit);
  const results: VideoJobResult[] = [];

  for (const lesson of lessons) {
    const prompt = deriveVideoPrompt({
      title: lesson.title,
      content: lesson.content,
      audience,
      style: lesson.videoStyle ?? "cinematic",
      courseTitle,
      durationSec: lesson.videoDuration ?? 5,
    });

    try {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: {
          videoPrompt: prompt,
          videoGenerationStatus: "GENERATING",
          videoProvider: provider.id,
          videoSource: "AI",
          ...(lesson.videoDuration ? {} : { videoDuration: 5 }),
          ...(lesson.videoStyle ? {} : { videoStyle: "cinematic" }),
        },
      });

      const imageRef = lesson.imageId ?? lesson.imageGenerationId;
      if (!imageRef) {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { videoGenerationStatus: "FAILED" },
        });
        results.push({ lessonId: lesson.id, status: "SKIPPED", error: "No image id — generate image first" });
        continue;
      }

      // Leonardo image-to-video needs the concrete image id, not the
      // generation id — resolve + persist it when only the latter exists.
      let motionImageId = lesson.imageId;
      if (!motionImageId && lesson.imageGenerationId && provider.resolveImageId) {
        motionImageId = await provider.resolveImageId(lesson.imageGenerationId);
        if (motionImageId) {
          await prisma.lesson.update({
            where: { id: lesson.id },
            data: { imageId: motionImageId },
          }).catch(() => {});
        }
      }
      if (!motionImageId) {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { videoGenerationStatus: "FAILED" },
        });
        results.push({ lessonId: lesson.id, status: "FAILED", generationId: undefined, promptUsed: prompt, error: "Could not resolve Leonardo image id" });
        continue;
      }

      const { generationId } = await provider.generateVideo({
        imageId: motionImageId,
        imageType: "GENERATED",
        prompt,
        durationSec: lesson.videoDuration ?? 5,
        style: lesson.videoStyle ?? undefined,
      });

      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { videoGenerationId: generationId, videoGenerationStatus: "GENERATING" },
      });

      // Immediate first reconcile — final completion happens via
      // reconcilePendingVideos() (DB-persisted, retryable).
      const state = await provider.getVideoStatus(generationId);
      if (state.status === "COMPLETED" && state.videoUrl) {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { videoUrl: state.videoUrl, videoGenerationStatus: "COMPLETED" },
        });
        results.push({ lessonId: lesson.id, status: "COMPLETED", videoUrl: state.videoUrl, generationId, promptUsed: prompt });
      } else if (state.status === "FAILED") {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { videoGenerationStatus: "FAILED" },
        });
        results.push({ lessonId: lesson.id, status: "FAILED", generationId, promptUsed: prompt, error: "Provider reported FAILED" });
      } else {
        results.push({ lessonId: lesson.id, status: "FAILED", generationId, promptUsed: prompt, error: "PENDING — poll /api/studio/video-status to complete" });
        // Keep DB as GENERATING so reconcile can finish it; report as pending.
        results[results.length - 1].status = "SKIPPED";
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { videoGenerationStatus: "FAILED" },
      }).catch(() => {});
      results.push({ lessonId: lesson.id, status: "FAILED", promptUsed: prompt, error });
    }
  }

  return results;
}

/**
 * Recovers pending work: for every GENERATING lesson with a generationId,
 * asks the provider for the current state and persists it. Retryable —
 * safe to call from any polling endpoint.
 */
export async function reconcilePendingVideos(productId?: string, lessonId?: string): Promise<VideoJobResult[]> {
  const provider = getVideoProvider();
  if (!provider) return [];

  const where: Record<string, unknown> = { videoGenerationStatus: "GENERATING" };
  if (lessonId) (where as Record<string, unknown>).id = lessonId;
  if (productId) (where as Record<string, unknown>).module = { course: { productId } };

  const pending = await prisma.lesson.findMany({
    where: where as never,
    select: { id: true, title: true, videoGenerationId: true, videoProvider: true },
    take: 20,
  });

  const results: VideoJobResult[] = [];
  for (const lesson of pending) {
    if (!lesson.videoGenerationId) {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { videoGenerationStatus: "FAILED" },
      }).catch(() => {});
      results.push({ lessonId: lesson.id, status: "FAILED", error: "Missing generationId" });
      continue;
    }
    try {
      const state: { status: VideoStatus; videoUrl?: string | null } =
        await provider.getVideoStatus(lesson.videoGenerationId);
      if (state.status === "COMPLETED" && state.videoUrl) {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { videoUrl: state.videoUrl, videoGenerationStatus: "COMPLETED" },
        });
        results.push({ lessonId: lesson.id, status: "COMPLETED", videoUrl: state.videoUrl, generationId: lesson.videoGenerationId });
      } else if (state.status === "FAILED") {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { videoGenerationStatus: "FAILED" },
        }).catch(() => {});
        results.push({ lessonId: lesson.id, status: "FAILED", generationId: lesson.videoGenerationId, error: "Provider FAILED" });
      } else {
        results.push({ lessonId: lesson.id, status: "SKIPPED", generationId: lesson.videoGenerationId });
      }
    } catch (err) {
      results.push({ lessonId: lesson.id, status: "SKIPPED", generationId: lesson.videoGenerationId, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return results;
}

/** Retry a single lesson video (FAILED or PENDING). Never touches CREATOR videos. */
export async function retryLessonVideo(lessonId: string): Promise<VideoJobResult> {
  const provider = getVideoProvider();
  if (!provider) return { lessonId, status: "FAILED", error: "Video provider not configured" };

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true, title: true, content: true,
      imageGenerationId: true, imageId: true,
      videoGenerationStatus: true, videoSource: true,
      videoDuration: true, videoStyle: true,
      module: { select: { course: { select: { product: { select: { title: true, shortDescription: true } } } } } },
    },
  });
  if (!lesson) return { lessonId, status: "FAILED", error: "Lesson not found" };
  if (lesson.videoSource === "CREATOR") return { lessonId, status: "SKIPPED", error: "Creator video — never auto-replaced" };

  const imageRef = lesson.imageId ?? lesson.imageGenerationId;
  if (!imageRef) return { lessonId, status: "SKIPPED", error: "No image id — generate image first" };

  let motionImageId = lesson.imageId;
  if (!motionImageId && lesson.imageGenerationId && provider.resolveImageId) {
    motionImageId = await provider.resolveImageId(lesson.imageGenerationId);
    if (motionImageId) {
      await prisma.lesson.update({
        where: { id: lessonId },
        data: { imageId: motionImageId },
      }).catch(() => {});
    }
  }
  if (!motionImageId) return { lessonId, status: "FAILED", error: "Could not resolve Leonardo image id" };

  const prompt = deriveVideoPrompt({
    title: lesson.title,
    content: lesson.content,
    audience: lesson.module?.course?.product?.shortDescription ?? null,
    style: lesson.videoStyle ?? "cinematic",
    courseTitle: lesson.module?.course?.product?.title ?? null,
    durationSec: lesson.videoDuration ?? 5,
  });

  try {
    await prisma.lesson.update({
      where: { id: lessonId },
      data: { videoPrompt: prompt, videoGenerationStatus: "GENERATING", videoProvider: provider.id, videoSource: "AI" },
    });
    const { generationId } = await provider.generateVideo({ imageId: motionImageId, imageType: "GENERATED", prompt });
    await prisma.lesson.update({ where: { id: lessonId }, data: { videoGenerationId: generationId } });

    const state = await provider.getVideoStatus(generationId);
    if (state.status === "COMPLETED" && state.videoUrl) {
      await prisma.lesson.update({
        where: { id: lessonId },
        data: { videoUrl: state.videoUrl, videoGenerationStatus: "COMPLETED" },
      });
      return { lessonId, status: "COMPLETED", videoUrl: state.videoUrl, generationId };
    }
    if (state.status === "FAILED") {
      await prisma.lesson.update({ where: { id: lessonId }, data: { videoGenerationStatus: "FAILED" } });
      return { lessonId, status: "FAILED", generationId, error: "Provider FAILED" };
    }
    return { lessonId, status: "SKIPPED", generationId, error: "PENDING — poll video-status" };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await prisma.lesson.update({ where: { id: lessonId }, data: { videoGenerationStatus: "FAILED" } }).catch(() => {});
    return { lessonId, status: "FAILED", error };
  }
}
