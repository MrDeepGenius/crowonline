import { z } from "zod";

import { PRODUCT_TYPES } from "@/lib/domain";

export const blueprintExerciseSchema = z.object({
  title: z.string().min(1),
  instructions: z.string().default(""),
  kind: z.enum(["PRACTICE", "QUIZ", "PROJECT"]).default("PRACTICE"),
});

export const blueprintLessonSchema = z.object({
  title: z.string().min(1),
  content: z.string().default(""),
  durationMin: z.number().int().min(1).max(600).default(20),
  imagePrompt: z.string().optional().default(""),
  videoUrl: z.string().optional().default(""),
  isFreePreview: z.boolean().default(false),
  exercises: z.array(blueprintExerciseSchema).default([]),
});

export const blueprintModuleSchema = z.object({
  title: z.string().min(1),
  summary: z.string().default(""),
  lessons: z.array(blueprintLessonSchema).default([]),
});

export const blueprintSchema = z.object({
  title: z.string().min(3),
  shortDescription: z.string().min(10),
  description: z.string().min(20),
  audience: z.string().min(3),
  promise: z.string().min(3),
  productType: z.enum(PRODUCT_TYPES),
  category: z.string().min(2),
  recommendedPriceUsdt: z.number().min(0).max(9999).default(29),
  includes: z.array(z.string()).default([]),
  resources: z.array(z.string()).default([]),
  commercialStrategy: z.array(z.string()).default([]),
  qualityChecklist: z.array(z.string()).default([]),
  learningGoals: z.array(z.string()).default([]),
  modules: z.array(blueprintModuleSchema).default([]),
  coverEmoji: z.string().default("◆"),
  coverGradient: z.string().default("violet"),
  tags: z.array(z.string()).default([]),
});

export type ProductBlueprint = z.infer<typeof blueprintSchema>;
export type BlueprintModule = z.infer<typeof blueprintModuleSchema>;
export type BlueprintLesson = z.infer<typeof blueprintLessonSchema>;
export type BlueprintExercise = z.infer<typeof blueprintExerciseSchema>;

export const blueprintJsonSchemaHint = `{
  "title": string,
  "shortDescription": string (max 120 chars),
  "description": string (2-4 párrafos),
  "audience": string,
  "promise": string,
  "productType": "COURSE" | "EBOOK" | "PDF" | "INTERACTIVE_WEB" | "RESOURCE_KIT",
  "category": "Cursos" | "Ebook" | "PDF" | "Web interactiva" | "Kit de recursos",
  "recommendedPriceUsdt": number,
  "includes": string[],
  "resources": string[],
  "commercialStrategy": string[],
  "qualityChecklist": string[],
  "learningGoals": string[],
  "tags": string[],
  "coverEmoji": string,
  "coverGradient": "violet" | "aurora" | "ember" | "ocean" | "mono",
  "modules": [
    {
      "title": string,
      "summary": string,
      "lessons": [
        {
          "title": string,
          "content": string,
          "durationMin": number,
          "imagePrompt": string,
          "videoUrl": "",
          "isFreePreview": boolean,
          "exercises": [{ "title": string, "instructions": string, "kind": "PRACTICE" | "QUIZ" | "PROJECT" }]
        }
      ]
    }
  ]
}`;

export function buildBlueprintPrompt(idea: string, productType?: string) {
  return `IDEA DEL CREATOR: "${idea}"
${productType ? `TIPO DE PRODUCTO PREFERIDO: ${productType}` : ""}

Genera el blueprint completo de un infoproducto vendible para CROW MARKET.
Devuelve EXCLUSIVAMENTE un JSON con esta forma exacta:
${blueprintJsonSchemaHint}

Requisitos:
- Entre 3 y 5 módulos, con 3 o 4 lecciones por módulo.
- Cada lección lleva 1 o 2 ejercicios concretos.
- Contenido específico del nicho de la idea, sin frases de relleno.
- Título atractivo, corto y comercial.`;
}

