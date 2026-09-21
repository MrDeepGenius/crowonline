/**
 * CROW Media Quality Engine — MediaSpec & Decision Engine
 *
 * Determines the optimal visual representation for each lesson's content.
 * NVIDIA analyzes the lesson and produces a MediaSpec, then CROW renders it.
 *
 * Media types:
 * - IMAGE: Pure visual (photo, illustration, scene) → Leonardo
 * - DIAGRAM: Technical diagrams, architectures, relationships → SVG
 * - CHART: Statistics, percentages, comparisons, metrics → SVG/Chart
 * - INFOGRAPHIC: Composed visual with labels/steps → Leonardo (bg) + SVG (overlay)
 * - TIMELINE: Sequential events/eras → SVG
 * - PROCESS: Step-by-step workflows → SVG
 * - COMPARISON: Side-by-side tables/cards → SVG
 * - CODE_VISUAL: Code with syntax highlighting, flow diagrams → SVG/HTML
 * - IMAGE_WITH_OVERLAY: Photo + precise text labels → Leonardo (clean) + SVG (overlay)
 */

export type MediaType =
  | "IMAGE"
  | "DIAGRAM"
  | "CHART"
  | "INFOGRAPHIC"
  | "TIMELINE"
  | "PROCESS"
  | "COMPARISON"
  | "CODE_VISUAL"
  | "IMAGE_WITH_OVERLAY";

export type MediaPurpose =
  | "concept_illustration"
  | "anatomy_structure"
  | "process_flow"
  | "architecture_system"
  | "data_visualization"
  | "statistics_metrics"
  | "comparison_table"
  | "timeline_history"
  | "code_demonstration"
  | "technical_diagram"
  | "composition_guide"
  | "exposure_diagram"
  | "workflow_steps"
  | "decision_tree"
  | "funnel_pipeline"
  | "conceptual_image"
  | "cover_art";

export interface MediaOverlay {
  text: string;
  position: "top" | "bottom" | "left" | "right" | "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  style?: "title" | "label" | "number" | "caption" | "badge";
  fontSize?: "sm" | "md" | "lg" | "xl";
}

export interface MediaSpec {
  type: MediaType;
  purpose: MediaPurpose;
  title?: string;
  description?: string;
  /** For Leonardo: visual prompt WITHOUT text instructions */
  visualPrompt?: string;
  /** For CROW renderers: structured data */
  data?: unknown;
  /** For INFOGRAPHIC / IMAGE_WITH_OVERLAY: text overlays to render on top */
  overlays?: MediaOverlay[];
  /** Confidence score from NVIDIA (0-1) */
  confidence?: number;
  /** Reasoning for the decision */
  reasoning?: string;
  /** Whether this lesson actually needs media (some pure-text lessons don't) */
  needed?: boolean;
}

// ─── Domain-specific media patterns ──────────────────────────────────────────

