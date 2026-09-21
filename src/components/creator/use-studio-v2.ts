"use client";

/**
 * useStudioV2 — State machine for the conversational Creator Studio.
 *
 * Single input, full pipeline:
 *   Write idea → CROW asks questions → spec built → blueprint proposed →
 *   confirm → materialize → images generated → publish
 *
 * All orchestration happens through /api/studio/converse, then
 * /api/studio/materialize and /api/studio/publish.
 */

import { useState, useCallback, useRef } from "react";
import type { ProductBlueprint } from "@/lib/ai/blueprint";
import type { ConversationPhase, ProductSpec, ProposalSummary } from "@/lib/ai/converse";

// ─── Message types ─────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system" | "proposal" | "action";

export type StudioMessage = {
  id: string;
  role: MessageRole;
  content: string;
  proposalSummary?: ProposalSummary;
  /** action messages have a button that triggers a callback */
  actionLabel?: string;
  actionKey?: string;
};

// ─── Working states ────────────────────────────────────────────────────────

export type WorkingState =
  | "thinking"       // CROW is composing a reply
  | "generating"     // building the full blueprint with AI
  | "materializing"  // writing product to DB
  | "publishing"     // publishing to marketplace
  | null;

// ─── Counters ──────────────────────────────────────────────────────────────

