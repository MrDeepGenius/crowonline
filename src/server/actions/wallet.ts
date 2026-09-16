"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { withdrawalSchema, type ActionState } from "@/lib/validation";
import { requestWithdrawal } from "@/server/services/withdrawals";

export async function requestWithdrawalAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Inicia sesión para solicitar un retiro." };

  const parsed = withdrawalSchema.safeParse({
    amountUsdt: formData.get("amountUsdt"),
    address: String(formData.get("address") ?? ""),
    method: String(formData.get("method") ?? "USDT_BEP20"),
    note: String(formData.get("note") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los datos del retiro",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const mode = String(formData.get("mode") ?? "DAILY") === "MONTHLY" ? "MONTHLY" : "DAILY";

  try {
    const withdrawal = await requestWithdrawal({
      userId: user.id,
      amountUsdt: parsed.data.amountUsdt,
      address: parsed.data.address,
      note: parsed.data.note || undefined,
      mode,
    });

    revalidatePath("/wallet");
    revalidatePath("/wallet/withdrawals");

    return {
      ok: true,
      message: `Solicitud ${withdrawal.reference} creada. Neto a recibir: ${withdrawal.netUsdt} USDT tras el fee del ${(withdrawal.feeRate * 100).toFixed(0)}%. Queda pendiente de aprobación del equipo CROW.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo crear el retiro",
    };
  }
}