const DOMAIN_MEDIA_PATTERNS: Array<{
  domain: string;
  patterns: RegExp[];
  preferredTypes: MediaType[];
  purposes: MediaPurpose[];
}> = [
  {
    domain: "programming",
    patterns: [
      /programaci[oó]n|c[oó]digo|software|algoritmo|desarrollo|frontend|backend|api|base de datos|git|docker|kubernetes|framework|library|typescript|javascript|python|rust|go|java|c\+\+|react|vue|angular|node|express|nextjs/i,
      /inteligencia artificial|machine learning|ia\b|redes neurona|modelo|dataset|entrenamiento|inferencia|transformer|llm/i,
      /ciberseguridad|hacking|seguridad inform|vulnerabilidad|encrypt|pentest|firewall|auth/i,
    ],
    preferredTypes: ["DIAGRAM", "CODE_VISUAL", "PROCESS", "COMPARISON", "CHART"] as MediaType[],
    purposes: ["architecture_system", "process_flow", "code_demonstration", "technical_diagram", "comparison_table", "data_visualization"],
  },
  {
    domain: "finance",
    patterns: [
      /finanza|contabilidad|balance|presupuest|inversi[oó]n|bolsa|acciones|mercado|econom/i,
      /impuesto|tribut|fiscal|declaraci[oó]n|iva|irpf/i,
      /trading|cripto|blockchain|defi|wallet|exchange/i,
    ],
    preferredTypes: ["CHART", "COMPARISON", "TIMELINE", "PROCESS", "INFOGRAPHIC"],
    purposes: ["statistics_metrics", "comparison_table", "timeline_history", "process_flow", "data_visualization"],
  },
  {
    domain: "medicine",
    patterns: [
      /anatom[ií]a|fisiolog[ií]a|diagn[oó]stic|enfermedad|patolog|cl[ií]nic|cirug[ií]a|farmac|salud|m[eé]dic|hospital|paciente|s[ií]ntoma|tratamiento/i,
      /biolog[ií]a|celular|molecular|gen[ée]tica|inmunolog/i,
      /psicolog[ií]a|terapia|trastorno|salud mental/i,
    ],
    preferredTypes: ["DIAGRAM", "IMAGE_WITH_OVERLAY", "PROCESS", "INFOGRAPHIC"] as MediaType[],
    purposes: ["anatomy_structure", "process_flow", "technical_diagram", "concept_illustration"],
  },
  {
    domain: "photography",
    patterns: [
      /fotograf[ií]a|c[aá]mara|iluminaci[oó]n|encuadre|retoque|exposici[oó]n|diafragma|obturador|iso|balance de blancos|composici[oó]n|regla de los tercios|profundidad de campo/i,
      /retrato|paisaje|macro|nocturna|deportivo|arquitectura|producto|moda|boda|evento/i,
      /lightroom|photoshop|capture one|raw|jpeg|histograma|curvas|capas|m[aá]scara/i,
    ],
    preferredTypes: ["IMAGE", "DIAGRAM", "COMPARISON", "INFOGRAPHIC"] as MediaType[],
    purposes: ["concept_illustration", "composition_guide", "exposure_diagram", "comparison_table", "technical_diagram"],
  },
  {
    domain: "marketing",
    patterns: [
      /marketing|ventas|embudo|campaña|anuncio|publicidad|branding|cliente|lead|conversi[oó]n|funnel|pipeline|seo|sem|analytics|roi|kpi/i,
      /redes sociales|instagram|tiktok|linkedin|facebook|twitter|content|influencer/i,
      /email marketing|automatizaci[oó]n|crf|segmentaci[oó]n|a\/b test/i,
    ],
    preferredTypes: ["PROCESS", "CHART", "COMPARISON", "INFOGRAPHIC", "TIMELINE"] as MediaType[],
    purposes: ["process_flow", "funnel_pipeline", "statistics_metrics", "comparison_table", "data_visualization", "timeline_history"],
  },
  {
    domain: "history",
    patterns: [
      /historia|evoluci[oó]n|origen|revoluci[oó]n|guerra|civil|sociedad|cultura|era|epoca|siglo|antig[üu]edad|edad media|renacimiento|ilustraci[oó]n|contempor[aá]neo/i,
      /biograf[ií]a|personaje hist[oó]rico|evento hist[oó]rico|monumento|patrimonio/i,
    ],
    preferredTypes: ["TIMELINE", "DIAGRAM", "INFOGRAPHIC", "IMAGE"],
    purposes: ["timeline_history", "process_flow", "data_visualization", "concept_illustration"],
  },
  {
    domain: "law",
    patterns: [
      /derecho|legal|jur[ií]dico|ley|norma|reglamento|contrato|cl[aá]usula|jurisprudencia|sentencia|tribunal|juicio|demanda|abogado|notario|registr/i,
      /penal|civil|mercantil|laboral|administrativo|constitucional|internacional|familia|herencia|sucesiones/i,
    ],
    preferredTypes: ["PROCESS", "DIAGRAM", "TIMELINE", "COMPARISON", "INFOGRAPHIC"],
    purposes: ["process_flow", "technical_diagram", "timeline_history", "comparison_table", "data_visualization"],
  },
];

// ─── Media type keywords for NVIDIA prompt ──────────────────────────────────

