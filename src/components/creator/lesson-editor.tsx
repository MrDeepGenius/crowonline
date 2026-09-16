"use client";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import type { ProductBlueprint } from "@/lib/ai/blueprint";
import {
  addExercise,
  moveLesson,
  patchExercise,
  patchLesson,
  removeLesson,
} from "@/lib/blueprint-edit";

export function LessonEditor({
  blueprint,
  moduleIndex,
  lessonIndex,
  onChange,
}: {
  blueprint: ProductBlueprint;
  moduleIndex: number;
  lessonIndex: number;
  onChange: (next: ProductBlueprint) => void;
}) {
  const lesson = blueprint.modules[moduleIndex].lessons[lessonIndex];

  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3.5">
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-crow-muted">
          {moduleIndex + 1}.{lessonIndex + 1}
        </span>
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            onClick={() => onChange(moveLesson(blueprint, moduleIndex, lessonIndex, -1))}
            className="rounded px-1 text-[10px] text-crow-muted hover:bg-white/[0.06] hover:text-crow-text"
            aria-label="Subir lección"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onChange(moveLesson(blueprint, moduleIndex, lessonIndex, 1))}
            className="rounded px-1 text-[10px] text-crow-muted hover:bg-white/[0.06] hover:text-crow-text"
            aria-label="Bajar lección"
          >
            ↓
          </button>
        </div>
        <Input
          value={lesson.title}
          onChange={(event) =>
            onChange(
              patchLesson(blueprint, moduleIndex, lessonIndex, { title: event.target.value }),
            )
          }
          placeholder="Título de la lección"
          className="h-9 flex-1"
        />
        <button
          type="button"
          onClick={() => onChange(removeLesson(blueprint, moduleIndex, lessonIndex))}
          className="shrink-0 rounded-md px-2 py-1 text-[11px] text-crow-danger/80 hover:bg-crow-danger/10"
          aria-label="Eliminar lección"
        >
          ✕
        </button>
      </div>

      <Textarea
        className="mt-2.5 min-h-[90px] text-[12.5px]"
        value={lesson.content}
        onChange={(event) =>
          onChange(
            patchLesson(blueprint, moduleIndex, lessonIndex, { content: event.target.value }),
          )
        }
        placeholder="Contenido de la lección"
      />

      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <Input
          type="number"
          min={1}
          max={600}
          value={lesson.durationMin}
          onChange={(event) =>
            onChange(
              patchLesson(blueprint, moduleIndex, lessonIndex, {
                durationMin: Number(event.target.value) || 20,
              }),
            )
          }
          className="h-9 w-24"
        />
        <span className="text-[11px] text-crow-muted">minutos</span>

        <label className="flex items-center gap-2 text-[11.5px] text-crow-muted">
          <input
            type="checkbox"
            checked={lesson.isFreePreview}
            onChange={(event) =>
              onChange(
                patchLesson(blueprint, moduleIndex, lessonIndex, {
                  isFreePreview: event.target.checked,
                }),
              )
            }
            className="h-3.5 w-3.5 accent-[#6A00FF]"
          />
          Preview gratis
        </label>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onChange(addExercise(blueprint, moduleIndex, lessonIndex))}
        >
          + Ejercicio
        </Button>
      </div>

      {lesson.exercises.length ? (
        <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
          {lesson.exercises.map((exercise, exerciseIndex) => (
            <div key={exerciseIndex} className="rounded-lg bg-white/[0.02] p-2.5">
              <Input
                value={exercise.title}
                onChange={(event) =>
                  onChange(
                    patchExercise(blueprint, moduleIndex, lessonIndex, exerciseIndex, {
                      title: event.target.value,
                    }),
                  )
                }
                className="h-9"
                placeholder="Título del ejercicio"
              />
              <Textarea
                className="mt-2 min-h-[60px] text-[12px]"
                value={exercise.instructions}
                onChange={(event) =>
                  onChange(
                    patchExercise(blueprint, moduleIndex, lessonIndex, exerciseIndex, {
                      instructions: event.target.value,
                    }),
                  )
                }
                placeholder="Instrucciones"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(["PRACTICE", "QUIZ", "PROJECT"] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() =>
                      onChange(
                        patchExercise(blueprint, moduleIndex, lessonIndex, exerciseIndex, {
                          kind,
                        }),
                      )
                    }
                    className={`rounded-full border px-2.5 py-0.5 text-[10.5px] transition ${
                      exercise.kind === kind
                        ? "border-crow-violet/50 bg-crow-violet/15 text-crow-glow"
                        : "border-white/[0.08] text-crow-muted hover:text-crow-text"
                    }`}
                  >
                    {kind}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}