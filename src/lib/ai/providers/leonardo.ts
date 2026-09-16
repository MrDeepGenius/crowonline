import type {
  GeneratedAsset,
  ImageGenerationOptions,
  MultimediaProvider,
} from "@/lib/ai/types";

/**
 * Leonardo.ai — multimedia provider for cover art and lesson illustrations.
 * Activated only when LEONARDO_API_KEY is present; otherwise the CROW
 * placeholder generator (deterministic gradient covers) is used.
 */
export class LeonardoProvider implements MultimediaProvider {
  readonly id = "leonardo";
  readonly label = "Leonardo";
  private readonly baseUrl: string;
  private readonly modelId: string;

  constructor(
    baseUrl = process.env.LEONARDO_BASE_URL ??
      "https://cloud.leonardo.ai/api/rest/v1",
    modelId = process.env.LEONARDO_MODEL_ID ?? "b24e16ff-06e3-43eb-8d33-4416c2d75876",
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.modelId = modelId;
  }

  isConfigured(): boolean {
    return Boolean(process.env.LEONARDO_API_KEY);
  }

  async generateImage(
    prompt: string,
    options: ImageGenerationOptions = {},
  ): Promise<GeneratedAsset> {
    const apiKey = process.env.LEONARDO_API_KEY;
    if (!apiKey) {
      throw new Error("LEONARDO_API_KEY is not configured");
    }

    const create = await fetch(`${this.baseUrl}/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: `${prompt}, premium dark violet SaaS aesthetic, cinematic lighting`,
        modelId: this.modelId,
        width: options.width ?? 1024,
        height: options.height ?? 640,
        num_images: options.count ?? 1,
      }),
    });

    if (!create.ok) {
      const detail = await create.text();
      throw new Error(
        `Leonardo request failed (${create.status}): ${detail.slice(0, 300)}`,
      );
    }

    const created = (await create.json()) as {
      sdGenerationJob?: { generationId?: string };
    };
    const generationId = created.sdGenerationJob?.generationId;
    if (!generationId) {
      throw new Error("Leonardo did not return a generation id");
    }

    // Leonardo renders asynchronously — poll a few times before giving up.
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const poll = await fetch(
        `${this.baseUrl}/generations/${generationId}`,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );
      if (!poll.ok) continue;
      const data = (await poll.json()) as {
        generations_by_pk?: { generated_images?: { url?: string }[] };
      };
      const url = data.generations_by_pk?.generated_images?.[0]?.url;
      if (url) {
        return { url, provider: this.id, prompt, kind: "IMAGE" };
      }
    }

    throw new Error("Leonardo generation timed out");
  }
}