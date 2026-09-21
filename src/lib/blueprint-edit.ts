import type {
  BlueprintLesson,
  BlueprintModule,
  ProductBlueprint,
} from "@/lib/ai/blueprint";

/**
 * Pure, client-safe immutable helpers for the Live Product Blueprint editor.
 * Every mutation returns a new blueprint so React state updates stay predictable.
 */

export function patchBlueprint(
  blueprint: ProductBlueprint,
  patch: Partial<ProductBlueprint>,
): ProductBlueprint {
  return { ...blueprint, ...patch };
}

export function patchStringList(
  blueprint: ProductBlueprint,
  key: "includes" | "resources" | "commercialStrategy" | "qualityChecklist" | "learningGoals" | "tags",
  value: string,
): ProductBlueprint {
  const list = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return { ...blueprint, [key]: list };
}

const emptyLesson = (): BlueprintLesson => ({
  title: "Nueva lección",
  content: "",
  durationMin: 20,
  imagePrompt: "",
  videoUrl: "",
  videoEnabled: false,
  videoRequired: false,
  videoPrompt: "",
  videoDuration: 5,
  videoStyle: "cinematic",
  isFreePreview: false,
  exercises: [],
});

export function addModule(blueprint: ProductBlueprint): ProductBlueprint {
  return {
    ...blueprint,
    modules: [
      ...blueprint.modules,
      {
        title: `Módulo ${blueprint.modules.length + 1}`,
        summary: "",
        lessons: [emptyLesson()],
      },
    ],
  };
}

export function removeModule(blueprint: ProductBlueprint, index: number): ProductBlueprint {
  return {
    ...blueprint,
    modules: blueprint.modules.filter((_, position) => position !== index),
  };
}

export function patchModule(
  blueprint: ProductBlueprint,
  index: number,
  patch: Partial<BlueprintModule>,
): ProductBlueprint {
  return {
    ...blueprint,
    modules: blueprint.modules.map((module, position) =>
      position === index ? { ...module, ...patch } : module,
    ),
  };
}

export function moveModule(
  blueprint: ProductBlueprint,
  index: number,
  direction: -1 | 1,
): ProductBlueprint {
  const target = index + direction;
  if (target < 0 || target >= blueprint.modules.length) return blueprint;
  const modules = [...blueprint.modules];
  const [item] = modules.splice(index, 1);
  modules.splice(target, 0, item);
  return { ...blueprint, modules };
}

export function addLesson(blueprint: ProductBlueprint, moduleIndex: number): ProductBlueprint {
  return patchModule(blueprint, moduleIndex, {
    lessons: [...blueprint.modules[moduleIndex].lessons, emptyLesson()],
  });
}

export function removeLesson(
  blueprint: ProductBlueprint,
  moduleIndex: number,
  lessonIndex: number,
): ProductBlueprint {
  return patchModule(blueprint, moduleIndex, {
    lessons: blueprint.modules[moduleIndex].lessons.filter(
      (_, position) => position !== lessonIndex,
    ),
  });
}

export function patchLesson(
  blueprint: ProductBlueprint,
  moduleIndex: number,
  lessonIndex: number,
  patch: Partial<BlueprintLesson>,
): ProductBlueprint {
  const lessons = blueprint.modules[moduleIndex].lessons.map((lesson, position) =>
    position === lessonIndex ? { ...lesson, ...patch } : lesson,
  );
  return patchModule(blueprint, moduleIndex, { lessons });
}

export function moveLesson(
  blueprint: ProductBlueprint,
  moduleIndex: number,
  lessonIndex: number,
  direction: -1 | 1,
): ProductBlueprint {
  const lessons = blueprint.modules[moduleIndex].lessons;
  const target = lessonIndex + direction;
  if (target < 0 || target >= lessons.length) return blueprint;
  const next = [...lessons];
  const [item] = next.splice(lessonIndex, 1);
  next.splice(target, 0, item);
  return patchModule(blueprint, moduleIndex, { lessons: next });
}

export function addExercise(
  blueprint: ProductBlueprint,
  moduleIndex: number,
  lessonIndex: number,
): ProductBlueprint {
  const lesson = blueprint.modules[moduleIndex].lessons[lessonIndex];
  return patchLesson(blueprint, moduleIndex, lessonIndex, {
    exercises: [
      ...lesson.exercises,
      {
        title: "Nuevo ejercicio",
        instructions: "",
        kind: "PRACTICE",
        options: [],
        correctAnswer: "",
        explanation: "",
      },
    ],
  });
}

export function patchExercise(
  blueprint: ProductBlueprint,
  moduleIndex: number,
  lessonIndex: number,
  exerciseIndex: number,
  patch: Partial<BlueprintLesson["exercises"][number]>,
): ProductBlueprint {
  const lesson = blueprint.modules[moduleIndex].lessons[lessonIndex];
  return patchLesson(blueprint, moduleIndex, lessonIndex, {
    exercises: lesson.exercises.map((exercise, position) =>
      position === exerciseIndex ? { ...exercise, ...patch } : exercise,
    ),
  });
}

export function totalDuration(blueprint: ProductBlueprint) {
  return blueprint.modules
    .flatMap((module) => module.lessons)
    .reduce((sum, lesson) => sum + (lesson.durationMin || 0), 0);
}