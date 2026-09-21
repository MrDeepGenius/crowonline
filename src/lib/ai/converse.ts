/**
 * CROW Studio Conversational Engine
 *
 * Manages the full conversation lifecycle:
 *   DISCOVERY → GATHERING → READY → REFINING
 *
 * In DISCOVERY/GATHERING the engine extracts specs from natural language,
 * asks progressive follow-up questions, and builds a ProductSpec incrementally.
 * When enough info is collected it proposes a blueprint summary for confirmation.
 * In REFINING it applies mutations to an existing blueprint.
 *
 * Never requires forms or commands — plain Spanish works.
 */

import { askProviders } from "@/lib/ai/providers";
import {
  buildBlueprintPrompt,
  extractJson,
  parseBlueprint,
  type ProductBlueprint,
} from "@/lib/ai/blueprint";
import { buildDemoBlueprint } from "@/lib/ai/demo";
import { runPipeline } from "@/lib/ai/pipeline";
import type { ChatMessage } from "@/lib/ai/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConversationPhase =
  | "DISCOVERY"   // first message(s) — extracting core idea
  | "GATHERING"   // asking follow-up questions one at a time
  | "READY"       // enough info — showing summary and asking to confirm
  | "GENERATING"  // blueprint is being created
  | "REFINING";   // blueprint exists — applying changes via chat

export type CourseDepth = "basic" | "intermediate" | "advanced" | "professional";

export const DEPTH_CONFIG: Record<CourseDepth, { modules: [number, number]; lessonsPerModule: [number, number]; label: string }> = {
  basic:         { modules: [5, 6],   lessonsPerModule: [3, 5], label: "Básico" },
  intermediate:  { modules: [7, 9],   lessonsPerModule: [4, 6], label: "Intermedio" },
  advanced:      { modules: [10, 12], lessonsPerModule: [5, 8], label: "Avanzado" },
  professional:  { modules: [12, 16], lessonsPerModule: [6, 10], label: "Profesional / Master" },
};

export type ProductSpec = {
  // Core identity
  topic?: string;
  productType?: "COURSE" | "EBOOK" | "PDF" | "INTERACTIVE_WEB" | "RESOURCE_KIT";
  title?: string;
  shortDescription?: string;
  description?: string;

  // Audience & positioning
  audience?: string;
  level?: "beginner" | "intermediate" | "advanced" | "all";
  language?: string;
  tone?: string;

  // Depth (auto-detected from user intent)
  depth?: CourseDepth;

  // Structure
  moduleCount?: number;
  lessonsPerModule?: number;

  // Content requirements
  objectives?: string[];
  modules?: ModuleSpec[];
  hasImages?: boolean;
  hasVideos?: boolean;
  videoPreference?: "all" | "none" | "practical" | "auto";
  videoDuration?: number;
  videoStyle?: string;
  hasExercises?: boolean;
  hasQuizzes?: boolean;
  hasCertificate?: boolean;
  hasResources?: boolean;
  resourcesList?: string[];

  // Commercial
  priceRange?: string;
  recommendedPriceUsdt?: number;

  // Branding
  coverEmoji?: string;
  coverGradient?: string;
  visualStyle?: string;

  // Creator assets
  creatorAssets?: { images?: string[]; videos?: string[] };

  // Progress tracking
  extraNotes?: string[];
  completenessScore?: number;
};

export type ModuleSpec = {
  title: string;
  summary?: string;
  objectives?: string[];
  lessons?: LessonSpec[];
};

export type LessonSpec = {
  title: string;
  objective?: string;
  content?: string;
  durationMin?: number;
  imagePrompt?: string;
  videoEnabled?: boolean;
  videoRequired?: boolean;
  videoPrompt?: string;
  videoDuration?: number;
  videoStyle?: string;
  exercises?: ExerciseSpec[];
  resources?: string[];
};

export type ExerciseSpec = {
  title: string;
  instructions: string;
  kind: "PRACTICE" | "QUIZ" | "PROJECT";
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
};

