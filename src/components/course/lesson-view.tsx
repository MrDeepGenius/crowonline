"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { completeLessonAction } from "@/server/actions/buyer";

export type PlayerExercise = {
  id: string;
  title: string;
  instructions: string;
  kind: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export type PlayerLesson = {
  id: string;
  title: string;
  content: string;
  durationMin: number;
  videoUrl: string | null;
  videoGenerationStatus?: string | null;
  videoSource?: string | null;
  imageUrl: string | null;
  exercises: PlayerExercise[];
};

// ── Lesson video block (§7, §11, §14) ───────────────────────────────────────
// Order in the lesson: IMAGE → VIDEO → CONTENT. The player only renders when
// videoStatus === COMPLETED && a real videoUrl exists. Real HTML5 player
// (play / pause / volume / fullscreen / progress / responsive via `controls`).
function LessonVideo({ lesson }: { lesson: PlayerLesson }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [retryMsg, setRetryMsg] = useState("");

  const hasRealVideo =
    lesson.videoGenerationStatus === "COMPLETED" && Boolean(lesson.videoUrl);

  async function retry() {
    setRetrying(true);
    setRetryMsg("");
    try {
      const res = await fetch("/api/studio/generate-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      setRetryMsg(data.message ?? (data.ok ? "Reintento iniciado." : "No se pudo reintentar."));
      if (data.ok) router.refresh();
    } catch {
      setRetryMsg("Error de red al reintentar.");
    } finally {
      setRetrying(false);
    }
  }

  if (hasRealVideo) {
    return (
      <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.08] bg-black">
        <video
          src={lesson.videoUrl as string}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full max-w-full"
        />
        {lesson.videoSource === "CREATOR" ? (
          <p className="bg-black/60 px-3 py-1.5 text-[10.5px] text-crow-muted">
            Video del creador
          </p>
        ) : null}
      </div>
    );
  }

  if (lesson.videoGenerationStatus === "GENERATING") {
    return (
      <div className="mt-5 flex h-24 items-center justify-center gap-2 rounded-xl border border-crow-violet/20 bg-crow-violet/5 text-[12px] text-crow-glow">
        <span className="h-2 w-2 animate-pulse rounded-full bg-crow-violet" />
        Generando video…
      </div>
    );
  }

  if (lesson.videoGenerationStatus === "FAILED") {
    return (
      <div className="mt-5 rounded-xl border border-crow-warn/30 bg-crow-warn/10 px-4 py-4 text-center">
        <p className="text-[12.5px] text-crow-warn">No pudimos generar este video.</p>
        <button
          type="button"
          onClick={retry}
          disabled={retrying}
          className="mt-2.5 inline-flex h-9 items-center rounded-xl border border-crow-warn/40 bg-crow-warn/10 px-4 text-[12px] text-crow-text transition hover:bg-crow-warn/20 disabled:opacity-50"
        >
          {retrying ? "Reintentando…" : "Reintentar"}
        </button>
        {retryMsg ? <p className="mt-2 text-[11px] text-crow-muted">{retryMsg}</p> : null}
      </div>
    );
  }

  return null;
}

// ── Quiz component ────────────────────────────────────────────────────────────
function QuizExercise({ exercise }: { exercise: PlayerExercise }) {
  const [selected, setSelected] = useState<string | null>(null);
  const revealed = selected !== null;
  const isCorrect = selected === exercise.correctAnswer;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2">
        <Badge tone="violet">QUIZ</Badge>
        <p className="text-[13px] font-medium text-crow-text">{exercise.title}</p>
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-crow-muted">
        {exercise.instructions}
      </p>
      {exercise.options.length > 0 && (
        <div className="mt-4 space-y-2">
          {exercise.options.map((option) => {
            let cls =
              "w-full rounded-lg border px-4 py-2.5 text-left text-[12.5px] transition ";
            if (!revealed) {
              cls += "border-white/[0.08] bg-white/[0.03] text-crow-text hover:bg-white/[0.07]";
            } else if (option === exercise.correctAnswer) {
              cls += "border-crow-success/50 bg-crow-success/10 text-crow-success";
            } else if (option === selected) {
              cls += "border-crow-danger/50 bg-crow-danger/10 text-crow-danger";
            } else {
              cls += "border-white/[0.05] bg-white/[0.01] text-crow-muted opacity-60";
            }
            return (
              <button
                key={option}
                type="button"
                disabled={revealed}
                onClick={() => setSelected(option)}
                className={cls}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}
      {revealed && (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-[12.5px] leading-relaxed ${
            isCorrect
              ? "border-crow-success/30 bg-crow-success/10 text-crow-success"
              : "border-crow-warn/30 bg-crow-warn/10 text-crow-warn"
          }`}
        >
          <p className="font-medium">
            {isCorrect ? "✓ Correcto" : `✗ Incorrecto — La respuesta correcta es: ${exercise.correctAnswer}`}
          </p>
          {exercise.explanation && (
            <p className="mt-1.5 opacity-90">{exercise.explanation}</p>
          )}
        </div>
      )}
      {revealed && (
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="mt-3 text-[11.5px] text-crow-muted underline hover:text-crow-text"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

// ── Practice / Project exercise ───────────────────────────────────────────────
function PracticeExercise({ exercise }: { exercise: PlayerExercise }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] font-medium text-crow-text">{exercise.title}</p>
        <Badge tone={exercise.kind === "PROJECT" ? "success" : "default"}>{exercise.kind}</Badge>
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-crow-muted">
        {exercise.instructions}
      </p>
    </div>
  );
}

// ── Main lesson view ──────────────────────────────────────────────────────────
export function LessonView({
  productSlug,
  courseTitle,
  creatorName,
  lesson,
  completed,
  prevId,
  nextId,
}: {
  productSlug: string;
  courseTitle: string;
  creatorName: string;
  lesson: PlayerLesson;
  completed: boolean;
  prevId?: string;
  nextId?: string;
}) {
  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge tone="violet">{courseTitle}</Badge>
          <Badge tone="default">{lesson.durationMin} min</Badge>
          {completed && (
            <Badge tone="success" dot>
              Completada
            </Badge>
          )}
        </div>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{lesson.title}</h1>
        <p className="mt-1.5 text-[12px] text-crow-muted">Por {creatorName}</p>

        {/* Lesson image (portada) — before the video (§11) */}
        {lesson.imageUrl && (
          <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.08]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lesson.imageUrl}
              alt={lesson.title}
              className="w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Video — real player only when COMPLETED + real URL (§7, §14) */}
        <LessonVideo lesson={lesson} />

        {/* Content — markdown rendered */}
        <div className="prose-crow mt-6">
          <ReactMarkdown
            components={{
              h2: ({ children }) => (
                <h2 className="mt-6 mb-2 text-[16px] font-semibold text-crow-text">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mt-4 mb-1.5 text-[14px] font-semibold text-crow-text">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-3 text-[14px] leading-relaxed text-crow-muted">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-crow-text">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-crow-muted">{children}</em>
              ),
              ul: ({ children }) => (
                <ul className="mb-3 space-y-1 pl-4">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-3 space-y-1 pl-4 list-decimal">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-[13.5px] leading-relaxed text-crow-muted before:mr-2 before:text-crow-violet before:content-['·']">
                  {children}
                </li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="mb-3 border-l-2 border-crow-violet/50 pl-4 italic text-crow-muted">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px] text-crow-glow">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="mb-3 overflow-x-auto rounded-xl bg-black/40 p-4 font-mono text-[12px] text-crow-glow">
                  {children}
                </pre>
              ),
            }}
          >
            {lesson.content}
          </ReactMarkdown>
        </div>

        {/* Exercises */}
        {lesson.exercises.length > 0 && (
          <div className="mt-7 space-y-3 border-t border-white/[0.06] pt-5">
            <p className="text-[13px] font-semibold text-crow-text">
              Ejercicios de la lección
            </p>
            {lesson.exercises.map((exercise) =>
              exercise.kind === "QUIZ" ? (
                <QuizExercise key={exercise.id} exercise={exercise} />
              ) : (
                <PracticeExercise key={exercise.id} exercise={exercise} />
              ),
            )}
          </div>
        )}
      </Card>

      {/* Navigation + complete */}
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2.5">
          {prevId && (
            <Link
              href={`/learn/${productSlug}?lesson=${prevId}`}
              className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-white/[0.05] px-4 text-[12.5px] text-crow-text transition hover:bg-white/[0.1]"
            >
              ← Anterior
            </Link>
          )}
          {nextId && (
            <Link
              href={`/learn/${productSlug}?lesson=${nextId}`}
              className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-white/[0.05] px-4 text-[12.5px] text-crow-text transition hover:bg-white/[0.1]"
            >
              Siguiente →
            </Link>
          )}
        </div>

        <form action={completeLessonAction} className="flex items-center gap-2.5">
          <input type="hidden" name="lessonId" value={lesson.id} />
          <input type="hidden" name="productSlug" value={productSlug} />
          <input type="hidden" name="completed" value={completed ? "false" : "true"} />
          <Button type="submit" variant={completed ? "secondary" : "primary"}>
            {completed ? "Marcar como pendiente" : "Marcar como completada"}
          </Button>
        </form>
      </Card>
    </>
  );
}
