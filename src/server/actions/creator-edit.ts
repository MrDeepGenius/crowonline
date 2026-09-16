"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlanById } from "@/lib/plans";
import { hasRole } from "@/lib/rbac";
import type { Role } from "@/lib/domain";
import { updateLessonContent, updateProductDetails } from "@/server/services/product-writes";

async function requireCreator() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user.roleList as Role[], "CREATOR")) redirect("/dashboard?denied=creator");
  return user;
}

export async function updateProductAction(formData: FormData) {
  const user = await requireCreator();
  const productId = String(formData.get("productId") ?? "");

  await updateProductDetails({
    productId,
    creatorId: user.id,
    data: {
      title: String(formData.get("title") ?? "").trim() || undefined,
      shortDescription:
        String(formData.get("shortDescription") ?? "").trim() || undefined,
      description: String(formData.get("description") ?? "").trim() || undefined,
      priceUsdt: Number(formData.get("priceUsdt") ?? 0) || undefined,
      category: String(formData.get("category") ?? "").trim() || undefined,
      coverEmoji: String(formData.get("coverEmoji") ?? "").trim() || undefined,
      coverGradient: String(formData.get("coverGradient") ?? "").trim() || undefined,
    },
  });

  revalidatePath(`/creator/products/${productId}`);
  redirect(`/creator/products/${productId}?saved=1`);
}

export async function updateLessonAction(formData: FormData) {
  const user = await requireCreator();
  const lessonId = String(formData.get("lessonId") ?? "");
  const productId = String(formData.get("productId") ?? "");

  await updateLessonContent({
    lessonId,
    creatorId: user.id,
    data: {
      title: String(formData.get("title") ?? "").trim() || undefined,
      content: String(formData.get("content") ?? ""),
      durationMin: Number(formData.get("durationMin") ?? 20) || 20,
      videoUrl: String(formData.get("videoUrl") ?? "").trim() || null,
      isFreePreview: formData.get("isFreePreview") === "on",
    },
  });

  revalidatePath(`/creator/products/${productId}`);
  redirect(`/creator/products/${productId}?lessonSaved=1#lecciones`);
}

export async function addModuleAction(formData: FormData) {
  const user = await requireCreator();
  const productId = String(formData.get("productId") ?? "");

  const course = await prisma.course.findFirst({
    where: { productId, product: { creatorId: user.id } },
    include: { modules: { select: { position: true } } },
  });
  if (!course) redirect(`/creator/products/${productId}`);

  const position = course.modules.length
    ? Math.max(...course.modules.map((module) => module.position)) + 1
    : 0;

  await prisma.module.create({
    data: {
      courseId: course.id,
      title: `Módulo ${position + 1}: nuevo contenido`,
      summary: "Describe el resultado de este módulo.",
      position,
      lessons: {
        create: [
          {
            title: "Nueva lección",
            content: "Escribe aquí el contenido de la lección.",
            durationMin: 20,
            position: 0,
          },
        ],
      },
    },
  });

  revalidatePath(`/creator/products/${productId}`);
  redirect(`/creator/products/${productId}?moduleAdded=1#lecciones`);
}

/** Plan selector: switches the creator subscription (pending payment). */
export async function selectCreatorPlanAction(formData: FormData) {
  const user = await requireCreator();
  const plan = getPlanById(
    String(formData.get("plan") ?? "START") as Parameters<typeof getPlanById>[0],
  );

  await prisma.creatorSubscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan: plan.id,
      priceUsdt: plan.priceUsdt,
      productLimit: plan.productLimit,
      publishedLimit: plan.publishedLimit,
      expiresAt: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
    },
    update: {
      plan: plan.id,
      priceUsdt: plan.priceUsdt,
      productLimit: plan.productLimit,
      publishedLimit: plan.publishedLimit,
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.transaction.create({
    data: {
      reference: `CROW-PLAN-${Date.now().toString(36).toUpperCase()}`,
      kind: "PLAN",
      status: "PENDING",
      amountUsdt: plan.priceUsdt,
      userId: user.id,
      metadata: JSON.stringify({ plan: plan.id, mode: "manual_approval" }),
    },
  });

  revalidatePath("/creator/plans");
  redirect(`/creator/plans?plan=${plan.id}&updated=1`);
}