/** Extracts the first JSON object from a model answer (tolerates markdown). */
export function extractJson(raw: string): unknown {
  const fenced = raw.split("```").map((chunk) => chunk.trim());
  const candidates = [raw, ...fenced];
  for (const candidate of candidates) {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) continue;
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      continue;
    }
  }
  return null;
}

export function parseBlueprint(raw: unknown): ProductBlueprint | null {
  const parsed = blueprintSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function blueprintStats(blueprint: ProductBlueprint) {
  const lessons = blueprint.modules.flatMap((module) => module.lessons);
  return {
    modules: blueprint.modules.length,
    lessons: lessons.length,
    exercises: lessons.reduce((sum, lesson) => sum + lesson.exercises.length, 0),
    durationMin: lessons.reduce(
      (sum, lesson) => sum + (lesson.durationMin || 20),
      0,
    ),
  };
}

export type QualityCheck = {
  label: string;
  ok: boolean;
  weight: number;
};

export type QualityReport = {
  score: number;
  ready: boolean;
  checks: QualityCheck[];
  blocking: QualityCheck[];
};

/**
 * Deterministic quality gate used by the Preview → Publish step.
 * Returns a 0-100 score plus actionable findings.
 */
export function qualityCheck(blueprint: ProductBlueprint): QualityReport {
  const stats = blueprintStats(blueprint);

  const checks: QualityCheck[] = [
    { label: "Título comercial definido", ok: blueprint.title.length >= 8, weight: 10 },
    {
      label: "Descripción con extensión suficiente",
      ok: blueprint.description.length >= 200,
      weight: 10,
    },
    { label: "Público objetivo claro", ok: blueprint.audience.length >= 10, weight: 10 },
    {
      label: "Promesa con resultado medible",
      ok: blueprint.promise.length >= 15,
      weight: 10,
    },
    { label: "Al menos 3 módulos", ok: stats.modules >= 3, weight: 15 },
    { label: "Al menos 8 lecciones", ok: stats.lessons >= 8, weight: 15 },
    { label: "Ejercicios prácticos", ok: stats.exercises >= 5, weight: 12 },
    { label: "Recursos entregables", ok: blueprint.resources.length >= 2, weight: 8 },
    {
      label: "Estrategia comercial definida",
      ok: blueprint.commercialStrategy.length >= 2,
      weight: 5,
    },
    {
      label: "Precio sugerido válido",
      ok: blueprint.recommendedPriceUsdt >= 9,
      weight: 5,
    },
  ];

  const earned = checks
    .filter((check) => check.ok)
    .reduce((sum, check) => sum + check.weight, 0);

  return {
    score: Math.round(earned),
    ready: earned >= 70,
    checks,
    blocking: checks.filter((check) => !check.ok && check.weight >= 12),
  };
}

export function blueprintToMarkdown(blueprint: ProductBlueprint) {
  const lines: string[] = [
    `# ${blueprint.title}`,
    "",
    blueprint.shortDescription,
    "",
    `**Promesa:** ${blueprint.promise}`,
    `**Público:** ${blueprint.audience}`,
    `**Precio sugerido:** ${blueprint.recommendedPriceUsdt} USDT`,
    "",
    "## Qué incluye",
    ...blueprint.includes.map((item) => `- ${item}`),
    "",
    "## Estructura",
  ];

  blueprint.modules.forEach((module, moduleIndex) => {
    lines.push(`### Módulo ${moduleIndex + 1}: ${module.title}`);
    module.lessons.forEach((item, lessonIndex) => {
      lines.push(`${moduleIndex + 1}.${lessonIndex + 1} ${item.title}`);
      if (item.content) lines.push("", item.content);
      item.exercises.forEach((exercise) => {
        lines.push(`> Ejercicio: ${exercise.title} — ${exercise.instructions}`);
      });
      lines.push("");
    });
  });

  return lines.join("\n");
}