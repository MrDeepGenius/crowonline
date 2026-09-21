"use client";

/**
 * LessonImageManager — upload or generate image for a single lesson.
 * Used in the creator product detail page.
 */

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function LessonImageManager({
  lessonId,
  lessonTitle,
  currentUrl,
  currentStatus,
  imagePrompt,
}: {
  lessonId: string;
  lessonTitle: string;
  currentUrl?: string | null;
  currentStatus?: string | null;
  imagePrompt?: string | null;
}) {
  const [url, setUrl] = useState(currentUrl ?? null);
  const [status, setStatus] = useState<"idle" | "generating" | "uploading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function generateWithCrow() {
    if (!imagePrompt && !lessonTitle) return;
    setStatus("generating");
    setMsg("Leonardo generando imagen…");
    try {
      const res = await fetch("/api/studio/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          imagePrompt: imagePrompt || lessonTitle,
          retry: true,
        }),
      });
      const data = await res.json() as { status?: string; imageUrl?: string; error?: string; message?: string };
      if (data.imageUrl) {
        setUrl(data.imageUrl);
        setStatus("done");
        setMsg(`✓ Imagen generada (${data.status})`);
      } else {
        setStatus(data.status === "NOT_CONFIGURED" ? "error" : "error");
        setMsg(data.message ?? data.error ?? "No se pudo generar la imagen.");
      }
    } catch {
      setStatus("error");
      setMsg("Error de red.");
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMsg("Solo imágenes (PNG, JPG, WebP)."); setStatus("error"); return; }
    if (file.size > 4_000_000) { setMsg("Demasiado grande (máx. 3MB)."); setStatus("error"); return; }
    setStatus("uploading");
    setMsg("Subiendo…");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      try {
        const res = await fetch("/api/studio/upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: "lesson", lessonId, dataUrl }),
        });
        const data = await res.json() as { ok?: boolean; url?: string; error?: string };
        if (data.ok && data.url) { setUrl(data.url); setStatus("done"); setMsg("Imagen guardada ✓"); }
        else { setStatus("error"); setMsg(data.error ?? "Error al guardar."); }
      } catch { setStatus("error"); setMsg("Error de red."); }
    };
    reader.readAsDataURL(file);
  }

  const genStatus = currentStatus ?? (url ? "COMPLETED" : "PENDING");

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <p className="truncate text-[12.5px] font-medium text-crow-text">{lessonTitle}</p>
        <Badge tone={url ? "success" : genStatus === "GENERATING" ? "violet" : "default"} dot>
          {url ? "COMPLETED" : genStatus}
        </Badge>
      </div>

      {url ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-white/[0.07]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={lessonTitle} className="h-28 w-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div className="mt-3 flex h-20 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.02] text-[11.5px] text-crow-muted">
          Sin imagen
        </div>
      )}

      {msg ? (
        <p className={cn("mt-2 text-[11.5px]", status === "error" ? "text-crow-danger" : "text-crow-success")}>
          {msg}
        </p>
      ) : null}

      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="secondary" className="flex-1 text-[11px]"
          disabled={status === "generating" || status === "uploading"}
          onClick={generateWithCrow}>
          {status === "generating" ? "…" : "🤖 CROW"}
        </Button>
        <Button size="sm" variant="secondary" className="flex-1 text-[11px]"
          disabled={status === "uploading"}
          onClick={() => fileRef.current?.click()}>
          {status === "uploading" ? "…" : "📁 Subir"}
        </Button>
      </div>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
