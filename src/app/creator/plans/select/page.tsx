import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlanUsage } from "@/server/services/creator";
import { selectCreatorPlanAction } from "@/server/actions/creator-edit";
import { CREATOR_PLANS } from "@/lib/plans";
import { formatUsdt } from "@/lib/utils";

export const metadata = { title: "Cambiar plan" };

export default async function PlanSelectPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (!user) return null;

  const usage = await getPlanUsage(user.id);
  const requested = CREATOR_PLANS.find((plan) => plan.id === params.plan) ?? usage.plan;

  return (
    <DashboardShell
      title={`Confirmar plan ${requested.name}`}
      description="Revisa las condiciones antes de activar el plan. El pago se realiza en USDT y queda pendiente de aprobación."
      activePath="/creator/plans"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <Card>
          <CardHeader
            title={`${requested.name} · ${formatUsdt(requested.priceUsdt)}`}
            description={`${requested.durationLabel} · ${requested.tagline}`}
          />
          <ul className="space-y-2.5 text-[13px] text-crow-muted">
            <li>
              <span className="text-crow-text">{requested.productLimit}</span>{" "}
              infoproductos permitidos
            </li>
            <li>
              <span className="text-crow-text">{requested.publishedLimit}</span>{" "}
              productos publicados simultáneamente
            </li>
            {requested.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>

          <form action={selectCreatorPlanAction} className="mt-6">
            <input type="hidden" name="plan" value={requested.id} />
            <Button type="submit" className="w-full">
              Solicitar plan {requested.name}
            </Button>
          </form>

          <p className="mt-4 text-[11.5px] leading-relaxed text-crow-muted">
            Al solicitar el plan se registra una transacción de tipo PLAN en estado
            PENDING. El equipo CROW verifica el pago en USDT BEP-20 y activa los
            límites.
          </p>
        </Card>

        <Card>
          <CardHeader title="Situación actual" description="Plan activo y consumo" />
          <div className="space-y-4 text-[12.5px]">
            <div className="flex items-center justify-between">
              <span className="text-crow-muted">Plan actual</span>
              <span className="text-crow-text">{usage.plan.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-crow-muted">Infoproductos</span>
              <span className="text-crow-text">
                {usage.used}/{usage.plan.productLimit}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-crow-muted">Publicados</span>
              <span className="text-crow-text">
                {usage.published}/{usage.plan.publishedLimit}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-crow-muted">Vigencia</span>
              <span className="text-crow-text">
                {usage.subscription
                  ? new Date(usage.subscription.expiresAt ?? Date.now()).toLocaleDateString("es-ES")
                  : "—"}
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 text-[11.5px] leading-relaxed text-crow-muted">
            Distribución por venta (fija): Creator 45% · CROW 10% · Afiliado directo
            30% · L1 5% · L2 3% · L3 2% · L4 2% · L5 1%.
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}