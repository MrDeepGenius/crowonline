/**
 * Tipos autocontenidos del curso "Introducción a la Criminología".
 * No dependen del schema de Prisma ni de la API interna del Studio:
 * el materializador traduce este formato a ProductBlueprint.
 */

export type ExerciseKind = "PRACTICE" | "QUIZ" | "PROJECT";

export type ExerciseSpec = {
  title: string;
  /** Consigna completa. Puede contener varios ítems (V/F, opciones, preguntas). */
  instructions: string;
  kind: ExerciseKind;
};

export type LessonSpec = {
  title: string;
  /** Texto plano; los párrafos se separan con "\n\n" (el player los renderiza). */
  content: string;
  /** Prompt para generar la imagen de la lección con Leonardo (opcional). */
  imagePrompt?: string;
  exercises?: ExerciseSpec[];
};

export type ModuleSpec = {
  title: string;
  summary: string;
  lessons: LessonSpec[];
};

export type CourseMeta = {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  priceUsdt: number;
  level: string;
  durationMinutes: number;
  objectives: string[];
  audience: string;
  coverImagePrompt: string;
};

export type CourseSpec = {
  meta: CourseMeta;
  modules: ModuleSpec[];
};

/**
 * Curso "Introducción a la Criminología" — tipos autocontenidos del material
 * didáctico. No dependen del schema de Prisma: el materializador los convierte
 * al ProductBlueprint que consume el pipeline del Creator Studio.
 */

export type ExerciseKind = "PRACTICE" | "QUIZ" | "PROJECT";

export type ExerciseSpec = {
  title: string;
  instructions: string;
  kind: ExerciseKind;
};

export type LessonSpec = {
  title: string;
  durationMin: number;
  isFreePreview?: boolean;
  imagePrompt?: string;
  /** Párrafos reales; el materializador los une con "\n\n". */
  paragraphs: string[];
  exercises: ExerciseSpec[];
};

export type ModuleSpec = {
  title: string;
  summary: string;
  lessons: LessonSpec[];
};

export type CourseSpec = {
  meta: {
    title: string;
    subtitle: string;
    shortDescription: string;
    description: string;
    category: string;
    productType: "COURSE";
    recommendedPriceUsdt: number;
    coverEmoji: string;
    coverGradient: string;
    tags: string[];
    includes: string[];
    learningGoals: string[];
    targetAudience: string;
    coverImagePrompt: string;
  };
  modules: ModuleSpec[];
};
