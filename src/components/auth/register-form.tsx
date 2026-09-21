"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { ErrorBox, FieldError } from "@/components/auth/auth-fields";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { registerAction } from "@/lib/auth/actions";
import { ROLE_LABEL, type Role } from "@/lib/domain";
import { initialActionState } from "@/lib/validation";
import { cn } from "@/lib/utils";

const SELECTABLE_ROLES: Role[] = ["BUYER", "AFFILIATE", "CREATOR"];

const ROLE_HINT: Record<Role, string> = {
  BUYER: "Compra productos y accede a tu biblioteca",
  AFFILIATE: "Gana comisiones con tu red de 5 niveles",
  CREATOR: "Crea y vende tus productos con IA",
  ADMIN: "Acceso total a la plataforma",
};

export function RegisterForm({
  defaultPlan,
  referralCode,
  googleEnabled = true,
}: {
  defaultPlan?: string;
  referralCode?: string;
  googleEnabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(registerAction, initialActionState);
  const [selected, setSelected] = useState<Role[]>(["CREATOR", "AFFILIATE"]);

  function toggle(role: Role) {
    setSelected((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role],
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Field label="Nombre">
            <Input name="name" required placeholder="Tu nombre" />
          </Field>
          <FieldError errors={state.fieldErrors?.name} />
        </div>
        <div>
          <Field label="Email">
            <Input name="email" type="email" required placeholder="tu@email.com" />
          </Field>
          <FieldError errors={state.fieldErrors?.email} />
        </div>
      </div>

      <div>
        <Field label="Contraseña" hint="Mínimo 8 caracteres · hash bcrypt">
          <Input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
          />
        </Field>
        <FieldError errors={state.fieldErrors?.password} />
      </div>

      <div>
        <span className="crow-label">Quiero usar CROW como</span>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {SELECTABLE_ROLES.map((role) => {
            const active = selected.includes(role);
            return (
              <button
                key={role}
                type="button"
                onClick={() => toggle(role)}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  active
                    ? "border-crow-violet/50 bg-crow-violet/12"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/20",
                )}
              >
                <span
                  className={cn(
                    "block text-[12.5px] font-medium",
                    active ? "text-crow-glow" : "text-crow-text",
                  )}
                >
                  {ROLE_LABEL[role]}
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-crow-muted">
                  {ROLE_HINT[role]}
                </span>
              </button>
            );
          })}
        </div>
        {selected.map((role) => (
          <input key={role} type="hidden" name="roles" value={role} />
        ))}
        {!selected.length ? <input type="hidden" name="roles" value="BUYER" /> : null}
      </div>

      <Field
        label="Código de referido (opcional)"
        hint="Si un afiliado te invitó, entras en su equipo automáticamente."
      >
        <Input name="referralCode" defaultValue={referralCode ?? ""} placeholder="CROWAB12" />
      </Field>

      {defaultPlan ? <input type="hidden" name="plan" value={defaultPlan} /> : null}

      <ErrorBox message={state.message} />

      {googleEnabled && (
        <>
          <GoogleOAuthButton
            ref={referralCode}
            roles={selected.join(",")}
            label="Registrarme con Google"
          />
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-[11px] text-crow-muted">o con email</span>
            <span className="h-px flex-1 bg-white/[0.08]" />
          </div>
        </>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creando tu cuenta…" : "Crear mi cuenta gratis →"}
      </Button>

      <p className="text-center text-[12.5px] text-crow-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-crow-glow hover:text-crow-text">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}