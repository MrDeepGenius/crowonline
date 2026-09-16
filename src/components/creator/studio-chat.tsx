"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_TYPES, type ProductType } from "@/lib/domain";
import { cn } from "@/lib/utils";

export type StudioMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

const QUICK_PROMPTS = [
  "Hazlo más premium y sube el precio",
  "Añade un módulo de plan de acción",
  "Refuerza los ejercicios prácticos",
  "Dame la estrategia de afiliados",
];

export function StudioChat({
  messages,
  input,
  onInputChange,
  onSend,
  onGenerate,
  loading,
  working,
  provider,
  mode,
  idea,
  onIdeaChange,
  format,
  onFormatChange,
  hasBlueprint,
}: {
  messages: StudioMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onGenerate: () => void;
  loading: boolean;
  working: "generate" | "materialize" | "publish" | null;
  provider: string;
  mode: "live" | "demo";
  idea: string;
  onIdeaChange: (value: string) => void;
  format: ProductType;
  onFormatChange: (value: ProductType) => void;
  hasBlueprint: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, loading]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0D0D10]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-crow-violet/30 bg-crow-violet/15 text-crow-glow">
            
          </span>
          <div>
            <p className="text-[13px] font-medium text-crow-text">
              CROW Studio · IA
            </p>
            <p className="text-[11px] text-crow-muted">
              IDEA → IA → PRODUCTO
            </p>
          </div>
        </div>
        <Badge tone={mode === "live" ? "success" : "warn"} dot>
          {mode === "live" ? provider : `${provider} · demo`}
        </Badge>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {!messages.length ? (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-[12.5px] leading-relaxed text-crow-muted">
              Describe tu idea y CROW generará el producto completo: título,
              promesa, público, módulos, lecciones, ejercicios y estrategia
              comercial. Después podrás editarlo todo.
            </p>
            <p className="mt-3 text-[11.5px] text-crow-muted">
              Ejemplo: “Quiero crear un curso para aprender marketing digital desde
              cero.”
            </p>
          </div>
        ) : null}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[92%] whitespace-pre-line rounded-2xl px-4 py-3 text-[13px] leading-relaxed",
                message.role === "user"
                  ? "bg-gradient-to-br from-crow-violet to-crow-violetDeep text-white"
                  : message.role === "system"
                    ? "border border-crow-warn/30 bg-crow-warn/10 text-crow-warn"
                    : "border border-white/[0.08] bg-white/[0.03] text-crow-text",
              )}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex items-center gap-2 px-1 text-[12px] text-crow-muted">
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-crow-violet" />
            CROW está trabajando en tu producto…
          </div>
        ) : null}
      </div>

      <div className="border-t border-white/[0.06] p-4">
        <p className="mb-2 text-[11px] uppercase tracking-wider text-crow-muted">
          Formato del producto
        </p>
        <div className="mb-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {PRODUCT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onFormatChange(type)}
              className={cn(
                "rounded-lg border px-2 py-1.5 text-[10.5px] font-medium transition",
                format === type
                  ? "border-crow-violet/60 bg-crow-violet/15 text-crow-glow shadow-[0_0_18px_-6px_rgba(106,0,255,0.8)]"
                  : "border-white/[0.08] bg-white/[0.02] text-crow-muted hover:text-crow-text",
              )}
            >
              {type.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="mb-3 space-y-2">
          <Textarea
            value={idea}
            onChange={(event) => onIdeaChange(event.target.value)}
            placeholder="Quiero crear un curso para aprender marketing digital desde cero."
            className="min-h-[76px]"
          />
          <Button onClick={onGenerate} disabled={loading || idea.trim().length < 6} className="w-full">
            {working === "generate"
              ? "Generando con IA…"
              : hasBlueprint
                ? "Regenerar blueprint"
                : "Generar producto con IA"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={!hasBlueprint || loading}
              onClick={() => onInputChange(prompt)}
              className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] text-crow-muted transition hover:text-crow-text disabled:opacity-40"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            disabled={!hasBlueprint || loading}
            placeholder={
              hasBlueprint
                ? "Pide cambios: estructura, precio, ejercicios…"
                : "Genera el blueprint para conversar"
            }
            className="crow-input"
          />
          <Button onClick={onSend} disabled={!hasBlueprint || loading || input.trim().length < 2}>
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}