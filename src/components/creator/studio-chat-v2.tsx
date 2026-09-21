"use client";

/**
 * StudioChatV2 — Unified conversational interface for CROW Creator Studio.
 *
 * Single input handles everything:
 * - First message starts discovery
 * - Follow-up answers advance gathering
 * - Proposal is shown as a card
 * - Actions (generate, materialize, publish) are inline buttons
 * - Blueprint changes via natural language
 */

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { StudioMessage, WorkingState } from "@/components/creator/use-studio-v2";
import type { ConversationPhase } from "@/lib/ai/converse";
import type { ProposalSummary } from "@/lib/ai/converse";

// ─── Phase label ──────────────────────────────────────────────────────────

const PHASE_LABEL: Record<ConversationPhase, string> = {
  DISCOVERY:  "Escuchando tu idea",
  GATHERING:  "Definiendo el producto",
  READY:      "Propuesta lista",
  GENERATING: "Generando blueprint",
  REFINING:   "Ajustando producto",
};

const PHASE_TONE: Record<ConversationPhase, "warn" | "success" | "violet" | "default"> = {
  DISCOVERY:  "default",
  GATHERING:  "warn",
  READY:      "violet",
  GENERATING: "violet",
  REFINING:   "success",
};

// ─── Proposal card ────────────────────────────────────────────────────────

