// Curso: Introducción a la Criminología — tipos compartidos del contenido.
// El contenido vive aquí; la materialización (scripts/materialize-criminologia.ts)
// mapea estas estructuras a los modelos Prisma existentes.

export type ExerciseKind =
  | "COMPREHENSION"
  | "TRUE_FALSE"
  | "MULTIPLE_CHOICE"
  | "CASE_ANALYSIS"
  | "REFLECTION";

export type ExerciseSpec = {
  kind: ExerciseKind;
  question: string;
  options?: string[];
  /** Índice de la opción correcta (para MULTIPLE_CHOICE y TRUE_FALSE). */
  answerIndex?: number;
  /** Respuesta esperada abierta (para COMPREHENSION, CASE_ANALYSIS, REFLECTION). */
  answerText?: string;
  explanation: string;
};

export type LessonSpec = {
  title: string;
  minutes: number;
  /** La primera lección de cada módulo es candidata a video. */
  video: boolean;
  sections: { heading: string; body: string }[];
  summary: string;
  activity?: string;
  resources?: { label: string; note: string }[];
};

export type ModuleSpec = {
  title: string;
  intro: string;
  /** Prompt para generar la imagen del módulo con Leonardo. */
  imagePrompt: string;
  lessons: LessonSpec[];
  exercises: ExerciseSpec[];
};

export type CourseHeader = {
  title: string;
  subtitle: string;
  description: string;
  objectives: string[];
  audience: string;
  audienceNote: string;
  level: string;
  hours: number;
  priceUsdt: number;
};

export type FinalAssessment = {
  title: string;
  instructions: string;
  rubric: { criterion: string; weight: number; detail: string }[];
};

export type CourseSpec = CourseHeader & {
  modules: ModuleSpec[];
  finalQuiz: ExerciseSpec[];
  finalAssessment: FinalAssessment;
  conclusion: string;
};
