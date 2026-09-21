/**
 * CROW Studio Modular Generation Pipeline (depth-aware)
 *
 * Supports courses from BÁSICO (5 modules, 3 lessons each) to
 * PROFESIONAL (16 modules, 10 lessons each).
 *
 * Pipeline:
 *   Step 1: Structure-only blueprint (small JSON, depth-adapted)
 *   Step 2: Module content generation (1 call/module, with prev/next context)
 *   Step 3: Quality gate before returning
 *
 * Each step produces small, parseable JSON. Results are incremental.
 */

import {
  type ProductBlueprint,
  type BlueprintModule,
  type BlueprintLesson,
  type BlueprintExercise,
  extractJson,
  parseBlueprint,
} from "@/lib/ai/blueprint";
import { askProviders } from "@/lib/ai/providers";
import type { ProductSpec, CourseDepth } from "@/lib/ai/converse";
import { DEPTH_CONFIG } from "@/lib/ai/converse";
import {
  type MediaSpec,
  buildMediaSpecPrompt,
  validateMediaSpec,
  defaultMediaSpec,
} from "@/lib/ai/media-spec";
import { renderMediaSpec } from "@/lib/ai/media-renderers";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PipelineProgress = {
  step: "structure" | "modules" | "media" | "quality" | "ready" | "failed";
  currentModule?: number;
  totalModules?: number;
  currentLesson?: number;
  totalLessons?: number;
  message: string;
};

export type PipelineResult = {
  blueprint: ProductBlueprint;
  provider: string;
  mode: "live" | "skeleton";
  steps: string[];
};

