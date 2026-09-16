import { withSystem } from "@/lib/ai/providers/groq";
import type {
  AICompletion,
  AIProvider,
  ChatMessage,
  CompletionOptions,
} from "@/lib/ai/types";

/**
 * NVIDIA NIM — alternative reasoning provider.
 * Prepared for NVDIA/OpenAI-compatible endpoints; used automatically when
 * GROQ is unavailable but NVIDIA_API_KEY exists.
 */
export class NvidiaProvider implements AIProvider {
  readonly id = "nvidia";
  readonly label = "NVIDIA";
  readonly model: string;
  private readonly baseUrl: string;

  constructor(
    model = process.env.NVIDIA_MODEL ?? "meta/llama-3.1-70b-instruct",
    baseUrl = process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1",
  ) {
    this.model = model;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  isConfigured(): boolean {
    return Boolean(process.env.NVIDIA_API_KEY);
  }

  async complete(
    messages: ChatMessage[],
    options: CompletionOptions = {},
  ): Promise<AICompletion> {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      throw new Error("NVIDIA_API_KEY is not configured");
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: withSystem(messages),
        temperature: options.temperature ?? 0.6,
        max_tokens: options.maxTokens ?? 4096,
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `NVIDIA request failed (${response.status}): ${detail.slice(0, 300)}`,
      );
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