const MEDIA_TYPE_DEFINITIONS = `
TIPOS DE MEDIA DISPONIBLES:
1. IMAGE — Fotografía, ilustración, escena, ambiente. SOLO contenido visual puro. NO texto.
2. DIAGRAMA — Anatomía, arquitectura de sistemas, relaciones, flujos técnicos, conceptos estructurales. Renderizado como SVG preciso con texto real.
3. CHART — Gráficos de barras, líneas, pastel, dispersión, áreas. Datos numéricos exactos. Renderizado con datos estructurados.
4. INFOGRAFICA — Composición visual con título, etiquetas, pasos numerados, explicaciones. Fondo visual (Leonardo SIN texto) + capas SVG encima.
5. TIMELINE — Línea temporal de eventos, eras, hitos. Renderizado como SVG interactivo.
6. PROCESS — Diagrama de proceso paso a paso, flujo de trabajo, pipeline. Nodos y flechas con texto real.
7. COMPARISON — Tablas comparativas, tarjetas lado a lado, matrices de decisión. Renderizado como HTML/SVG.
8. CODE_VISUAL — Código con syntax highlighting, diagramas de flujo de ejecución, arquitectura de software, terminal simulada. NUNCA pedirle a Leonardo que escriba código.
9. IMAGE_WITH_OVERLAY — Imagen fotográfica/ilustración LIMPIA (Leonardo SIN texto) + etiquetas/títulos/números precisos renderizados por CROW encima.

REGLAS DE DECISIÓN:
- Si el contenido necesita PRECISIÓN textual (números, etiquetas técnicas, código, pasos) → NO uses IMAGE sola, usa DIAGRAM, CHART, INFOGRAFICA, CODE_VISUAL, o IMAGE_WITH_OVERLAY.
- Si es puramente visual (ambiente, foto de referencia, ilustración conceptual) → IMAGE.
- Si hay datos numéricos/estadísticas → CHART.
- Si es una secuencia temporal → TIMELINE.
- Si es un flujo/proceso con pasos → PROCESS.
- Si compara opciones → COMPARISON.
- Si es programación/código → CODE_VISUAL.
- Si necesita imagen de fondo + texto preciso encima → IMAGE_WITH_OVERLAY.
- Si es composición visual rica con múltiples elementos textuales → INFOGRAFICA.
- NUNCA uses IMAGE para diagramas, tablas, código, o infografías con texto.
`;

// ─── NVIDIA Prompt Builder ─────────────────────────────────────────────────

