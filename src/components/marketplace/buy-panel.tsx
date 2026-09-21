"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonClass } from "@/components/ui/button";
import { purchaseProductAction } from "@/server/actions/buyer";
import { initialActionState } from "@/lib/validation";
import { cn, formatUsdt } from "@/lib/utils";

export function BuyPanel({
  productId,
  priceUsdt,
  compareAt,
  isAuthenticated,
  owned,
  referralCode,
}: {
  productId: string;
  priceUsdt: number;
  compareAt?: number | null;
  isAuthenticated: boolean;
  owned: boolean;
  referralCode?: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    purchaseProductAction,
    initialActionState,
  );

  return (
    <div className="mp-card mp-card-hover sticky top-24 rounded-2xl p-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-crow-muted">
            Precio
          </p>
          <p className="mp-display mt-1 text-3xl font-semibold text-crow-text">
            {formatUsdt(priceUsdt)}
          </p>
        </div>
        {compareAt && compareAt > priceUsdt ? (
          <span className="text-[13px] text-crow-muted line-through">
            {formatUsdt(compareAt)}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-[12px] text-crow-muted">
        Pago único en USDT (BEP-20). Acceso inmediato a la biblioteca y certificado
        al completar.
      </p>

      {owned ? (
        <Link
          href={`/library`}
          className={cn(buttonClass("secondary", "md"), "mt-6 w-full")}
        >
          Ya es tuyo · Ir a mi biblioteca
        </Link>
      ) : isAuthenticated ? (
        <form action={formAction} className="mt-6 space-y-3">
          <input type="hidden" name="productId" value={productId} />
          {referralCode ? (
            <input type="hidden" name="referralCode" value={referralCode} />
          ) : null}
          <Button
            type="submit"
            size="lg"
            className="mp-btn-primary w-full bg-gradient-to-r from-crow-violet to-crow-glow"
            disabled={pending}
          >
            {pending ? "Creando orden…" : "Comprar ahora"}
          </Button>
          {state.message ? (
            <p
              className={cn(
                "rounded-lg border px-3 py-2 text-[12px]",
                state.ok
                  ? "border-crow-success/30 bg-crow-success/10 text-crow-success"
                  : "border-crow-danger/30 bg-crow-danger/10 text-crow-danger",
              )}
            >
              {state.message}
            </p>
          ) : null}
        </form>
      ) : (
        <Link href="/login" className={cn(buttonClass("primary", "md"), "mt-6 w-full")}>
          Iniciar sesión para comprar
        </Link>
      )}

      <ul className="mt-6 space-y-2.5 border-t border-white/[0.06] pt-5 text-[12.5px] text-crow-muted">
        {[
          "Acceso de por vida al contenido",
          "Progreso guardado por lección",
          "Certificado digital verificable",
          "Compatible con el programa de afiliados",
        ].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-crow-violet" />
            {item}
          </li>
        ))}
      </ul>

      {referralCode ? (
        <p className="mt-5 rounded-lg border border-crow-violet/25 bg-crow-violet/10 px-3 py-2 text-[11.5px] text-crow-glow">
          Referido activo: {referralCode.toUpperCase()} · el afiliado recibirá su
          comisión al confirmarse el pago.
        </p>
      ) : null}
    </div>
  );
}