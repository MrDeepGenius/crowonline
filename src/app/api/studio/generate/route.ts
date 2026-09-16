import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { generateBlueprintFromIdea } from "@/server/services/creator";
import { saveBlueprint } from "@/server/services/creator";
import { hasRole } from "@/lib/rbac";
import type { Role } from "@/lib/domain";

const bodySchema = z.object({
  idea: z.string().min(6).max(2000),
  productType: z
    .enum(["COURSE", "EBOOK", "PDF", "INTERACTIVE_WEB", "RESOURCE_KIT"])
    .optional(),
  blueprintId: z.string().optional(),
  persist: z.boolean().optional(),
});

/** IDEA → IA → BLUEPRINT (Creator Studio generation endpoint). */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const roles = user.roleList as Role[];
  if (!hasRole(roles, "CREATOR")) {
    return NextResponse.json(
      { error: "Se requiere rol CREATOR para usar el Creator Studio" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid payload", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { idea, productType, blueprintId, persist } = parsed.data;

  try {
    const generation = await generateBlueprintFromIdea(idea, productType);

    let savedId = blueprintId ?? null;
    if (persist) {
      const saved = await saveBlueprint({
        userId: user.id,
        idea,
        blueprint: generation.blueprint,
        provider: generation.provider,
        blueprintId,
      });
      savedId = saved.id;
    }

    return NextResponse.json({
      ok: true,
      blueprint: generation.blueprint,
      provider: generation.provider,
      mode: generation.mode,
      notes: generation.notes,
      blueprintId: savedId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "generation_failed",
        message: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 },
    );
  }
}