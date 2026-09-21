"use client";

import { useState } from "react";
import styles from "./course-player.module.css";
import { LessonSidebar } from "@/components/course/lesson-sidebar";
import { LessonView, type PlayerLesson } from "@/components/course/lesson-view";
import { Card } from "@/components/ui/card";
import { ThemeProvider } from "@/components/course/theme-provider";
import { ThemeToggle } from "@/components/course/theme-toggle";
import { cn } from "@/lib/utils";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const lessons = modules.flatMap((m) => m.lessons);
  const activeLesson = lessons.find((l) => l.id === activeLessonId) ?? lessons[0];
  const index = lessons.findIndex((l) => l.id === activeLesson?.id);
  const prevId = index > 0 ? lessons[index - 1].id : undefined;
  const nextId = index >= 0 && index < lessons.length - 1 ? lessons[index + 1].id : undefined;

  return (
    <ThemeProvider>
      <div className={styles.playerRoot}>
        {/* ── Mobile sidebar toggle bar ── */}
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <span className="text-[13px] font-medium text-crow-text truncate mr-3">{courseTitle}</span>
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-[13px] text-crow-muted transition hover:bg-white/[0.08] hover:text-crow-text"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
            {sidebarOpen ? "Ocultar temario" : "Ver temario"}
          </button>
        </div>

        {/* ── Mobile collapsible sidebar ── */}
        <div className={cn("mb-5 lg:hidden", sidebarOpen ? "block" : "hidden")}>
          <LessonSidebar
            productSlug={productSlug}
            modules={modules}
            completedIds={completedIds}
            activeLessonId={activeLesson?.id ?? ""}
            progressPct={progressPct}
            certificateSerial={certificateSerial}
            onLessonClick={() => setSidebarOpen(false)}
          />
        </div>

        {/* ── Desktop two-column layout ── */}
        <div className="hidden gap-6 lg:grid lg:grid-cols-[300px_1fr]">
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
              <span className="text-3xl font-bold text-crow-text tracking-tight">{courseTitle}</span>
              <ThemeToggle />
            </div>
            {activeLesson ? (
              <LessonView productSlug={productSlug} courseTitle={courseTitle} creatorName={creatorName} lesson={activeLesson} completed={completedIds.includes(activeLesson.id)} prevId={prevId} nextId={nextId} />
            ) : (
              <Card className="py-16 text-center text-[13px] text-crow-muted">Este producto todavía no tiene lecciones publicadas.</Card>
            )}
            {resources.length > 0 && <ResourcesPanel resources={resources} />}
          </div>
        </div>

        {/* ── Mobile lesson content (always visible) ── */}
        <div className="space-y-5 lg:hidden">
          <div className="flex items-center justify-between">
            <ThemeToggle />
          </div>
          {activeLesson ? (
            <LessonView productSlug={productSlug} courseTitle={courseTitle} creatorName={creatorName} lesson={activeLesson} completed={completedIds.includes(activeLesson.id)} prevId={prevId} nextId={nextId} />
          ) : (
            <Card className="py-16 text-center text-[13px] text-crow-muted">Este producto todavía no tiene lecciones publicadas.</Card>
          )}
          {resources.length > 0 && <ResourcesPanel resources={resources} />}
        </div>
      </div>
    </ThemeProvider>
  );
}

function ResourcesPanel({ resources }: { resources: { id: string; title: string; content: string; url: string | null; kind: string }[] }) {
  return (
    <Card>
      <h2 className="text-[15px] font-semibold text-crow-text">Recursos del curso</h2>
      <ul className="mt-4 space-y-2.5">
        {resources.map((resource) => (
          <li key={resource.id} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <span className="mt-0.5 text-[16px]">{KIND_ICON[resource.kind] ?? "📎"}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-crow-text">{resource.title}</p>
              {resource.content && resource.content !== resource.title && (
                <p className="mt-0.5 text-[12px] leading-relaxed text-crow-muted">{resource.content}</p>
              )}
            </div>
            {resource.url && (
              <a href={resource.url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg border border-crow-violet/30 bg-crow-violet/10 px-3 py-1 text-[11.5px] text-crow-glow hover:bg-crow-violet/20">
                Ver →
              </a>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
