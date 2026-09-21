"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { createBoostCheckout } from "@/server/services/boost";

export async function createBoostCheckoutAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  let reference: string;
  try {
    const order = await createBoostCheckout({
      creatorId: user.id, productId: String(formData.get("productId") ?? ""),
    });
    reference = order.reference;
  } catch {
    redirect("/creator/products?boostError=1");
  }
  redirect(`/checkout/${reference}`);
}
