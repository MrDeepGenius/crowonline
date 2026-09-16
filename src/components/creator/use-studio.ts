"use client";

import { useState } from "react";

import type { StudioMessage } from "@/components/creator/studio-chat";
import type { ProductBlueprint } from "@/lib/ai/blueprint";
import type { ProductType } from "@/lib/domain";

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
 * Studio state machine: IDEA → IA → BLUEPRINT → GENERACIÓN → PREVIEW → PUBLICAR.
 * Materialize/publish hablan con /api/studio/* para que el flujo viva dentro del
 * Studio sin navegar a /creator/products/[id].
 */
export function useStudio(initialIdea = "") {
  const [idea, setIdea] = useState(initialIdea);
  const [input, setInput] = useState("");
  const [format, setFormat] = useState<ProductType>("COURSE");
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [blueprint, setBlueprint] = useState<ProductBlueprint | null>(null);
  const [blueprintId, setBlueprintId] = useState<string | undefined>(undefined);
  const [provider, setProvider] = useState("crow-demo");
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState<"generate" | "materialize" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [productSlug, setProductSlug] = useState<string | null>(null);
  const [productStatus, setProductStatus] = useState<string | null>(null);

  function syncFormat(next: ProductBlueprint | null) {
    if (next) setFormat(next.productType);
  }

  function setBlueprintAndFormat(next: ProductBlueprint | null) {
    setBlueprint(next);
    syncFormat(next);
  }

  function changeFormat(next: ProductType) {
    setFormat(next);
    setBlueprint((current) =>
      current ? { ...current, productType: next } : current,
    );
  }

  async function generate() {
    if (idea.trim().length < 6) return;
    setLoading(true);
    setWorking("generate");
    setError(null);
    setNotice(null);
    setMessages((current) => [
      ...current,
      { id: nextMessageId(), role: "user", content: idea.trim() },
    ]);

    try {
      const response = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: idea.trim(),
          productType: format,
          persist: true,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? data.error ?? "No se pudo generar el blueprint");
        return;
      }

      const nextBlueprint = { ...(data.blueprint as ProductBlueprint), productType: format };
      setBlueprintAndFormat(nextBlueprint);
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
      setWorking(null);
    }
  }

  async function send() {
    if (!blueprint || input.trim().length < 2) return;
    const message = input.trim();
    setInput("");
    setLoading(true);
    setError(null);
    setNotice(null);
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

      setBlueprintAndFormat(data.blueprint as ProductBlueprint);
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

  /** GENERACIÓN: blueprint editado → Product (+ Course/Module/Lesson/Exercise). */
  async function materialize() {
    if (!blueprint) return;
    setLoading(true);
    setWorking("materialize");
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/studio/materialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: idea.trim() || "Idea sin descripción",
          blueprint,
          blueprintId,
          provider,
          productType: format,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? data.error ?? "No se pudo crear el producto");
        return;
      }

      setProductId(data.productId as string);
      setProductSlug(data.slug as string);
      setProductStatus(data.status as string);
      setBlueprintId(data.blueprintId as string);
      setNotice(
        data.reused
          ? `Producto reutilizado (ya existía para este blueprint). Estado: ${data.status}.`
          : `Producto creado en CROW (estado ${data.status}). Revisa el preview y publícalo.`,
      );
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId(),
          role: "assistant",
          content: data.reused
            ? `El producto ya existía y lo reutilicé: “${blueprint.title}”. Pasa al preview y publícalo cuando esté listo.`
            : `Producto generado: “${blueprint.title}” con ${blueprintSummary(blueprint)}. Ahora revisa el preview y pulsa “Publicar en CROW Market”.`,
        },
      ]);
    } catch {
      setError("Error de red al crear el producto");
    } finally {
      setLoading(false);
      setWorking(null);
    }
  }

  /** PUBLICAR: ProductPublication + PUBLISHED + visible en /marketplace. */
  async function publish() {
    if (!productId) return;
    setLoading(true);
    setWorking("publish");
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/studio/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? data.error ?? "No se pudo publicar");
        return;
      }

      setProductSlug(data.slug as string);
      setProductStatus("PUBLISHED");
      setNotice(
        data.alreadyPublished
          ? "El producto ya estaba publicado: no se duplicó nada."
          : "Publicado en CROW Market. Ya es visible en el marketplace.",
      );
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId(),
          role: "assistant",
          content: `“${blueprint?.title ?? "Tu producto"}” ya está en CROW Market: /marketplace/${data.slug}.`,
        },
      ]);
    } catch {
      setError("Error de red al publicar");
    } finally {
      setLoading(false);
      setWorking(null);
    }
  }

  const step: 1 | 2 | 3 | 4 | 5 = !blueprint
    ? 1
    : !productId
      ? 3
      : productStatus === "PUBLISHED"
        ? 5
        : 4;

  return {
    idea,
    setIdea,
    input,
    setInput,
    format,
    changeFormat,
    messages,
    blueprint,
    setBlueprint: setBlueprintAndFormat,
    blueprintId,
    provider,
    mode,
    loading,
    working,
    error,
    notice,
    productId,
    productSlug,
    productStatus,
    step,
    generate,
    send,
    materialize,
    publish,
  };
}

export type StudioState = ReturnType<typeof useStudio>;