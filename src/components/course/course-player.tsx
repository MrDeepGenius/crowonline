"use client";

import styles from "./course-player.module.css";
import { LessonSidebar } from "@/components/course/lesson-sidebar";
import { LessonView, PlayerLesson, PlayerExercise } from "@/components/course/lesson-view";
import { Card } from "@/components/ui/card";
import { ThemeProvider } from "@/components/course/theme-provider";
import { ThemeToggle } from "@/components/course/theme-toggle";

type Module = {
  id: string;
  title: string;
  summary?: string | null;
  imageUrl?: string | null;
  lessons: PlayerLesson[];
};

type Resource = {
  id: string;
  title: string;
  content: string;
  url: string | null;
  kind: string;
};

const KIND_ICON: Record<string, string> = {
  CHECKLIST: "✓",
  TEMPLATE: "📄",
  GUIDE: "📖",
  GLOSSARY: "📚",
  TOOL: "🔧",
  LINK: "🔗",
  PDF: "📋",
};

/** Premium Course Player: sidebar de progreso + lección activa + recursos. */
export function CoursePlayer({
  productSlug,
  courseTitle,
  creatorName,
  modules,
  completedIds,
  activeLessonId,
  progressPct,
  certificateSerial,
  resources = [],
}: {
  productSlug: string;
  courseTitle: string;
  creatorName: string;
  modules: Module[];
  completedIds: string[];
  activeLessonId: string;
  progressPct: number;
  certificateSerial?: string | null;
  resources?: Resource[];
}) {
  const lessons = modules.flatMap((m) => m.lessons);
  const activeLesson =
    lessons.find((l) => l.id === activeLessonId) ?? lessons[0];
  const index = lessons.findIndex((l) => l.id === activeLesson?.id);
  const prevId = index > 0 ? lessons[index - 1].id : undefined;
  const nextId =
    index >= 0 && index < lessons.length - 1 ? lessons[index + 1].id : undefined;

  return (
    <ThemeProvider>
      <div className={`${styles.playerRoot} grid gap-6 lg:grid-cols-[300px_1fr]`}>
        <LessonSidebar
          productSlug={productSlug}
          modules={modules}
          completedIds={completedIds}
          activeLessonId={activeLesson?.id ?? ""}
          progressPct={progressPct}
          certificateSerial={certificateSerial}
        />

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-crow-text tracking-tight">
                {courseTitle}
              </span>
            </div>
            <ThemeToggle />
          </div>

          {activeLesson ? (
            <LessonView
              productSlug={productSlug}
              courseTitle={courseTitle}
              creatorName={creatorName}
              lesson={activeLesson}
              completed={completedIds.includes(activeLesson.id)}
              prevId={prevId}
              nextId={nextId}
            />
          ) : (
            <Card className="py-16 text-center text-[13px] text-crow-muted">
              Este producto todavía no tiene lecciones publicadas.
            </Card>
          )}

          {/* Resources panel */}
          {resources.length > 0 && (
            <Card>
              <h2 className="text-[15px] font-semibold text-crow-text">
                Recursos del curso
              </h2>
              <ul className="mt-4 space-y-2.5">
                {resources.map((resource) => (
                  <li
                    key={resource.id}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <span className="mt-0.5 text-[16px]">
                      {KIND_ICON[resource.kind] ?? "📎"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-crow-text">
                        {resource.title}
                      </p>
                      {resource.content && resource.content !== resource.title && (
                        <p className="mt-0.5 text-[12px] leading-relaxed text-crow-muted">
                          {resource.content}
                        </p>
                      )}
                    </div>
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg border border-crow-violet/30 bg-crow-violet/10 px-3 py-1 text-[11.5px] text-crow-glow hover:bg-crow-violet/20"
                      >
                        Ver →
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}