import type { ProductBlueprint } from "@/lib/ai/blueprint";

/**
 * Compact spec format used by the CROW demo engine.
 * Keeps the deterministic fallback blueprints readable and easy to extend.
 */

export type QuizSpec = {
  title: string;
  instructions: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export type LessonSpec = [
  title: string,
  content: string,
  exercise: string,
  preview?: boolean,
  quizzes?: QuizSpec[],
  imagePrompt?: string,
];

export type ModuleSpec = [title: string, summary: string, lessons: LessonSpec[]];

export type BlueprintSpec = {
  keywords: string[];
  title: string;
  short: string;
  description: string;
  audience: string;
  promise: string;
  type: ProductBlueprint["productType"];
  category: string;
  price: number;
  includes: string[];
  resources: string[];
  strategy: string[];
  checklist: string[];
  goals: string[];
  tags: string[];
  emoji: string;
  gradient: string;
  modules: ModuleSpec[];
};