export type ConverseRequest = {
  message: string;
  history: ChatMessage[];   // full conversation so far
  phase: ConversationPhase;
  spec: ProductSpec;
  blueprint?: ProductBlueprint | null;
};

export type ConverseResponse = {
  reply: string;
  phase: ConversationPhase;
  spec: ProductSpec;
  blueprint?: ProductBlueprint | null;
  provider: string;
  mode: "live" | "skeleton";
  /** When phase=READY, this is the human-readable product summary */
  proposalSummary?: ProposalSummary;
};

export type ProposalSummary = {
  title: string;
  productType: string;
  format: string;
  audience: string;
  level: string;
  modules: number;
  lessons: number;
  durationHours: number;
  features: string[];
  price: number;
  emoji: string;
  imagesEstimate: number;
  exercisesTotal: number;
  quizzesTotal: number;
  resourcesTotal: number;
  certificateEnabled: boolean;
  videosEnabled: boolean;
  videosEstimate: number;
  coverEmoji: string;
  coverGradient: string;
};

// ─── Demo fallbacks ───────────────────────────────────────────────────────────

function demoDiscovery(message: string): string {
  const lower = message.toLowerCase();
  if (lower.match(/fotograf|photo/))
    return "¡Me encanta! Fotografía tiene mucho potencial.\n\n¿Qué tipo de producto querés crear?\n1. Curso online (COURSE)\n2. Ebook / Libro digital (EBOOK)\n3. PDF descargable (PDF)\n4. Web interactiva (INTERACTIVE_WEB)\n5. Kit de recursos (RESOURCE_KIT)";
  if (lower.match(/trading|bolsa|invers/))
    return "Perfecto. Trading es un tema con alta demanda.\n\n¿Qué tipo de producto querés crear?\n1. Curso online (COURSE)\n2. Ebook / Libro digital (EBOOK)\n3. PDF descargable (PDF)\n4. Web interactiva (INTERACTIVE_WEB)\n5. Kit de recursos (RESOURCE_KIT)";
  if (lower.match(/program|código|desarroll/))
    return "Excelente. Programación siempre tiene demanda.\n\n¿Qué tipo de producto querés crear?\n1. Curso online (COURSE)\n2. Ebook / Libro digital (EBOOK)\n3. PDF descargable (PDF)\n4. Web interactiva (INTERACTIVE_WEB)\n5. Kit de recursos (RESOURCE_KIT)";
  if (lower.match(/market|ventas|negocio/))
    return "Muy bien. Marketing y ventas son siempre rentables.\n\n¿Qué tipo de producto querés crear?\n1. Curso online (COURSE)\n2. Ebook / Libro digital (EBOOK)\n3. PDF descargable (PDF)\n4. Web interactiva (INTERACTIVE_WEB)\n5. Kit de recursos (RESOURCE_KIT)";
  return `Entendido. Voy a ayudarte a crear ese producto.\n\n¿Qué tipo de producto querés crear?\n1. Curso online (COURSE)\n2. Ebook / Libro digital (EBOOK)\n3. PDF descargable (PDF)\n4. Web interactiva (INTERACTIVE_WEB)\n5. Kit de recursos (RESOURCE_KIT)`;
}

function demoFollowUp(spec: ProductSpec, questionIndex: number): string {
  const questions = [
    spec.title === undefined
      ? "¿Qué título querés darle a tu producto? (Ej: 'Fotografía con Celular: Guía Completa')"
      : null,
    spec.level === undefined
      ? "¿Cuál es el nivel del público objetivo?\n1. Principiantes (sin conocimiento previo)\n2. Intermedio\n3. Avanzado\n4. Todos los niveles"
      : null,
    spec.hasImages === undefined
      ? "¿Querés que CROW genere imágenes ilustrativas para las lecciones/portada automáticamente?"
      : null,
    spec.hasVideos === undefined
      ? "¿Querés incluir videos generados por IA en las lecciones prácticas?"
      : null,
    spec.hasExercises === undefined
      ? "¿Querés incluir ejercicios prácticos y casos de análisis en cada módulo?"
      : null,
    spec.hasQuizzes === undefined
      ? "¿Querés agregar evaluaciones tipo quiz con respuestas y explicaciones?"
      : null,
    spec.hasCertificate === undefined
      ? "¿Querés que los alumnos reciban un certificado digital al completar?"
      : null,
    spec.hasResources === undefined
      ? "¿Querés incluir recursos descargables (checklists, guías, plantillas)?"
      : null,
    spec.moduleCount === undefined
      ? "¿Cuántos módulos te gustaría? (Recomiendo entre 6 y 12 para un curso completo)"
      : null,
  ].filter(Boolean);

  return questions[questionIndex] ?? "Tengo suficiente información. Déjame preparar la propuesta de tu producto.";
}

