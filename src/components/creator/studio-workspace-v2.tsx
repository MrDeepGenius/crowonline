"use client";

/**
 * StudioWorkspaceV2 — Full conversational Creator Studio.
 *
 * Left panel:  StudioChatV2 — single input, all phases
 * Right panel: Blueprint editor tabs (Brief / Structure / Assets / Quality / Preview)
 *
 * All orchestration lives in useStudioV2.
 */

import { useState } from "react";
import Link from "next/link";

import { useStudioV2 } from "@/components/creator/use-studio-v2";
import { StudioChatV2 } from "@/components/creator/studio-chat-v2";
import { BriefCard } from "@/components/creator/brief-card";
import { ModulesEditor } from "@/components/creator/modules-editor";
import { ListsCard, QualityCard } from "@/components/creator/quality-card";
import { StudioPreview } from "@/components/creator/studio-preview";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { blueprintStats } from "@/lib/ai/blueprint";

const TABS = [
  { id: "brief",     label: "Brief" },
  { id: "structure", label: "Estructura" },
  { id: "assets",    label: "Listas" },
  { id: "quality",   label: "Quality" },
  { id: "preview",   label: "Preview" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// Map WorkingState to the legacy StudioPreview working prop
function toPreviewWorking(
  w: ReturnType<typeof useStudioV2>["working"],
): "generate" | "materialize" | "publish" | null {
  if (w === "materializing") return "materialize";
  if (w === "publishing")    return "publish";
  return null;
}

export function StudioWorkspaceV2({ initialIdea: _initialIdea = "" }: { initialIdea?: string }) {
  const studio = useStudioV2();
  const [tab, setTab] = useState<TabId>("brief");
  const { blueprint } = studio;

  // Auto-switch to preview tab once product is materialized
  const hasProduct = Boolean(studio.productId);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      {/* ── Left: Chat ──────────────────────────────────────────────────────── */}
      <div className="xl:sticky xl:top-24 xl:h-[calc(100vh-7.5rem)]">
        <StudioChatV2
          messages={studio.messages}
          input={studio.input}
          onInputChange={studio.setInput}
          onSend={studio.send}
          onAction={studio.handleAction}
          working={studio.working}
          phase={studio.phase}
          provider={studio.provider}
          mode={studio.mode}
          hasBlueprint={Boolean(blueprint)}
        />
      </div>

      {/* ── Right: Blueprint editor ──────────────────────────────────────── */}
      <div className="space-y-5">

        {/* Error banner */}
        {studio.error ? (
          <p className="rounded-xl border border-crow-danger/30 bg-crow-danger/10 px-4 py-3 text-[12.5px] text-crow-danger">
            {studio.error}
          </p>
        ) : null}

        {/* Product published banner */}
        {studio.productStatus === "PUBLISHED" && studio.productSlug ? (
          <div className="flex items-center justify-between rounded-xl border border-crow-success/30 bg-crow-success/10 px-4 py-3">
            <p className="text-[12.5px] text-crow-success">
              Publicado en CROW Market
            </p>
            <a
              href={`/marketplace/${studio.productSlug}`}
              className="text-[12px] text-crow-success underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver en marketplace →
            </a>
          </div>
        ) : null}

        {/* Image generation notice */}
        {studio.imageGenStatus === "started" && (
          <p className="rounded-xl border border-crow-violet/20 bg-crow-violet/10 px-4 py-3 text-[12px] text-crow-glow">
            Leonardo está generando portada e imágenes de lecciones en background ✓
          </p>
        )}

        {/* Empty state */}
        {!blueprint ? (
          <Card className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <span className="text-4xl">💬</span>
            <h3 className="mt-4 text-[15px] font-semibold">Blueprint en vivo</h3>
            <p className="mt-2 max-w-sm text-[12.5px] leading-relaxed text-crow-muted">
              Contale a CROW qué querés crear. Él te va a guiar con preguntas, va a proponer la estructura y va a generar el producto completo.
            </p>
            <p className="mt-3 text-[11.5px] text-crow-muted">
              Ejemplo: &quot;Quiero un curso de trading para principiantes&quot;
            </p>
          </Card>
        ) : (
          <>
            {/* Blueprint header */}
            <Card className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-crow-muted">
                  Blueprint · paso {studio.step}/5
                </p>
                <h2 className="mt-1 truncate text-[16px] font-semibold">
                  {blueprint.title}
                </h2>
                <p className="mt-1 text-[11.5px] text-crow-muted">
                  {blueprint.productType} · {blueprint.category} ·{" "}
                  {blueprint.recommendedPriceUsdt} USDT
                  {studio.productStatus ? ` · ${studio.productStatus}` : ""}
                  {(() => {
                    const stats = blueprintStats(blueprint);
                    return ` · ${stats.modules} módulos · ${stats.lessons} lecciones`;
                  })()}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={studio.mode === "live" ? "success" : "warn"}>
                  {studio.mode === "live" ? studio.provider : "esqueleto"}
                </Badge>
                {hasProduct ? (
                  <Link
                    href={`/creator/products/${studio.productId}`}
                    className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-[11.5px] text-crow-muted transition hover:text-crow-text"
                  >
                    Edición avanzada →
                  </Link>
                ) : null}
              </div>
            </Card>

            {/* Tab bar */}
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1.5">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "rounded-lg px-3.5 py-2 text-[12.5px] transition",
                    tab === item.id
                      ? "bg-crow-violet/15 text-crow-glow"
                      : "text-crow-muted hover:text-crow-text",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === "brief" ? (
              <BriefCard blueprint={blueprint} onChange={studio.setBlueprint} />
            ) : null}
            {tab === "structure" ? (
              <ModulesEditor blueprint={blueprint} onChange={studio.setBlueprint} />
            ) : null}
            {tab === "assets" ? (
              <ListsCard blueprint={blueprint} onChange={studio.setBlueprint} />
            ) : null}
            {tab === "quality" ? (
              <QualityCard blueprint={blueprint} />
            ) : null}
            {tab === "preview" ? (
              <StudioPreview
                blueprint={blueprint}
                format={blueprint.productType}
                working={toPreviewWorking(studio.working)}
                productId={studio.productId}
                productSlug={studio.productSlug}
                productStatus={studio.productStatus}
                onMaterialize={studio.materialize}
                onPublish={studio.publish}
                onBlueprintChange={studio.setBlueprint}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
