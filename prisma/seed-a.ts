import type { SeedProduct } from "./seed-types";

export const SEED_PRODUCTS_A: SeedProduct[] = [
  {
    title: "Curso de Marketing Digital desde Cero",
    short: "Sistema completo de captación, embudo y contenido para vender online.",
    description:
      "Programa práctico para construir un sistema de marketing digital funcionando en 30 días: nicho, oferta, embudo, contenido y campañas.\n\nCada módulo termina con una plantilla lista para publicar. Al final tienes oferta validada, landing activa y las primeras conversaciones de venta.\n\nIncluye calendario de contenido, estructura de anuncios y panel de métricas semanal.",
    type: "COURSE",
    category: "Cursos",
    price: 49,
    emoji: "📣",
    gradient: "violet",
    includes: ["4 módulos y 12 lecciones", "12 plantillas editables", "Certificado al completar"],
    tags: ["marketing", "ventas", "embudo"],
    creatorIndex: 0,
    modules: [
      {
        title: "Nicho, oferta y público",
        summary: "Define un mercado que sí paga.",
        lessons: [
          {
            title: "Elegir un nicho rentable",
            content:
              "Un nicho rentable combina problema caro, disposición a pagar y accesibilidad. Usamos la matriz Nicho × Capacidad × Demanda para descartar ideas rápido.",
            exercise: "Completa la matriz con 3 nichos y marca el ganador.",
            preview: true,
          },
          {
            title: "Diseñar la oferta irresistible",
            content:
              "La oferta es resultado, certeza, tiempo y esfuerzo: Valor = (Resultado × Certeza) / (Tiempo × Esfuerzo).",
            exercise: "Reescribe tu oferta con los 4 componentes.",
          },
        ],
      },
      {
        title: "Embudo y contenido",
        summary: "De la atención a la conversión.",
        lessons: [
          {
            title: "Embudo mínimo viable",
            content:
              "Contenido → Recurso → Landing → Oferta → Seguimiento, con una métrica por pieza.",
            exercise: "Dibuja tu embudo y define la métrica clave de cada pieza.",
          },
          {
            title: "Calendario de 30 días",
            content: "Autoridad, prueba, historia y venta directa en proporción 3-3-2-1.",
            exercise: "Rellena el calendario con 20 ideas.",
          },
        ],
      },
    ],
  },
  {
    title: "Curso de IA para Negocios",
    short: "Automatiza atención, contenido y procesos con flujos no-code.",
    description:
      "Programa operativo para aplicar IA con retorno inmediato: atención al cliente, producción de contenido y automatizaciones entre herramientas.\n\nCada módulo entrega un flujo funcional con métricas de ahorro de horas y control de costes.\n\nAl terminar tienes cuatro automatizaciones activas y un manual interno para tu equipo.",
    type: "COURSE",
    category: "Cursos",
    price: 79,
    emoji: "🤖",
    gradient: "aurora",
    includes: ["4 módulos y 12 lecciones", "Biblioteca de 60 prompts", "Manual interno editable"],
    tags: ["ia", "automatización", "operaciones"],
    creatorIndex: 0,
    modules: [
      {
        title: "Diagnóstico de oportunidades",
        summary: "Dónde la IA ahorra dinero esta semana.",
        lessons: [
          {
            title: "Mapa de tareas y horas",
            content:
              "Clasificamos tareas por frecuencia y valor para atacar primero las que devuelven más horas.",
            exercise: "Exporta tus tareas de una semana y clasifícalas.",
            preview: true,
          },
          {
            title: "Riesgos y datos sensibles",
            content:
              "Qué información no debe salir de la organización y cómo anonimizar antes de usar IA.",
            exercise: "Redacta tu política mínima de datos.",
          },
        ],
      },
      {
        title: "Automatizaciones no-code",
        summary: "Conecta IA con tus sistemas actuales.",
        lessons: [
          {
            title: "Flujo formulario → IA → CRM → Email",
            content: "Construcción paso a paso con manejo de errores y logs.",
            exercise: "Construye el flujo mínimo y pruébalo con datos reales.",
          },
          {
            title: "Métricas de ahorro",
            content: "Horas ahorradas, costo por tarea y alertas de gasto en APIs.",
            exercise: "Mide tu semana actual y fija objetivos.",
          },
        ],
      },
    ],
  },
];