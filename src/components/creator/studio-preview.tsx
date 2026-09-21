"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { blueprintStats, qualityCheck, type ProductBlueprint } from "@/lib/ai/blueprint";
import { coverGradientClass } from "@/lib/domain";

const STEPS = ["Idea", "IA", "Blueprint", "Generación", "Preview", "Publicar"] as const;

export type StudioWorking = "generate" | "materialize" | "publish" | null;

export function StudioPreview({
  blueprint,
  format,
  working,
  productId,
  productSlug,
  productStatus,
  onMaterialize,
  onPublish,
  onBlueprintChange,
}: {
  blueprint: ProductBlueprint;
  format: string;
  working: StudioWorking;
  productId: string | null;
  productSlug: string | null;
  productStatus: string | null;
  onMaterialize: () => void;
  onPublish: () => void;
  onBlueprintChange?: (next: ProductBlueprint) => void;
}) {
  const stats = blueprintStats(blueprint);
  const quality = qualityCheck(blueprint);
  const firstLesson = blueprint.modules[0]?.lessons[0];
  const published = productStatus === "PUBLISHED";
  const videoCount = blueprint.modules.flatMap((m) => m.lessons).filter((l) => l.videoEnabled).length;
  const totalLessons = stats.lessons;

  function setAllVideos(enabled: boolean) {
    onBlueprintChange?.({
      ...blueprint,
      modules: blueprint.modules.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) => ({ ...l, videoEnabled: enabled })),
      })),
    });
  }

  function setVideoDefaults(duration: number, style: string) {
    onBlueprintChange?.({
      ...blueprint,
      modules: blueprint.modules.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) => ({ ...l, videoDuration: duration, videoStyle: style })),
      })),
    });
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Preview del producto"
        description="Cómo se verá en CROW Market antes de publicar"
        action={
          <Badge tone={published ? "success" : quality.ready ? "violet" : "warn"}>
            {published
              ? "Publicado"
              : productId
                ? `Generado · quality ${quality.score}`
                : `Blueprint · quality ${quality.score}`}
          </Badge>
        }
      />

      <div
        className={`flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-gradient-to-br p-5 ${coverGradientClass(blueprint.coverGradient)}`}
      >
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-black/45 text-3xl">
          {blueprint.coverEmoji || "◆"}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-white/70">
            {format.replace("_", " ")} · {blueprint.category}
          </p>
          <h3 className="truncate text-[17px] font-semibold text-white">
            {blueprint.title}
          </h3>
          <p className="mt-0.5 truncate text-[12px] text-white/70">
            {blueprint.shortDescription}
          </p>
        </div>
        <span className="ml-auto shrink-0 rounded-xl bg-black/50 px-3 py-1.5 text-[14px] font-semibold text-white">
          {blueprint.recommendedPriceUsdt} USDT
        </span>
      </div>

      <p className="mt-4 line-clamp-4 text-[12.5px] leading-relaxed text-crow-muted">
        {blueprint.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-crow-muted">
        <span>{stats.modules} módulos</span>
        <span>{stats.lessons} lecciones</span>
        <span>{stats.exercises} ejercicios</span>
        <span>~{Math.round(stats.durationMin / 60)}h de contenido</span>
        <span>🎥 {videoCount} videos recomendados</span>
      </div>

      {/* Video controls — creator decides before generating (§8, §9) */}
      {onBlueprintChange && !productId ? (
        <div className="mt-4 rounded-xl border border-crow-violet/20 bg-crow-violet/5 p-4">
          <p className="text-[12px] font-semibold text-crow-text">
            🎥 Videos — este producto generará {videoCount} video{videoCount === 1 ? "" : "s"} de {totalLessons} lecciones
          </p>
          <p className="mt-1 text-[11px] text-crow-muted">
            Solo se generan cuando confirmás la creación. Podés cambiarlo lección por lección en “Estructura”.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAllVideos(true)}
              className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-[11.5px] text-crow-text transition hover:bg-white/[0.06]"
            >
              Todas las lecciones
            </button>
            <button
              type="button"
              onClick={() => setAllVideos(false)}
              className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-[11.5px] text-crow-text transition hover:bg-white/[0.06]"
            >
              Sin videos
            </button>
            <label className="ml-1 flex items-center gap-1.5 text-[11.5px] text-crow-muted">
              Duración
              <select
                value={blueprint.modules[0]?.lessons[0]?.videoDuration ?? 5}
                onChange={(e) => setVideoDefaults(Number(e.target.value), blueprint.modules[0]?.lessons[0]?.videoStyle ?? "cinematic")}
                className="rounded-lg border border-white/[0.08] bg-black/40 px-2 py-1.5 text-[11.5px] text-crow-text"
              >
                <option value={5}>5s</option>
                <option value={8}>8s</option>
                <option value={10}>10s</option>
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-[11.5px] text-crow-muted">
              Estilo
              <select
                value={blueprint.modules[0]?.lessons[0]?.videoStyle ?? "cinematic"}
                onChange={(e) => setVideoDefaults(blueprint.modules[0]?.lessons[0]?.videoDuration ?? 5, e.target.value)}
                className="rounded-lg border border-white/[0.08] bg-black/40 px-2 py-1.5 text-[11.5px] text-crow-text"
              >
                <option value="cinematic">Cinemático</option>
                <option value="documentary">Documental</option>
                <option value="tutorial">Tutorial</option>
                <option value="minimal">Minimalista</option>
              </select>
            </label>
          </div>
        </div>
      ) : null}

      <div className="mt-4 space-y-2.5">
        {blueprint.modules.slice(0, 5).map((module, moduleIndex) => (
          <details
            key={`${module.title}-${moduleIndex}`}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02]"
            open={moduleIndex === 0}
          >
            <summary className="cursor-pointer list-none px-4 py-3 text-[12.5px] font-medium">
              <span className="mr-2 text-crow-glow">{moduleIndex + 1}.</span>
              {module.title}
              <span className="ml-2 text-[11px] font-normal text-crow-muted">
                {module.lessons.length} lecciones
              </span>
            </summary>
            <ul className="space-y-1 border-t border-white/[0.06] px-4 py-3">
              {module.lessons.map((lesson, lessonIndex) => (
                <li key={`${lesson.title}-${lessonIndex}`} className="text-[12px] text-crow-muted">
                  <span className="text-crow-text">
                    {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                  </span>
                  {lesson.videoEnabled ? (
                    <span className="ml-2 text-[10.5px]" title="Video recomendado">🎥</span>
                  ) : null}
                  {lesson.exercises.length ? (
                    <span className="ml-2 text-[10.5px] text-crow-glow">
                      · {lesson.exercises.length} ejercicio(s)
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>

      {firstLesson?.content ? (
        <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/30 p-4">
          <p className="text-[11px] uppercase tracking-wider text-crow-muted">
            Contenido · {firstLesson.title}
          </p>
          <p className="mt-2 line-clamp-5 whitespace-pre-line text-[12.5px] leading-relaxed text-crow-text">
            {firstLesson.content}
          </p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-2.5">
        {!productId ? (
          <Button onClick={onMaterialize} disabled={working !== null} className="w-full">
            {working === "materialize" ? "Creando producto…" : "Crear producto"}
          </Button>
        ) : (
          <>
            <Button onClick={onPublish} disabled={working !== null} className="w-full">
              {working === "publish"
                ? "Publicando…"
                : published
                  ? "Republicar en CROW Market"
                  : "Publicar en CROW Market"}
            </Button>
            <div className="flex flex-wrap gap-2">
              <ButtonLink
                href={productSlug ? `/marketplace/${productSlug}` : "/marketplace"}
                variant="secondary"
                size="sm"
                className="flex-1"
              >
                Ver ficha pública
              </ButtonLink>
              <Link
                href={`/creator/products/${productId}`}
                className="inline-flex h-9 flex-1 items-center justify-center rounded-xl border border-white/10 px-3.5 text-[13px] text-crow-muted transition hover:text-crow-text"
              >
                Edición avanzada
              </Link>
            </div>
          </>
        )}
      </div>

      <ol className="mt-5 flex flex-wrap gap-1.5">
        {STEPS.map((label, index) => {
          const active =
            (!productId && index <= 2) ||
            (productId && !published && index <= 4) ||
            (published && index <= 5);
          return (
            <li
              key={label}
              className={`rounded-full border px-2.5 py-1 text-[10.5px] ${
                active
                  ? "border-crow-violet/50 bg-crow-violet/10 text-crow-glow"
                  : "border-white/[0.07] text-crow-muted"
              }`}
            >
              {index + 1}. {label}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

