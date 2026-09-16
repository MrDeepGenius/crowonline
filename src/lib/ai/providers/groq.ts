import {
  SYSTEM_PROMPT,
  type AICompletion,
  type AIProvider,
  type ChatMessage,
  type CompletionOptions,
} from "@/lib/ai/types";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Groq — fast conversational provider used by the Creator Studio chat.
 * Configure with GROQ_API_KEY (and optionally GROQ_MODEL).
 */
export class GroqProvider implements AIProvider {
  readonly id = "groq";
  readonly label = "Groq";
  readonly model: string;

  constructor(model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile") {
    this.model = model;
  }

  isConfigured(): boolean {
    return Boolean(process.env.GROQ_API_KEY);
  }

  async complete(
    messages: ChatMessage[],
    options: CompletionOptions = {},
  ): Promise<AICompletion> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: withSystem(messages),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        ...(options.json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Groq request failed (${response.status}): ${detail.slice(0, 300)}`);
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    return {
      text: payload.choices?.[0]?.message?.content?.trim() ?? "",
      provider: this.id,
      model: this.model,
      usage: {
        promptTokens: payload.usage?.prompt_tokens,
        completionTokens: payload.usage?.completion_tokens,
      },
    };
  }
}

export function withSystem(messages: ChatMessage[]): ChatMessage[] {
  if (messages.some((message) => message.role === "system")) return messages;
  return [{ role: "system", content: SYSTEM_PROMPT }, ...messages];
}