import Link from "next/link";

import { ProgressBar } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Lesson = { id: string; title: string; durationMin: number };
type Module = { id: string; title: string; summary?: string | null; imageUrl?: string | null; lessons: Lesson[] };

export function LessonSidebar({
  productSlug,
  modules,
  completedIds,
  activeLessonId,
  progressPct,
  certificateSerial,
}: {
  productSlug: string;
  modules: Module[];
  completedIds: string[];
  activeLessonId: string;
  progressPct: number;
  certificateSerial?: string | null;
}) {
  const total = modules.flatMap((module) => module.lessons).length;

  return (
    <aside className="space-y-4">
      <Card className="p-4">
        <p className="text-[11px] uppercase tracking-wider text-crow-muted">
          Progreso del curso
        </p>
        <p className="mt-2 text-2xl font-semibold text-crow-text">{progressPct}%</p>
        <ProgressBar value={progressPct} className="mt-3" />
        <p className="mt-2.5 text-[11.5px] text-crow-muted">
          {completedIds.length} de {total} lecciones completadas
        </p>

        {certificateSerial ? (
          <Link
            href={`/certificates/${certificateSerial}`}
            className="mt-4 block rounded-xl border border-crow-success/30 bg-crow-success/10 px-3 py-2.5 text-[12px] text-crow-success"
          >
            🎓 Ver mi certificado
          </Link>
        ) : (
          <p className="mt-4 text-[11.5px] text-crow-muted">
            Completa el 100% para emitir tu certificado CROW.
          </p>
        )}
      </Card>

      <Card className="max-h-[70vh] overflow-y-auto p-3">
        {modules.map((module, moduleIndex) => (
          <div key={module.id} className="mb-3 last:mb-0">
            {/* Module header with optional image */}
            {module.imageUrl ? (
              <div className="mb-2 overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={module.imageUrl} alt={module.title} className="h-20 w-full object-cover opacity-80" loading="lazy" />
              </div>
            ) : null}
            <p className="px-2 py-1.5 text-[11px] uppercase tracking-wider text-crow-muted">
              Módulo {moduleIndex + 1} · {module.title}
            </p>
            <ul className="space-y-0.5">
              {module.lessons.map((lesson, lessonIndex) => {
                const active = lesson.id === activeLessonId;
                const done = completedIds.includes(lesson.id);
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/learn/${productSlug}?lesson=${lesson.id}`}
                      className={cn(
                        "flex items-start gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] transition",
                        active
                          ? "border border-crow-violet/30 bg-crow-violet/12 text-crow-text"
                          : "border border-transparent text-crow-muted hover:bg-white/[0.04] hover:text-crow-text",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px]",
                          done
                            ? "bg-crow-success/20 text-crow-success"
                            : "bg-white/[0.07] text-crow-muted",
                        )}
                      >
                        {done ? "✓" : lessonIndex + 1}
                      </span>
                      <span className="flex-1">{lesson.title}</span>
                      <span className="shrink-0 text-[10.5px] text-crow-muted">
                        {lesson.durationMin}m
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </Card>
    </aside>
  );
}