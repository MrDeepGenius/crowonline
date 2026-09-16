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
 * GENERACIÓN — crea el Product (+ Course/Module/Lesson/Exercise para COURSE)
 * a partir del blueprint editado. Reutiliza el producto ya vinculado al
 * blueprint: nunca duplica.
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

    return NextResponse.json({
      ok: true,
      productId: product.id,
      slug: product.slug,
      status: product.status,
      reused,
      quality: quality.score,
      blueprintId: saved.id,
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
