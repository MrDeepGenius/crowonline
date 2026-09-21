/**
 * Image generation orchestration for CROW Creator Studio.
 *
 * Generates:
 *  - Product cover  → saved to Product.coverImageUrl
 *  - Module images  → saved to Module.imageUrl
 *  - Lesson images  → saved to Lesson.imageUrl
 *
 * Generic: works for any course topic (marketing, forensics, fitness, code…).
 * Derives prompts automatically from lesson/module title + content when no
 * imagePrompt is stored.
 *
 * Status lifecycle: PENDING → GENERATING → COMPLETED | FAILED
 */

import prisma from "@/lib/db";
import { LeonardoProvider } from "@/lib/ai/providers/leonardo";
import { deriveImagePrompt } from "@/lib/ai/lesson-image-prompt";

export type ImageJobResult = {
  lessonId: string;
  status: "COMPLETED" | "FAILED" | "SKIPPED";
  imageUrl?: string;
  generationId?: string;
  promptUsed?: string;
  error?: string;
};

export type ModuleImageResult = {
  moduleId: string;
  status: "COMPLETED" | "FAILED" | "SKIPPED";
  imageUrl?: string;
  generationId?: string;
  error?: string;
};

export type ProductImageResult = {
  coverImageUrl?: string;
  coverGenerationId?: string;
  modules: ModuleImageResult[];
  lessons: ImageJobResult[];
};

/** Media types that render via SVG — no Leonardo needed. */
const SVG_ONLY_TYPES = new Set(["DIAGRAM", "CHART", "TIMELINE", "PROCESS", "COMPARISON", "CODE_VISUAL"]);

/** Resolves the effective prompt for a lesson, respecting Media Quality Engine. */
function resolvePrompt(lesson: {
  title: string;
  content: string;
  imagePrompt: string | null;
  mediaType?: string | null;
  mediaVisualPrompt?: string | null;
  mediaSpec?: string | null;
}): string | null {
  // SVG-only types: no Leonardo image needed — rendered via mediaSvg
  if (lesson.mediaType && SVG_ONLY_TYPES.has(lesson.mediaType)) return null;
  // Prefer clean visual prompt from Media Engine
  if (lesson.mediaVisualPrompt?.trim()) return lesson.mediaVisualPrompt.trim();
  if (lesson.mediaSpec) {
    try {
      const spec = JSON.parse(lesson.mediaSpec) as { visualPrompt?: string; type?: string };
      if (spec.visualPrompt?.trim() && spec.type && !SVG_ONLY_TYPES.has(spec.type)) {
        return spec.visualPrompt.trim();
      }
      if (spec.type && SVG_ONLY_TYPES.has(spec.type)) return null;
    } catch {}
  }
  if (lesson.imagePrompt?.trim()) return lesson.imagePrompt.trim();
  return deriveImagePrompt(lesson.title, lesson.content);
}

/** Generates one image from a prompt, saves generationId immediately, then polls. */
async function generateOne(
  leonardo: LeonardoProvider,
  prompt: string,
  options: { width?: number; height?: number } = {},
): Promise<{ url: string; generationId: string } | { error: string; generationId?: string }> {
  const generationId = await leonardo.startGeneration(prompt, {
    width: options.width ?? 1024,
    height: options.height ?? 640,
  });
  const url = await leonardo.pollForResult(generationId);
  if (url) return { url, generationId };
  return { error: "Timed out waiting for Leonardo", generationId };
}

/**
 * Derives a cover prompt from the product title, short description and
 * the first lesson content. Generic across all course topics.
 */
function deriveCoverPrompt(opts: {
  title: string;
  shortDescription: string;
  firstLessonTitle?: string;
}): string {
  const { title, shortDescription, firstLessonTitle } = opts;
  const context = firstLessonTitle
    ? `${title} — ${shortDescription} — ${firstLessonTitle}`
    : `${title} — ${shortDescription}`;
  // Use the lesson-image-prompt deriver with the combined context as content
  const derived = deriveImagePrompt(title, context + " ".repeat(200)) ?? title;
  // Replace "Educational illustration about" with something cover-specific
  return derived
    .replace(/^Educational illustration about/, "Professional course cover image about")
    .replace(/no text overlays$/, "no text, premium educational product cover");
}

/**
 * Generates the cover image for a product and updates Product.coverImageUrl.
 * Returns the URL if successful, null otherwise. Never throws.
 */
