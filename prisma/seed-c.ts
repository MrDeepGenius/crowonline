import type { SeedProduct } from "./seed-types";

export const SEED_PRODUCTS_C: SeedProduct[] = [
  {
    title: "Curso de Finanzas Personales",
    short: "Ordena tus finanzas, elimina deudas y construye tu fondo de emergencia.",
    description:
      "Programa para tomar control del dinero: presupuesto real, reducción de deudas, fondo de emergencia e inversión inicial.\n\nCon plantillas de seguimiento mensual y un método de decisión para gastos grandes.\n\nAl terminar tienes un sistema financiero propio funcionando durante los próximos 12 meses.",
    type: "COURSE",
    category: "Cursos",
    price: 39,
    emoji: "💰",
    gradient: "mono",
    includes: ["3 módulos y 9 lecciones", "Plantilla de presupuesto", "Calculadora de deudas"],
    tags: ["finanzas", "presupuesto", "deudas"],
    creatorIndex: 2,
    modules: [
      {
        title: "Diagnóstico financiero",
        summary: "Saber dónde estás.",
        lessons: [
          {
            title: "Presupuesto real en 30 minutos",
            content: "Clasificación de gastos fijos, variables y hormiga.",
            exercise: "Completa tu presupuesto del mes pasado.",
            preview: true,
          },
          {
            title: "Deuda: orden de ataque",
            content: "Método bola de nieve vs. avalancha y cuál te conviene.",
            exercise: "Ordena tus deudas y define la estrategia.",
          },
        ],
      },
      {
        title: "Fondo e inversión",
        summary: "Construir tranquilidad.",
        lessons: [
          {
            title: "Fondo de emergencia",
            content: "Cuánto necesitas y dónde guardarlo sin perder valor.",
            exercise: "Define tu objetivo de fondo y el plazo.",
          },
        ],
      },
    ],
  },
  {
    title: "Web Interactiva de Productividad",
    short: "Panel interactivo con sistema GTD, metas y seguimiento semanal.",
    description:
      "Experiencia web interactiva para organizar proyectos, tareas y objetivos con el sistema CROW.\n\nIncluye tableros de captura, priorización por impacto y revisión semanal guiada.\n\nSe abre en el navegador y funciona como tu centro de productividad diario.",
    type: "INTERACTIVE_WEB",
    category: "Web interactiva",
    price: 35,
    emoji: "⚡",
    gradient: "aurora",
    includes: ["Panel interactivo", "Revisión semanal guiada", "Plantilla de objetivos"],
    tags: ["productividad", "gtd", "foco"],
    creatorIndex: 2,
    modules: [
      {
        title: "Capturar y priorizar",
        summary: "Vaciar la cabeza.",
        lessons: [
          {
            title: "Bandeja de entrada",
            content: "Todo entra primero, se decide después.",
            exercise: "Captura todo lo pendiente durante 24 horas.",
            preview: true,
          },
          {
            title: "Priorización por impacto",
            content: "Matriz impacto/esfuerzo aplicada a proyectos reales.",
            exercise: "Prioriza tus 10 pendientes y elimina 3.",
          },
        ],
      },
      {
        title: "Revisión y foco",
        summary: "Sostener el sistema.",
        lessons: [
          {
            title: "Revisión semanal guiada",
            content: "30 minutos para revisar, ajustar y planificar la semana.",
            exercise: "Ejecuta una revisión completa y documenta cambios.",
          },
        ],
      },
    ],
  },
];