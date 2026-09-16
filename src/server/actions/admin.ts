"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/rbac";
import type { Role } from "@/lib/domain";
import { updateProductStatus, updateUserStatus } from "@/server/services/admin";
import { reviewWithdrawal } from "@/server/services/withdrawal-review";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user.roleList as Role[], "ADMIN")) redirect("/dashboard?denied=admin");
  return user;
}

export async function reviewWithdrawalAction(formData: FormData) {
  const admin = await requireAdmin();

  const withdrawalId = String(formData.get("withdrawalId") ?? "");
  const action = String(formData.get("action") ?? "APPROVE") as
    | "APPROVE"
    | "REJECT"
    | "PAID";
  const adminNote = String(formData.get("adminNote") ?? "").trim() || undefined;
  const txHash = String(formData.get("txHash") ?? "").trim() || undefined;

  await reviewWithdrawal({
    withdrawalId,
    adminId: admin.id,
    action,
    adminNote,
    txHash,
  });

  revalidatePath("/admin/withdrawals");
  revalidatePath("/admin");
  redirect(`/admin/withdrawals?updated=${action.toLowerCase()}`);
}

export async function setUserStatusAction(formData: FormData) {
  await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "ACTIVE");

  await updateUserStatus(userId, status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE");

  revalidatePath("/admin/users");
  redirect(`/admin/users?updated=${status.toLowerCase()}`);
}

export async function setProductStatusAction(formData: FormData) {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  const status = String(formData.get("status") ?? "PUBLISHED");

  await updateProductStatus(productId, status);

  revalidatePath("/admin/products");
  revalidatePath("/marketplace");
  redirect(`/admin/products?updated=${status.toLowerCase()}`);
}