export async function generateProductCover(productId: string): Promise<string | null> {
  const leonardo = new LeonardoProvider();
  if (!leonardo.isConfigured()) return null;

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        title: true,
        shortDescription: true,
        coverImageUrl: true,
        course: {
          select: {
            modules: {
              take: 1,
              orderBy: { position: "asc" },
              select: {
                lessons: {
                  take: 1,
                  orderBy: { position: "asc" },
                  select: { title: true },
                },
              },
            },
          },
        },
      },
    });
    if (!product) return null;
    if (product.coverImageUrl) return product.coverImageUrl; // already has one

    const firstLesson = product.course?.modules[0]?.lessons[0];
    const prompt = deriveCoverPrompt({
      title: product.title,
      shortDescription: product.shortDescription,
      firstLessonTitle: firstLesson?.title,
    });

    const result = await generateOne(leonardo, prompt, { width: 1280, height: 720 });
    if ("error" in result) {
      console.error(`[image-gen] Cover FAILED for ${productId}: ${result.error}`);
      return null;
    }

    await prisma.product.update({
      where: { id: productId },
      data: { coverImageUrl: result.url },
    });

    return result.url;
  } catch (err) {
    console.error(`[image-gen] Cover exception for ${productId}:`, err);
    return null;
  }
}

/**
 * Generates images for up to `maxLessons` lessons in a product that don't
 * have an imageUrl yet. Derives prompts automatically from content when
 * no imagePrompt is stored.
 *
 * Never throws. Returns a summary of what happened.
 */
export async function generateProductImages(
  productId: string,
  options: { maxLessons?: number } = {},
): Promise<ImageJobResult[]> {
  const { maxLessons = 4 } = options;

  const leonardo = new LeonardoProvider();
  if (!leonardo.isConfigured()) return [];

  // Load all lessons without an image. Filter GENERATING in JS to avoid
  // Prisma NOT-on-nullable SQLite bug that returns 0 results.
  const modules = await prisma.module.findMany({
    where: { course: { productId } },
    orderBy: { position: "asc" },
    select: {
      position: true,
      lessons: {
        where: { imageUrl: null },
        orderBy: { position: "asc" },
        select: { id: true, title: true, content: true, imagePrompt: true, imageGenerationStatus: true, mediaType: true, mediaSpec: true, mediaVisualPrompt: true, mediaSvg: true },
      },
    },
  });

  const lessons = modules
    .flatMap((m) => m.lessons)
    .filter((l) => l.imageGenerationStatus !== "GENERATING");
  const results: ImageJobResult[] = [];

  for (const lesson of lessons) {
    const completed = results.filter((r) => r.status === "COMPLETED" || r.status === "FAILED").length;
    if (completed >= maxLessons) break;

    // Media Engine: SVG lessons already have precise visual — no Leonardo call
    const typedLesson = lesson as typeof lesson & { mediaSvg?: string | null };
    if (typedLesson.mediaType && SVG_ONLY_TYPES.has(typedLesson.mediaType) && typedLesson.mediaSvg) {
      results.push({ lessonId: lesson.id, status: "SKIPPED", error: `SVG ${typedLesson.mediaType} — no Leonardo needed` });
      continue;
    }

    const prompt = resolvePrompt(lesson as Parameters<typeof resolvePrompt>[0]);
    if (!prompt) {
      results.push({ lessonId: lesson.id, status: "SKIPPED" });
      continue;
    }

    // Persist derived prompt so it's visible and editable
    if (!lesson.imagePrompt?.trim()) {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { imagePrompt: prompt, imageGenerationStatus: "PENDING" },
      }).catch(() => {});
    }

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { imageGenerationStatus: "GENERATING" },
    }).catch(() => {});

    try {
      const genId = await leonardo.startGeneration(prompt, { width: 1024, height: 640 });

      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { imageGenerationId: genId, imageGenerationStatus: "GENERATING" },
      });

      const url = await leonardo.pollForResult(genId);

      if (url) {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { imageUrl: url, imageGenerationStatus: "COMPLETED" },
        });
        results.push({ lessonId: lesson.id, status: "COMPLETED", imageUrl: url, generationId: genId, promptUsed: prompt });
      } else {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { imageGenerationStatus: "FAILED" },
        });
        results.push({ lessonId: lesson.id, status: "FAILED", generationId: genId, promptUsed: prompt, error: "Timed out" });
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { imageGenerationStatus: "FAILED" },
      }).catch(() => {});
      results.push({ lessonId: lesson.id, status: "FAILED", promptUsed: prompt, error });
    }
  }

  return results;
}

/**
 * Generates images for modules (up to maxModules).
 * Each module image is a thematic illustration derived from module title + summary.
 * Never throws.
 */
