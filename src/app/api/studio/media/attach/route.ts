import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/db";

const bodySchema = z.object({
  assetId: z.string().min(1),
  lessonId: z.string().min(1),
});

/** Attach a library video to a lesson — source follows the asset (§12). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid payload" }, { status: 422 });

  const asset = await prisma.mediaAsset.findFirst({
    where: { id: parsed.data.assetId, ownerId: session.userId },
  });
  if (!asset) return NextResponse.json({ error: "asset not found" }, { status: 404 });

  const lesson = await prisma.lesson.findUnique({
    where: { id: parsed.data.lessonId },
    select: {
      id: true,
      videoSource: true,
      videoUrl: true,
      module: { select: { course: { select: { product: { select: { creatorId: true } } } } } },
    },
  });
  if (!lesson || lesson.module?.course?.product?.creatorId !== session.userId) {
    return NextResponse.json({ error: "lesson not found" }, { status: 404 });
  }
  // Never silently overwrite a creator video with an AI one.
  if (
    lesson.videoSource === "CREATOR" &&
    lesson.videoUrl &&
    asset.source === "AI"
  ) {
    return NextResponse.json({
      error: "La lección ya usa un video propio. Cambialo manualmente primero.",
    }, { status: 409 });
  }

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      videoUrl: asset.url,
      videoGenerationStatus: "COMPLETED",
      videoSource: asset.source,
      videoProvider: asset.provider ?? "library",
    },
  });

  return NextResponse.json({ ok: true, url: asset.url, source: asset.source });
}