function buildProposalSummary(spec: ProductSpec, blueprint?: ProductBlueprint | null): ProposalSummary {
  const features: string[] = [];
  if (spec.hasImages !== false) features.push("Imágenes generadas por IA");
  if (spec.hasExercises !== false) features.push("Ejercicios prácticos");
  if (spec.hasQuizzes !== false) features.push("Evaluaciones con feedback");
  if (spec.hasCertificate !== false) features.push("Certificado digital");
  if (spec.hasResources !== false) features.push("Recursos descargables");
  if (spec.hasVideos === true) features.push("Videos");

  const allLessons = blueprint?.modules.flatMap((m) => m.lessons) ?? [];
  const allExercises = allLessons.flatMap((l) => l.exercises);
  const quizzes = allExercises.filter((e) => e.kind === "QUIZ");

  const imagesEstimate = blueprint
    ? allLessons.filter((l) => l.imagePrompt || (l.content && l.content.length > 120)).length
    : Math.round((spec.moduleCount ?? 7) * 2.5);

  const videosEstimate = blueprint
    ? allLessons.filter((l) =>
        typeof (l as { videoEnabled?: boolean }).videoEnabled === "boolean"
          ? (l as { videoEnabled?: boolean }).videoEnabled
          : (l.content?.length ?? 0) > 600,
      ).length
    : spec.hasVideos === true
      ? spec.videoPreference === "all"
        ? Math.round((spec.moduleCount ?? 7) * 3.5)
        : Math.round((spec.moduleCount ?? 7) * 1.5)
      : 0;

  const productTypeLabel = (() => {
    switch (spec.productType ?? "COURSE") {
      case "EBOOK": return "Ebook";
      case "PDF": return "PDF";
      case "INTERACTIVE_WEB": return "Web interactiva";
      case "RESOURCE_KIT": return "Kit de recursos";
      default: return "Curso";
    }
  })();

  const levelLabel = (() => {
    switch (spec.level) {
      case "beginner": return "Principiantes";
      case "intermediate": return "Intermedio";
      case "advanced": return "Avanzado";
      case "all": return "Todos los niveles";
      default: return spec.audience ?? "General";
    }
  })();

  const totalDurationMin = allLessons.reduce((sum, l) => sum + (l.durationMin ?? 15), 0);

  return {
    title: spec.title ?? blueprint?.title ?? `${productTypeLabel} de ${spec.topic ?? "tu tema"}`,
    productType: productTypeLabel,
    format: spec.productType ?? "COURSE",
    audience: levelLabel,
    level: spec.level ?? "all",
    modules: spec.moduleCount ?? blueprint?.modules.length ?? 7,
    lessons: allLessons.length || Math.round((spec.moduleCount ?? 7) * 3.5),
    durationHours: Math.round(totalDurationMin / 60 * 10) / 10 || Math.round((spec.moduleCount ?? 7) * 3.5 * 15 / 60 * 10) / 10,
    features,
    price: spec.recommendedPriceUsdt ?? blueprint?.recommendedPriceUsdt ?? 49,
    emoji: spec.coverEmoji ?? blueprint?.coverEmoji ?? "📚",
    coverEmoji: spec.coverEmoji ?? blueprint?.coverEmoji ?? "📚",
    coverGradient: spec.coverGradient ?? blueprint?.coverGradient ?? "from-rose-500 to-violet-600",
    imagesEstimate,
    exercisesTotal: allExercises.length || Math.round((spec.moduleCount ?? 7) * 8),
    quizzesTotal: quizzes.length || Math.round((spec.moduleCount ?? 7) * 2),
    resourcesTotal: blueprint?.resources.length ?? (spec.hasResources !== false ? 5 : 0),
    certificateEnabled: spec.hasCertificate !== false,
    videosEnabled: spec.hasVideos === true,
    videosEstimate,
  };
}

