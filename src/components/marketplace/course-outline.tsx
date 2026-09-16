import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Lesson = {
  id: string;
  title: string;
  durationMin: number;
  exercises: { id: string; title: string }[];
};

type Module = {
  id: string;
  title: string;
  summary: string | null;
  lessons: Lesson[];
};

export function CourseOutline({ modules }: { modules: Module[] }) {
  return (
    <div className="mt-5 space-y-3">
      {modules.map((module, moduleIndex) => (
        <Card key={module.id} className="p-0">
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3.5">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-crow-muted">
                Módulo {moduleIndex + 1}
              </p>
              <p className="mt-0.5 text-[14px] font-medium text-crow-text">
                {module.title}
              </p>
              {module.summary ? (
                <p className="mt-1 text-[11.5px] text-crow-muted">{module.summary}</p>
              ) : null}
            </div>
            <Badge tone="default" className="shrink-0">
              {module.lessons.length} lecciones
            </Badge>
          </div>
          <ul className="divide-y divide-white/[0.05]">
            {module.lessons.map((lesson, lessonIndex) => (
              <li
                key={lesson.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-crow-text">
                    {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                  </p>
                  {lesson.exercises.length ? (
                    <p className="mt-0.5 text-[11px] text-crow-muted">
                      {lesson.exercises.length} ejercicio
                      {lesson.exercises.length === 1 ? "" : "s"}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 text-[11.5px] text-crow-muted">
                  {lesson.durationMin} min
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}