/**
 * CROW — automatic video decision + prompt derivation (spec §4, §10).
 *
 * - Not every lesson deserves a video. Demonstrations, procedures,
 *   tutorials and complex explanations benefit; simple concepts may not.
 * - The creator's explicit preference ALWAYS wins:
 *     "todas" → all lessons · "ninguna" → none · "prácticas" → practical only.
 */

export type VideoPreference = "all" | "none" | "practical" | "auto";

const PRACTICAL_HINTS =
  /demostra|demostración|procedim|tutorial|paso a paso|práctic|practic|ejercicio|caso|ejemplo|técnica|forense|levantamiento|huella|escena|análisis|configura|instala|código|programa|diseño|maquill|entrena|cocina|repara|construye|dibuja|toca|baila|yoga|fitness/i;

const COMPLEX_HINTS =
  /complej|avanzad|profund|detalle|mecanismo|proceso|sistema|teoría|concepto clave|fundamento|estrategia|arquitectura|algoritmo|anatomía|fisiología|química|física|matemát/i;

const SIMPLE_HINTS =
  /introducción|bienvenida|presentación|qué es|definición breve|glosario|resumen|conclusión|cierre|despedida|índice|overview/i;

export function parseVideoPreference(message: string): VideoPreference | null {
  const lower = message.toLowerCase();
  const mentionsVideo = /video|vídeo|filme|visual|motion/.test(lower);
  if (!mentionsVideo) return null;

  if (/sin videos|no quiero videos|ningún video|ningun video|sin vídeo|no videos|omite|omitir/.test(lower))
    return "none";
  if (/todas|todos|cada lección|todas las lecciones|completo/.test(lower)) return "all";
  if (/práctic|practic|tutorial|demostra|procedim|hands-on|manos/.test(lower)) return "practical";
  // "quiero videos" without scope → practical-first auto (cost control), NOT all.
  return "auto";
}

export type LessonForDecision = { title: string; content?: string | null };

/** Heuristic: does this lesson really benefit from a video? */
export function shouldRecommendVideo(lesson: LessonForDecision): boolean {
  const text = `${lesson.title}\n${lesson.content ?? ""}`;
  if (PRACTICAL_HINTS.test(text)) return true;
  if (COMPLEX_HINTS.test(text)) return true;
  if (SIMPLE_HINTS.test(text) && !PRACTICAL_HINTS.test(text)) return false;
  // Default: medium-length substantive lessons get a recommendation.
  return (lesson.content ?? "").length > 600;
}

export function applyVideoPreference(
  lessons: LessonForDecision[],
  preference: VideoPreference,
): boolean[] {
  switch (preference) {
    case "all":
      return lessons.map(() => true);
    case "none":
      return lessons.map(() => false);
    case "practical":
      return lessons.map((l) => shouldRecommendVideo(l));
    case "auto":
    default: {
      // Auto = recommended ones (cost control: NOT all lessons).
      return lessons.map((l) => shouldRecommendVideo(l));
    }
  }
}

export function countRecommendedVideos(lessons: LessonForDecision[]): number {
  return lessons.filter(shouldRecommendVideo).length;
}

/**
 * Builds the motion prompt from the REAL lesson content (§10):
 * title + objective/content + audience + style + course context.
 */
export function deriveVideoPrompt(opts: {
  title: string;
  content?: string | null;
  audience?: string | null;
  style?: string | null;
  courseTitle?: string | null;
  durationSec?: number | null;
}): string {
  const { title, content, audience, style, courseTitle, durationSec } = opts;
  const clean = (content ?? "")
    .replace(/#+\s+/g, "")
    .replace(/[*_`>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);

  const parts = [
    `Smooth cinematic educational intro for the lesson "${title}"`,
    courseTitle ? `from the course "${courseTitle}"` : "",
    clean ? `covering: ${clean}.` : ".",
    "Gentle camera movement, professional educational tone, no text overlays, no watermarks.",
    audience ? `Audience: ${audience}.` : "",
    style ? `Style: ${style}.` : "",
    durationSec ? `Duration ~${durationSec}s.` : "",
  ];
  return parts.filter(Boolean).join(" ").slice(0, 1000);
}
