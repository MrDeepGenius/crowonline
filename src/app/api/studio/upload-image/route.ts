import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/db";

/**
 * POST /api/studio/upload-image
 *
 * Accepts a base64-encoded image and a target (product cover or lesson image).
 * Stores the data URL directly in DB (for local SQLite dev — in production
 * this would go to an object store and only the URL would be saved).
 *
 * Body: { target: "cover" | "lesson", productId?: string, lessonId?: string, dataUrl: string }
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { target?: string; productId?: string; lessonId?: string; dataUrl?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }

  const { target, productId, lessonId, dataUrl } = body;

  if (!dataUrl || !dataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "invalid dataUrl — must be data:image/..." }, { status: 400 });
  }
  if (dataUrl.length > 5_000_000) {
    return NextResponse.json({ error: "Image too large (max ~3.5MB)" }, { status: 413 });
  }

  if (target === "cover" && productId) {
    const product = await prisma.product.findFirst({
      where: { id: productId, creatorId: session.userId },
    });
    if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });

    await prisma.product.update({
      where: { id: productId },
      data: { coverImageUrl: dataUrl },
    });
    return NextResponse.json({ ok: true, url: dataUrl, target: "cover" });
  }

  if (target === "lesson" && lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        module: { select: { course: { select: { product: { select: { creatorId: true } } } } } },
      },
    });
    if (!lesson || lesson.module?.course?.product?.creatorId !== session.userId) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    await prisma.lesson.update({
      where: { id: lessonId },
      data: { imageUrl: dataUrl, imageGenerationStatus: "COMPLETED" },
    });
    return NextResponse.json({ ok: true, url: dataUrl, target: "lesson" });
  }

  return NextResponse.json({ error: "invalid target or missing id" }, { status: 400 });
}
