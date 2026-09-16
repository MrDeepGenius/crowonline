import { buildBlueprintPrompt, extractJson, parseBlueprint, type ProductBlueprint } from "@/lib/ai/blueprint";
import { askProviders } from "@/lib/ai/providers";

export type AssistantResult = {
  reply: string;
  blueprint: ProductBlueprint;
  provider: string;
  mode: "live" | "demo";
};

export function mergeBlueprint(
  current: ProductBlueprint,
  patch: Partial<ProductBlueprint>,
): ProductBlueprint {
  const merged = { ...current, ...patch };
  if (Array.isArray(patch.modules) && patch.modules.length) {
    merged.modules = patch.modules;
  }
  const parsed = parseBlueprint(merged);
  return parsed ?? current;
}

function demoReply(message: string, blueprint: ProductBlueprint): AssistantResult["reply"] {
  const lower = message.toLowerCase();
  const hints: string[] = [];

  if (lower.includes("precio") || lower.includes("cobrar") || lower.includes("vender")) {
    hints.push(
      `Revisa el precio en función del valor entregado. Para este blueprint sugiero mantener ${blueprint.recommendedPriceUsdt} USDT como precio base y probar un cupón de lanzamiento del 30% durante 7 días.`,
    );
  }
  if (lower.includes("módulo") || lower.includes("modulo") || lower.includes("estructura")) {
    hints.push(
      `La estructura actual tiene ${blueprint.modules.length} módulos. Un cierre fuerte suele necesitar un módulo final de "Plan de acción y siguientes pasos" con una lección de implementación guiada.`,
    );
  }
  if (lower.includes("ejercicio") || lower.includes("práctica") || lower.includes("practica")) {
    hints.push(
      "Cada lección debería terminar con un ejercicio que produzca un entregable visible: una plantilla rellenada, una landing escrita o una campaña configurada.",
    );
  }
  if (lower.includes("vender") || lower.includes("marketing") || lower.includes("afiliad")) {
    hints.push(
      "Para distribuirlo: publica el módulo 1 como preview gratuito, activa afiliados con 30% directo y L1-L5, y usa un webinar mensual como captación.",
    );
  }
  if (!hints.length) {
    hints.push(
      "Ahora mismo no hay proveedor de IA conectado, así que estoy usando el motor de recomendaciones de CROW. Configura GROQ_API_KEY (o NVIDIA_API_KEY) para conversar con el modelo en vivo.",
    );
    hints.push(
      `Sobre "${blueprint.title}": refuerza la promesa con un resultado medible y define el primer entregable del alumno en las primeras 24 horas.`,
    );
  }

  return hints.join("\n\n");
}

/**
 * Conversational Studio: the assistant answers and returns the updated
 * blueprint so the Live Product Blueprint panel can re-render instantly.
 */
export async function chatAboutBlueprint({
  message,
  blueprint,
}: {
  message: string;
  blueprint: ProductBlueprint;
}): Promise<AssistantResult> {
  const instructions = `Eres el asistente del Creator Studio de CROW MARKET.
El creator conversa contigo para mejorar su producto digital.

BLUEPRINT ACTUAL (JSON):
${JSON.stringify(blueprint).slice(0, 12000)}

MENSAJE DEL CREATOR: "${message}"

Responde EXCLUSIVAMENTE con un JSON con esta forma:
{
  "reply": string (respuesta breve y accionable en español, 2-4 párrafos máximo, sin markdown),
  "blueprint": el blueprint completo actualizado (misma estructura que el actual; si no hay cambios, devuélvelo idéntico)
}

Reglas:
- Si el creator pide cambios de estructura, precio o contenido, aplícalos en "blueprint".
- No inventes campos nuevos fuera de la estructura.`;

  const answer = await askProviders([{ role: "user", content: instructions }], {
    temperature: 0.6,
    maxTokens: 4096,
    json: true,
  });

  if (answer) {
    const json = extractJson(answer.text) as
      | { reply?: string; blueprint?: unknown }
      | null;
    if (json) {
      const next = parseBlueprint(json.blueprint) ?? blueprint;
      return {
        reply: json.reply?.trim() || "Blueprint actualizado.",
        blueprint: next,
        provider: answer.provider,
        mode: "live",
      };
    }
  }

  return {
    reply: demoReply(message, blueprint),
    blueprint,
    provider: "crow-demo",
    mode: "demo",
  };
}

/** Used by the "mejorar automáticamente" action inside the Studio. */
export async function improveBlueprint(
  blueprint: ProductBlueprint,
): Promise<AssistantResult> {
  return chatAboutBlueprint({
    message:
      "Refuerza la estructura y la promesa de este producto: mejora el título si es genérico, añade un módulo final de plan de acción y asegura que cada lección tenga un ejercicio con entregable.",
    blueprint,
  });
}

export function studioPromptPreview(idea: string) {
  return buildBlueprintPrompt(idea);
}