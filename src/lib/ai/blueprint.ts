import { z } from "zod";

import { PRODUCT_TYPES } from "@/lib/domain";

export const blueprintExerciseSchema = z.object({
  title: z.string().min(1),
  instructions: z.string().default(""),
  kind: z.enum(["PRACTICE", "QUIZ", "PROJECT"]).default("PRACTICE"),
  // Quiz fields — only used when kind = "QUIZ"
  options: z.array(z.string()).default([]),
  correctAnswer: z.string().default(""),
  explanation: z.string().default(""),
});

export const mediaSpecSchema = z.object({
  type: z.enum(["IMAGE", "DIAGRAM", "CHART", "INFOGRAPHIC", "TIMELINE", "PROCESS", "COMPARISON", "CODE_VISUAL", "IMAGE_WITH_OVERLAY"]).default("IMAGE"),
  purpose: z.string().default("concept_illustration"),
  title: z.string().optional().default(""),
  description: z.string().optional().default(""),
  visualPrompt: z.string().optional().default(""),
  data: z.unknown().optional(),
  overlays: z.array(z.object({
    text: z.string(),
    position: z.enum(["top", "bottom", "left", "right", "center", "top-left", "top-right", "bottom-left", "bottom-right"]),
    style: z.enum(["title", "label", "number", "caption", "badge"]).optional(),
    fontSize: z.enum(["sm", "md", "lg", "xl"]).optional(),
  })).optional().default([]),
  confidence: z.number().min(0).max(1).optional().default(0.5),
  reasoning: z.string().optional().default(""),
  needed: z.boolean().optional().default(true),
});

export const blueprintLessonSchema = z.object({
  title: z.string().min(1),
  content: z.string().default(""),
  durationMin: z.number().int().min(1).max(600).default(20),
  imagePrompt: z.string().optional().default(""),
  mediaSvg: z.string().optional(),
  mediaVisualPrompt: z.string().optional(),
  videoUrl: z.string().optional().default(""),
  // ── Video spec (§3): decided by CROW heuristic + creator preference ──────
  videoEnabled: z.boolean().default(false),
  videoRequired: z.boolean().default(false),
  videoPrompt: z.string().optional().default(""),
  videoDuration: z.number().int().min(1).max(60).optional().default(5),
  videoStyle: z.string().optional().default("cinematic"),
  isFreePreview: z.boolean().default(false),
  exercises: z.array(blueprintExerciseSchema).default([]),
  // ── Media Quality Engine (§NEW): precise visual specification ───────────
  mediaSpec: mediaSpecSchema.optional(),
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
          "content": string (markdown supported: use ## headings, **bold**, - lists, > quotes),
          "durationMin": number,
          "imagePrompt": string (detailed visual description for cover/illustration, in English),
          "videoUrl": "",
          "videoEnabled": boolean (true when the lesson benefits from a video: demos, procedures, tutorials, complex explanations),
          "videoPrompt": string (short motion description in English, derived from the lesson content),
          "videoDuration": 5,
          "videoStyle": "cinematic",
          "isFreePreview": boolean,
          "exercises": [
            {
              "title": string,
              "instructions": string,
              "kind": "PRACTICE" | "QUIZ" | "PROJECT",
              "options": ["option A", "option B", "option C", "option D"] (only for QUIZ),
              "correctAnswer": "option A" (exact string from options, only for QUIZ),
              "explanation": "Why this is correct and others are not" (only for QUIZ)
            }
          ]
        }
      ]
    }
  ]
}`;

export function buildBlueprintPrompt(idea: string, productType?: string) {
  return `Generá un JSON para CROW MARKET sobre: "${idea}"${productType ? ` (${productType})` : ""}

Schema:
${blueprintJsonSchemaHint}

Reglas: 5 módulos, 3 lecciones c/u. content: 80-120 palabras, markdown, específico. 1 PRACTICE + 1 QUIZ/lesson. imagePrompt inglés. description 2 párrafos. resources 3. includes 4. price 29-49. Solo JSON.`;
}

/** Extracts the first JSON object from a model answer (tolerates markdown and truncation). */
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
  // Attempt to repair truncated JSON by closing open brackets/strings
  for (const candidate of candidates) {
    const start = candidate.indexOf("{");
    if (start === -1) continue;
    const slice = candidate.slice(start);
    try {
      return JSON.parse(slice);
    } catch {
      // Try to repair truncated JSON
      let repaired = "";
      let inString = false;
      let escaped = false;
      const openStack: string[] = [];
      let lastValidLen = 0;

      for (let i = 0; i < slice.length; i++) {
        const ch = slice[i];
        if (escaped) { escaped = false; repaired += ch; continue; }
        if (ch === "\\") { escaped = true; repaired += ch; continue; }
        if (ch === '"') {
          if (!inString) {
            inString = true;
            repaired += ch;
          } else {
            // Check if this closes the string (next char isn't escaped)
            inString = false;
            repaired += ch;
          }
          continue;
        }
        if (inString) { repaired += ch; continue; }
        if (ch === "{" || ch === "[") {
          openStack.push(ch === "{" ? "}" : "]");
          repaired += ch;
          continue;
        }
        if ((ch === "}" || ch === "]") && openStack.length > 0) {
          const expected = openStack.pop();
          if (ch === expected) {
            repaired += ch;
            if (openStack.length === 0) lastValidLen = repaired.length;
          }
          continue;
        }
        if (ch === "," || ch === ":" || ch === " " || ch === "\n" || ch === "\r" || ch === "\t") {
          repaired += ch;
          continue;
        }
        if (ch >= "0" && ch <= "9" || ch === "-") {
          repaired += ch;
          continue;
        }
        if (ch === "t" || ch === "f" || ch === "n") {
          repaired += ch;
          continue;
        }
      }

      // Close any remaining open structures
      let closing = "";
      for (let i = openStack.length - 1; i >= 0; i--) {
        closing += openStack[i];
      }

      // If we're inside a string, close it first
      if (inString) closing = '"' + closing;

      const attempt = repaired + closing;
      try {
        return JSON.parse(attempt);
      } catch {
        // Try without trailing incomplete values
        if (lastValidLen > 10) {
          const trimmed = repaired.slice(0, lastValidLen);
          let closeExtra = "";
          for (let i = openStack.length - 1; i >= 0; i--) {
            closeExtra += openStack[i];
          }
          try {
            return JSON.parse(trimmed + closeExtra);
          } catch {
            continue;
          }
        }
        continue;
      }
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
    { label: "Al menos 4 módulos", ok: stats.modules >= 4, weight: 10 },
    { label: "Al menos 8 lecciones", ok: stats.lessons >= 8, weight: 15 },
    { label: "Ejercicios prácticos (mín. 5)", ok: stats.exercises >= 5, weight: 8 },
    {
      label: "Quiz con opciones en al menos 1 ejercicio",
      ok: blueprint.modules.flatMap(m => m.lessons).flatMap(l => l.exercises).some(
        e => e.kind === "QUIZ" && e.options.length >= 2 && e.correctAnswer.length > 0
      ),
      weight: 10,
    },
    { label: "Recursos entregables (mín. 2)", ok: blueprint.resources.length >= 2, weight: 7 },
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