// ─── Spec extraction ──────────────────────────────────────────────────────────

const YES_PATTERN = /\bsí\b|^si$|^s$|^yes\b|quiero|dale|ok|claro|perfecto|por supuesto|agreea/i;
const NO_PATTERN  = /\bno\b|^n$|sin |no quiero|no necesito|omitir|skip/i;

function extractBool(msg: string): boolean | undefined {
  if (YES_PATTERN.test(msg)) return true;
  if (NO_PATTERN.test(msg))  return false;
  return undefined;
}

function extractLevel(msg: string): ProductSpec["level"] | undefined {
  const lower = msg.toLowerCase();
  if (lower.match(/\b1\b|princip|beginn|sin experiencia|desde cero/)) return "beginner";
  if (lower.match(/\b2\b|intermed/)) return "intermediate";
  if (lower.match(/\b3\b|avanz|advanced/)) return "advanced";
  if (lower.match(/\b4\b|todos|general|cualquier/)) return "all";
  return undefined;
}

function extractModuleCount(msg: string): number | undefined {
  const match = msg.match(/\b(\d{1,2})\s*(módulos?|modulos?|chapters?)/i) ?? msg.match(/\b([5-9]|1[0-5])\b/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n >= 3 && n <= 20) return n;
  }
  return undefined;
}

/**
 * Merges new signals from a message into the running ProductSpec.
 */
