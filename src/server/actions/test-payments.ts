"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { requirePaymentsTestMode } from "@/server/payments/test-mode";
import { confirmLocalTestPayment } from "@/server/payments/test-settlement";
import prisma from "@/lib/db";

export async function confirmLocalTestPaymentAction(formData: FormData) {
  requirePaymentsTestMode();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orderId = String(formData.get("orderId") ?? "");

  await confirmLocalTestPayment({ orderId, buyerId: user.id });

  revalidatePath("/library");
  revalidatePath("/wallet");
  revalidatePath("/admin/payments");
  revalidatePath("/admin");

  // Resolve product slug + type to redirect directly to the product
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      reference: true,
      items: {
        select: { product: { select: { slug: true, type: true } } },
      },
    },
  });

  const firstItem = order?.items[0];
  const slug = firstItem?.product.slug;
  const type = firstItem?.product.type;

  if (slug) {
    redirect(type === "COURSE" ? `/learn/${slug}` : `/access/${slug}`);
  }

  redirect("/library?purchased=1&test=1");
}
