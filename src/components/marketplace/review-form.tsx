"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { createReviewAction } from "@/server/actions/buyer";
import { initialActionState } from "@/lib/validation";
import { cn } from "@/lib/utils";

export function ReviewForm({
  productId,
  canReview,
  isAuthenticated,
}: {
  productId: string;
  canReview: boolean;
  isAuthenticated: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    createReviewAction,
    initialActionState,
  );

  if (!isAuthenticated) {
    return (
      <div className="crow-surface p-4 text-[12.5px] text-crow-muted">
        Inicia sesión y compra el producto para dejar tu valoración.
      </div>
    );
  }

  if (!canReview && !state.ok) {
    return (
      <div className="crow-surface p-4 text-[12.5px] text-crow-muted">
        Solo los compradores pueden valorar este producto.
      </div>
    );
  }

  return (
    <form action={formAction} className="crow-surface space-y-4 p-4">
      <input type="hidden" name="productId" value={productId} />
      <Field label="Valoración">
        <Select name="rating" defaultValue="5">
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} {"★".repeat(value)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Tu opinión">
        <Textarea
          name="comment"
          required
          minLength={4}
          placeholder="¿Qué te aportó el producto?"
        />
      </Field>
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Publicando…" : "Publicar review"}
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
  );
}