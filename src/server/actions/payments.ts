"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/rbac";
import type { Role } from "@/lib/domain";
import { confirmOrderPayment, markOrderFailed } from "@/server/services/settlement";

/** Legacy form handler: simulation is disabled in every environment. */
export async function confirmPaymentDemoAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orderId = String(formData.get("orderId") ?? "");
  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId: user.id },
    include: { boost: true, payment: true, items: { include: { product: true } } },
  });
  if (!order) redirect("/library");

  // Legacy action retained only to invalidate old forms; never simulates PAID.
  redirect(`/checkout/${order.reference}?paymentError=use-wallet`);
}

/** ADMIN: requests blockchain verification, never overrides its outcome. */
export async function confirmPaymentAdminAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user.roleList as Role[], "ADMIN")) redirect("/dashboard?denied=admin");

  const orderId = String(formData.get("orderId") ?? "");
  const txHash = String(formData.get("txHash") ?? "").trim();

  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: { payment: true },
  });
  if (!order || order.payment?.chainId !== 97) redirect("/admin/orders?paymentError=testnet-only");
  try {
    await confirmOrderPayment({ orderId: order.id, txHash: txHash || order.payment.txHash || "" });
  } catch {
    redirect("/admin/orders?paymentError=not-verified");
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/payments");
  revalidatePath("/library");

  redirect("/admin/payments");
}

export async function cancelOrderAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orderId = String(formData.get("orderId") ?? "");
  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId: user.id },
  });
  if (!order) redirect("/library");

  await markOrderFailed({ orderId: order.id, reason: "cancelled_by_buyer" });
  redirect("/marketplace");
}