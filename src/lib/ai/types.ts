/**
 * AI provider contracts. Every provider is optional: if its API key is not
 * configured the platform keeps working through the CROW demo engine, which
 * produces a complete, deterministic blueprint from the creator's idea.
 *
 * API keys are ONLY read from environment variables.
 */

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type CompletionOptions = {
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  signal?: AbortSignal;
};

export type AICompletion = {
  text: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
};

export interface AIProvider {
  readonly id: string;
  readonly label: string;
  readonly model: string;
  isConfigured(): boolean;
  complete(
    messages: ChatMessage[],
    options?: CompletionOptions,
  ): Promise<AICompletion>;
}

export type ImageGenerationOptions = {
  width?: number;
  height?: number;
  count?: number;
};

export type GeneratedAsset = {
  url: string;
  provider: string;
  prompt: string;
  kind: "IMAGE" | "PLACEHOLDER";
};

export interface MultimediaProvider {
  readonly id: string;
  readonly label: string;
  isConfigured(): boolean;
  generateImage(
    prompt: string,
    options?: ImageGenerationOptions,
  ): Promise<GeneratedAsset>;
}

export const SYSTEM_PROMPT = `Eres CROW Studio, el motor de producto de CROW MARKET.
Conviertes una idea en un infoproducto vendible: cursos, ebooks, PDFs, webs interactivas y kits de recursos.
Reglas:
- Responde SIEMPRE con JSON válido cuando se te pida JSON, sin markdown ni comentarios.
- Escribe en español neutro, claro y premium. Nada de relleno genérico.
- Propón estructura real: módulos, lecciones, ejercicios y recursos accionables.
- Ajusta el precio sugerido al mercado digital: entre 9 y 199 USDT.
- Sé concreto en la promesa: resultado medible, no promesas vacías.`;