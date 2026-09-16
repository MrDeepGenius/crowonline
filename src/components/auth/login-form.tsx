"use client";

import Link from "next/link";
import { useActionState } from "react";

import { ErrorBox, FieldError } from "@/components/auth/auth-fields";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { loginAction } from "@/lib/auth/actions";
import { initialActionState } from "@/lib/validation";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div>
        <Field label="Email">
          <Input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@email.com"
          />
        </Field>
        <FieldError errors={state.fieldErrors?.email} />
      </div>

      <div>
        <Field label="Contraseña">
          <Input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </Field>
        <FieldError errors={state.fieldErrors?.password} />
      </div>

      <ErrorBox message={state.message} />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Entrando…" : "Entrar a CROW"}
      </Button>

      <p className="text-center text-[12.5px] text-crow-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-crow-glow hover:text-crow-text">
          Crear mi cuenta gratis →
        </Link>
      </p>
    </form>
  );
}