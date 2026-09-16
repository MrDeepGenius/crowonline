"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/rbac";
import type { Role } from "@/lib/domain";
import { confirmOrderPayment, markOrderFailed } from "@/server/services/settlement";

/**
 * Development/demo confirmation. In production the blockchain watcher or the
 * payment webhook (/api/webhooks/payments) calls confirmOrderPayment instead.
 * Only the order owner can confirm it from the UI.
 */
export async function confirmPaymentDemoAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orderId = String(formData.get("orderId") ?? "");
  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId: user.id },
    include: { payment: true, items: { include: { product: true } } },
  });
  if (!order) redirect("/library");

  const txHash =
    order.payment?.txHash ?? `0x${Math.random().toString(16).slice(2).padEnd(40, "0")}`;
  await confirmOrderPayment({ orderId: order.id, txHash });
  redirect("/library?purchased=1");
}

/** ADMIN/DEV: confirma un Payment PENDING como PAID sin blockchain real. */
export async function confirmPaymentAdminAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user.roleList as Role[], "ADMIN")) redirect("/dashboard?denied=admin");

  const orderId = String(formData.get("orderId") ?? "");
  const txHash =
    String(formData.get("txHash") ?? "").trim() ||
    `0xDEV-${Math.random().toString(16).slice(2, 10).toUpperCase().padEnd(8, "0")}`;

  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: { payment: true },
  });
  if (!order) redirect("/admin/orders");

  const result = await confirmOrderPayment({ orderId: order.id, txHash });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/payments");
  revalidatePath("/library");

  redirect(
    `/admin/orders?confirmed=${order.reference}${result.alreadyPaid ? "&already=1" : ""}`,
  );
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