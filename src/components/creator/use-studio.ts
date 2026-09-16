"use client";

import { useState } from "react";

import type { StudioMessage } from "@/components/creator/studio-chat";
import type { ProductBlueprint } from "@/lib/ai/blueprint";

let messageCounter = 0;
export function nextMessageId() {
  messageCounter += 1;
  return `m${messageCounter}-${Date.now()}`;
}

function blueprintSummary(blueprint: ProductBlueprint) {
  const lessons = blueprint.modules.flatMap((module) => module.lessons);
  return `${blueprint.modules.length} módulos · ${lessons.length} lecciones · ${blueprint.recommendedPriceUsdt} USDT sugeridos`;
}

/**
 * Studio state machine: idea → IA → blueprint, plus the conversational loop.
 * Kept separate from the UI so the panel stays presentational and testable.
 */
export function useStudio(initialIdea = "") {
  const [idea, setIdea] = useState(initialIdea);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [blueprint, setBlueprint] = useState<ProductBlueprint | null>(null);
  const [blueprintId, setBlueprintId] = useState<string | undefined>(undefined);
  const [provider, setProvider] = useState("crow-demo");
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (idea.trim().length < 6) return;
    setLoading(true);
    setError(null);
    setMessages((current) => [
      ...current,
      { id: nextMessageId(), role: "user", content: idea.trim() },
    ]);

    try {
      const response = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.trim(), persist: true }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? data.error ?? "No se pudo generar el blueprint");
        return;
      }

      const nextBlueprint = data.blueprint as ProductBlueprint;
      setBlueprint(nextBlueprint);
      setProvider(data.provider);
      setMode(data.mode);
      setBlueprintId(data.blueprintId);
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId(),
          role: "assistant",
          content: `Blueprint listo: “${nextBlueprint.title}”.\n\n${blueprintSummary(
            nextBlueprint,
          )}.\n\n${(data.notes as string[]).join(" ")}`,
        },
      ]);
    } catch {
      setError("Error de red al generar el blueprint");
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    if (!blueprint || input.trim().length < 2) return;
    const message = input.trim();
    setInput("");
    setLoading(true);
    setError(null);
    setMessages((current) => [
      ...current,
      { id: nextMessageId(), role: "user", content: message },
    ]);

    try {
      const response = await fetch("/api/studio/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, blueprint }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? data.error ?? "El asistente no respondió");
        return;
      }

      setBlueprint(data.blueprint as ProductBlueprint);
      setProvider(data.provider);
      setMode(data.mode);
      setMessages((current) => [
        ...current,
        { id: nextMessageId(), role: "assistant", content: data.reply },
      ]);
    } catch {
      setError("Error de red al conversar con el Studio");
    } finally {
      setLoading(false);
    }
  }

  return {
    idea,
    setIdea,
    input,
    setInput,
    messages,
    blueprint,
    setBlueprint,
    blueprintId,
    provider,
    mode,
    loading,
    error,
    generate,
    send,
  };
}

export type StudioState = ReturnType<typeof useStudio>;