import type { ProductBlueprint } from "@/lib/ai/blueprint";
import type { BlueprintSpec, LessonSpec, ModuleSpec } from "@/lib/ai/spec";
import { shouldRecommendVideo } from "@/lib/ai/video-decision";

export type { BlueprintSpec, LessonSpec, ModuleSpec };

/**
 * CROW demo engine.
 *
 * This is a MINIMAL skeleton fallback used ONLY when no AI provider is configured.
 * It generates a basic, topic-adaptive structure — NEVER hardcoded content.
 * When AI is available, the converse engine always uses LLM-generated blueprints.
 */

export function specToBlueprint(spec: BlueprintSpec): ProductBlueprint {
  return {
    title: spec.title,
    shortDescription: spec.short,
    description: spec.description,
    audience: spec.audience,
    promise: spec.promise,
    productType: spec.type,
    category: spec.category,
    recommendedPriceUsdt: spec.price,
    includes: spec.includes,
    resources: spec.resources,
    commercialStrategy: spec.strategy,
    qualityChecklist: spec.checklist,
    learningGoals: spec.goals,
    tags: spec.tags,
    coverEmoji: spec.emoji,
    coverGradient: spec.gradient,
    modules: spec.modules.map(([title, summary, lessons]) => ({
      title,
      summary,
      lessons: lessons.map(([lessonTitle, content, exercise, preview, quizzes, imagePrompt]) => ({
        title: lessonTitle,
        content,
        durationMin: 20,
        imagePrompt: imagePrompt ?? "",
        videoUrl: "",
        videoEnabled: shouldRecommendVideo({ title: lessonTitle, content }),
        videoRequired: false,
        videoPrompt: "",
        videoDuration: 5,
        videoStyle: "cinematic",
        isFreePreview: Boolean(preview),
        exercises: [
          {
            title: `Ejercicio: ${lessonTitle}`,
            instructions: exercise,
            kind: "PRACTICE" as const,
            options: [],
            correctAnswer: "",
            explanation: "",
          },
          ...(quizzes ?? []).map((q) => ({
            title: q.title,
            instructions: q.instructions,
            kind: "QUIZ" as const,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          })),
        ],
      })),
    })),
  };
}

/**
 * Builds a minimal, topic-adaptive skeleton blueprint.
 * This is a LAST RESORT fallback when AI is completely unavailable.
 * The content is structured but intentionally generic — it must be
 * enhanced by AI generation or manual editing before publishing.
 */
