import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PlanCards } from "@/components/landing/plans-grid";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlanUsage } from "@/server/services/creator";
import { CREATOR_PLANS } from "@/lib/plans";
import { formatUsdt } from "@/lib/utils";

export const metadata = { title: "Planes Creator" };

export default async function CreatorPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; updated?: string; error?: string }>;
}) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (!user) redirect("/login");

  const usage = await getPlanUsage(user.id);

  return (
    <DashboardShell
      title="Planes Creator"
      description="Elige la capacidad de tu cuenta: infoproductos permitidos, publicaciones activas y duración."
      activePath="/creator/plans"
      action={<Badge tone="violet">Plan actual: {usage.plan.name}</Badge>}
    >
      {params.error ? (
        <p className="mb-5 rounded-xl border border-crow-warn/30 bg-crow-warn/10 px-4 py-3 text-[12.5px] text-crow-warn">
          {params.error}
        </p>
      ) : null}

      {params.updated ? (
        <p className="mb-5 rounded-xl border border-crow-success/30 bg-crow-success/10 px-4 py-3 text-[12.5px] text-crow-success">
          Plan {params.plan} registrado. El pago queda pendiente de aprobación del
          equipo CROW.
        </p>
      ) : null}

      {usage.expired ? (
        <p className="mb-5 rounded-xl border border-crow-warn/30 bg-crow-warn/10 px-4 py-3 text-[12.5px] text-crow-warn">
          Tu suscripción anterior venció. Selecciona un plan para reactivar tus
          límites de creación y publicación.
        </p>
      ) : null}

      <PlanCards
        highlightPlan={usage.plan.id}
        ctaHref="/creator/plans/select"
        ctaLabel="Seleccionar"
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Detalle de los planes"
            description="Configuración comercial de CROW"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead className="text-[11px] uppercase tracking-wider text-crow-muted">
                <tr>
                  <th className="py-2">Plan</th>
                  <th className="py-2">Precio</th>
                  <th className="py-2">Productos</th>
                  <th className="py-2">Publicados</th>
                  <th className="py-2">Duración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {CREATOR_PLANS.map((plan) => (
                  <tr key={plan.id} className={plan.id === usage.plan.id ? "text-crow-glow" : ""}>
                    <td className="py-2.5 font-medium">{plan.name}</td>
                    <td className="py-2.5">{formatUsdt(plan.priceUsdt)}</td>
                    <td className="py-2.5">{plan.productLimit}</td>
                    <td className="py-2.5">{plan.publishedLimit}</td>
                    <td className="py-2.5">{plan.durationLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Cómo funciona el cambio de plan"
            description="Proceso manual y transparente"
          />
          <ol className="space-y-4">
            {[
              "Selecciona el plan que quieres usar. CROW registra la solicitud.",
              "El pago se realiza en USDT (BEP-20) al equipo CROW.",
              "ADMIN aprueba el pago y el plan queda activo con sus límites.",
              "Los límites se aplican de inmediato en el Creator Studio.",
            ].map((step, index) => (
              <li key={step} className="flex gap-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-crow-violet/30 bg-crow-violet/10 text-[11px] text-crow-glow">
                  {index + 1}
                </span>
                <p className="text-[12.5px] leading-relaxed text-crow-muted">{step}</p>
              </li>
            ))}
          </ol>
          <p className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 text-[11.5px] leading-relaxed text-crow-muted">
            Distribución por venta: Creator 45% · CROW 10% · Afiliado directo 30% ·
            L1 5% · L2 3% · L3 2% · L4 2% · L5 1%. El Emergency Reserve no forma
            parte de la distribución permanente.
          </p>
        </Card>
      </div>
    </DashboardShell>
  );
}