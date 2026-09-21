"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type OrderStatus = "PENDING" | "PAID" | "EXPIRED" | "FAILED" | "REFUNDED";

type PollResult = {
  status: OrderStatus;
  settled: boolean;
  productSlug: string | null;
  productType: string | null;
};

const LABEL: Record<OrderStatus, string> = {
  PENDING: "Esperando pago…",
  PAID: "Pago confirmado · Desbloqueando acceso…",
  EXPIRED: "Orden expirada",
  FAILED: "Orden fallida",
  REFUNDED: "Reembolso procesado",
};

const TONE: Record<OrderStatus, string> = {
  PENDING: "text-crow-warn",
  PAID: "text-crow-success",
  EXPIRED: "text-crow-danger",
  FAILED: "text-crow-danger",
  REFUNDED: "text-crow-muted",
};

function accessPath(slug: string, type: string | null) {
  return type === "COURSE" ? `/learn/${slug}` : `/access/${slug}`;
}

/**
 * CheckoutPoller — polls /api/order/[reference] every 5 s while PENDING.
 * When the order moves to PAID it redirects to the product.
 *
 * Rendered on the checkout page (server component) only when the order is
 * PENDING. Stops automatically on any terminal state.
 */
export function CheckoutPoller({
  reference,
  initialStatus,
  productSlug,
  productType,
}: {
  reference: string;
  initialStatus: OrderStatus;
  productSlug: string | null;
  productType: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [settled, setSettled] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Don't poll if already terminal
    if (status !== "PENDING") return;

    async function poll() {
      try {
        const res = await fetch(`/api/order/${reference}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as PollResult;

        setStatus(data.status);
        setSettled(data.settled);

        if (data.status === "PAID" && data.settled) {
          // Stop polling and redirect
          if (intervalRef.current) clearInterval(intervalRef.current);
          const slug = data.productSlug ?? productSlug;
          const type = data.productType ?? productType;
          if (slug) {
            router.push(accessPath(slug, type));
          } else {
            router.push("/library?purchased=1");
          }
        } else if (data.status !== "PENDING") {
          // Terminal non-PAID state — stop polling
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        // Network error — keep polling
      }
    }

    intervalRef.current = setInterval(poll, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const terminal = status !== "PENDING";

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3"
    >
      {/* Animated dot */}
      <span
        className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
          status === "PAID"
            ? "bg-crow-success"
            : terminal
              ? "bg-crow-danger"
              : "animate-pulse bg-crow-warn"
        }`}
      />
      <span className={`text-[13px] font-medium ${TONE[status]}`}>
        {LABEL[status]}
      </span>
      {!terminal && (
        <span className="ml-auto text-[11px] text-crow-muted">
          actualizando cada 5 s
        </span>
      )}
      {status === "PAID" && settled && (productSlug ?? false) && (
        <a
          href={accessPath(productSlug!, productType)}
          className="ml-auto text-[12px] text-crow-glow underline"
        >
          Ir al producto →
        </a>
      )}
    </div>
  );
}
