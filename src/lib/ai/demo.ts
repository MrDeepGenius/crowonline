import type { ProductBlueprint } from "@/lib/ai/blueprint";
import type { BlueprintSpec, LessonSpec, ModuleSpec } from "@/lib/ai/spec";
import { buildGenericSpec } from "@/lib/ai/demo-generic";

export type { BlueprintSpec, LessonSpec, ModuleSpec };

/**
 * CROW demo engine.
 *
 * Deterministic fallback used whenever no AI provider is configured (or every
 * provider fails), so the Creator Studio always returns a complete, editable
 * and publishable blueprint.
 */
export const DEMO_SPECS: BlueprintSpec[] = [
  {
    keywords: ["marketing", "digital", "social", "ads", "embudo", "instagram"],
    title: "Marketing Digital desde Cero: Sistema de Ventas en 30 Días",
    short: "Construye embudo, contenido y anuncios con un sistema simple y replicable.",
    description:
      "Este curso lleva al alumno desde cero hasta tener un sistema de marketing digital funcionando: nicho, oferta, embudo, contenido y campañas.\n\nNo es teoría de universidad: cada módulo termina con una plantilla lista para publicar el mismo día. El objetivo es terminar con oferta validada, landing publicada y las primeras conversaciones de venta.\n\nIncluye calendario de contenido, estructura de anuncios y un panel de métricas semanal.",
    audience:
      "Emprendedores, freelancers y creadores que venden productos digitales o servicios y no quieren depender de agencias.",
    promise:
      "Terminar con un sistema de captación activo y las primeras 10 conversaciones de venta generadas.",
    type: "COURSE",
    category: "Cursos",
    price: 49,
    includes: [
      "9 lecciones con progreso guardado",
      "12 plantillas editables (contenido, ads, embudo)",
      "Panel de métricas semanal",
      "Certificado digital al completar",
    ],
    resources: [
      "Calendario de contenido de 30 días",
      "Swipe file con 20 anuncios de referencia",
      "Checklist de lanzamiento de oferta",
    ],
    strategy: [
      "Lanzamiento a 49 USDT con cupón del 50% los primeros 7 días",
      "Primer módulo como lead magnet distribuido por afiliados",
      "Comisión directa 30% + niveles L1-L5 para el equipo",
    ],
    checklist: [
      "Cada módulo entrega un activo tangible",
      "Ejercicios revisables sin sesiones en vivo",
      "Precio alineado al mercado hispano",
    ],
    goals: [
      "Definir oferta irresistible y público objetivo",
      "Construir un embudo mínimo viable",
      "Publicar contenido con intención de venta",
      "Leer métricas y optimizar campañas",
    ],
    tags: ["marketing", "ventas", "embudo", "contenido"],
    emoji: "📣",
    gradient: "violet",
    modules: [
      [
        "Fundamentos: nicho, oferta y público",
        "Elige un mercado que sí paga y define tu promesa.",
        [
          [
            "Elegir un nicho rentable en 1 hora",
            "Un nicho rentable tiene problema caro, disposición a pagar y gente fácil de encontrar. Usamos la matriz Nicho × Capacidad × Demanda.",
            "Completa la matriz con 3 nichos candidatos y marca el ganador.",
            true,
          ],
          [
            "Diseñar una oferta irresistible",
            "La oferta no es el producto: es resultado, tiempo y reducción de riesgo. Trabajamos Valor = (Resultado × Certeza) / (Tiempo × Esfuerzo).",
            "Reescribe tu oferta con los 4 componentes y añade 3 bonus.",
          ],
          [
            "Perfil de cliente y creencias",
            "Un avatar útil describe deseos, creencias limitantes y objeciones, para que cada contenido ataque una objeción concreta.",
            "Redacta 5 objeciones y su respuesta con prueba.",
          ],
        ],
      ],
      [
        "Embudo mínimo viable",
        "De la atención a la conversión sin herramientas complicadas.",
        [
          [
            "Arquitectura del embudo en 5 piezas",
            "Contenido → Recurso → Landing → Oferta → Seguimiento, con la métrica clave de cada pieza.",
            "Dibuja tu embudo y define la métrica de cada pieza.",
          ],
          [
            "Landing que convierte sin diseño avanzado",
            "Promesa, prueba, mecanismo, oferta, garantía y CTA: los 6 bloques que sostienen la conversión.",
            "Escribe tu landing en texto plano revisando los 6 bloques.",
          ],
          [
            "Lead magnet que la gente sí quiere",
            "Un buen recurso resuelve un problema pequeño por completo en menos de 10 minutos.",
            "Crea tu recurso descargable en formato editable.",
          ],
        ],
      ],
      [
        "Contenido y escala",
        "Publicar menos, con más propósito, y multiplicar con afiliados.",
        [
          [
            "El calendario de 30 días",
            "Autoridad, prueba, historia y venta directa en proporción 3-3-2-1 por semana.",
            "Rellena el calendario con 20 ideas siguiendo la proporción.",
          ],
          [
            "Guiones cortos que retienen",
            "Anatomía del guion: gancho, contexto, mecanismo, prueba y CTA, adaptado a tres plataformas.",
            "Escribe 3 guiones de 45 segundos con estructura completa.",
          ],
          [
            "Escalar con anuncios y afiliados",
            "Estructura de campañas simples y cómo calcular la comisión máxima viable antes de reclutar afiliados.",
            "Configura una campaña de prueba y prepara tu kit de afiliado.",
          ],
        ],
      ],
    ],
  },
  {
    keywords: ["ia", "inteligencia", "negocio", "automatiz", "gpt", "chatgpt"],
    title: "IA para Negocios: Automatiza tu Operación en 21 Días",
    short: "Aplica IA en atención, contenido y procesos con flujos listos para copiar.",
    description:
      "Programa práctico para negocios que quieren usar IA con retorno inmediato.\n\nCada módulo cubre un área operativa: atención al cliente, contenido, datos y automatizaciones entre herramientas. Todo con prompts y flujos probados que se implementan el mismo día.\n\nAl terminar, el negocio cuenta con su manual interno de IA y cuatro automatizaciones activas operando sin intervención humana.",
    audience:
      "Dueños de negocio, responsables de operaciones y equipos de marketing de 1 a 20 personas.",
    promise: "Terminar con 4 automatizaciones activas y un manual de IA para tu equipo.",
    type: "COURSE",
    category: "Cursos",
    price: 79,
    includes: [
      "9 lecciones operativas con casos reales",
      "Biblioteca de 60 prompts por área",
      "Diagramas de automatización no-code",
      "Certificado digital de automatización",
    ],
    resources: [
      "Biblioteca de 60 prompts por área",
      "Plantilla de manual interno de IA",
      "Checklist de datos sensibles",
    ],
    strategy: [
      "Posicionar a 79 USDT con garantía de 14 días",
      "Webinar mensual de captación junto a afiliados",
      "Bundle con el kit de automatizaciones a 119 USDT",
    ],
    checklist: [
      "Cada automatización tiene ROI medible",
      "No requiere conocimientos de código",
      "Incluye política de uso responsable de datos",
    ],
    goals: [
      "Detectar tareas automatizables por impacto",
      "Diseñar flujos de IA sin código",
      "Medir ahorro de horas y costo por tarea",
      "Documentar procesos para el equipo",
    ],
    tags: ["ia", "automatización", "productividad", "operaciones"],
    emoji: "🤖",
    gradient: "aurora",
    modules: [
      [
        "Diagnóstico y oportunidades",
        "Encuentra dónde la IA ahorra dinero esta semana.",
        [
          [
            "Mapa de tareas y horas",
            "Antes de automatizar hay que medir: clasificamos tareas por frecuencia y valor para elegir las que devuelven más horas.",
            "Exporta tus tareas de una semana y clasifícalas por horas y valor.",
            true,
          ],
          [
            "Regla 80/20 de la automatización",
            "Solo automatiza lo repetitivo, verificable y sin responsabilidad crítica. Analizamos tres casos límite.",
            "Elige 3 procesos y valida que cumplen la regla.",
          ],
          [
            "Riesgos y datos sensibles",
            "Qué información no debe salir de tu organización y cómo anonimizar antes de usar IA.",
            "Redacta tu política mínima de datos en una página.",
          ],
        ],
      ],
      [
        "Atención al cliente con IA",
        "Responder más rápido sin perder tono humano.",
        [
          [
            "Base de conocimiento y tono",
            "La calidad de una IA depende de su contexto: construimos la base de conocimiento real del negocio.",
            "Crea 20 preguntas frecuentes con respuesta modelo.",
          ],
          [
            "Flujo de respuestas y escalado",
            "Cuándo contesta la IA y cuándo escala a un humano, con reglas explícitas.",
            "Define tus 5 reglas de escalado.",
          ],
          [
            "Métricas de soporte",
            "Tiempo de primera respuesta, resolución sin humano y satisfacción, con umbrales de alerta.",
            "Mide tu semana actual y fija objetivos.",
          ],
        ],
      ],
      [
        "Automatizaciones y contenido",
        "Conectar IA con tus sistemas y producir contenido constante.",
        [
          [
            "Flujo n8n/Make mínimo",
            "Formulario → IA → CRM → Email, construido paso a paso con manejo de errores.",
            "Construye el flujo mínimo y pruébalo con datos reales.",
          ],
          [
            "Contenido asistido con voz de marca",
            "Cómo generar 30 piezas mensuales manteniendo voz propia y sin contenido genérico.",
            "Genera 10 piezas y edítalas con tu checklist de marca.",
          ],
          [
            "Manual interno y formación",
            "Documentar el sistema para que el equipo lo use sin depender de ti.",
            "Publica tu manual interno y capacita a una persona.",
          ],
        ],
      ],
    ],
  },
];

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
      lessons: lessons.map(([lessonTitle, content, exercise, preview]) => ({
        title: lessonTitle,
        content,
        durationMin: 20,
        imagePrompt: "",
        videoUrl: "",
        isFreePreview: Boolean(preview),
        exercises: [
          {
            title: `Ejercicio: ${lessonTitle}`,
            instructions: exercise,
            kind: "PRACTICE" as const,
          },
        ],
      })),
    })),
  };
}

/** Resolves the deterministic CROW demo blueprint for any idea. */
export function buildDemoBlueprint(idea: string): {
  blueprint: ProductBlueprint;
  template: string;
} {
  const normalized = idea.toLowerCase();
  const spec = DEMO_SPECS.find((item) =>
    item.keywords.some((keyword) => normalized.includes(keyword)),
  );

  if (spec) {
    return { blueprint: specToBlueprint(spec), template: spec.title };
  }

  return { blueprint: specToBlueprint(buildGenericSpec(idea)), template: "generic" };
}