// ─── Concurrency limiter ─────────────────────────────────────────────────────

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  maxConcurrency: number,
): Promise<T[]> {
  const results: T[] = [];
  const executing = new Set<Promise<void>>();

  for (const task of tasks) {
    const p = task().then((result) => {
      results.push(result);
    });
    const tracked = p.then(() => { executing.delete(tracked); });
    executing.add(tracked);

    if (executing.size >= maxConcurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

// ─── Depth helpers ──────────────────────────────────────────────────────────

function getDepthRange(depth: CourseDepth): { modules: [number, number]; lessonsPerModule: [number, number] } {
  return DEPTH_CONFIG[depth] ?? DEPTH_CONFIG.basic;
}

function getDepthContentGuide(depth: CourseDepth): string {
  switch (depth) {
    case "professional":
      return `ESTE ES UN CURSO PROFESIONAL/MASTER.
Cada lección debe ser profunda: explicación detallada, ejemplos reales del mundo profesional, procedimientos paso a paso, errores frecuentes, casos de estudio, recomendaciones de expertos.
Incluye: proyecto final, evaluaciones acumulativas, casos prácticos, recursos descargables.
Contenido por lección: 200-350 palabras de calidad.`;
    case "advanced":
      return `ESTE ES UN CURSO AVANZADO.
Cada lección debe profundizar en técnicas, estrategias y aplicaciones complejas. Incluir casos de estudio reales, comparativas, errores comunes y mejores prácticas.
Contenido por lección: 180-280 palabras.`;
    case "intermediate":
      return `ESTE ES UN CURSO INTERMEDIO.
Cada lección debe conectar fundamentos con aplicación práctica. Incluir ejemplos reales, ejercicios guiados y tips profesionales.
Contenido por lección: 150-220 palabras.`;
    default:
      return `ESTE ES UN CURSO BÁSICO.
Cada lección debe explicar desde cero, con ejemplos simples, pasos claros y lenguaje accesible. Evitar jerga técnica innecesaria.
Contenido por lección: 120-180 palabras.`;
  }
}

// ─── Step 1: Structure-only blueprint ────────────────────────────────────────

function buildStructurePrompt(spec: ProductSpec): string {
  const topic = spec.topic ?? spec.title ?? "producto";
  const depth = spec.depth ?? "basic";
  const config = getDepthRange(depth);

  const parts = [topic];
  if (spec.audience) parts.push(`para ${spec.audience}`);
  if (spec.level) parts.push(`nivel ${spec.level}`);
  const fullIdea = parts.join(", ");

  const extras: string[] = [];
  if (spec.title) extras.push(`Título: "${spec.title}"`);
  if (spec.level) extras.push(`Nivel: ${spec.level}`);
  if (spec.audience) extras.push(`Público: ${spec.audience}`);
  if (spec.hasImages === false) extras.push("Sin imágenes");
  if (spec.hasVideos === true) extras.push("Con videos");
  if (spec.hasExercises === false) extras.push("Sin ejercicios");
  if (spec.hasQuizzes === false) extras.push("Sin quizzes");
  if (spec.hasCertificate === true) extras.push("Con certificado");
  if (spec.hasResources === false) extras.push("Sin recursos");
  if (spec.tone) extras.push(`Tono: ${spec.tone}`);
  if (spec.productType) extras.push(`Tipo: ${spec.productType}`);

  const extrasText = extras.length > 0
    ? `\nRequisitos:\n${extras.map((e) => `- ${e}`).join("\n")}`
    : "";

  const depthGuide = getDepthContentGuide(depth);
  const moduleCountRange = config.modules[0] === config.modules[1]
    ? `${config.modules[0]}`
    : `${config.modules[0]}-${config.modules[1]}`;
  const lessonsRange = config.lessonsPerModule[0] === config.lessonsPerModule[1]
    ? `${config.lessonsPerModule[0]}`
    : `${config.lessonsPerModule[0]}-${config.lessonsPerModule[1]}`;

  return `Generá un JSON con la ESTRUCTURA de un curso para CROW MARKET.

IDEA: "${fullIdea}"
NIVEL: ${DEPTH_CONFIG[depth].label} (${depth})
${depthGuide}
${extrasText}

REGLAS DE ESTRUCTURA:
- Generá EXACTAMENTE entre ${moduleCountRange} módulos.
- Cada módulo debe tener entre ${lessonsRange} lecciones.
- La estructura debe ser PROGRESIVA y lógica para el dominio:
  1. Fundamentos / introducción
  2. Conceptos esenciales
  3. Técnicas / herramientas
  4. Aplicación práctica
  5. Casos avanzados (si aplica)
  6. Evaluación / integración
  7. Proyecto final (si nivel professional)
- NO repitas estructura genérica. La estructura debe DEPENDER DEL TEMA.
  Ejemplo: programación ≠ fotografía ≠ marketing ≠ medicina.
- NO uses "..." ni abrevies nada.
- content VACÍO en todas las lecciones (se genera después).

El JSON debe tener EXACTAMENTE esta forma:

{
  "title": "título comercial atractivo",
  "shortDescription": "descripción corta (max 120 chars)",
  "description": "descripción completa de 2-3 párrafos de venta",
  "audience": "público objetivo",
  "promise": "promesa con resultado medible",
  "productType": "COURSE",
  "category": "Cursos",
  "recommendedPriceUsdt": 29,
  "includes": ["item 1", "item 2", "item 3", "item 4"],
  "resources": ["recurso 1", "recurso 2", "recurso 3"],
  "commercialStrategy": ["estrategia 1", "estrategia 2"],
  "qualityChecklist": ["check 1", "check 2"],
  "learningGoals": ["objetivo 1", "objetivo 2", "objetivo 3", "objetivo 4"],
  "tags": ["tag1", "tag2", "tag3"],
  "coverEmoji": "emoji apropiado",
  "coverGradient": "violet",
  "modules": [
    {
      "title": "Título del Módulo 1",
      "summary": "Resumen breve del módulo",
      "lessons": [
        {
          "title": "Título de la Lección 1.1",
          "content": "",
          "durationMin": 20,
          "imagePrompt": "descripción en inglés para generar imagen",
          "videoEnabled": false,
          "videoPrompt": "",
          "videoDuration": 5,
          "videoStyle": "cinematic",
          "isFreePreview": false,
          "exercises": []
        }
      ]
    }
  ]
}

Solo JSON, nada más.`;
}

/**
 * Step 1: Generate the structure-only blueprint.
 * Adapted for depth: basic courses get 5 modules, professional get 12-16.
 */
export async function generateStructure(
  spec: ProductSpec,
): Promise<{ blueprint: ProductBlueprint; provider: string } | null> {
  const prompt = buildStructurePrompt(spec);
  const depth = spec.depth ?? "basic";
  const config = getDepthRange(depth);
  // Larger courses need more tokens for structure
  const maxTokens = depth === "professional" || depth === "advanced" ? 8192 : 4096;

  const answer = await askProviders(
    [{ role: "user", content: prompt }],
    { temperature: 0.65, maxTokens, json: true },
  );

  if (!answer) return null;

  const json = extractJson(answer.text);
  if (!json) {
    console.error("[pipeline:structure] extractJson=null");
    console.error("[pipeline:structure] FIRST 300:", JSON.stringify(answer.text.slice(0, 300)));
    return null;
  }

  const parsed = parseBlueprint(json);
  if (!parsed) {
    console.error("[pipeline:structure] parseBlueprint FAILED");
    console.error("[pipeline:structure] keys:", Object.keys(json as object));
    return null;
  }

  // Clamp module count to depth range
  if (parsed.modules.length < config.modules[0]) {
    console.error(`[pipeline:structure] too few modules: ${parsed.modules.length}, expected >=${config.modules[0]}`);
  }
  if (parsed.modules.length > config.modules[1] + 2) {
    console.error(`[pipeline:structure] too many modules: ${parsed.modules.length}, expected <=${config.modules[1] + 2}`);
  }

  return { blueprint: parsed, provider: answer.provider };
}

// ─── Step 2: Module content generation ───────────────────────────────────────

function buildModulePrompt(
  blueprint: ProductBlueprint,
  moduleIndex: number,
  spec: ProductSpec,
  allModuleSummaries: string[],
): string {
  const mod = blueprint.modules[moduleIndex];
  const totalModules = blueprint.modules.length;
  const depth = spec.depth ?? "basic";
  const depthGuide = getDepthContentGuide(depth);

  const lessonList = mod.lessons.map((t, i) => `${i + 1}. ${t.title}`).join("\n");

  // Build prev/next context
  const prevModules = allModuleSummaries
    .slice(Math.max(0, moduleIndex - 2), moduleIndex)
    .map((s, i) => {
      const idx = Math.max(0, moduleIndex - 2) + i;
      return `  Módulo ${idx + 1}: ${s}`;
    }).join("\n");

  const nextModules = allModuleSummaries
    .slice(moduleIndex + 1, Math.min(totalModules, moduleIndex + 3))
    .map((s, i) => {
      const idx = moduleIndex + 1 + i;
      return `  Módulo ${idx + 1}: ${s}`;
    }).join("\n");

  const progressPercent = Math.round(((moduleIndex + 1) / totalModules) * 100);

  return `Generá el contenido COMPLETO del módulo ${moduleIndex + 1} de ${totalModules} de un curso.

CONTEXTO DEL CURSO:
- Título: "${blueprint.title}"
- Descripción: ${blueprint.description.slice(0, 300)}
- Público: ${blueprint.audience}
- Promesa: ${blueprint.promise}
- Nivel: ${spec.level ?? "all"}
- Progreso: módulo ${moduleIndex + 1} de ${totalModules} (${progressPercent}% del curso)
${depthGuide}

${prevModules ? `MÓDULOS ANTERIORES (ya cubiertos, NO repetir):\n${prevModules}\n` : ""}
MÓDULO ACTUAL:
- Título: "${mod.title}"
- Resumen: ${mod.summary}

${nextModules ? `MÓDULOS SIGUIENTES (próximos, preparar transición):\n${nextModules}\n` : ""}
LECCIONES DE ESTE MÓDULO:
${lessonList}

Devolvé un JSON con el contenido de CADA lección:

{
  "lessons": [
    {
      "title": "Título exacto de la lección",
      "content": "Contenido educativo real en markdown. ESPECÍFICO al dominio del curso.",
      "durationMin": 20,
      "imagePrompt": "descripción detallada en inglés para generar imagen ilustrativa",
      "videoEnabled": true/false,
      "videoPrompt": "descripción en inglés del movimiento si videoEnabled=true",
      "isFreePreview": false,
      "exercises": [
        {
          "title": "Ejercicio práctico",
          "instructions": "Instrucciones claras y accionables",
          "kind": "PRACTICE",
          "options": [],
          "correctAnswer": "",
          "explanation": ""
        },
        {
          "title": "Quiz: conceptos clave",
          "instructions": "Evaluá tu comprensión",
          "kind": "QUIZ",
          "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
          "correctAnswer": "Opción A",
          "explanation": "Por qué esta es la respuesta correcta y las otras no"
        }
      ]
    }
  ]
}

REGLAS:
- 1 PRACTICE + 1 QUIZ por lección (al menos)
- Para nivel professional: incluir PROJECT exercises cuando corresponda
- QUIZ: 4 opciones, correctAnswer exacto, explanation clara
- content: markdown real, específico al dominio, NO placeholder
- Cada lección debe aportar conocimiento NUEVO (no repetir lo de módulos anteriores)
- imagePrompt: inglés, descriptivo, específico de la lección
- videoEnabled: true solo en lecciones prácticas/demostraciones
- Si el curso NO quiere videos (spec.hasVideos === false), videoEnabled: false en todas
- Solo JSON, nada más`;
}

/**
 * Step 2: Generate content for a single module.
 * Passes prev/next module context for coherence.
 */
export async function generateModuleContent(
  blueprint: ProductBlueprint,
  moduleIndex: number,
  spec: ProductSpec,
): Promise<{ moduleIndex: number; lessons: BlueprintLesson[] } | null> {
  const mod = blueprint.modules[moduleIndex];
  if (!mod) return null;

  const allModuleSummaries = blueprint.modules.map(
    (m) => `${m.title}: ${m.summary}`,
  );

  const prompt = buildModulePrompt(blueprint, moduleIndex, spec, allModuleSummaries);

  // First attempt
  const lessons = await tryModuleGeneration(prompt, mod, spec);
  if (lessons) return { moduleIndex, lessons };

  // Retry with correction prompt
  console.error(`[pipeline:module:${moduleIndex}] retrying with correction prompt`);
  const correctionPrompt = prompt +
    "\n\nIMPORTANTE: Respondé SOLO con un JSON válido. No uses markdown, no uses comillas triples, no uses texto explicativo. Solo el JSON puro.";

  const retryLessons = await tryModuleGeneration(correctionPrompt, mod, spec);
  if (retryLessons) return { moduleIndex, lessons: retryLessons };

  console.error(`[pipeline:module:${moduleIndex}] both attempts failed, using skeleton`);
  return null;
}

async function tryModuleGeneration(
  prompt: string,
  mod: BlueprintModule,
  spec: ProductSpec,
): Promise<BlueprintLesson[] | null> {
  const answer = await askProviders(
    [{ role: "user", content: prompt }],
    { temperature: 0.65, maxTokens: 4096, json: true },
  );

  if (!answer) return null;

  const json = extractJson(answer.text) as { lessons?: unknown[] } | null;
  if (!json?.lessons || !Array.isArray(json.lessons)) {
    console.error(`[pipeline:module] invalid response, len: ${answer.text.length}`);
    console.error(`[pipeline:module] FIRST 200:`, JSON.stringify(answer.text.slice(0, 200)));
    return null;
  }

  // Validate and merge each lesson
  const lessons: BlueprintLesson[] = [];
  for (let i = 0; i < mod.lessons.length; i++) {
    const rawLesson = json.lessons[i] as Record<string, unknown> | undefined;
    const existing = mod.lessons[i];

    if (!rawLesson || typeof rawLesson !== "object") {
      lessons.push(existing);
      continue;
    }

    lessons.push({
      title: existing.title,
      content: typeof rawLesson.content === "string" && rawLesson.content.length > 20
        ? rawLesson.content
        : existing.content,
      durationMin: typeof rawLesson.durationMin === "number"
        ? rawLesson.durationMin
        : existing.durationMin,
      imagePrompt: typeof rawLesson.imagePrompt === "string" && rawLesson.imagePrompt.length > 5
        ? rawLesson.imagePrompt
        : existing.imagePrompt,
      videoUrl: existing.videoUrl,
      videoEnabled: spec.hasVideos === false
        ? false
        : typeof rawLesson.videoEnabled === "boolean"
          ? rawLesson.videoEnabled
          : existing.videoEnabled,
      videoRequired: existing.videoRequired,
      videoPrompt: typeof rawLesson.videoPrompt === "string"
        ? rawLesson.videoPrompt
        : existing.videoPrompt,
      videoDuration: existing.videoDuration,
      videoStyle: existing.videoStyle,
      isFreePreview: existing.isFreePreview,
      exercises: parseExercises(rawLesson.exercises, existing.exercises),
    });
  }

  return lessons;
}

function parseExercises(
  raw: unknown,
  fallback: BlueprintExercise[],
): BlueprintExercise[] {
  if (!Array.isArray(raw) || raw.length === 0) return fallback;

  return raw.map((ex, i) => {
    if (!ex || typeof ex !== "object") return fallback[i] ?? fallback[0];
    const obj = ex as Record<string, unknown>;
    const fb = fallback[i] ?? fallback[0];

    return {
      title: typeof obj.title === "string" && obj.title.length > 2 ? obj.title : fb.title,
      instructions: typeof obj.instructions === "string" && obj.instructions.length > 5
        ? obj.instructions
        : fb.instructions,
      kind: ["PRACTICE", "QUIZ", "PROJECT"].includes(obj.kind as string)
        ? (obj.kind as "PRACTICE" | "QUIZ" | "PROJECT")
        : fb.kind,
      options: Array.isArray(obj.options) ? obj.options.map(String) : fb.options,
      correctAnswer: typeof obj.correctAnswer === "string" ? obj.correctAnswer : fb.correctAnswer,
      explanation: typeof obj.explanation === "string" ? obj.explanation : fb.explanation,
    };
  });
}

// ─── Media Quality Engine ─────────────────────────────────────────────────

// Appended automatically when Leonardo must NOT render text
const LEONARDO_NO_TEXT_SUFFIX =
  ", no readable text, no letters, no typography, no labels, no captions, no UI text, no words, clean visual only, abstract background";

function sanitizeVisualPrompt(prompt: string | undefined, type: string): string {
  if (!prompt) return "";
  const lower = prompt.toLowerCase();
  const hasNoText = lower.includes("no text") || lower.includes("no letters");
  if (type === "IMAGE" || type === "IMAGE_WITH_OVERLAY" || type === "INFOGRAPHIC") {
    return hasNoText ? prompt : `${prompt}${LEONARDO_NO_TEXT_SUFFIX}`;
  }
  // Pure SVG types don't need Leonardo at all — keep prompt for reference only
  return prompt;
}

async function generateMediaSpecForLesson(opts: {
  lesson: BlueprintLesson;
  moduleTitle: string;
  moduleSummary: string;
  blueprint: ProductBlueprint;
}): Promise<MediaSpec> {
  const { lesson, moduleTitle, moduleSummary, blueprint } = opts;
  const prompt = buildMediaSpecPrompt({
    title: lesson.title,
    content: lesson.content,
    moduleTitle,
    moduleSummary,
    courseTitle: blueprint.title,
    courseDescription: blueprint.description,
    audience: blueprint.audience,
  });

  try {
    const answer = await askProviders(
      [{ role: "user", content: prompt }],
      { temperature: 0.5, maxTokens: 2048, json: true },
    );
    if (!answer) throw new Error("No provider answer");

    const json = extractJson(answer.text) as Partial<MediaSpec> | null;
    if (!json || !json.type) throw new Error("Invalid MediaSpec JSON");

    // Coerce and sanitize
    const spec: MediaSpec = {
      type: (json.type as MediaSpec["type"]) ?? "IMAGE",
      purpose: (json.purpose as MediaSpec["purpose"]) ?? "concept_illustration",
      title: typeof json.title === "string" ? json.title : lesson.title.slice(0, 80),
      description: typeof json.description === "string" ? json.description : "",
      visualPrompt: sanitizeVisualPrompt(
        typeof json.visualPrompt === "string" ? json.visualPrompt : lesson.imagePrompt,
        String(json.type),
      ),
      data: json.data,
      overlays: Array.isArray(json.overlays) ? (json.overlays as MediaSpec["overlays"]) : undefined,
      confidence: typeof json.confidence === "number" ? json.confidence : 0.7,
      reasoning: typeof json.reasoning === "string" ? json.reasoning : "",
      needed: typeof json.needed === "boolean" ? json.needed : true,
    };

    const validation = validateMediaSpec(spec);
    if (!validation.valid) {
      console.warn(`[pipeline:media] validation warnings for "${lesson.title}":`, validation.errors.join("; "));
      // Fix common issues: ensure overlays for types that need them
      if ((spec.type === "INFOGRAPHIC" || spec.type === "IMAGE_WITH_OVERLAY") && (!spec.overlays || spec.overlays.length === 0)) {
        spec.type = "IMAGE";
        spec.visualPrompt = sanitizeVisualPrompt(spec.visualPrompt, "IMAGE");
      }
      if ((spec.type === "CHART" || spec.type === "TIMELINE" || spec.type === "PROCESS" || spec.type === "COMPARISON" || spec.type === "CODE_VISUAL") && !spec.data) {
        spec.type = "IMAGE";
        spec.data = undefined;
      }
    }

    // For IMAGE, ensure visualPrompt is set
    if ((spec.type === "IMAGE" || spec.type === "IMAGE_WITH_OVERLAY" || spec.type === "INFOGRAPHIC") && !spec.visualPrompt) {
      spec.visualPrompt = sanitizeVisualPrompt(lesson.imagePrompt || `Educational illustration about "${lesson.title}", clean professional style`, spec.type);
    }

    return spec;
  } catch (err) {
    console.warn(`[pipeline:media] fallback for "${lesson.title}":`, err instanceof Error ? err.message : String(err));
    const fallback = defaultMediaSpec(lesson);
    fallback.visualPrompt = sanitizeVisualPrompt(fallback.visualPrompt, fallback.type);
    return fallback;
  }
}

function renderSpecToSvg(spec: MediaSpec): string {
  // Pure IMAGE needs no SVG — Leonardo handles it
  if (spec.type === "IMAGE") return "";
  try {
    return renderMediaSpec(spec, 800, 500);
  } catch (err) {
    console.error(`[pipeline:media] render failed for ${spec.type}:`, err);
    return "";
  }
}

/**
 * Validates media quality: text never depends on AI visual, structured data present, etc.
 */
export function validateMediaQuality(specs: MediaSpec[]): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;

  // Check text dependence
  const imageWithText = specs.filter((s) => s.type === "IMAGE" && s.visualPrompt && /text|label|caption|typography/i.test(s.visualPrompt));
  if (imageWithText.length > 0) {
    issues.push(`${imageWithText.length} IMAGE specs contain text instructions (should be no-text)`);
    score -= 15;
  }

  // Check structured data for data-driven types
  const needsData = specs.filter((s) => ["CHART", "TIMELINE", "PROCESS", "COMPARISON", "CODE_VISUAL"].includes(s.type) && !s.data);
  if (needsData.length > 0) {
    issues.push(`${needsData.length} specs missing structured data`);
    score -= 20;
  }

  // Check diversity: not all same type (except very short courses)
  if (specs.length >= 8) {
    const typeCounts = new Map<string, number>();
    for (const s of specs) typeCounts.set(s.type, (typeCounts.get(s.type) ?? 0) + 1);
    const maxCount = Math.max(...typeCounts.values());
    if (maxCount / specs.length > 0.7) {
      issues.push(`Low diversity: ${maxCount}/${specs.length} are same type`);
      score -= 10;
    }
  }

  // Check overlays for types that need them
  const missingOverlays = specs.filter((s) => ["INFOGRAPHIC", "IMAGE_WITH_OVERLAY"].includes(s.type) && (!s.overlays || s.overlays.length === 0));
  if (missingOverlays.length > 0) {
    issues.push(`${missingOverlays.length} INFOGRAPHIC/IMAGE_WITH_OVERLAY missing overlays`);
    score -= 15;
  }

  return { score: Math.max(0, score), issues };
}

// ─── Quality gate ──────────────────────────────────────────────────────────

export type QualityGateResult = {
  passed: boolean;
  score: number;
  issues: string[];
};

/**
 * Validates the blueprint against depth-appropriate expectations.
 * Returns a score and list of issues. Does NOT reject — only reports.
 */
export function validateBlueprintQuality(
  blueprint: ProductBlueprint,
  spec: ProductSpec,
): QualityGateResult {
  const depth = spec.depth ?? "basic";
  const config = getDepthRange(depth);
  const issues: string[] = [];
  let score = 0;

  // Module count
  const moduleCount = blueprint.modules.length;
  if (moduleCount >= config.modules[0] && moduleCount <= config.modules[1] + 2) {
    score += 20;
  } else {
    issues.push(`Módulos: ${moduleCount}, esperado ${config.modules[0]}-${config.modules[1]}`);
  }

  // Lesson count per module
  const allLessons = blueprint.modules.flatMap((m) => m.lessons);
  const avgLessons = allLessons.length / Math.max(moduleCount, 1);
  if (avgLessons >= config.lessonsPerModule[0] - 1 && avgLessons <= config.lessonsPerModule[1] + 2) {
    score += 20;
  } else {
    issues.push(`Promedio lecciones/módulo: ${avgLessons.toFixed(1)}, esperado ${config.lessonsPerModule[0]}-${config.lessonsPerModule[1]}`);
  }

  // Real content (not placeholder)
  let realContentCount = 0;
  const placeholderKw = ["Contenido pendiente", "Paso 1", "Paso 2", "Paso 3", "placeholder", "lorem ipsum"];
  for (const l of allLessons) {
    if (l.content && l.content.length > 50 && !placeholderKw.some((k) => l.content.includes(k))) {
      realContentCount++;
    }
  }
  const contentRatio = allLessons.length > 0 ? realContentCount / allLessons.length : 0;
  if (contentRatio >= 0.8) {
    score += 25;
  } else {
    issues.push(`Contenido real: ${realContentCount}/${allLessons.length} lecciones (${(contentRatio * 100).toFixed(0)}%)`);
  }

  // Exercises present
  const allExercises = allLessons.flatMap((l) => l.exercises);
  if (allExercises.length >= allLessons.length) {
    score += 15;
  } else {
    issues.push(`Ejercicios: ${allExercises.length} para ${allLessons.length} lecciones`);
  }

  // Quizzes present
  const quizzes = allExercises.filter((e) => e.kind === "QUIZ" && e.options.length >= 2);
  if (quizzes.length >= Math.ceil(allLessons.length * 0.5)) {
    score += 10;
  } else {
    issues.push(`Quizzes con opciones: ${quizzes.length}, esperado >=${Math.ceil(allLessons.length * 0.5)}`);
  }

  // Description quality
  if (blueprint.description.length >= 100) {
    score += 5;
  } else {
    issues.push(`Descripción muy corta: ${blueprint.description.length} chars`);
  }

  // Learning goals
  if (blueprint.learningGoals.length >= 3) {
    score += 5;
  } else {
    issues.push(`Objetivos de aprendizaje: ${blueprint.learningGoals.length}, esperado >=3`);
  }

  return {
    passed: score >= 70,
    score,
    issues,
  };
}

// ─── Deduplication check ────────────────────────────────────────────────────

/**
 * Checks for content repetition across modules.
 * Flags titles that appear in multiple modules.
 */
export function checkDeduplication(blueprint: ProductBlueprint): string[] {
  const issues: string[] = [];
  const titleCounts = new Map<string, number>();

  for (const mod of blueprint.modules) {
    for (const lesson of mod.lessons) {
      const normalized = lesson.title.toLowerCase().trim();
      titleCounts.set(normalized, (titleCounts.get(normalized) ?? 0) + 1);
    }
  }

  for (const [title, count] of titleCounts) {
    if (count > 1) {
      issues.push(`Título duplicado: "${title}" aparece ${count} veces`);
    }
  }

  // Check for very similar content between first 50 chars
  const contentStarts = blueprint.modules.flatMap((m) =>
    m.lessons.map((l) => l.content?.slice(0, 80).toLowerCase().trim() ?? ""),
  );
  const seen = new Set<string>();
  for (const start of contentStarts) {
    if (start.length < 20) continue;
    if (seen.has(start)) {
      issues.push(`Contenido duplicado detectado: "${start.slice(0, 50)}..."`);
    }
    seen.add(start);
  }

  return issues;
}

// ─── Full pipeline orchestrator ─────────────────────────────────────────────

/**
 * Runs the full modular generation pipeline.
 *
 * 1. Generates the structure-only blueprint (1 call, depth-adapted)
 * 2. Generates content for each module (N calls, max 3 parallel)
 * 3. Validates quality
 * 4. Returns the final blueprint
 *
 * Each step is independent — if a module fails, the rest still succeed.
 */
export async function runPipeline(
  spec: ProductSpec,
  onProgress?: (progress: PipelineProgress) => void,
): Promise<PipelineResult> {
  const steps: string[] = [];
  const depth = spec.depth ?? "basic";

  // ── Step 1: Structure ──────────────────────────────────────────────────
  onProgress?.({ step: "structure", message: `Generando estructura (${DEPTH_CONFIG[depth].label})...` });

  const structure = await generateStructure(spec);

  if (!structure) {
    onProgress?.({ step: "failed", message: "No se pudo generar la estructura" });
    throw new Error("Pipeline step 1 failed: structure generation returned null");
  }

  const { blueprint, provider } = structure;
  const totalModules = blueprint.modules.length;
  const totalLessons = blueprint.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  steps.push(`Estructura: ${totalModules} módulos, ${totalLessons} lecciones (${provider}, ${DEPTH_CONFIG[depth].label})`);
  onProgress?.({
    step: "modules",
    currentModule: 0,
    totalModules,
    message: `Estructura generada (${totalModules} módulos, ${totalLessons} lecciones). Generando contenido...`,
  });

  // ── Step 2: Module content (concurrent, max 3) ────────────────────────
  const moduleTasks = blueprint.modules.map((_, idx) => async () => {
    onProgress?.({
      step: "modules",
      currentModule: idx + 1,
      totalModules,
      message: `Generando módulo ${idx + 1} de ${totalModules}: ${blueprint.modules[idx].title}...`,
    });

    const result = await generateModuleContent(blueprint, idx, spec);
    if (result) {
      blueprint.modules[idx].lessons = result.lessons;
      steps.push(`Módulo ${idx + 1}: ${result.lessons.length} lecciones generadas`);
    } else {
      steps.push(`Módulo ${idx + 1}: usando skeleton (generación falló)`);
    }
    return result;
  });

  await runWithConcurrency(moduleTasks, 3);

  // ── Step 2.5: Media Quality Engine ───────────────────────────────────
  onProgress?.({ step: "media", message: "Generando MediaSpec para cada lección..." });

  const allLessonsWithContext: Array<{
    lesson: BlueprintLesson;
    moduleTitle: string;
    moduleSummary: string;
    moduleIdx: number;
    lessonIdx: number;
  }> = [];
  blueprint.modules.forEach((mod, mi) => {
    mod.lessons.forEach((lesson, li) => {
      allLessonsWithContext.push({
        lesson,
        moduleTitle: mod.title,
        moduleSummary: mod.summary,
        moduleIdx: mi,
        lessonIdx: li,
      });
    });
  });

  // Generate MediaSpec for each lesson (max 3 concurrent)
  const mediaTasks = allLessonsWithContext.map(({ lesson, moduleTitle, moduleSummary, moduleIdx, lessonIdx }) => async () => {
    const spec = await generateMediaSpecForLesson({
      lesson,
      moduleTitle,
      moduleSummary,
      blueprint,
    });
    const svg = renderSpecToSvg(spec);

    // Persist back into blueprint
    const target = blueprint.modules[moduleIdx]?.lessons[lessonIdx];
    if (target) {
      (target as unknown as { mediaSpec?: MediaSpec; mediaSvg?: string; mediaVisualPrompt?: string }).mediaSpec = spec;
      (target as unknown as { mediaSpec?: MediaSpec; mediaSvg?: string; mediaVisualPrompt?: string }).mediaSvg = svg;
      (target as unknown as { mediaSpec?: MediaSpec; mediaSvg?: string; mediaVisualPrompt?: string }).mediaVisualPrompt = spec.visualPrompt ?? "";
      // For pure visual types, keep imagePrompt as clean visual; for SVG types, clear Leonardo prompt
      if (spec.type !== "IMAGE" && spec.type !== "IMAGE_WITH_OVERLAY" && spec.type !== "INFOGRAPHIC") {
        // SVG-driven: no Leonardo needed; keep imagePrompt empty to skip Leonardo
        // But preserve a fallback visualPrompt for reference
      } else {
        // Ensure lesson imagePrompt is the clean visual prompt (no text)
        if (spec.visualPrompt) target.imagePrompt = spec.visualPrompt;
      }
    }
    steps.push(`Media ${moduleIdx + 1}.${lessonIdx + 1}: ${spec.type} (${spec.purpose})`);
    return spec;
  });

  let mediaSpecs: MediaSpec[] = [];
  try {
    mediaSpecs = await runWithConcurrency(mediaTasks, 3);
  } catch (err) {
    console.error("[pipeline:media] concurrency error:", err);
  }

  // Media quality validation
  if (mediaSpecs.length > 0) {
    const mediaQuality = validateMediaQuality(mediaSpecs);
    steps.push(`Media quality: ${mediaQuality.score}/100`);
    if (mediaQuality.issues.length > 0) {
      console.warn("[pipeline:media:quality]", mediaQuality.issues.join("; "));
    }
    // Log diversity
    const typeDist = new Map<string, number>();
    for (const s of mediaSpecs) typeDist.set(s.type, (typeDist.get(s.type) ?? 0) + 1);
    console.log("[pipeline:media] distribution:", Object.fromEntries(typeDist));
  }

  // ── Step 3: Quality gate ──────────────────────────────────────────────
  onProgress?.({ step: "quality", message: "Validando calidad del blueprint..." });

  const quality = validateBlueprintQuality(blueprint, spec);
  const dedup = checkDeduplication(blueprint);

  steps.push(`Calidad: score=${quality.score}, issues=${quality.issues.length + dedup.length}`);
  if (quality.issues.length > 0) {
    console.error("[pipeline:quality]", quality.issues.join("; "));
  }
  if (dedup.length > 0) {
    console.error("[pipeline:dedup]", dedup.join("; "));
  }

  // ── Finalize ──────────────────────────────────────────────────────────
  const finalTotalLessons = blueprint.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  onProgress?.({
    step: "ready",
    message: `Blueprint completo: ${totalModules} módulos, ${finalTotalLessons} lecciones (calidad: ${quality.score}/100)`,
  });

  return {
    blueprint,
    provider,
    mode: "live",
    steps,
  };
}
