"use client";

import { LessonEditor } from "@/components/creator/lesson-editor";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import type { ProductBlueprint } from "@/lib/ai/blueprint";
import { addLesson, addModule, moveModule, patchModule, removeModule } from "@/lib/blueprint-edit";

export function ModulesEditor({
  blueprint,
  onChange,
}: {
  blueprint: ProductBlueprint;
  onChange: (next: ProductBlueprint) => void;
}) {
  return (
    <Card className="space-y-5">
      <CardHeader
        title="Estructura del producto"
        description="Módulos, lecciones y ejercicios — editable campo por campo"
        action={
          <Button size="sm" variant="secondary" onClick={() => onChange(addModule(blueprint))}>
            + Módulo
          </Button>
        }
      />

      <div className="space-y-4">
        {blueprint.modules.map((module, moduleIndex) => (
          <div
            key={moduleIndex}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
          >
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-crow-violet/30 bg-crow-violet/10 text-[11px] font-medium text-crow-glow">
                {moduleIndex + 1}
              </span>

              <div className="flex-1 space-y-2.5">
                <Input
                  value={module.title}
                  onChange={(event) =>
                    onChange(patchModule(blueprint, moduleIndex, { title: event.target.value }))
                  }
                  placeholder="Título del módulo"
                />
                <Input
                  value={module.summary}
                  onChange={(event) =>
                    onChange(patchModule(blueprint, moduleIndex, { summary: event.target.value }))
                  }
                  placeholder="Resumen del módulo"
                />
              </div>

              <div className="flex shrink-0 flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => onChange(moveModule(blueprint, moduleIndex, -1))}
                  className="rounded-md px-2 py-1 text-[11px] text-crow-muted hover:bg-white/[0.06] hover:text-crow-text"
                  aria-label="Subir módulo"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onChange(moveModule(blueprint, moduleIndex, 1))}
                  className="rounded-md px-2 py-1 text-[11px] text-crow-muted hover:bg-white/[0.06] hover:text-crow-text"
                  aria-label="Bajar módulo"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => onChange(removeModule(blueprint, moduleIndex))}
                  className="rounded-md px-2 py-1 text-[11px] text-crow-danger/80 hover:bg-crow-danger/10"
                  aria-label="Eliminar módulo"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {module.lessons.map((_, lessonIndex) => (
                <LessonEditor
                  key={lessonIndex}
                  blueprint={blueprint}
                  moduleIndex={moduleIndex}
                  lessonIndex={lessonIndex}
                  onChange={onChange}
                />
              ))}

              <Button
                size="sm"
                variant="secondary"
                onClick={() => onChange(addLesson(blueprint, moduleIndex))}
              >
                + Lección
              </Button>
            </div>
          </div>
        ))}

        {!blueprint.modules.length ? (
          <p className="text-[12.5px] text-crow-muted">
            Genera el blueprint con IA o añade módulos manualmente.
          </p>
        ) : null}
      </div>
    </Card>
  );
}