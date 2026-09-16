import { LessonSidebar } from "@/components/course/lesson-sidebar";
import { LessonView } from "@/components/course/lesson-view";
import { Card } from "@/components/ui/card";

type Lesson = {
  id: string;
  title: string;
  content: string;
  durationMin: number;
  videoUrl: string | null;
  exercises: { id: string; title: string; instructions: string; kind: string }[];
};

type Module = { id: string; title: string; lessons: Lesson[] };

/** Premium Course Player: sidebar de progreso + lección activa. */
export function CoursePlayer({
  productSlug,
  courseTitle,
  creatorName,
  modules,
  completedIds,
  activeLessonId,
  progressPct,
  certificateSerial,
}: {
  productSlug: string;
  courseTitle: string;
  creatorName: string;
  modules: Module[];
  completedIds: string[];
  activeLessonId: string;
  progressPct: number;
  certificateSerial?: string | null;
}) {
  const lessons = modules.flatMap((module) => module.lessons);
  const activeLesson =
    lessons.find((lesson) => lesson.id === activeLessonId) ?? lessons[0];
  const index = lessons.findIndex((lesson) => lesson.id === activeLesson?.id);
  const prevId = index > 0 ? lessons[index - 1].id : undefined;
  const nextId = index >= 0 && index < lessons.length - 1 ? lessons[index + 1].id : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <LessonSidebar
        productSlug={productSlug}
        modules={modules}
        completedIds={completedIds}
        activeLessonId={activeLesson?.id ?? ""}
        progressPct={progressPct}
        certificateSerial={certificateSerial}
      />

      <div className="space-y-5">
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
      </div>
    </div>
  );
}