export function buildMediaSpecPrompt(lesson: {
  title: string;
  content: string;
  moduleTitle: string;
  moduleSummary: string;
  courseTitle: string;
  courseDescription: string;
  audience: string;
  domain?: string;
}): string {
  const contentPreview = lesson.content
    .replace(/#+\s+/g, "")
    .replace(/[*_`>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1500);

  return `Analizá esta lección y decidí el TIPO DE MEDIA óptimo para enseñar su contenido.

CURSO: "${lesson.courseTitle}"
Descripción: ${lesson.courseDescription.slice(0, 300)}
Público: ${lesson.audience}

MÓDULO: "${lesson.moduleTitle}"
Resumen: ${lesson.moduleSummary}

LECCIÓN: "${lesson.title}"
Contenido:
${contentPreview}

${MEDIA_TYPE_DEFINITIONS}

DEVOLVÉ SOLO JSON con esta estructura exacta:

{
  "type": "IMAGE|DIAGRAM|CHART|INFOGRAPHIC|TIMELINE|PROCESS|COMPARISON|CODE_VISUAL|IMAGE_WITH_OVERLAY",
  "purpose": "concept_illustration|anatomy_structure|process_flow|architecture_system|data_visualization|statistics_metrics|comparison_table|timeline_history|code_demonstration|technical_diagram|composition_guide|exposure_diagram|workflow_steps|decision_tree|funnel_pipeline|conceptual_image|cover_art",
  "title": "Título descriptivo del elemento visual (máx 80 chars)",
  "description": "Qué muestra esta media y por qué ayuda a aprender (1-2 frases)",
  "visualPrompt": "Prompt en inglés para Leonardo — SOLO descripción visual, SIN instrucciones de texto. Ej: 'clean professional diagram of neural network architecture, nodes and connections, no text, no labels, dark violet aesthetic'",
  "data": { /* Estructura específica según type — ver ejemplos abajo */ },
  "overlays": [
    { "text": "Etiqueta 1", "position": "top-left", "style": "label" },
    { "text": "Paso 1", "position": "center", "style": "number" }
  ],
  "confidence": 0.92,
  "reasoning": "Explicación breve de por qué este tipo es el óptimo para esta lección",
  "needed": true
}

EJEMPLOS DE ESTRUCTURA "data" POR TIPO:

DIAGRAM: { "nodes": [{ "id": "1", "label": "Input", "type": "input" }, { "id": "2", "label": "Process", "type": "process" }], "edges": [{ "from": "1", "to": "2" }] }
CHART: { "type": "bar|line|pie|area|scatter", "data": [{ "label": "Ene", "value": 100 }, { "label": "Feb", "value": 120 }], "xKey": "label", "yKey": "value" }
INFOGRAPHIC: { "sections": [{ "title": "Paso 1", "content": "Descripción", "icon": "📝" }, { "title": "Paso 2", "content": "Descripción", "icon": "⚙️" }] }
TIMELINE: { "events": [{ "date": "2020", "title": "Evento", "description": "Detalle" }, { "date": "2021", "title": "Otro", "description": "Detalle" }] }
PROCESS: { "steps": [{ "number": 1, "title": "Paso 1", "description": "Qué hacer" }, { "number": 2, "title": "Paso 2", "description": "Qué hacer" }], "decisionPoints": [] }
COMPARISON: { "criteria": ["Precio", "Facilidad", "Potencia"], "items": [{ "name": "Opción A", "values": ["$10", "Alta", "Media"] }, { "name": "Opción B", "values": ["$20", "Media", "Alta"] }] }
CODE_VISUAL: { "language": "python", "code": "def hello():\\n    print('Hola')", "explanation": "Función saludo", "flowDiagram": { "nodes": [], "edges": [] } }
IMAGE_WITH_OVERLAY: { "baseImagePrompt": "photo of camera lens closeup, professional lighting", "overlays": [{ "text": "Diafragma", "position": "center" }, { "text": "f/1.8", "position": "bottom" }] }

Solo JSON, nada más.`;
}

// ─── Domain detection ──────────────────────────────────────────────────────

export function detectDomain(lesson: { title: string; content: string; moduleTitle: string; courseTitle: string }): string | null {
  const combined = `${lesson.courseTitle} ${lesson.moduleTitle} ${lesson.title} ${lesson.content}`.toLowerCase();
  for (const { domain, patterns } of DOMAIN_MEDIA_PATTERNS) {
    if (patterns.some((p) => p.test(combined))) return domain;
  }
  return null;
}

export function getDomainPreferences(domain: string): { preferredTypes: MediaType[]; purposes: MediaPurpose[] } | null {
  const entry = DOMAIN_MEDIA_PATTERNS.find((d) => d.domain === domain);
  return entry ? { preferredTypes: entry.preferredTypes, purposes: entry.purposes } : null;
}

// ─── MediaSpec validation ──────────────────────────────────────────────────

export function validateMediaSpec(spec: MediaSpec): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!spec.type) errors.push("Missing type");
  if (!spec.purpose) errors.push("Missing purpose");
  if (spec.needed === false && spec.type !== "IMAGE") errors.push("Not needed but has non-IMAGE type");
  if (spec.confidence !== undefined && (spec.confidence < 0 || spec.confidence > 1)) errors.push("Confidence out of range");
  if (spec.visualPrompt && spec.visualPrompt.length > 500) errors.push("visualPrompt too long");
  if (spec.overlays) {
    for (const o of spec.overlays) {
      if (!o.text) errors.push("Overlay missing text");
      if (!["top", "bottom", "left", "right", "center", "top-left", "top-right", "bottom-left", "bottom-right"].includes(o.position)) {
        errors.push(`Invalid overlay position: ${o.position}`);
      }
    }
  }

  // Type-specific validation
  if (spec.type === "CHART" && !spec.data) errors.push("CHART requires data");
  if (spec.type === "TIMELINE" && !spec.data) errors.push("TIMELINE requires data");
  if (spec.type === "PROCESS" && !spec.data) errors.push("PROCESS requires data");
  if (spec.type === "COMPARISON" && !spec.data) errors.push("COMPARISON requires data");
  if (spec.type === "CODE_VISUAL" && !spec.data) errors.push("CODE_VISUAL requires data");
  if ((spec.type === "INFOGRAPHIC" || spec.type === "IMAGE_WITH_OVERLAY") && (!spec.overlays || spec.overlays.length === 0)) {
    errors.push(`${spec.type} requires overlays`);
  }

  return { valid: errors.length === 0, errors };
}

// ─── Default MediaSpec fallback ────────────────────────────────────────────

export function defaultMediaSpec(lesson: { title: string; content: string }): MediaSpec {
  return {
    type: "IMAGE",
    purpose: "concept_illustration",
    title: lesson.title.slice(0, 80),
    description: "Ilustración conceptual de la lección",
    visualPrompt: `Educational illustration about "${lesson.title.slice(0, 80)}", clean professional style, high detail, cinematic lighting, no text overlays`,
    confidence: 0.5,
    reasoning: "Fallback: no specific media type detected",
    needed: true,
  };
}