function ProposalCard({ summary }: { summary: ProposalSummary }) {
  return (
    <div className="rounded-2xl border border-crow-violet/30 bg-crow-violet/10 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{summary.emoji}</span>
        <div>
          <p className="text-[14px] font-semibold text-crow-text">{summary.title}</p>
          <p className="mt-0.5 text-[12px] text-crow-muted">{summary.format} · {summary.audience}</p>
        </div>
      </div>

      {/* Structure stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Módulos", value: summary.modules },
          { label: "Lecciones", value: summary.lessons },
          { label: "Precio", value: `${summary.price} USDT` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-crow-muted">{label}</p>
            <p className="mt-1 text-[16px] font-semibold text-crow-text">{value}</p>
          </div>
        ))}
      </div>

      {/* Multimedia breakdown */}
      <div className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 space-y-2">
        <p className="text-[10.5px] uppercase tracking-wider text-crow-muted mb-2">Multimedia</p>
        {[
          { icon: "🖼️", label: "Portada profesional", enabled: true },
          { icon: "🖼️", label: `~${summary.imagesEstimate} imágenes de lecciones`, enabled: summary.imagesEstimate > 0 },
          { icon: "🎥", label: summary.videosEnabled ? `🎥 ${summary.videosEstimate} videos recomendados` : "Videos: pendiente de proveedor", enabled: summary.videosEnabled, dim: !summary.videosEnabled },
          { icon: "🧩", label: `${summary.exercisesTotal} ejercicios prácticos`, enabled: summary.exercisesTotal > 0 },
          { icon: "🧠", label: `${summary.quizzesTotal} evaluaciones con feedback`, enabled: summary.quizzesTotal > 0 },
          { icon: "📦", label: `${summary.resourcesTotal} recursos descargables`, enabled: summary.resourcesTotal > 0 },
          { icon: "🏆", label: "Certificado digital al completar", enabled: summary.certificateEnabled },
        ].map(({ icon, label, enabled, dim }) => (
          <div key={label} className={cn("flex items-center gap-2 text-[12.5px]", dim ? "opacity-40" : "")}>
            <span className={enabled && !dim ? "text-crow-success" : "text-crow-muted"}>
              {enabled && !dim ? "✓" : "·"}
            </span>
            <span className="mr-1">{icon}</span>
            <span className={enabled && !dim ? "text-crow-text" : "text-crow-muted"}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────

function MessageBubble({
  message,
  onAction,
  working,
}: {
  message: StudioMessage;
  onAction: (key: string) => void;
  working: WorkingState;
}) {
  if (message.role === "proposal") {
    return (
      <div className="flex justify-start">
        <div className="w-full max-w-[95%]">
          {message.content ? (
            <p className="mb-3 whitespace-pre-line text-[13px] leading-relaxed text-crow-text">
              {message.content}
            </p>
          ) : null}
          {message.proposalSummary ? (
            <ProposalCard summary={message.proposalSummary} />
          ) : null}
        </div>
      </div>
    );
  }

  if (message.role === "action") {
    return (
      <div className="flex justify-start">
        <Button
          onClick={() => onAction(message.actionKey!)}
          disabled={!!working}
          className="mt-1 bg-gradient-to-r from-crow-violet to-crow-glow text-white shadow-[0_0_24px_-8px_rgba(106,0,255,0.7)]"
        >
          {working ? "Trabajando…" : message.actionLabel}
        </Button>
      </div>
    );
  }

  if (message.role === "system") {
    return (
      <div className="flex justify-center">
        <p className="rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-1.5 text-[11.5px] text-crow-muted">
          {message.content}
        </p>
      </div>
    );
  }

  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-[13px] leading-relaxed",
          isUser
            ? "bg-gradient-to-br from-crow-violet to-crow-violetDeep text-white"
            : "border border-white/[0.08] bg-white/[0.03] text-crow-text",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────

function TypingIndicator({ working }: { working: WorkingState }) {
  const labels: Record<NonNullable<WorkingState>, string> = {
    thinking:     "CROW está pensando…",
    generating:   "Generando blueprint completo con IA…",
    materializing:"Creando el producto en CROW…",
    publishing:   "Publicando en CROW Market…",
  };
  if (!working) return null;
  return (
    <div className="flex items-center gap-2 px-1 text-[12px] text-crow-muted">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-crow-violet"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      {labels[working]}
    </div>
  );
}

// ─── Quick suggestions ────────────────────────────────────────────────────

const SUGGESTIONS_INITIAL = [
  "Quiero crear un curso de trading para principiantes",
  "Quiero un curso de fotografía desde cero",
  "Haceme un curso de marketing digital",
  "Quiero un ebook sobre productividad",
];

const SUGGESTIONS_REFINING = [
  "Agregale más ejercicios prácticos",
  "Hacelo más avanzado",
  "Cambiá el precio a 59 USDT",
  "Sumale un módulo de casos reales",
  "Quitá los videos",
];

// ─── Main component ───────────────────────────────────────────────────────

export function StudioChatV2({
  messages,
  input,
  onInputChange,
  onSend,
  onAction,
  working,
  phase,
  provider,
  mode,
  hasBlueprint,
}: {
  messages: StudioMessage[];
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onAction: (key: string) => void;
  working: WorkingState;
  phase: ConversationPhase;
  provider: string;
  mode: "live" | "skeleton";
  hasBlueprint: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const isLoading = Boolean(working);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, working]);

  // Focus input after response
  useEffect(() => {
    if (!working) inputRef.current?.focus();
  }, [working]);

  const suggestions = hasBlueprint ? SUGGESTIONS_REFINING : SUGGESTIONS_INITIAL;

  const placeholder = phase === "DISCOVERY"
    ? "Describí tu idea de producto…"
    : phase === "GATHERING"
      ? "Respondé la pregunta de CROW…"
      : phase === "READY"
        ? "Escribí 'sí' para generar o pedí cambios…"
        : "Pedí cambios: estructura, precio, módulos…";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0D0D10]">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-crow-violet/30 bg-crow-violet/15 text-crow-glow text-lg">
            🤖
          </span>
          <div>
            <p className="text-[13px] font-medium text-crow-text">CROW Studio</p>
            <p className="text-[11px] text-crow-muted">Orquestador de productos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={PHASE_TONE[phase]}>
            {PHASE_LABEL[phase]}
          </Badge>
          <Badge tone={mode === "live" ? "success" : "warn"} dot>
            {mode === "live" ? provider : "esqueleto"}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">

        {/* Welcome state */}
        {messages.length === 0 ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="text-[13px] font-medium text-crow-text">Hola, soy CROW</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-crow-muted">
                Contame qué querés crear. Puede ser un curso, un ebook, un kit de recursos o cualquier infoproducto. Yo me encargo del resto.
              </p>
              <p className="mt-2 text-[11.5px] text-crow-muted">
                Podés decirle algo como: <span className="text-crow-text">&quot;Quiero crear un curso de fotografía para principiantes&quot;</span>
              </p>
            </div>
            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS_INITIAL.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onInputChange(s)}
                  className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[11.5px] text-crow-muted transition hover:border-crow-violet/40 hover:text-crow-text"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Message list */}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onAction={onAction}
            working={working}
          />
        ))}

        {/* Loading indicator */}
        {working ? <TypingIndicator working={working} /> : null}
      </div>

      {/* Input area */}
      <div className="border-t border-white/[0.06] p-4 space-y-3">

        {/* Contextual quick suggestions */}
        {messages.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 3).map((s) => (
              <button
                key={s}
                type="button"
                disabled={isLoading}
                onClick={() => onInputChange(s)}
                className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] text-crow-muted transition hover:text-crow-text disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}

        {/* Main input */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            disabled={isLoading}
            placeholder={placeholder}
            className="crow-input flex-1"
          />
          <Button
            onClick={onSend}
            disabled={isLoading || input.trim().length < 2}
            className="shrink-0"
          >
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              "Enviar"
            )}
          </Button>
        </div>

        {/* Phase hint */}
        <p className="text-[10.5px] text-crow-muted">
          {phase === "DISCOVERY" && "Describí tu idea en lenguaje natural. No necesitás comandos."}
          {phase === "GATHERING" && "CROW te hace preguntas una a la vez. Respondé con naturalidad."}
          {phase === "READY" && "Revisá la propuesta y confirmá para que CROW genere el producto completo."}
          {phase === "GENERATING" && "Generando el blueprint completo…"}
          {phase === "REFINING" && "El blueprint está listo. Pedí cambios o avanzá a crear el producto."}
        </p>
      </div>
    </div>
  );
}
