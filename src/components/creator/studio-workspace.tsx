"use client";

import { useState } from "react";

import { BriefCard } from "@/components/creator/brief-card";
import { ModulesEditor } from "@/components/creator/modules-editor";
import { ListsCard, QualityCard } from "@/components/creator/quality-card";
import { StudioChat } from "@/components/creator/studio-chat";
import { useStudio } from "@/components/creator/use-studio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveStudioDraftAction } from "@/server/actions/creator";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "brief", label: "Brief" },
  { id: "structure", label: "Estructura" },
  { id: "assets", label: "Listas" },
  { id: "quality", label: "Quality" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function StudioWorkspace({ initialIdea = "" }: { initialIdea?: string }) {
  const studio = useStudio(initialIdea);
  const [tab, setTab] = useState<TabId>("brief");
  const { blueprint } = studio;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div className="xl:sticky xl:top-24 xl:h-[calc(100vh-7.5rem)]">
        <StudioChat
          messages={studio.messages}
          input={studio.input}
          onInputChange={studio.setInput}
          onSend={studio.send}
          onGenerate={studio.generate}
          loading={studio.loading}
          provider={studio.provider}
          mode={studio.mode}
          idea={studio.idea}
          onIdeaChange={studio.setIdea}
          hasBlueprint={Boolean(blueprint)}
        />
      </div>

      <div className="space-y-5">
        {studio.error ? (
          <p className="rounded-xl border border-crow-danger/30 bg-crow-danger/10 px-4 py-3 text-[12.5px] text-crow-danger">
            {studio.error}
          </p>
        ) : null}

        {!blueprint ? (
          <Card className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <h3 className="text-[15px] font-semibold">Live Product Blueprint</h3>
            <p className="mt-2 max-w-md text-[12.5px] leading-relaxed text-crow-muted">
              Escribe tu idea en el chat y pulsa “Generar producto con IA”. El
              blueprint aparecerá aquí, completamente editable, y se actualizará
              mientras conversas con CROW.
            </p>
          </Card>
        ) : (
          <>
            <Card className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-crow-muted">
                  Live product blueprint
                </p>
                <h2 className="mt-1 truncate text-[16px] font-semibold">
                  {blueprint.title}
                </h2>
                <p className="mt-1 text-[11.5px] text-crow-muted">
                  {blueprint.productType} · {blueprint.category} ·{" "}
                  {blueprint.recommendedPriceUsdt} USDT
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Badge tone={studio.mode === "live" ? "success" : "warn"}>
                  {studio.mode === "live" ? studio.provider : `${studio.provider} · demo`}
                </Badge>
                <form action={saveStudioDraftAction}>
                  <input type="hidden" name="idea" value={studio.idea} />
                  <input type="hidden" name="blueprint" value={JSON.stringify(blueprint)} />
                  <input type="hidden" name="provider" value={studio.provider} />
                  {studio.blueprintId ? (
                    <input type="hidden" name="blueprintId" value={studio.blueprintId} />
                  ) : null}
                  <Button type="submit">Guardar borrador y editar →</Button>
                </form>
              </div>
            </Card>

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

            {tab === "brief" ? (
              <BriefCard blueprint={blueprint} onChange={studio.setBlueprint} />
            ) : null}
            {tab === "structure" ? (
              <ModulesEditor blueprint={blueprint} onChange={studio.setBlueprint} />
            ) : null}
            {tab === "assets" ? (
              <ListsCard blueprint={blueprint} onChange={studio.setBlueprint} />
            ) : null}
            {tab === "quality" ? <QualityCard blueprint={blueprint} /> : null}
          </>
        )}
      </div>
    </div>
  );
}