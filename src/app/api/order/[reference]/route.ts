import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * GET /api/order/[reference]
 * Polling endpoint — returns the current status and product slug for the
 * checkout page. Only the authenticated buyer can read their own order.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { reference } = await params;

  const order = await prisma.order.findFirst({
    where: { reference, buyerId: user.id },
    select: {
      id: true,
      status: true,
      settledAt: true,
      items: {
        select: {
          product: { select: { slug: true, type: true } },
        },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const firstItem = order.items[0];
  const productSlug = firstItem?.product.slug ?? null;
  const productType = firstItem?.product.type ?? null;

  return NextResponse.json({
    status: order.status,
    settled: Boolean(order.settledAt),
    productSlug,
    productType,
  });
}
