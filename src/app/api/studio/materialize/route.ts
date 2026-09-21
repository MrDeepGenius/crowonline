import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { parseBlueprint } from "@/lib/ai/blueprint";
import { hasRole } from "@/lib/rbac";
import type { ProductType, Role } from "@/lib/domain";
import {
  createDraftFromBlueprint,
  saveBlueprint,
} from "@/server/services/creator";
import {
  generateProductCover,
  generateModuleImages,
  generateProductImages,
} from "@/lib/ai/image-generation";
import { LeonardoProvider } from "@/lib/ai/providers/leonardo";

const bodySchema = z.object({
  idea: z.string().min(1).max(2000).default("Idea sin descripción"),
  blueprint: z.unknown(),
  blueprintId: z.string().optional(),
  provider: z.string().max(60).optional(),
  productType: z
    .enum(["COURSE", "EBOOK", "PDF", "INTERACTIVE_WEB", "RESOURCE_KIT"])
    .optional(),
});

/**
 * POST /api/studio/materialize
 *
 * 1. Persiste el blueprint y crea el Product + Course + Module + Lesson + Exercise
 * 2. Genera portada de forma SÍNCRONA (espera la URL real antes de responder)
 * 3. Lanza módulos + lecciones en background asíncrono
 *
 * El frontend puede consultar /api/studio/media-status?productId=xxx para
 * seguir el progreso de las imágenes después de que el endpoint responda.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!hasRole(user.roleList as Role[], "CREATOR")) {
    return NextResponse.json({ error: "Se requiere rol CREATOR" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 422 });
  }

  const blueprint = parseBlueprint(parsed.data.blueprint);
  if (!blueprint) {
    return NextResponse.json({ error: "blueprint inválido" }, { status: 422 });
  }
  if (parsed.data.productType) {
    blueprint.productType = parsed.data.productType as ProductType;
  }

  try {
    const saved = await saveBlueprint({
      userId: user.id,
      idea: parsed.data.idea,
      blueprint,
      provider: parsed.data.provider ?? "crow-studio",
      blueprintId: parsed.data.blueprintId,
    });

    const { product, quality, reused } = await createDraftFromBlueprint({
      creatorId: user.id,
      blueprint,
      blueprintId: saved.id,
    });

    const isLeonardoConfigured = new LeonardoProvider().isConfigured();
    const isCourse = blueprint.productType === "COURSE";

    let coverImageUrl: string | null = null;

    if (isLeonardoConfigured && isCourse) {
      // ── Portada: síncrona — la URL queda en DB antes de responder ────────
      coverImageUrl = await generateProductCover(product.id);

      // ── Módulos + lecciones: asíncronas — el frontend hace polling ────────
      // Usamos setImmediate para separar del ciclo de request y que Node
      // no cancele la promesa cuando el cliente recibe la respuesta HTTP.
      setImmediate(() => {
        Promise.all([
          generateModuleImages(product.id, { maxModules: 3 }),
          generateProductImages(product.id, { maxLessons: 6 }),
        ]).catch((err) => console.error("[materialize] background media error:", err));
      });
    }

    return NextResponse.json({
      ok: true,
      productId: product.id,
      slug: product.slug,
      status: product.status,
      reused,
      quality: quality.score,
      blueprintId: saved.id,
      coverImageUrl,
      imageGeneration: isLeonardoConfigured && isCourse ? "generating" : "skipped",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "materialize_failed",
        message: error instanceof Error ? error.message : "unknown error",
      },
      { status: 400 },
    );
  }
}
