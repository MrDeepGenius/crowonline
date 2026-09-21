import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/db";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * POST /api/studio/upload-video
 *
 * Creator-owned video (§12): "Subir mi video".
 * Accepts multipart form-data { lessonId?, file } (mp4/webm/mov, max 100MB),
 * stores it under public/uploads/videos and persists:
 *   Lesson.videoUrl + videoSource=CREATOR + status COMPLETED
 *   MediaAsset row (library, §13)
 *
 * CREATOR videos are never auto-replaced by AI generation.
 */
const MAX_BYTES = 100_000_000;
const ALLOWED = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"]);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let form: FormData;
  try { form = await req.formData(); }
  catch { return NextResponse.json({ error: "invalid form" }, { status: 400 }); }

  const lessonId = (form.get("lessonId") as string | null) ?? undefined;
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Solo MP4, WebM o MOV." }, { status: 415 });
  }
  if (file.size > MAX_BYTES || file.size === 0) {
    return NextResponse.json({ error: "Tamaño inválido (máx 100 MB)." }, { status: 413 });
  }

  let lessonProductId: string | null = null;
  if (lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        module: { select: { course: { select: { product: { select: { id: true, creatorId: true } } } } } },
      },
    });
    if (!lesson || lesson.module?.course?.product?.creatorId !== session.userId) {
      return NextResponse.json({ error: "lesson not found" }, { status: 404 });
    }
    lessonProductId = lesson.module?.course?.product?.id ?? null;
  }

  const ext = file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "videos");
  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, safeName), bytes);
  const url = `/uploads/videos/${safeName}`;

  const asset = await prisma.mediaAsset.create({
    data: {
      ownerId: session.userId,
      name: file.name || safeName,
      url,
      kind: "VIDEO",
      size: file.size,
      mime: file.type,
      source: "CREATOR",
      provider: "upload",
      productId: lessonProductId,
      lessonId: lessonId ?? null,
      metadata: JSON.stringify({ originalName: file.name }),
    },
  });

  if (lessonId) {
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        videoUrl: url,
        videoGenerationStatus: "COMPLETED",
        videoSource: "CREATOR",
        videoProvider: "upload",
      },
    });
  }

  return NextResponse.json({ ok: true, url, assetId: asset.id, source: "CREATOR" });
}