let _counter = 0;
function uid() {
  _counter += 1;
  return `m${_counter}-${Date.now()}`;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useStudioV2() {
  const [messages, setMessages]       = useState<StudioMessage[]>([]);
  const [input, setInput]             = useState("");
  const [working, setWorking]         = useState<WorkingState>(null);
  const [error, setError]             = useState<string | null>(null);

  // Conversation state
  const [phase, setPhase]             = useState<ConversationPhase>("DISCOVERY");
  const [spec, setSpec]               = useState<ProductSpec>({});
  const [provider, setProvider]       = useState("crow-skeleton");
  const [mode, setMode]               = useState<"live" | "skeleton">("skeleton");

  // Blueprint & product state
  const [blueprint, setBlueprint]     = useState<ProductBlueprint | null>(null);
  const [blueprintId, setBlueprintId] = useState<string | undefined>();
  const [productId, setProductId]     = useState<string | null>(null);
  const [productSlug, setProductSlug] = useState<string | null>(null);
  const [productStatus, setProductStatus] = useState<string | null>(null);
  const [imageGenStatus, setImageGenStatus] = useState<string | null>(null);

  // Ref to track history for the API (only user/assistant roles)
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const mediaPollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function pushMessage(msg: Omit<StudioMessage, "id">) {
    const full: StudioMessage = { ...msg, id: uid() };
    setMessages((prev) => [...prev, full]);
    // Track in history ref (only conversational messages)
    if (msg.role === "user" || msg.role === "assistant") {
      historyRef.current = [...historyRef.current.slice(-20), { role: msg.role, content: msg.content }];
    }
    return full.id;
  }

  function clearError() { setError(null); }

  // ─── converse() — single entry point for all chat ─────────────────────────

  const converse = useCallback(async (userMessage: string) => {
    const trimmed = userMessage.trim();
    if (!trimmed || working) return;

    clearError();
    pushMessage({ role: "user", content: trimmed });
    setInput("");
    setWorking("thinking");

    try {
      const res = await fetch("/api/studio/converse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: historyRef.current,
          phase,
          spec,
          blueprint,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? data.error ?? "CROW no pudo responder");
        setWorking(null);
        return;
      }

      // Update conversation state
      setPhase(data.phase);
      setSpec(data.spec ?? spec);
      setProvider(data.provider ?? "crow-skeleton");
      setMode(data.mode ?? "skeleton");

      // If blueprint came back, update it
      if (data.blueprint) {
        setBlueprint(data.blueprint);
      }

      // Push CROW's reply
      if (data.phase === "READY" && data.proposalSummary) {
        // Show proposal card
        pushMessage({
          role: "proposal",
          content: data.reply,
          proposalSummary: data.proposalSummary,
        });
        // Push confirm action
        pushMessage({
          role: "action",
          content: "",
          actionLabel: "Generar producto completo",
          actionKey: "confirm_generate",
        });
      } else if (data.phase === "REFINING" && data.blueprint) {
        // Blueprint is ready — show blueprint summary and next steps
        pushMessage({ role: "assistant", content: data.reply });
        pushMessage({
          role: "action",
          content: "",
          actionLabel: "Crear producto en CROW",
          actionKey: "materialize",
        });
      } else {
        pushMessage({ role: "assistant", content: data.reply });
      }

    } catch {
      setError("Error de red al conectar con CROW Studio");
    } finally {
      setWorking(null);
    }
  }, [working, phase, spec, blueprint]);

  // ─── confirm_generate() — triggers blueprint generation ──────────────────

  const confirmGenerate = useCallback(async () => {
    if (working) return;
    clearError();
    setWorking("generating");
    pushMessage({ role: "system", content: "Generando blueprint completo con IA…" });

    try {
      const res = await fetch("/api/studio/converse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "confirmo, generá el producto",
          history: historyRef.current,
          phase: "GENERATING",
          spec,
          blueprint: null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? data.error ?? "No se pudo generar el blueprint");
        setWorking(null);
        return;
      }

      setPhase("REFINING");
      setSpec(data.spec ?? spec);
      setProvider(data.provider ?? "crow-skeleton");
      setMode(data.mode ?? "skeleton");

      if (data.blueprint) {
        setBlueprint(data.blueprint);
      }

      pushMessage({ role: "assistant", content: data.reply });
      pushMessage({
        role: "action",
        content: "",
        actionLabel: "Crear producto en CROW",
        actionKey: "materialize",
      });

    } catch {
      setError("Error al generar el blueprint");
    } finally {
      setWorking(null);
    }
  }, [working, spec]);

  // ─── startMediaPolling() — polls /api/studio/media-status for bg images ─

  const startMediaPolling = useCallback((pid: string) => {
    if (mediaPollerRef.current) clearInterval(mediaPollerRef.current);
    let attempts = 0;
    const maxAttempts = 15;
    mediaPollerRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/studio/media-status?productId=${pid}`);
        if (!res.ok) return;
        const data = await res.json() as {
          cover: { url: string | null; ready: boolean };
          modules: { completed: number; total: number };
          lessons: { completed: number; total: number; generating: number };
          allDone: boolean;
        };
        if (data.allDone || attempts >= maxAttempts) {
          if (mediaPollerRef.current) clearInterval(mediaPollerRef.current);
          const parts: string[] = [];
          if (data.cover.ready) parts.push("portada ✓");
          if (data.modules.completed > 0) parts.push(`${data.modules.completed} imágenes de módulos ✓`);
          if (data.lessons.completed > 0) parts.push(`${data.lessons.completed}/${data.lessons.total} imágenes de lecciones ✓`);
          if (parts.length > 0) {
            pushMessage({ role: "assistant", content: `Multimedia listo: ${parts.join(" · ")}\n\nYa podés ver las imágenes en el producto.` });
          }
          setImageGenStatus("done");
        }
      } catch { /* silencioso */ }
    }, 8000);
  }, []);

  // ─── materialize() — write product to DB ─────────────────────────────────

  const materialize = useCallback(async () => {
    if (!blueprint || working) return;
    clearError();
    setWorking("materializing");
    pushMessage({ role: "system", content: "Creando producto en CROW y generando portada e imágenes…" });

    try {
      // Save blueprint first if we don't have an ID
      let currentBlueprintId = blueprintId;
      if (!currentBlueprintId) {
        const saveRes = await fetch("/api/studio/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idea: spec.topic ?? blueprint.title,
            productType: blueprint.productType,
            persist: true,
          }),
        });
        const saveData = await saveRes.json();
        if (saveData.blueprintId) {
          currentBlueprintId = saveData.blueprintId;
          setBlueprintId(saveData.blueprintId);
        }
      }

      const res = await fetch("/api/studio/materialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: spec.topic ?? blueprint.title,
          blueprint,
          blueprintId: currentBlueprintId,
          provider,
          productType: blueprint.productType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? data.error ?? "No se pudo crear el producto");
        setWorking(null);
        return;
      }

      setProductId(data.productId);
      setProductSlug(data.slug);
      setProductStatus(data.status);
      setBlueprintId(data.blueprintId ?? currentBlueprintId);
      setImageGenStatus(data.imageGeneration ?? null);

      const lessons = blueprint.modules.flatMap((m) => m.lessons).length;
      const modules = blueprint.modules.length;

      pushMessage({
        role: "assistant",
        content: data.reused
          ? `El producto ya existía — lo reutilicé. Estado: ${data.status}. Podés publicarlo cuando quieras.`
          : `Producto creado: "${blueprint.title}"\n${modules} módulos · ${lessons} lecciones · estado ${data.status}\n\n${data.imageGeneration === "generating" ? "Portada generada ✓ · Imágenes de lecciones generándose en background…" : ""}`,
      });

      // Start polling for background media generation
      if (data.imageGeneration === "generating" && data.productId) {
        startMediaPolling(data.productId as string);
      }

      pushMessage({
        role: "action",
        content: "",
        actionLabel: "Publicar en CROW Market",
        actionKey: "publish",
      });

    } catch {
      setError("Error de red al crear el producto");
    } finally {
      setWorking(null);
    }
  }, [blueprint, working, blueprintId, spec, provider, startMediaPolling]);

  // ─── publish() — make product live ───────────────────────────────────────

  const publish = useCallback(async () => {
    if (!productId || working) return;
    clearError();
    setWorking("publishing");
    pushMessage({ role: "system", content: "Publicando en CROW Market…" });

    try {
      const res = await fetch("/api/studio/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? data.error ?? "No se pudo publicar");
        setWorking(null);
        return;
      }

      setProductSlug(data.slug);
      setProductStatus("PUBLISHED");

      pushMessage({
        role: "assistant",
        content: data.alreadyPublished
          ? `El producto ya estaba publicado en /marketplace/${data.slug}.`
          : `¡Publicado! Ya está visible en CROW Market:\n/marketplace/${data.slug}\n\nTus afiliados ya pueden compartirlo y ganar comisiones.`,
      });

    } catch {
      setError("Error de red al publicar");
    } finally {
      setWorking(null);
    }
  }, [productId, working]);

  // ─── handleAction() — dispatches button clicks in the chat ───────────────

  const handleAction = useCallback((actionKey: string) => {
    if (actionKey === "confirm_generate") return confirmGenerate();
    if (actionKey === "materialize")      return materialize();
    if (actionKey === "publish")          return publish();
  }, [confirmGenerate, materialize, publish]);

  // ─── send() — simple wrapper to send the current input ───────────────────

  const send = useCallback(() => {
    if (input.trim()) converse(input);
  }, [input, converse]);

  // ─── Derived state ────────────────────────────────────────────────────────

  const step = !blueprint
    ? phase === "READY" ? 2 : 1
    : !productId
      ? 3
      : productStatus === "PUBLISHED"
        ? 5
        : 4;

  return {
    // UI state
    messages,
    input,
    setInput,
    working,
    error,
    // Conversation
    phase,
    spec,
    provider,
    mode,
    // Product
    blueprint,
    setBlueprint,
    blueprintId,
    productId,
    productSlug,
    productStatus,
    imageGenStatus,
    step,
    // Actions
    send,
    converse,
    handleAction,
    materialize,
    publish,
  };
}

export type StudioV2State = ReturnType<typeof useStudioV2>;
