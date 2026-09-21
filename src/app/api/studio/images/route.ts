import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { retryLessonImage } from "@/lib/ai/image-generation";
import { LeonardoProvider } from "@/lib/ai/providers/leonardo";

const postSchema = z.object({
  lessonId: z.string(),
  imagePrompt: z.string().min(1).optional(),
  retry: z.boolean().default(false),
});

/**
 * POST /api/studio/images
 *
 * Genera o reintenta la imagen de una lección específica.
 * Si Leonardo no está configurado, no genera URLs falsas.
 * Guarda generationId, status e imageUrl en DB.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { lessonId, imagePrompt, retry } = parsed.data;

    // Verify ownership
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        imagePrompt: true,
        imageUrl: true,
        imageGenerationStatus: true,
        module: {
          select: {
            course: {
              select: { product: { select: { creatorId: true } } },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const creatorId = lesson.module?.course?.product?.creatorId;
    if (creatorId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If new imagePrompt provided, update it first
    const effectivePrompt = imagePrompt ?? lesson.imagePrompt ?? null;
    if (!effectivePrompt) {
      return NextResponse.json({ error: "No imagePrompt available" }, { status: 400 });
    }

    if (imagePrompt && imagePrompt !== lesson.imagePrompt) {
      await prisma.lesson.update({
        where: { id: lessonId },
        data: { imagePrompt, imageGenerationStatus: "PENDING" },
      });
    }

    const leonardo = new LeonardoProvider();
    if (!leonardo.isConfigured()) {
      return NextResponse.json({
        success: true,
        status: "NOT_CONFIGURED",
        message: "Leonardo API key not configured. Image generation skipped.",
        lessonId,
      });
    }

    // If retry or first generation, delegate to retryLessonImage
    if (retry || !lesson.imageUrl) {
      const result = await retryLessonImage(lessonId);
      return NextResponse.json({
        success: result.status === "COMPLETED",
        status: result.status,
        imageUrl: result.imageUrl,
        generationId: result.generationId,
        lessonId,
        error: result.error,
      });
    }

    return NextResponse.json({
      success: true,
      status: "COMPLETED",
      imageUrl: lesson.imageUrl,
      lessonId,
    });
  } catch (error) {
    console.error("Image generation endpoint error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/studio/images?lessonId=xxx
 * Returns current generation status for a lesson.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lessonId = req.nextUrl.searchParams.get("lessonId");
  if (!lessonId) return NextResponse.json({ error: "lessonId required" }, { status: 400 });

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      imageUrl: true,
      imagePrompt: true,
      imageGenerationId: true,
      imageGenerationStatus: true,
    },
  });

  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    lessonId,
    imageUrl: lesson.imageUrl,
    generationId: lesson.imageGenerationId,
    status: lesson.imageGenerationStatus ?? "PENDING",
    hasImage: Boolean(lesson.imageUrl),
  });
}
