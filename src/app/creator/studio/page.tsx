import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StudioWorkspace } from "@/components/creator/studio-workspace";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import { providerStatus } from "@/lib/ai/providers";
import { getPlanUsage } from "@/server/services/creator";
import { formatUsdt } from "@/lib/utils";

export const metadata = { title: "Creator Studio" };

export default async function CreatorStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ idea?: string; error?: string }>;
}) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (!user) return null;

  const usage = await getPlanUsage(user.id);
  const providers = providerStatus();

  return (
    <DashboardShell
      title="Creator Studio"
      description="Escribe una idea y CROW la convierte en un producto digital completo, editable y listo para publicar."
      activePath="/creator/studio"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="violet">
            Plan {usage.plan.name} · {usage.used}/{usage.plan.productLimit} productos
          </Badge>
          <Badge tone="default">
            {usage.published}/{usage.plan.publishedLimit} publicados
          </Badge>
          <Badge tone={providers.conversational.some((p) => p.configured) ? "success" : "warn"} dot>
            {providers.conversational.some((p) => p.configured)
              ? "IA en vivo"
              : "Modo demo IA"}
          </Badge>
        </div>
      }
    >
      {params.error ? (
        <p className="mb-5 rounded-xl border border-crow-warn/30 bg-crow-warn/10 px-4 py-3 text-[12.5px] text-crow-warn">
          {params.error === "blueprint"
            ? "No se pudo leer el blueprint. Genera de nuevo el producto."
            : params.error}
        </p>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="crow-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-crow-muted">
            Proveedor conversacional
          </p>
          <p className="mt-1.5 text-[13px] text-crow-text">
            {providers.conversational
              .map((provider) =>
                provider.configured ? `${provider.label} ✓` : `${provider.label} (sin clave)`,
              )
              .join(" · ")}
          </p>
        </div>
        <div className="crow-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-crow-muted">
            Multimedia
          </p>
          <p className="mt-1.5 text-[13px] text-crow-text">
            {providers.multimedia.configured
              ? `${providers.multimedia.label} ✓`
              : "Leonardo (sin clave) · portadas degradadas"}
          </p>
        </div>
        <div className="crow-card p-4">
          <p className="text-[11px] uppercase tracking-wider text-crow-muted">
            Precio base sugerido
          </p>
          <p className="mt-1.5 text-[13px] text-crow-text">
            {formatUsdt(39)} — editable en cada blueprint
          </p>
        </div>
      </div>

      <StudioWorkspace initialIdea={params.idea ?? ""} />
    </DashboardShell>
  );
}