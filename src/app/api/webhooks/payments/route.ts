import { NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { confirmOrderPayment, markOrderFailed } from "@/server/services/settlement";

const payloadSchema = z.object({
  reference: z.string().min(3).optional(),
  orderId: z.string().min(3).optional(),
  txHash: z.string().min(6).optional(),
  confirmations: z.coerce.number().int().min(0).optional(),
  status: z.enum(["PAID", "FAILED"]).default("PAID"),
});

function authorized(request: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) return true; // dev mode: no secret configured
  const header =
    request.headers.get("x-crow-signature") ??
    request.headers.get("authorization")?.replace("Bearer ", "");
  return header === secret;
}

/**
 * Blockchain / PSP webhook.
 * Configure PAYMENT_WEBHOOK_SECRET and send it as `x-crow-signature`.
 * The commission engine only runs through confirmOrderPayment, so the split is
 * always applied exactly once.
 */
export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid payload", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { reference, orderId, txHash, confirmations, status } = parsed.data;

  const order = orderId
    ? await prisma.order.findUnique({ where: { id: orderId } })
    : reference
      ? await prisma.order.findUnique({ where: { reference } })
      : null;

  if (!order) {
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }

  if (status === "FAILED") {
    await markOrderFailed({ orderId: order.id, reason: "webhook_failed" });
    return NextResponse.json({ ok: true, orderId: order.id, status: "FAILED" });
  }

  const result = await confirmOrderPayment({
    orderId: order.id,
    txHash,
    confirmations,
  });

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    alreadyPaid: result.alreadyPaid,
    commissions: result.snapshot.length,
  });
}

export async function GET() {
  const pending = await prisma.payment.count({ where: { status: "PENDING" } });
  return NextResponse.json({
    provider: process.env.PAYMENT_PROVIDER ?? "usdt_bep20",
    network: "BEP20",
    pendingPayments: pending,
    requiredConfirmations: Number(
      process.env.PAYMENT_REQUIRED_CONFIRMATIONS ?? 12,
    ),
  });
}