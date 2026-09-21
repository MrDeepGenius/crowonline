import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/db";

/**
 * GET /api/studio/media-status?productId=xxx
 *
 * Returns the current image generation status for a product:
 * - cover: status + url
 * - modules: count by status + first 3 with urls
 * - lessons: count by status + first 4 with urls
 *
 * Used by the Studio frontend to poll progress after materialisation.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const product = await prisma.product.findFirst({
    where: { id: productId, creatorId: session.userId },
    select: { id: true, coverImageUrl: true, coverGradient: true, coverEmoji: true },
  });
  if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [modules, lessons] = await Promise.all([
    prisma.module.findMany({
      where: { course: { productId } },
      orderBy: { position: "asc" },
      select: { id: true, title: true, imageUrl: true, imageGenerationStatus: true },
    }),
    prisma.lesson.findMany({
      where: { module: { course: { productId } } },
      orderBy: [{ module: { position: "asc" } }, { position: "asc" }],
      select: { id: true, title: true, imageUrl: true, imageGenerationStatus: true },
    }),
  ]);

  const lessonStats = {
    total: lessons.length,
    completed: lessons.filter((l) => l.imageUrl).length,
    generating: lessons.filter((l) => l.imageGenerationStatus === "GENERATING").length,
    pending: lessons.filter((l) => !l.imageUrl && l.imageGenerationStatus !== "GENERATING").length,
    sample: lessons.filter((l) => l.imageUrl).slice(0, 4).map((l) => ({ id: l.id, title: l.title, imageUrl: l.imageUrl })),
  };

  const moduleStats = {
    total: modules.length,
    completed: modules.filter((m) => m.imageUrl).length,
    sample: modules.filter((m) => m.imageUrl).slice(0, 3).map((m) => ({ id: m.id, title: m.title, imageUrl: m.imageUrl })),
  };

  return NextResponse.json({
    productId,
    cover: {
      url: product.coverImageUrl,
      ready: Boolean(product.coverImageUrl),
    },
    modules: moduleStats,
    lessons: lessonStats,
    allDone:
      Boolean(product.coverImageUrl) &&
      lessonStats.generating === 0,
  });
}
