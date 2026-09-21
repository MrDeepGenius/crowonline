/**
 * Derives a visual image prompt from a lesson's title and content.
 *
 * Generic — works for any course topic (marketing, law, fitness, code, etc.).
 * Pure function: no DB access, no network calls.
 *
 * Rules:
 * - Returns null when a lesson clearly doesn't benefit from an image
 *   (pure-text concepts, short intros, evaluations, farewells).
 * - Returns a prompt string when the lesson is conceptual, procedural,
 *   or practical enough to be illustrated.
 * - Prompt is always in English for Leonardo (better model coverage).
 * - Prompt is specific to the lesson topic, not generic.
 */

/** Minimum content length to bother generating an image. */
const MIN_CONTENT_LENGTH = 120;

/**
 * Patterns that indicate a lesson is unlikely to benefit from an image.
 * Matched against the lowercased title.
 */
const SKIP_PATTERNS = [
  /^(bienvenid|welcome|introducci[oó]n al curso|presentaci[oó]n|¿qu[eé] ver[eé]mos)/i,
  /evaluaci[oó]n final/i,
  /examen\s+(final|parcial)/i,
  /despedida|cierre del curso|hasta (pronto|luego)/i,
  /quiz\s*\d+/i,
];

/**
 * Topic keywords → visual context descriptors.
 * Each entry maps a topic pattern to a list of visual concepts.
 * Used to make prompts more specific without being domain-locked.
 */
const TOPIC_VISUAL_MAP: Array<[RegExp, string]> = [
  // Law / crime / forensics
  [/criminalíst|forense|evidenci|escena del|custodia|balíst|dactilos|huell|cadena de|dictamen/i,
    "forensic science, crime scene investigation, evidence analysis, professional documentation"],
  [/criminolog|delito|crimen|investigaci[oó]n criminal|reconstru/i,
    "criminal investigation, detective work, legal evidence, law enforcement"],
  // Medicine / health / biology
  [/anatomía|fisiolog|diagnóstic|enfermedad|patolog|clínic|cirugía|farmac|salud|médic/i,
    "medical science, healthcare professional, clinical environment, educational diagram"],
  [/nutrici[oó]n|dieta|aliment|vitamina|metabol/i,
    "nutrition science, healthy food, body metabolism, educational infographic"],
  // Finance / economics
  [/finanza|contabilidad|balance|presupuest|inversión|bolsa|acciones|mercado|econom/i,
    "finance and economics, charts and graphs, professional business environment"],
  [/impuesto|tribut|fiscal|declaraci[oó]n/i,
    "tax documentation, financial paperwork, accounting office"],
  // Marketing / business
  [/marketing|ventas|embudo|campaña|anuncio|publicidad|branding|cliente/i,
    "digital marketing, sales funnel, business growth, professional presentation"],
  [/emprend|startup|negocio|empresa|estrategia|liderazgo|gesti[oó]n/i,
    "business strategy, entrepreneurship, team collaboration, professional setting"],
  // Technology / programming
  [/programaci[oó]n|código|software|algoritmo|desarrollo|frontend|backend|base de datos/i,
    "software development, coding screen, technology workspace, digital interface"],
  [/inteligencia artificial|machine learning|ia\b|redes neurona|modelo|dataset/i,
    "artificial intelligence, neural network visualization, data science, technology"],
  [/ciberseguridad|hacking|seguridad inform|vulnerabilidad|encrypt/i,
    "cybersecurity, digital protection, network security, technology shield"],
  // Design / creativity
  [/diseño|ilustraci[oó]n|gráfic|tipografía|color|composici[oó]n|ui\b|ux\b/i,
    "graphic design, creative workspace, design tools, color palette, visual art"],
  [/fotografía|cámara|iluminaci[oó]n|encuadre|retoque/i,
    "photography, professional camera, studio lighting, composition technique"],
  // Fitness / sports
  [/ejercicio|entrena|fitness|deporte|musculación|cardio|yoga|pilates/i,
    "fitness training, athletic exercise, professional sport, body movement"],
  [/nutrici[oó]n deportiva|suplemento|rendimiento físico/i,
    "sports nutrition, athletic performance, healthy lifestyle"],
  // Languages / communication
  [/gramática|vocabulario|pronunciaci[oó]n|idioma|inglés|francés|alemán|escritura/i,
    "language learning, communication, books and words, educational classroom"],
  [/oratoria|comunicaci[oó]n|discurso|presentaci[oó]n oral|público/i,
    "public speaking, professional presentation, confident communication"],
  // Education / psychology
  [/aprendizaje|memoria|cognitiv|psicolog|emocion|comportamiento|motivaci[oó]n/i,
    "psychology and learning, human mind, educational environment, cognitive science"],
  // Science / math
  [/física|química|biología|matemática|cálculo|álgebra|estadística|probabilidad/i,
    "science education, laboratory, mathematical concepts, scientific diagram"],
  // History / social
  [/historia|evolución|origen|revolución|guerra|civil|sociedad|cultura/i,
    "historical education, timeline, cultural heritage, documentary style"],
  // Generic procedural / conceptual fallback
  [/principio|fundamento|concepto|método|técnica|proceso|procedimiento|protocolo/i,
    "educational concept, professional methodology, step-by-step process diagram"],
  [/ética|profesional|integridad|responsabilidad|norma|código de/i,
    "professional ethics, integrity, workplace standards, responsibility"],
  [/caso práctico|caso de estudio|ejemplo real|aplicaci[oó]n práctica/i,
    "real-world case study, practical application, professional scenario"],
  [/error|mistake|problema|falla|corrección|prevención/i,
    "problem solving, error prevention, quality control, professional analysis"],
  [/resumen|conclusi[oó]n|integrac|cierre de módulo/i,
    "knowledge summary, learning conclusions, educational review, mind map"],
];

