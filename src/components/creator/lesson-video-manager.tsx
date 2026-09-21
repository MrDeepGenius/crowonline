"use client";

/**
 * LessonVideoManager — per-lesson video controls (§12).
 *
 *   "Generar con CROW" → POST /api/studio/generate-videos { lessonId }
 *   "Subir mi video"   → POST /api/studio/upload-video (multipart, persisted)
 *   "Biblioteca"       → GET /api/studio/media?kind=VIDEO + attach
 *
 * Source badge: AI vs CREATOR. CREATOR videos are never auto-replaced.
 * Polls /api/studio/video-status?lessonId= (DB-persisted reconcile).
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type VideoStatus = "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";

type LibraryAsset = {
  id: string;
  name: string;
  url: string;
  mime: string | null;
  source: string;
};

export function LessonVideoManager({
  lessonId,
  lessonTitle,
  currentVideoUrl,
  currentStatus,
  currentSource,
  hasImage,
}: {
  lessonId: string;
  lessonTitle: string;
  currentVideoUrl?: string | null;
  currentStatus?: string | null;
  currentSource?: string | null;
  /** Whether the lesson already has an image id (required for image-to-video) */
  hasImage: boolean;
}) {
  const [videoUrl, setVideoUrl]   = useState(currentVideoUrl ?? null);
  const [source, setSource]       = useState<string | null>(currentSource ?? null);
  const [status, setStatus]       = useState<VideoStatus>(
    currentVideoUrl ? "COMPLETED" : ((currentStatus as VideoStatus) ?? "PENDING"),
  );
  const [msg, setMsg]             = useState("");
  const [working, setWorking]     = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [library, setLibrary]     = useState<LibraryAsset[]>([]);
  const fileRef                   = useRef<HTMLInputElement>(null);
  const pollerRef                 = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start polling when GENERATING (reads DB-persisted state, reconciled server-side)
  useEffect(() => {
    if (status !== "GENERATING") return;
    if (pollerRef.current) return;

    pollerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/studio/video-status?lessonId=${lessonId}`);
        if (!res.ok) return;
        const data = await res.json() as { videoUrl?: string | null; status?: string; ready?: boolean };
        if (data.ready && data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setSource("AI");
          setStatus("COMPLETED");
          setMsg("Video generado ✓");
          if (pollerRef.current) { clearInterval(pollerRef.current); pollerRef.current = null; }
        } else if (data.status === "FAILED") {
          setStatus("FAILED");
          setMsg("No pudimos generar este video.");
          if (pollerRef.current) { clearInterval(pollerRef.current); pollerRef.current = null; }
        }
      } catch { /* silencioso */ }
    }, 6000);

    return () => {
      if (pollerRef.current) { clearInterval(pollerRef.current); pollerRef.current = null; }
    };
  }, [status, lessonId]);

  async function generateWithCrow() {
    if (!hasImage) {
      setMsg("Generá la imagen de la lección primero.");
      return;
    }
    setWorking(true);
    setMsg("Enviando al proveedor de video…");
    try {
      const res = await fetch("/api/studio/generate-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
      const data = await res.json() as { ok?: boolean; status?: string; message?: string };
      if (data.ok) {
        setStatus("GENERATING");
        setMsg("Generando… puede tardar 1-2 minutos.");
      } else if (data.status === "NOT_CONFIGURED") {
        setStatus("FAILED");
        setMsg("Proveedor de video no configurado. Agregá LEONARDO_API_KEY al .env.");
      } else {
        setStatus("FAILED");
        setMsg(data.message ?? "Error al iniciar la generación.");
      }
    } catch {
      setMsg("Error de red.");
    } finally {
      setWorking(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { setMsg("Solo archivos de video (MP4, WebM)."); return; }
    if (file.size > 100_000_000) { setMsg("Máximo 100 MB."); return; }

    setWorking(true);
    setMsg("Subiendo video…");
    try {
      const form = new FormData();
      form.append("lessonId", lessonId);
      form.append("file", file);
      const res = await fetch("/api/studio/upload-video", { method: "POST", body: form });
      const data = await res.json() as { ok?: boolean; url?: string; error?: string };
      if (res.ok && data.url) {
        setVideoUrl(data.url);
        setSource("CREATOR");
        setStatus("COMPLETED");
        setMsg("Video propio guardado ✓ (no será reemplazado por la IA).");
      } else {
        setMsg(data.error ?? "No se pudo subir el video.");
      }
    } catch {
      setMsg("Error de red al subir.");
    } finally {
      setWorking(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function loadLibrary() {
    setShowLibrary((v) => !v);
    if (library.length > 0) return;
    try {
      const res = await fetch("/api/studio/media?kind=VIDEO");
      const data = await res.json() as { assets?: LibraryAsset[] };
      setLibrary(data.assets ?? []);
    } catch { /* silencioso */ }
  }

  async function attachFromLibrary(asset: LibraryAsset) {
    setWorking(true);
    try {
      const res = await fetch("/api/studio/media/attach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: asset.id, lessonId }),
      });
      const data = await res.json() as { ok?: boolean; url?: string; error?: string };
      if (res.ok && data.url) {
        setVideoUrl(data.url);
        setSource(asset.source);
        setStatus("COMPLETED");
        setMsg(`Video de tu biblioteca aplicado ✓ (${asset.name}).`);
        setShowLibrary(false);
      } else {
        setMsg(data.error ?? "No se pudo aplicar el video.");
      }
    } catch {
      setMsg("Error de red.");
    } finally {
      setWorking(false);
    }
  }

  const statusTone = {
    COMPLETED:  "success",
    GENERATING: "violet",
    FAILED:     "warn",
    PENDING:    "default",
  } as const;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[12.5px] font-medium text-crow-text">{lessonTitle}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          {source ? (
            <Badge tone={source === "CREATOR" ? "violet" : "default"}>
              {source === "CREATOR" ? "Propio" : "IA"}
            </Badge>
          ) : null}
          <Badge tone={statusTone[status]} dot>
            {status === "GENERATING" ? "Generando…" : status}
          </Badge>
        </div>
      </div>

      {/* Video preview */}
      {videoUrl ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-white/[0.07] bg-black">
          <video src={videoUrl} controls playsInline preload="metadata" className="aspect-video w-full" />
        </div>
      ) : status === "GENERATING" ? (
        <div className="mt-3 flex h-20 items-center justify-center gap-2 rounded-lg border border-crow-violet/20 bg-crow-violet/5 text-[11.5px] text-crow-glow">
          <span className="h-2 w-2 animate-pulse rounded-full bg-crow-violet" />
          Generando video…
        </div>
      ) : status === "FAILED" ? (
        <div className="mt-3 rounded-lg border border-crow-warn/30 bg-crow-warn/10 px-3 py-3 text-center text-[11.5px] text-crow-warn">
          No pudimos generar este video.
        </div>
      ) : (
        <div className="mt-3 flex h-20 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.02] text-[11.5px] text-crow-muted">
          {hasImage ? "Sin video — generá con CROW o subí uno" : "Primero generá la imagen"}
        </div>
      )}

      {/* Status message */}
      {msg ? (
        <p className={cn("mt-2 text-[11.5px]",
          status === "FAILED" ? "text-crow-warn" :
          status === "COMPLETED" ? "text-crow-success" : "text-crow-muted"
        )}>
          {msg}
        </p>
      ) : null}

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <Button
          size="sm" variant="secondary"
          className="flex-1 text-[11px]"
          disabled={working || status === "GENERATING" || !hasImage}
          onClick={generateWithCrow}
          title={!hasImage ? "Generá la imagen primero" : "Generar con el proveedor de video"}
        >
          {status === "GENERATING" ? "⏳ Generando…" : status === "FAILED" ? "🔁 Reintentar" : "🎬 Generar con CROW"}
        </Button>
        <Button
          size="sm" variant="secondary"
          className="flex-1 text-[11px]"
          disabled={working}
          onClick={() => fileRef.current?.click()}
        >
          📁 Subir mi video
        </Button>
        <Button
          size="sm" variant="secondary"
          className="flex-1 text-[11px]"
          disabled={working}
          onClick={loadLibrary}
        >
          🗂️ Biblioteca
        </Button>
      </div>
      <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleFileChange} />

      {showLibrary ? (
        <div className="mt-3 max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-white/[0.06] bg-black/30 p-2">
          {library.length === 0 ? (
            <p className="px-2 py-2 text-[11px] text-crow-muted">Tu biblioteca de videos está vacía. Subí un video para empezar.</p>
          ) : (
            library.map((asset) => (
              <button
                key={asset.id}
                type="button"
                disabled={working}
                onClick={() => attachFromLibrary(asset)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[11.5px] text-crow-text transition hover:bg-white/[0.06]"
              >
                <span className="truncate">🎥 {asset.name}</span>
                <span className="shrink-0 text-[10px] text-crow-muted">{asset.source}</span>
              </button>
            ))
          )}
        </div>
      ) : null}

      {!hasImage && (
        <p className="mt-2 text-[10.5px] text-crow-muted">
          Requiere imagen generada. Generá la imagen de la lección primero.
        </p>
      )}
    </div>
  );
}