export async function generateModuleImages(
  productId: string,
  options: { maxModules?: number } = {},
): Promise<ModuleImageResult[]> {
  const { maxModules = 3 } = options;
  const leonardo = new LeonardoProvider();
  if (!leonardo.isConfigured()) return [];

  const modules = await prisma.module.findMany({
    where: { course: { productId }, imageUrl: null },
    orderBy: { position: "asc" },
    select: { id: true, title: true, summary: true, imageGenerationStatus: true },
    take: maxModules * 2, // fetch extra, filter in JS
  });

  const candidates = modules
    .filter((m) => m.imageGenerationStatus !== "GENERATING")
    .slice(0, maxModules);

  const results: ModuleImageResult[] = [];

  for (const mod of candidates) {
    const context = [mod.title, mod.summary].filter(Boolean).join(" — ");
    const prompt = deriveImagePrompt(mod.title, context + " ".repeat(150));
    if (!prompt) {
      results.push({ moduleId: mod.id, status: "SKIPPED" });
      continue;
    }

    try {
      await prisma.module.update({
        where: { id: mod.id },
        data: { imageGenerationStatus: "GENERATING" },
      });

      const genId = await leonardo.startGeneration(prompt, { width: 1024, height: 576 });
      await prisma.module.update({
        where: { id: mod.id },
        data: { imageGenerationId: genId },
      });

      const url = await leonardo.pollForResult(genId);
      if (url) {
        await prisma.module.update({
          where: { id: mod.id },
          data: { imageUrl: url, imageGenerationStatus: "COMPLETED" },
        });
        results.push({ moduleId: mod.id, status: "COMPLETED", imageUrl: url, generationId: genId });
      } else {
        await prisma.module.update({
          where: { id: mod.id },
          data: { imageGenerationStatus: "FAILED" },
        });
        results.push({ moduleId: mod.id, status: "FAILED", generationId: genId });
      }
    } catch (err) {
      await prisma.module.update({ where: { id: mod.id }, data: { imageGenerationStatus: "FAILED" } }).catch(() => {});
      results.push({ moduleId: mod.id, status: "FAILED", error: err instanceof Error ? err.message : String(err) });
    }
  }

  return results;
}

/**
 * Generates product cover + module images + lesson images in one call.
 * Cover is awaited synchronously (fast, ~6s).
 * Module + lesson images run in parallel, capped.
 * Never throws.
 */
export async function generateAllProductMedia(
  productId: string,
  options: { maxLessons?: number; maxModules?: number } = {},
): Promise<ProductImageResult> {
  const cover = await generateProductCover(productId);

  const [modules, lessons] = await Promise.all([
    generateModuleImages(productId, { maxModules: options.maxModules ?? 3 }),
    generateProductImages(productId, { maxLessons: options.maxLessons ?? 4 }),
  ]);

  return {
    coverImageUrl: cover ?? undefined,
    modules,
    lessons,
  };
}

/**
 * Retry a single lesson image that previously FAILED or is PENDING.
 * Derives prompt automatically from content if none is stored.
 */
export async function retryLessonImage(lessonId: string): Promise<ImageJobResult> {
  const leonardo = new LeonardoProvider();
  if (!leonardo.isConfigured()) {
    return { lessonId, status: "FAILED", error: "Leonardo not configured" };
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, title: true, content: true, imagePrompt: true, imageGenerationId: true, imageGenerationStatus: true, mediaType: true, mediaSpec: true, mediaVisualPrompt: true, mediaSvg: true },
  });

  if (!lesson) return { lessonId, status: "FAILED", error: "Lesson not found" };

  // SVG types already rendered — no Leonardo
  if (lesson.mediaType && SVG_ONLY_TYPES.has(lesson.mediaType) && lesson.mediaSvg) {
    return { lessonId, status: "SKIPPED", error: `SVG ${lesson.mediaType} — no Leonardo needed` };
  }

  const prompt = resolvePrompt(lesson as Parameters<typeof resolvePrompt>[0]);
  if (!prompt) return { lessonId, status: "SKIPPED", error: "No image needed for this lesson" };

  if (!lesson.imagePrompt?.trim()) {
    await prisma.lesson.update({ where: { id: lessonId }, data: { imagePrompt: prompt } }).catch(() => {});
  }

  try {
    await prisma.lesson.update({ where: { id: lessonId }, data: { imageGenerationStatus: "GENERATING" } });

    const genId = await leonardo.startGeneration(prompt);
    await prisma.lesson.update({ where: { id: lessonId }, data: { imageGenerationId: genId, imageGenerationStatus: "GENERATING" } });

    const url = await leonardo.pollForResult(genId);
    if (url) {
      await prisma.lesson.update({ where: { id: lessonId }, data: { imageUrl: url, imageGenerationStatus: "COMPLETED" } });
      return { lessonId, status: "COMPLETED", imageUrl: url, generationId: genId, promptUsed: prompt };
    }

    await prisma.lesson.update({ where: { id: lessonId }, data: { imageGenerationStatus: "FAILED" } });
    return { lessonId, status: "FAILED", generationId: genId, promptUsed: prompt, error: "Timed out" };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await prisma.lesson.update({ where: { id: lessonId }, data: { imageGenerationStatus: "FAILED" } }).catch(() => {});
    return { lessonId, status: "FAILED", promptUsed: prompt, error };
  }
}

// ─── Video generation ────────────────────────────────────────────────────────
// Moved to @/lib/ai/video-generation (provider-agnostic VideoProvider +
// DB-persisted reconcile). Re-exported here so existing imports keep working
// without touching image code paths.
export {
  generateLessonVideos,
  retryLessonVideo,
  reconcilePendingVideos,
  maxVideosPerRun,
  type VideoJobResult,
} from "@/lib/ai/video-generation";