/** Default visual context when no topic match is found. */
const DEFAULT_VISUAL = "educational professional concept, learning environment, knowledge visualization";

/**
 * Extract a short, clean description of the lesson topic from its content.
 * Uses the first meaningful sentence or heading found.
 */
function extractTopicSnippet(content: string): string {
  // Try to get first heading (markdown ## or #)
  const headingMatch = content.match(/^#{1,3}\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim().slice(0, 80);

  // First non-empty line that isn't a markdown token
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (line.startsWith("#") || line.startsWith("|") || line.startsWith("```")) continue;
    const clean = line.replace(/[*_`]/g, "").trim();
    if (clean.length > 30) return clean.slice(0, 80);
  }

  return "";
}

/**
 * Derives the most relevant visual context for a lesson topic.
 */
function visualContextFor(title: string, content: string): string {
  const combined = `${title} ${content.slice(0, 600)}`;
  for (const [pattern, context] of TOPIC_VISUAL_MAP) {
    if (pattern.test(combined)) return context;
  }
  return DEFAULT_VISUAL;
}

/**
 * Determines whether a lesson should have an image generated.
 * Returns false for lessons that clearly don't benefit from imagery.
 */
export function lessonNeedsImage(title: string, content: string): boolean {
  if (content.length < MIN_CONTENT_LENGTH) return false;
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(title)) return false;
  }
  return true;
}

/**
 * Derives a visual image prompt in English from a lesson's title and content.
 * Returns null if the lesson doesn't benefit from an image.
 *
 * @param title   The lesson title (any language)
 * @param content The lesson content in markdown (any language)
 * @returns       An English prompt string for Leonardo, or null to skip
 */
export function deriveImagePrompt(title: string, content: string): string | null {
  if (!lessonNeedsImage(title, content)) return null;

  const topicSnippet = extractTopicSnippet(content);
  const visualContext = visualContextFor(title, content);

  // Build a specific prompt: topic + visual context + style
  const topicPart = topicSnippet
    ? `${title} — ${topicSnippet}`
    : title;

  // Truncate title to avoid overly long prompts
  const truncated = topicPart.slice(0, 120);

  return (
    `Educational illustration about "${truncated}", ` +
    `${visualContext}, ` +
    `clean professional style, high detail, cinematic lighting, no text overlays`
  );
}
