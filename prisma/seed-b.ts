import type { SeedProduct } from "./seed-types";

export const SEED_PRODUCTS_B: SeedProduct[] = [
  {
    title: "Ebook de Ventas: del Primer Contacto al Cierre",
    short: "Guiones, objeciones y seguimiento para cerrar ventas sin sonar desesperado.",
    description:
      "Ebook directo al punto: cómo estructurar una conversación de venta, responder las objeciones más frecuentes y hacer seguimiento con valor.\n\nIncluye 20 guiones de mensajes y un sistema de 7 toques para mantener oportunidades vivas sin presión.\n\nSe lee en una tarde y se aplica en la siguiente conversación.",
    type: "EBOOK",
    category: "Ebook",
    price: 19,
    emoji: "📈",
    gradient: "ember",
    includes: ["Ebook de 90 páginas", "20 guiones editables", "Matriz de objeciones"],
    tags: ["ventas", "cierre", "guiones"],
    creatorIndex: 1,
    modules: [
      {
        title: "Preparación de la conversación",
        summary: "Antes de vender.",
        lessons: [
          {
            title: "Señales de compra y descarte",
            content: "Cómo detectar prospectos listos sin gastar energía en el resto.",
            exercise: "Escribe 5 señales de compra y 5 de descarte.",
            preview: true,
          },
        ],
      },
      {
        title: "Cierre y seguimiento",
        summary: "Del interés a la firma.",
        lessons: [
          {
            title: "Las 12 objeciones más comunes",
            content: "Matriz objeción → causa real → respuesta con prueba.",
            exercise: "Completa la matriz con tus objeciones reales.",
          },
        ],
      },
    ],
  },
  {
    title: "Kit de Contenido para Redes Sociales",
    short: "300 piezas listas: hooks, guiones, carruseles y calendario de 90 días.",
    description:
      "Kit de recursos para producir contenido constante sin bloquearte: 100 hooks probados, 50 guiones cortos, 50 ideas de carrusel y un calendario de 90 días.\n\nTodo en formato editable (Notion, Sheets y Canva) listo para adaptar a tu marca.\n\nIdeal como base para creadores y negocios que publican cada semana.",
    type: "RESOURCE_KIT",
    category: "Kit de recursos",
    price: 29,
    emoji: "🧰",
    gradient: "ocean",
    includes: ["100 hooks", "50 guiones", "Calendario de 90 días"],
    tags: ["contenido", "redes", "plantillas"],
    creatorIndex: 1,
    modules: [
      {
        title: "Biblioteca de hooks",
        summary: "Primeros 3 segundos que retienen.",
        lessons: [
          {
            title: "50 hooks por tipo de audiencia",
            content: "Clasificados por dolor, deseo, curiosidad y autoridad.",
            exercise: "Adapta 10 hooks a tu nicho.",
            preview: true,
          },
        ],
      },
      {
        title: "Sistema de publicación",
        summary: "Publicar sin improvisar.",
        lessons: [
          {
            title: "Calendario de 90 días",
            content: "Estructura semanal con formatos y objetivos por pieza.",
            exercise: "Rellena tu primera semana completa.",
          },
        ],
      },
    ],
  },
];