export function updateSpec(spec: ProductSpec, message: string): ProductSpec {
  const next = { ...spec };
  const lower = message.toLowerCase();

  // Product type detection
  if (!next.productType) {
    if (lower.match(/ebook|libro digital|libro/)) next.productType = "EBOOK";
    else if (lower.match(/pdf|descargable|guía rápida/)) next.productType = "PDF";
    else if (lower.match(/web interactiv|plataforma|simulador/)) next.productType = "INTERACTIVE_WEB";
    else if (lower.match(/kit|recursos|plantillas|checklist/)) next.productType = "RESOURCE_KIT";
    else if (lower.match(/curso|clase|lección|lecciones|módulo|módulos/)) next.productType = "COURSE";
  }

  // Level
  const level = extractLevel(message);
  if (level && !next.level) next.level = level;

  // Modules
  const mc = extractModuleCount(message);
  if (mc) next.moduleCount = mc;

  // Depth detection — auto-assign from intensity signals in the user's message
  if (!next.depth) {
    if (/profesional|extremadamente completo|master|maestría|máster|experto|certificación profesional|formación completa|curso completo|deep dive|mba|especializaci/.test(lower)) {
      next.depth = "professional";
    } else if (/avanzado|intermedio-avanzado|nivel alto|profundo|detallado|completo|extenso|todo sobre|desde cero hasta|A-Z|de 0 a 100|todo lo que necesit/.test(lower)) {
      next.depth = "advanced";
    } else if (/intermedio|nivel medio|bases sólidas|fundamentos sólidos|no tan básico|con algo de experiencia/.test(lower)) {
      next.depth = "intermediate";
    }
    // Infer depth from explicit module count
    if (next.moduleCount) {
      if (next.moduleCount >= 12 && !next.depth) next.depth = "professional";
      else if (next.moduleCount >= 10 && !next.depth) next.depth = "advanced";
      else if (next.moduleCount >= 7 && !next.depth) next.depth = "intermediate";
    }
    // Default to basic if nothing signals depth
    if (!next.depth) next.depth = "basic";
  }

  // Booleans — only set if still undefined (first mention wins)
  if (next.hasImages    === undefined) { const v = extractBool(message); if (v !== undefined) next.hasImages    = v; }
  if (next.hasExercises === undefined) { const v = extractBool(message); if (v !== undefined) next.hasExercises = v; }
  if (next.hasQuizzes   === undefined) { const v = extractBool(message); if (v !== undefined) next.hasQuizzes   = v; }
  if (next.hasCertificate === undefined) { const v = extractBool(message); if (v !== undefined) next.hasCertificate = v; }
  if (next.hasResources  === undefined) { const v = extractBool(message); if (v !== undefined) next.hasResources  = v; }
  if (next.hasVideos     === undefined && lower.match(/video|vídeo/)) { next.hasVideos = true; }

  // Video preference — creator wording always wins over the heuristic (§4).
  if (lower.match(/video|vídeo/)) {
    if (/sin videos|no quiero videos|ningún video|ningun video|no videos/.test(lower)) {
      next.hasVideos = false;
      next.videoPreference = "none";
    } else if (/todas|todos|cada lección|todas las lecciones/.test(lower)) {
      next.hasVideos = true;
      next.videoPreference = "all";
    } else if (/solamente|sol[ao] en|únicamente|unicamente|práctic|practic|tutorial|demostra|procedim/.test(lower)) {
      next.hasVideos = true;
      next.videoPreference = "practical";
    } else if (next.videoPreference === undefined) {
      next.hasVideos = true;
      next.videoPreference = "auto";
    }
  }

  // Tone
  if (!next.tone && lower.match(/profesional|formal/))  next.tone = "profesional";
  if (!next.tone && lower.match(/amigable|casual|simple/)) next.tone = "amigable";
  if (!next.tone && lower.match(/técnico|avanzado/)) next.tone = "técnico";

  // Audience
  if (!next.audience && lower.match(/emprend/))  next.audience = "Emprendedores";
  if (!next.audience && lower.match(/estudian/)) next.audience = "Estudiantes";
  if (!next.audience && lower.match(/profesion/)) next.audience = "Profesionales";
  if (!next.audience && lower.match(/princip|beginner/)) next.audience = "Principiantes";

  // Title extraction — detect explicit title patterns
  if (!next.title) {
    const titleMatch = message.match(/(?:se llama|título|titulo|nombre|llámalo|llamalo)[:\s]+["""]?([^"""]+)["""]?/i);
    if (titleMatch) next.title = titleMatch[1].trim();
  }

  // Topic extraction — if no topic yet and first message
  if (!next.topic && !next.title) {
    next.topic = message.trim();
  }

  return next;
}

/**
 * Counts how many spec fields are still undecided.
 * Returns 0 when we have enough to generate.
 */
function missingFields(spec: ProductSpec): number {
  let missing = 0;
  if (!spec.topic && !spec.title) missing++;
  if (!spec.productType) missing++;
  if (!spec.level && !spec.audience) missing++;
  if (spec.hasImages    === undefined) missing++;
  if (spec.hasExercises === undefined) missing++;
  if (spec.hasQuizzes   === undefined) missing++;
  if (spec.hasCertificate === undefined) missing++;
  if (spec.hasResources  === undefined) missing++;
  return missing;
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildConverseSystemPrompt(): string {
  return `Eres CROW Studio, el orquestador de creación de productos educativos digitales de CROW MARKET.

Tu trabajo es CONVERSAR con el creador para entender exactamente qué quiere crear, y luego generar el producto completo.

FASES DE LA CONVERSACIÓN:
1. DISCOVERY: extraés la idea principal del primer mensaje (título, tipo de producto, tema)
2. GATHERING: hacés preguntas progresivas (UNA a la vez) para completar los requisitos
3. READY: mostrás el resumen de la propuesta y pedís confirmación
4. GENERATING: el creador confirmó → construir el blueprint completo
5. REFINING: con blueprint activo, aplicás cambios pedidos

REGLAS CRÍTICAS:
- Nunca hacés más de 1 pregunta a la vez
- Respondés en español neutro, warm y directo
- Cuando detectás que ya tenés suficiente info (título, tipo, nivel, imágenes, ejercicios, certificado, recursos), pasás a READY
- Nunca inventás features que el creador no pidió
- Si el creador dice "generá", "dale" o "confirmo" estando en READY, devolvés phase: GENERATING
- Si hay blueprint activo y el creador pide cambios, los aplicás y devolvés phase: REFINING

TIPOS DE PRODUCTO: COURSE (curso), EBOOK (libro digital), PDF (guía descargable), INTERACTIVE_WEB (plataforma/web), RESOURCE_KIT (kit de recursos)

Respondé SIEMPRE con JSON puro:
{
  "reply": string (mensaje conversacional, claro y cálido, máx 4 líneas),
  "phase": "DISCOVERY" | "GATHERING" | "READY" | "GENERATING" | "REFINING",
  "spec": { topic, title, productType, audience, level, moduleCount, hasImages, hasVideos, hasExercises, hasQuizzes, hasCertificate, hasResources, tone, recommendedPriceUsdt, coverEmoji },
  "proposalSummary": { title, productType, format, audience, modules, features: string[], price, emoji } | null
}`;
}

function buildConversePrompt(req: ConverseRequest): string {
  const historyText = req.history
    .slice(-10)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const specText = JSON.stringify(req.spec);
  const blueprintTitle = req.blueprint?.title ?? null;

  return `HISTORIAL:
${historyText}

NUEVO MENSAJE DEL CREADOR: "${req.message}"

FASE ACTUAL: ${req.phase}
SPEC ACUMULADA: ${specText}
${blueprintTitle ? `BLUEPRINT ACTIVO: "${blueprintTitle}"` : "SIN BLUEPRINT AÚN"}

Analizá el mensaje, actualizá la spec, determiná la siguiente fase y respondé según las reglas del sistema.`;
}

function buildBlueprintPromptFromSpec(spec: ProductSpec): string {
  const extras: string[] = [];
  if (spec.level === "beginner") extras.push("Orientado a principiantes sin experiencia previa. Explicaciones desde cero con ejemplos cotidianos.");
  if (spec.level === "intermediate") extras.push("Nivel intermedio. Asume conocimientos básicos, incluir casos de estudio reales.");
  if (spec.level === "advanced") extras.push("Nivel avanzado. Contenido profundo, técnico, con investigaciones y datos.");
  if (spec.moduleCount) extras.push(`Crear exactamente ${spec.moduleCount} módulos.`);
  if (spec.lessonsPerModule) extras.push(`Cada módulo debe tener ${spec.lessonsPerModule} lecciones.`);
  if (spec.hasImages === false) extras.push("No incluir imagePrompt en las lecciones.");
  if (spec.hasExercises === false) extras.push("Sin ejercicios prácticos.");
  if (spec.hasQuizzes === false) extras.push("Sin ejercicios tipo QUIZ.");
  if (spec.hasCertificate === true) extras.push("El curso incluye certificado al completar (certificateEnabled: true).");
  if (spec.hasResources === false) extras.push("Sin recursos descargables.");
  if (spec.tone) extras.push(`Tono: ${spec.tone}.`);
  if (spec.audience) extras.push(`Público objetivo principal: ${spec.audience}.`);
  if (spec.title) extras.push(`Título del producto: "${spec.title}".`);
  if (spec.productType === "EBOOK") extras.push("Tipo: Ebook digital. Cada capítulo debe ser una sección extensa con contenido profundo.");
  if (spec.productType === "PDF") extras.push("Tipo: PDF descargable. Contenido conciso y accionable, ideal para consulta rápida.");
  if (spec.productType === "INTERACTIVE_WEB") extras.push("Tipo: Web interactiva. Incluir ejercicios interactivos, quizzes en línea, y progreso del estudiante.");
  if (spec.productType === "RESOURCE_KIT") extras.push("Tipo: Kit de recursos. Plantillas, checklists, guías descargables organizadas por módulo.");
  if (spec.videoPreference === "all") extras.push("El creador quiere videos en TODAS las lecciones: marcá videoEnabled=true en todas.");
  else if (spec.videoPreference === "none") extras.push("El creador NO quiere videos: marcá videoEnabled=false en todas las lecciones.");
  else if (spec.videoPreference === "practical") extras.push("El creador quiere videos solamente en las lecciones prácticas (demostraciones, procedimientos, tutoriales): marcá videoEnabled=true solo en esas.");
  else if (spec.hasVideos === true) extras.push("El creador quiere videos donde aporten valor (demostraciones, procedimientos, tutoriales, explicaciones complejas).");

  const fullIdea = [spec.topic, spec.audience && `para ${spec.audience}`, spec.level && `nivel ${spec.level}`]
    .filter(Boolean)
    .join(", ");

  const base = buildBlueprintPrompt(fullIdea, spec.productType);
  return extras.length > 0 ? `${base}\n\nRequisitos adicionales:\n${extras.map((e) => `- ${e}`).join("\n")}` : base;
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Main conversational engine.
 * Handles all phases: discovery, gathering, ready, generating, refining.
 */
export async function converse(req: ConverseRequest): Promise<ConverseResponse> {
  const updatedSpec = updateSpec(req.spec, req.message);

  // ── Phase: GENERATING (confirmation received → build full blueprint) ───────
  if (req.phase === "GENERATING" || req.phase === "READY") {
    const confirmPatterns = /\bsí\b|^si$|generá|generar|dale|confirmo|ok|listo|empez|crea/i;
    if (req.phase === "GENERATING" || confirmPatterns.test(req.message)) {
      // Use the modular pipeline: structure → module content
      try {
        const result = await runPipeline(updatedSpec);

        if (result && result.mode === "live") {
          return {
            reply: `¡Listo! Generé el blueprint completo para "${result.blueprint.title}".\n\n${result.blueprint.modules.length} módulos · ${result.blueprint.modules.flatMap((m) => m.lessons).length} lecciones. Revisá el panel derecho y cuando estés conforme, publicá tu producto.`,
            phase: "REFINING",
            spec: updatedSpec,
            blueprint: result.blueprint,
            provider: result.provider,
            mode: "live",
            proposalSummary: buildProposalSummary(updatedSpec, result.blueprint),
          };
        }
      } catch (err) {
        console.error("[converse] pipeline failed:", err);
      }

      // Fallback: try monolithic generation
      const prompt = buildBlueprintPromptFromSpec(updatedSpec);
      const answer = await askProviders(
        [{ role: "user", content: prompt }],
        { temperature: 0.65, maxTokens: 4096, json: true },
      );

      if (answer) {
        const json = extractJson(answer.text);
        const parsed = parseBlueprint(json);
        if (parsed) {
          return {
            reply: `¡Listo! Generé el blueprint completo para "${parsed.title}".\n\n${parsed.modules.length} módulos · ${parsed.modules.flatMap((m) => m.lessons).length} lecciones. Revisá el panel derecho y cuando estés conforme, publicá tu producto.`,
            phase: "REFINING",
            spec: updatedSpec,
            blueprint: parsed,
            provider: answer.provider,
            mode: "live",
            proposalSummary: buildProposalSummary(updatedSpec, parsed),
          };
        }
      }

      // Demo fallback
      const demo = buildDemoBlueprint(updatedSpec.topic ?? "producto");
      const demoBlueprint = demo.blueprint;
      return {
        reply: `Blueprint generado con el esqueleto básico de CROW (sin IA configurada). Título: "${demoBlueprint.title}". Podés editarlo desde el panel derecho.`,
        phase: "REFINING",
        spec: updatedSpec,
        blueprint: demoBlueprint,
        provider: "crow-skeleton",
        mode: "skeleton",
        proposalSummary: buildProposalSummary(updatedSpec, demoBlueprint),
      };
    }
  }

  // ── Phase: REFINING (blueprint exists → apply changes) ────────────────────
  if (req.phase === "REFINING" && req.blueprint) {
    const instructions = `Eres el asistente del Creator Studio de CROW MARKET.
BLUEPRINT ACTUAL: ${JSON.stringify(req.blueprint).slice(0, 10000)}
MENSAJE DEL CREATOR: "${req.message}"
Respondé con JSON: { "reply": string, "blueprint": blueprint_actualizado }`;

    const answer = await askProviders(
      [{ role: "user", content: instructions }],
      { temperature: 0.6, maxTokens: 4096, json: true },
    );

    if (answer) {
      const json = extractJson(answer.text) as { reply?: string; blueprint?: unknown } | null;
      if (json) {
        const next = parseBlueprint(json.blueprint) ?? req.blueprint;
        return {
          reply: json.reply?.trim() || "Blueprint actualizado.",
          phase: "REFINING",
          spec: updatedSpec,
          blueprint: next,
          provider: answer.provider,
          mode: "live",
        };
      }
    }

    // Demo refining fallback
    return {
      reply: `Entendido. ${req.message.toLowerCase().includes("módulo") ? `El blueprint tiene ${req.blueprint.modules.length} módulos. Podés editar la estructura desde el panel "Estructura".` : "Podés editar cualquier campo directamente desde los paneles del lado derecho."}`,
      phase: "REFINING",
      spec: updatedSpec,
      blueprint: req.blueprint,
      provider: "crow-skeleton",
      mode: "skeleton",
    };
  }

  // ── Phase: DISCOVERY / GATHERING — use IA when available ─────────────────
  const missing = missingFields(updatedSpec);

  // If spec is complete enough → move to READY
  if (missing === 0 && updatedSpec.topic) {
    const summary = buildProposalSummary(updatedSpec);
    const features = summary.features.map((f) => `✓ ${f}`).join("\n");
    const reply = `Ya tengo todo lo que necesito. Esto es lo que voy a crear:\n\n📘 ${summary.title}\n👥 ${summary.audience}\n📚 ${summary.modules} módulos\n\n${features}\n\n¿Querés que lo genere?`;

    return {
      reply,
      phase: "READY",
      spec: updatedSpec,
      blueprint: null,
      provider: "crow-skeleton",
      mode: "skeleton",
      proposalSummary: summary,
    };
  }

  // Try IA for conversational response
  const answer = await askProviders(
    [
      { role: "system", content: buildConverseSystemPrompt() },
      { role: "user", content: buildConversePrompt({ ...req, spec: updatedSpec }) },
    ],
    { temperature: 0.6, maxTokens: 512, json: true },
  );

  if (answer) {
    const json = extractJson(answer.text) as {
      reply?: string;
      phase?: ConversationPhase;
      spec?: ProductSpec;
      proposalSummary?: ProposalSummary;
    } | null;

    if (json?.reply) {
      const nextPhase = json.phase ?? (missing <= 2 ? "GATHERING" : "DISCOVERY");
      const mergedSpec = { ...updatedSpec, ...(json.spec ?? {}) };
      let proposalSummary = json.proposalSummary;
      if (nextPhase === "READY" && !proposalSummary) {
        proposalSummary = buildProposalSummary(mergedSpec);
      }
      return {
        reply: json.reply,
        phase: nextPhase,
        spec: mergedSpec,
        blueprint: null,
        provider: answer.provider,
        mode: "live",
        proposalSummary,
      };
    }
  }

  // ── Demo fallback ────────────────────────────────────────────────────────
  // Extract topic from first message if in DISCOVERY
  const nextSpec = { ...updatedSpec };
  if (req.phase === "DISCOVERY" && !nextSpec.topic) {
    nextSpec.topic = req.message.trim();
  }

  const questionIndex = Object.values(nextSpec).filter(v => v !== undefined).length - 1;

  const reply =
    req.phase === "DISCOVERY" || !nextSpec.productType
      ? demoDiscovery(req.message)
      : demoFollowUp(nextSpec, Math.max(0, questionIndex - 1));

  const nextPhase: ConversationPhase =
    missingFields(nextSpec) <= 1 ? "READY" : nextSpec.productType ? "GATHERING" : "DISCOVERY";

  const proposalSummary = nextPhase === "READY" ? buildProposalSummary(nextSpec) : undefined;

  return {
    reply,
    phase: nextPhase,
    spec: nextSpec,
    blueprint: null,
    provider: "crow-skeleton",
    mode: "skeleton",
    proposalSummary,
  };
}
