"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { checkoutSchema, reviewSchema, type ActionState } from "@/lib/validation";
import { createOrderWithPayment } from "@/server/services/orders";
import { toggleLessonComplete } from "@/server/services/learning";

/** Buyer purchases a published product → creates PENDING order + payment intent. */
export async function purchaseProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Inicia sesión para comprar este producto." };
  }

  const parsed = checkoutSchema.safeParse({
    productId: String(formData.get("productId") ?? ""),
    referralCode: String(formData.get("referralCode") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, message: "Datos de compra inválidos." };
  }

  let reference: string;
  try {
    const order = await createOrderWithPayment({
      buyerId: user.id,
      productId: parsed.data.productId,
      referralCode: parsed.data.referralCode || null,
    });
    reference = order.reference;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo crear la orden.",
    };
  }

  redirect(`/checkout/${reference}`);
}

export async function createReviewAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Inicia sesión para dejar una review." };

  const parsed = reviewSchema.safeParse({
    productId: String(formData.get("productId") ?? ""),
    rating: String(formData.get("rating") ?? "5"),
    comment: String(formData.get("comment") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa la valoración",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, slug: true, creatorId: true },
  });
  if (!product) return { ok: false, message: "Producto no encontrado" };

  const purchased = await prisma.orderItem.findFirst({
    where: { productId: product.id, order: { buyerId: user.id, status: "PAID" } },
    select: { id: true },
  });
  if (!purchased) {
    return { ok: false, message: "Solo puedes valorar productos que hayas comprado." };
  }

  const existing = await prisma.review.findFirst({
    where: { productId: product.id, userId: user.id },
    select: { id: true },
  });

  if (existing) {
    await prisma.review.update({
      where: { id: existing.id },
      data: { rating: parsed.data.rating, comment: parsed.data.comment },
    });
  } else {
    await prisma.review.create({
      data: {
        productId: product.id,
        userId: user.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
    });
  }

  const reviews = await prisma.review.findMany({
    where: { productId: product.id },
    select: { rating: true },
  });
  const ratingAvg =
    reviews.reduce((sum, item) => sum + item.rating, 0) / (reviews.length || 1);

  await prisma.product.update({
    where: { id: product.id },
    data: {
      ratingAvg: Math.round(ratingAvg * 10) / 10,
      ratingCount: reviews.length,
    },
  });

  revalidatePath(`/marketplace/${product.slug}`);
  return { ok: true, message: "¡Gracias! Tu review ya está publicada." };
}

export async function completeLessonAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const lessonId = String(formData.get("lessonId") ?? "");
  const completed = String(formData.get("completed") ?? "") === "true";
  const productSlug = String(formData.get("productSlug") ?? "");

  await toggleLessonComplete({ userId: user.id, lessonId, completed });
  revalidatePath(`/learn/${productSlug}`);
  redirect(`/learn/${productSlug}?lesson=${lessonId}`);
}