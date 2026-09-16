"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { parseBlueprint, qualityCheck } from "@/lib/ai/blueprint";
import { hasRole } from "@/lib/rbac";
import type { Role } from "@/lib/domain";
import { createDraftFromBlueprint, getPlanUsage, saveBlueprint } from "@/server/services/creator";
import { publishProductRecord, updateProductDetails } from "@/server/services/product-writes";

async function requireCreator() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user.roleList as Role[], "CREATOR")) redirect("/dashboard?denied=creator");
  return user;
}

/** Step Generate/Edit → creates (or reuses) the draft product. */
export async function saveStudioDraftAction(formData: FormData) {
  const user = await requireCreator();

  const raw = String(formData.get("blueprint") ?? "");
  const idea = String(formData.get("idea") ?? "Idea sin descripción");
  const blueprintId = String(formData.get("blueprintId") ?? "") || undefined;

  let blueprint;
  try {
    blueprint = parseBlueprint(JSON.parse(raw));
  } catch {
    blueprint = null;
  }
  if (!blueprint) redirect("/creator/studio?error=blueprint");

  const saved = await saveBlueprint({
    userId: user.id,
    idea,
    blueprint,
    provider: String(formData.get("provider") ?? "crow-demo"),
    blueprintId,
  });

  try {
    const { product } = await createDraftFromBlueprint({
      creatorId: user.id,
      blueprint,
      blueprintId: saved.id,
    });
    revalidatePath("/creator/products");
    redirect(`/creator/products/${product.id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar";
    redirect(`/creator/studio?error=${encodeURIComponent(message)}`);
  }
}

/** Step Publish → creates the ProductPublication exactly once. */
export async function publishProductAction(formData: FormData) {
  const user = await requireCreator();
  const productId = String(formData.get("productId") ?? "");

  const product = await prisma.product.findFirst({
    where: { id: productId, creatorId: user.id },
  });
  if (!product) redirect("/creator/products");

  const usage = await getPlanUsage(user.id);
  if (!usage.canPublishProduct && product.status !== "PUBLISHED") {
    redirect(
      `/creator/plans?error=${encodeURIComponent(
        `Tu plan ${usage.plan.name} permite ${usage.plan.publishedLimit} productos publicados. Mejora tu plan para publicar más.`,
      )}`,
    );
  }

  const { slug } = await publishProductRecord({ productId, actorId: user.id });

  if (product.blueprintId) {
    await prisma.blueprint.updateMany({
      where: { id: product.blueprintId },
      data: { status: "PUBLISHED", productId },
    });
  }

  revalidatePath("/marketplace");
  revalidatePath("/creator/products");
  redirect(`/marketplace/${slug}?published=1`);
}

export async function archiveProductAction(formData: FormData) {
  const user = await requireCreator();
  const productId = String(formData.get("productId") ?? "");

  await updateProductDetails({
    productId,
    creatorId: user.id,
    data: { status: "ARCHIVED" },
  });

  revalidatePath("/creator/products");
  redirect("/creator/products");
}

/** Re-runs the Quality Check and stores the score on the product. */
export async function revalidateQualityAction(formData: FormData) {
  const user = await requireCreator();
  const productId = String(formData.get("productId") ?? "");

  const product = await prisma.product.findFirst({
    where: { id: productId, creatorId: user.id },
  });
  if (!product) redirect("/creator/products");

  let score = product.qualityScore;
  if (product.blueprintId) {
    const blueprint = await prisma.blueprint.findUnique({
      where: { id: product.blueprintId },
    });
    if (blueprint) {
      try {
        const parsed = parseBlueprint(JSON.parse(blueprint.data));
        if (parsed) score = qualityCheck(parsed).score;
      } catch {
        score = product.qualityScore;
      }
    }
  }

  await prisma.product.update({ where: { id: productId }, data: { qualityScore: score } });

  revalidatePath(`/creator/products/${productId}`);
  redirect(`/creator/products/${productId}?quality=${score}`);
}