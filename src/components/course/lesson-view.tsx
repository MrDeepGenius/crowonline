import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { completeLessonAction } from "@/server/actions/buyer";

export type PlayerLesson = {
  id: string;
  title: string;
  content: string;
  durationMin: number;
  videoUrl: string | null;
  exercises: { id: string; title: string; instructions: string; kind: string }[];
};

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
          {completed ? (
            <Badge tone="success" dot>
              Completada
            </Badge>
          ) : null}
        </div>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{lesson.title}</h1>
        <p className="mt-1.5 text-[12px] text-crow-muted">Por {creatorName}</p>

        {lesson.videoUrl ? (
          <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.08] bg-black">
            <video src={lesson.videoUrl} controls className="aspect-video w-full" />
          </div>
        ) : (
          <div className="mt-5 flex h-36 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-crow-violet/20 to-transparent text-[12px] text-crow-muted">
            Lección en formato texto
          </div>
        )}

        <div className="mt-6 space-y-3 text-[14px] leading-relaxed text-crow-muted">
          {lesson.content
            .split("\n")
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
        </div>

        {lesson.exercises.length ? (
          <div className="mt-7 space-y-3 border-t border-white/[0.06] pt-5">
            <p className="text-[13px] font-semibold text-crow-text">
              Ejercicios de la lección
            </p>
            {lesson.exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12.5px] font-medium text-crow-text">
                    {exercise.title}
                  </p>
                  <Badge tone="violet">{exercise.kind}</Badge>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-crow-muted">
                  {exercise.instructions}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2.5">
          {prevId ? (
            <Link
              href={`/learn/${productSlug}?lesson=${prevId}`}
              className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-white/[0.05] px-4 text-[12.5px] text-crow-text transition hover:bg-white/[0.1]"
            >
              ← Anterior
            </Link>
          ) : null}
          {nextId ? (
            <Link
              href={`/learn/${productSlug}?lesson=${nextId}`}
              className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-white/[0.05] px-4 text-[12.5px] text-crow-text transition hover:bg-white/[0.1]"
            >
              Siguiente →
            </Link>
          ) : null}
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