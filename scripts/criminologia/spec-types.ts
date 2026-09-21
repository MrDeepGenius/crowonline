/**
 * Formato autocontenido del curso "Introducción a la Criminología".
 * El materializador (scripts/materialize-criminologia.ts) mapea este formato
 * a ProductBlueprint usando createProductFromBlueprint + publishProductRecord.
 */

export type ExerciseKind = "PRACTICE" | "QUIZ" | "PROJECT";

export interface ExerciseSpec {
  title: string;
  instructions: string;
  kind: ExerciseKind;
}

export interface LessonSpec {
  title: string;
  /** Texto plano; el player separa párrafos por línea en blanco. */
  content: string;
  /** Prompt para Leonardo; el materializador genera la imagen y la vincula a la lección. */
  imagePrompt?: string;
  exercises: ExerciseSpec[];
}

export interface ModuleSpec {
  title: string;
  summary: string;
  /** Prompt para la imagen del módulo. */
  imagePrompt?: string;
  lessons: LessonSpec[];
}
