import { GroqProvider } from "@/lib/ai/providers/groq";
import { LeonardoProvider } from "@/lib/ai/providers/leonardo";
import { NvidiaProvider } from "@/lib/ai/providers/nvidia";
import type {
  AIProvider,
  ChatMessage,
  MultimediaProvider,
} from "@/lib/ai/types";

const groq = new GroqProvider();
const nvidia = new NvidiaProvider();
const leonardo = new LeonardoProvider();

/**
 * Provider registry — ordered by preference.
 * If none is configured, callers fall back to the CROW demo engine.
 */
export function listConversationalProviders(): AIProvider[] {
  return [groq, nvidia];
}

export function getConfiguredProvider(): AIProvider | null {
  return listConversationalProviders().find((provider) => provider.isConfigured()) ?? null;
}

export function getMultimediaProvider(): MultimediaProvider | null {
  return leonardo.isConfigured() ? leonardo : null;
}

export function providerStatus() {
  return {
    conversational: listConversationalProviders().map((provider) => ({
      id: provider.id,
      label: provider.label,
      model: provider.model,
      configured: provider.isConfigured(),
    })),
    multimedia: {
      id: leonardo.id,
      label: leonardo.label,
      configured: leonardo.isConfigured(),
    },
  };
}

export type ProviderAttempt = {
  provider: string;
  ok: boolean;
  error?: string;
};

export type ProviderAnswer = {
  text: string;
  provider: string;
  model: string;
  attempts: ProviderAttempt[];
  mode: "live" | "skeleton";
};

/**
 * Tries every configured provider in order and returns the first answer.
 * Returns `null` when no provider is configured or all of them fail, so the
 * caller can decide the fallback (CROW demo engine).
 */
export async function askProviders(
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number; json?: boolean } = {},
): Promise<ProviderAnswer | null> {
  const providers = listConversationalProviders();
  const attempts: ProviderAttempt[] = [];

  for (const provider of providers) {
    if (!provider.isConfigured()) {
      attempts.push({ provider: provider.id, ok: false, error: "not configured" });
      continue;
    }
    try {
      const completion = await provider.complete(messages, options);
      if (!completion.text) {
        attempts.push({ provider: provider.id, ok: false, error: "empty response" });
        continue;
      }
      attempts.push({ provider: provider.id, ok: true });
      return {
        text: completion.text,
        provider: completion.provider,
        model: completion.model,
        attempts,
        mode: "live",
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "unknown error";
      attempts.push({ provider: provider.id, ok: false, error: msg });
      console.error(`[askProviders] ${provider.id} ERROR: ${msg}`);
    }
  }

  return null;
}

export { groq, nvidia, leonardo };
export type { AIProvider, MultimediaProvider, ChatMessage };