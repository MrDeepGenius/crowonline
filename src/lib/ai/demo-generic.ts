import type { BlueprintSpec, LessonSpec } from "@/lib/ai/spec";

function titleCase(value: string) {
  const clean = value.trim().replace(/\s+/g, " ");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

const lesson = (
  title: string,
  content: string,
  exercise: string,
  preview = false,
): LessonSpec => [title, content, exercise, preview];

/**
 * Generic spec for ideas that do not match a curated niche template.
 * Runs through the same specToBlueprint() pipeline as the curated specs.
 */
export function buildGenericSpec(idea: string): BlueprintSpec {
  const topic = titleCase(idea.replace(/["“”]/g, "").slice(0, 90));
  const shortTopic = topic.length > 58 ? `${topic.slice(0, 55)}...` : topic;
  const lower = shortTopic.toLowerCase();

  return {
    keywords: [],
    title: `${shortTopic}: Método Completo Paso a Paso`,
    short: `Programa práctico sobre ${lower} con plantillas y ejercicios desde el primer módulo.`,
    description: `Un programa diseñado alrededor de tu idea: "${topic}".\n\nEl recorrido parte de los fundamentos, avanza a la ejecución guiada y termina con un plan de acción y métricas para sostener resultados en el tiempo.\n\nCada módulo cierra con un entregable concreto para que el alumno no acumule teoría sin aplicación.`,
    audience: `Personas que quieren dominar ${lower} y necesitan un camino claro, ordenado y aplicable.`,
    promise:
      "Terminar con un sistema propio funcionando y un plan de 30 días para escalarlo.",
    type: "COURSE",
    category: "Cursos",
    price: 39,
    includes: [
      "9 lecciones organizadas por módulos",
      "Plantillas y checklists descargables",
      "Ejercicios de aplicación por lección",
      "Certificado digital al completar",
    ],
    resources: [
      "Plantilla de plan de acción 30 días",
      "Checklist de implementación",
      "Panel de seguimiento de métricas",
    ],
    strategy: [
      "Precio de entrada de 39 USDT con cupón de lanzamiento",
      "Contenido gratuito del módulo 1 para captación",
      "Red de afiliados con comisión directa del 30%",
    ],
    checklist: [
      "Cada módulo entrega un activo reutilizable",
      "Ejercicios autocorregibles sin sesiones en vivo",
      "Promesa medible en el título del curso",
    ],
    goals: [
      `Comprender los fundamentos de ${lower}`,
      "Aplicar el método con plantillas",
      "Medir resultados con métricas simples",
      "Escalar con un plan de 30 días",
    ],
    tags: lower
      .split(/[^a-záéíóúñ]+/)
      .filter((word) => word.length > 3)
      .slice(0, 4),
    emoji: "◆",
    gradient: "violet",
    modules: [
      [
        "Fundamentos y diagnóstico",
        "Entender el terreno antes de ejecutar.",
        [
          lesson(
            `Panorama de ${lower}`,
            "Definimos conceptos clave, errores frecuentes y el mapa completo del método del programa.",
            "Escribe tu punto de partida actual y tu objetivo a 30 días.",
            true,
          ),
          lesson(
            "Diagnóstico personal",
            "Identificamos recursos, restricciones y el punto de apalancamiento con mayor impacto inmediato.",
            "Completa el diagnóstico y elige prioridades.",
          ),
          lesson(
            "Objetivos medibles",
            "Convertimos deseos en metas con número, plazo y responsable.",
            "Formaliza 3 objetivos medibles.",
          ),
        ],
      ],
      [
        "Método y ejecución",
        "El sistema paso a paso, listo para aplicar.",
        [
          lesson(
            "El método en 5 fases",
            "Desglose operativo del sistema completo, con criterios de decisión en cada fase.",
            "Documenta tu versión del método en una página.",
          ),
          lesson(
            "Herramientas y plantillas",
            "Cómo usar cada plantilla sin perder tiempo configurando.",
            "Configura tus plantillas y publica tu primera versión.",
          ),
          lesson(
            "Ejecución guiada",
            "Puesta en marcha con control semanal y corrección temprana de desviaciones.",
            "Ejecuta una semana completa y registra resultados.",
          ),
        ],
      ],
      [
        "Escala y sostenibilidad",
        "Consolidar resultados y crecer con orden.",
        [
          lesson(
            "Métricas y control",
            "Qué medir, cada cuánto y con qué umbrales de decisión.",
            "Define tu panel de métricas mínimo.",
          ),
          lesson(
            "Optimización continua",
            "Ciclos de mejora cortos basados en datos reales.",
            "Ejecuta un ciclo de mejora y documenta el cambio.",
          ),
          lesson(
            "Plan a 30 días",
            "Cierre del programa con plan de acción y siguientes pasos.",
            "Entrega tu plan final y compártelo con el grupo.",
          ),
        ],
      ],
    ],
  };
}