import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/auth/session";
import { isGoogleConfigured } from "@/lib/auth/google";
import { redirect } from "next/navigation";

export const metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, session] = await Promise.all([searchParams, getSession()]);
  if (session) redirect(next && next.startsWith("/") ? next : "/dashboard");

  return (
    <AuthLayout
      title="Entra a tu cuenta"
      subtitle="Accede al marketplace, tu Creator Studio, tus afiliados y tu wallet en USDT."
      badge="CROW MARKET"
      footer={
        <div className="crow-surface p-4 text-[11.5px] leading-relaxed text-crow-muted">
          <p className="font-medium text-crow-text">Cuentas de demo del seed</p>
          <p className="mt-1.5">
            creator@crow.market · affiliate@crow.market · admin@crow.market — password{" "}
            <span className="text-crow-glow">crow12345</span>
          </p>
        </div>
      }
    >
      <LoginForm next={next} googleEnabled={isGoogleConfigured()} />
    </AuthLayout>
  );
}