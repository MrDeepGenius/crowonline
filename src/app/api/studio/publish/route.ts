import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/rbac";
import type { Role } from "@/lib/domain";
import { getPlanUsage } from "@/server/services/creator";
import { publishProductRecord } from "@/server/services/product-writes";

const bodySchema = z.object({ productId: z.string().min(1) });

/**
 * PUBLICAR — crea el ProductPublication exactamente una vez, marca PUBLISHED
 * y lo hace visible en /marketplace. Idempotente: republicar no duplica.
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

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, creatorId: user.id },
  });
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const usage = await getPlanUsage(user.id);
  if (!usage.canPublishProduct && product.status !== "PUBLISHED") {
    return NextResponse.json(
      {
        error: "plan_limit",
        message: `Tu plan ${usage.plan.name} permite ${usage.plan.publishedLimit} productos publicados.`,
      },
      { status: 402 },
    );
  }

  try {
    const { slug, alreadyPublished } = await publishProductRecord({
      productId: product.id,
      actorId: user.id,
    });

    if (product.blueprintId) {
      await prisma.blueprint.updateMany({
        where: { id: product.blueprintId },
        data: { status: "PUBLISHED", productId: product.id },
      });
    }

    revalidatePath("/marketplace");
    revalidatePath("/creator/products");

    return NextResponse.json({ ok: true, slug, alreadyPublished });
  } catch (error) {
    return NextResponse.json(
      {
        error: "publish_failed",
        message: error instanceof Error ? error.message : "unknown error",
      },
      { status: 400 },
    );
  }
}
