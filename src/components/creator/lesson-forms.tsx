import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { addModuleAction, updateLessonAction } from "@/server/actions/creator-edit";

type Lesson = {
  id: string;
  title: string;
  content: string;
  durationMin: number;
  videoUrl: string | null;
  isFreePreview: boolean;
};

type Module = { id: string; title: string; lessons: Lesson[] };

export function LessonForms({
  productId,
  modules,
}: {
  productId: string;
  modules: Module[];
}) {
  return (
    <Card id="lecciones">
      <CardHeader
        title="Lecciones"
        description={`${modules.length} módulos · ${modules.flatMap((module) => module.lessons).length} lecciones`}
        action={
          <form action={addModuleAction}>
            <input type="hidden" name="productId" value={productId} />
            <Button type="submit" size="sm" variant="secondary">
              + Módulo
            </Button>
          </form>
        }
      />

      <div className="space-y-4">
        {modules.map((module, moduleIndex) => (
          <div key={module.id} className="rounded-2xl border border-white/[0.07] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-medium text-crow-text">
                {moduleIndex + 1}. {module.title}
              </p>
              <Badge tone="default">{module.lessons.length} lecciones</Badge>
            </div>

            <div className="mt-3 space-y-3">
              {module.lessons.map((lesson, lessonIndex) => (
                <details
                  key={lesson.id}
                  className="rounded-xl border border-white/[0.06] bg-black/25 p-3"
                >
                  <summary className="cursor-pointer text-[12.5px] text-crow-text">
                    {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                    <span className="ml-2 text-[11px] text-crow-muted">
                      {lesson.durationMin} min
                    </span>
                  </summary>

                  <form action={updateLessonAction} className="mt-3 space-y-3">
                    <input type="hidden" name="productId" value={productId} />
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <Field label="Título">
                      <Input name="title" defaultValue={lesson.title} />
                    </Field>
                    <Field label="Contenido">
                      <Textarea
                        name="content"
                        className="min-h-[120px]"
                        defaultValue={lesson.content}
                      />
                    </Field>
                    <div className="flex flex-wrap items-center gap-3">
                      <Input
                        name="durationMin"
                        type="number"
                        min={1}
                        max={600}
                        defaultValue={lesson.durationMin}
                        className="w-24"
                      />
                      <Input
                        name="videoUrl"
                        placeholder="URL de vídeo (opcional)"
                        defaultValue={lesson.videoUrl ?? ""}
                        className="flex-1"
                      />
                      <label className="flex items-center gap-2 text-[11.5px] text-crow-muted">
                        <input
                          type="checkbox"
                          name="isFreePreview"
                          defaultChecked={lesson.isFreePreview}
                          className="h-3.5 w-3.5 accent-[#6A00FF]"
                        />
                        Preview gratis
                      </label>
                    </div>
                    <Button type="submit" size="sm">
                      Guardar lección
                    </Button>
                  </form>
                </details>
              ))}
            </div>
          </div>
        ))}

        {!modules.length ? (
          <p className="text-[12.5px] text-crow-muted">
            Este producto no es un curso o todavía no tiene módulos.
          </p>
        ) : null}
      </div>
    </Card>
  );
}