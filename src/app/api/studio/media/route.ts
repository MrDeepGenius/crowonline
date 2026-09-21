import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/db";

/**
 * GET /api/studio/media?kind=VIDEO — creator media library (§13).
 * POST /api/studio/media/attach { assetId, lessonId } — "Elegir de mi biblioteca".
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const kind = req.nextUrl.searchParams.get("kind") ?? undefined;
  const assets = await prisma.mediaAsset.findMany({
    where: {
      ownerId: session.userId,
      ...(kind === "VIDEO" || kind === "IMAGE" ? { kind } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, name: true, url: true, kind: true, duration: true,
      size: true, mime: true, source: true, provider: true, createdAt: true,
    },
  });
  return NextResponse.json({ ok: true, assets });
}