function buildSkeletonBlueprint(idea: string): ProductBlueprint {
  const topic = idea.slice(0, 80);
  const lower = idea.toLowerCase();

  const productType: ProductBlueprint["productType"] = lower.includes("ebook") || lower.includes("libro")
    ? "EBOOK"
    : lower.includes("pdf") || lower.includes("guía")
      ? "PDF"
      : lower.includes("web") || lower.includes("plataforma")
        ? "INTERACTIVE_WEB"
        : lower.includes("kit") || lower.includes("recurso")
          ? "RESOURCE_KIT"
          : "COURSE";

  const emoji = lower.includes("fotograf") ? "📷"
    : lower.includes("trading") || lower.includes("invers") ? "📈"
    : lower.includes("program") || lower.includes("código") ? "💻"
    : lower.includes("marketing") ? "📣"
    : lower.includes("ia") || lower.includes("inteligencia") ? "🤖"
    : lower.includes("fitness") || lower.includes("ejercicio") ? "💪"
    : lower.includes("cocina") || lower.includes("receta") ? "🍳"
    : lower.includes("música") || lower.includes("guitarra") ? "🎵"
    : lower.includes("idioma") || lower.includes("inglés") ? "🌍"
    : lower.includes("diseño") || lower.includes("dibujo") ? "🎨"
    : "📚";

  const category = productType === "EBOOK" ? "Ebook"
    : productType === "PDF" ? "PDF"
    : productType === "INTERACTIVE_WEB" ? "Web interactiva"
    : productType === "RESOURCE_KIT" ? "Kit de recursos"
    : "Cursos";

  const moduleCount = 6;

  const moduleTemplates = [
    { title: "Fundamentos", suffix: "Los conceptos esenciales para empezar" },
    { title: "Herramientas y Recursos", suffix: "Lo que necesitás tener listo" },
    { title: "Técnicas Básicas", suffix: "Primeras acciones concretas" },
    { title: "Estrategia Intermedia", suffix: "Profundizando en el tema" },
    { title: "Avanzado y Optimización", suffix: "Nivel superior" },
    { title: "Proyecto Final y Siguientes Pasos", suffix: "Aplicación real y plan de acción" },
  ];

  const modules = moduleTemplates.slice(0, moduleCount).map((mod, mIdx) => {
    const lessonCount = mIdx === 0 ? 4 : 3;
    const lessons = Array.from({ length: lessonCount }, (_, lIdx) => {
      const lessonTitle = `Lección ${mIdx + 1}.${lIdx + 1}: ${mod.title} — Paso ${lIdx + 1}`;
      return {
        title: lessonTitle,
        content: `## ${lessonTitle}\n\nContenido pendiente de generación para "${topic}".\n\nEsta lección debe cubrir los aspectos prácticos de ${mod.title.toLowerCase()} dentro del contexto de ${topic}.\n\n### Conceptos clave\n- Concepto 1\n- Concepto 2\n- Concepto 3\n\n### Ejemplo práctico\nDescribir un caso de uso real relacionado con el tema.\n\n### Reflexión\n¿Cómo aplica esto en tu situación particular?`,
        durationMin: 20,
        imagePrompt: `Educational illustration about ${topic} - ${mod.title}, professional, clean design`,
        videoUrl: "",
        videoEnabled: lIdx === 0 || lIdx === 2,
        videoRequired: false,
        videoPrompt: "",
        videoDuration: 5,
        videoStyle: "cinematic",
        isFreePreview: mIdx === 0 && lIdx === 0,
        exercises: [
          {
            title: `Ejercicio: ${mod.title}`,
            instructions: `Completá el siguiente ejercicio práctico sobre ${topic} en el contexto de ${mod.title.toLowerCase()}.`,
            kind: "PRACTICE" as const,
            options: [],
            correctAnswer: "",
            explanation: "",
          },
          {
            title: `Quiz: ${mod.title}`,
            instructions: `Evaluá tu comprensión de ${mod.title.toLowerCase()}.`,
            kind: "QUIZ" as const,
            options: ["Opción A", "Opción B", "Opción C", "Opción D"],
            correctAnswer: "Opción A",
            explanation: "Explicación pendiente de generar.",
          },
        ],
      };
    });

    return {
      title: `${mod.title}: ${topic}`,
      summary: mod.suffix,
      lessons,
    };
  });

  return {
    title: `${topic}`,
    shortDescription: `Producto digital completo sobre ${topic}.`,
    description: `Producto educativo sobre ${topic} diseñado para ofrecer conocimiento práctico y aplicable. Incluye ejercicios, evaluaciones y recursos descargables.`,
    audience: "Público general interesado en el tema",
    promise: `Dominar los fundamentos de ${topic} y aplicarlos de forma práctica.`,
    productType,
    category,
    recommendedPriceUsdt: 29,
    includes: [
      `${moduleCount} módulos con lecciones detalladas`,
      "Ejercicios prácticos en cada módulo",
      "Evaluaciones tipo quiz",
      "Recursos descargables",
    ],
    resources: [
      "Glosario de términos",
      "Checklist de implementación",
      "Plantilla de plan de acción",
    ],
    commercialStrategy: [
      "Lanzamiento inicial con precio introductory",
      "Primer módulo gratuito como preview",
    ],
    qualityChecklist: [
      "Cada módulo entrega conocimiento aplicable",
      "Ejercicios prácticos incluidos",
      "Estructura progresiva clara",
    ],
    learningGoals: [
      `Comprender los fundamentos de ${topic}`,
      `Aplicar técnicas prácticas en ${topic}`,
      "Desarrollar un plan de acción concreto",
    ],
    tags: topic.toLowerCase().split(/\s+/).slice(0, 5),
    coverEmoji: emoji,
    coverGradient: "violet",
    modules,
  };
}

/**
 * Resolves the deterministic CROW skeleton blueprint for any idea.
 * This is a LAST RESORT fallback — when AI is available, it should
 * always generate real, domain-specific content via the converse engine.
 */
export function buildDemoBlueprint(idea: string): {
  blueprint: ProductBlueprint;
  template: string;
} {
  return { blueprint: buildSkeletonBlueprint(idea), template: "skeleton" };
}
