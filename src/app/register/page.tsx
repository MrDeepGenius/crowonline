import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";
import { getSession } from "@/lib/auth/session";
import { isGoogleConfigured } from "@/lib/auth/google";

export const metadata = { title: "Crear cuenta" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; ref?: string }>;
}) {
  const [params, store, session] = await Promise.all([
    searchParams,
    cookies(),
    getSession(),
  ]);
  if (session) redirect("/dashboard");

  const referralCode = params.ref ?? store.get("crow_ref")?.value;

  return (
    <AuthLayout
      title="Crear mi cuenta gratis"
      subtitle="Elige cómo quieres usar CROW. Puedes activar más roles después desde tu perfil."
      badge="Sin tarjeta · Configúralo en 30 segundos"
      footer={
        <p className="text-center text-[11px] leading-relaxed text-crow-muted">
          Al crear tu cuenta aceptas la distribución comercial de CROW: 45% creator ·
          10% plataforma · 30% afiliado directo · niveles L1-L5.
        </p>
      }
    >
      <RegisterForm defaultPlan={params.plan} referralCode={referralCode} googleEnabled={isGoogleConfigured()} />
    </AuthLayout>
  );
}