import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import prisma from "@/lib/db";
import { confirmOrderPayment } from "@/server/services/settlement";

const payload = z.object({ orderId: z.string().min(1), txHash: z.string().regex(/^0x[\da-f]{64}$/i) }).strict();
export async function POST(request: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  const supplied = request.headers.get("x-crow-signature") ?? "";
  if (!secret || Buffer.byteLength(secret) !== Buffer.byteLength(supplied) ||
      !timingSafeEqual(Buffer.from(secret), Buffer.from(supplied))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid payload" }, { status: 422 });
  const payment = await prisma.payment.findUnique({ where: { orderId: parsed.data.orderId } });
  if (payment?.chainId !== 97) return NextResponse.json({ error: "Not a testnet payment" }, { status: 422 });
  try {
    // Webhook is only a hint. Status and confirmations ALWAYS come from RPC.
    const result = await confirmOrderPayment(parsed.data);
    const order = await prisma.order.findUniqueOrThrow({ where: { id: parsed.data.orderId } });
    return NextResponse.json({ ok: true, status: order.status, alreadyPaid: result.alreadyPaid });
  } catch {
    return NextResponse.json({ error: "TX not verified; no payment credited" }, { status: 422 });
  }
}
