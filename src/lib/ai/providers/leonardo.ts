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
  ): Promise<GeneratedAsset & { generationId: string }> {
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

    // Poll up to 20 times with 2s intervals (~40s max) — Leonardo can be slow.
    const url = await this.pollForResult(generationId, apiKey, 20, 2000);
    if (!url) {
      throw new Error(`Leonardo generation timed out (generationId: ${generationId})`);
    }

    return { url, provider: this.id, prompt, kind: "IMAGE", generationId };
  }

  /** Kick off a generation and return generationId immediately (non-blocking). */
  async startGeneration(
    prompt: string,
    options: ImageGenerationOptions = {},
  ): Promise<string> {
    const apiKey = process.env.LEONARDO_API_KEY;
    if (!apiKey) throw new Error("LEONARDO_API_KEY is not configured");

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
      throw new Error(`Leonardo request failed (${create.status}): ${detail.slice(0, 300)}`);
    }

    const created = (await create.json()) as {
      sdGenerationJob?: { generationId?: string };
    };
    const generationId = created.sdGenerationJob?.generationId;
    if (!generationId) throw new Error("Leonardo did not return a generation id");
    return generationId;
  }

  /** Poll until completed or exhausted. Returns URL or null. */
  async pollForResult(
    generationId: string,
    apiKey?: string,
    maxAttempts = 20,
    intervalMs = 2000,
  ): Promise<string | null> {
    const key = apiKey ?? process.env.LEONARDO_API_KEY;
    if (!key) throw new Error("LEONARDO_API_KEY is not configured");

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      try {
        const poll = await fetch(`${this.baseUrl}/generations/${generationId}`, {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${key}`,
          },
        });
        if (!poll.ok) continue;
        const data = (await poll.json()) as {
          generations_by_pk?: {
            status?: string;
            generated_images?: { url?: string }[];
          };
        };
        const status = data.generations_by_pk?.status;
        const url = data.generations_by_pk?.generated_images?.[0]?.url;
        if (url) return url;
        // If status is FAILED stop early
        if (status === "FAILED") return null;
      } catch {
        // network error — continue polling
        continue;
      }
    }
    return null;
  }

  /**
   * Generates a video from an existing Leonardo image using Motion 2.0.
   * Requires the imageId returned by Leonardo when the image was created
   * (stored as Lesson.imageGenerationId after polling gives back the image).
   *
   * Returns: { videoUrl, generationId } or throws.
   *
   * The video generation job is async — we poll until the motionMP4URL
   * field is populated in the generated_images record.
   */
  async generateVideo(opts: {
    imageId: string;
    imageType?: "GENERATED" | "UPLOADED";
    prompt: string;
    resolution?: "RESOLUTION_480" | "RESOLUTION_720";
  }): Promise<{ videoUrl: string; generationId: string }> {
    const apiKey = process.env.LEONARDO_API_KEY;
    if (!apiKey) throw new Error("LEONARDO_API_KEY is not configured");

    const { imageId, imageType = "GENERATED", prompt, resolution = "RESOLUTION_720" } = opts;

    // Use the v1 image-to-video endpoint which accepts a generated imageId directly
    const createRes = await fetch(`${this.baseUrl}/generations-image-to-video`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        imageId,
        imageType,
        isPublic: false,
        resolution,
        prompt,
        frameInterpolation: true,
        promptEnhance: false,
      }),
    });

    if (!createRes.ok) {
      const detail = await createRes.text();
      throw new Error(`Leonardo video request failed (${createRes.status}): ${detail.slice(0, 300)}`);
    }

    const created = (await createRes.json()) as {
      sdGenerationJob?: { generationId?: string };
    };
    const generationId = created.sdGenerationJob?.generationId;
    if (!generationId) throw new Error("Leonardo did not return a video generationId");

    // Poll for motionMP4URL — same polling endpoint as images, but we read motionMP4URL
    const videoUrl = await this.pollForVideoResult(generationId, apiKey);
    if (!videoUrl) {
      throw new Error(`Leonardo video generation timed out (generationId: ${generationId})`);
    }

    return { videoUrl, generationId };
  }

  /**
   * Starts a video generation job and returns the generationId immediately.
   * Use pollForVideoResult() separately to get the final URL.
   */
  async startVideoGeneration(opts: {
    imageId: string;
    imageType?: "GENERATED" | "UPLOADED";
    prompt: string;
    resolution?: "RESOLUTION_480" | "RESOLUTION_720";
  }): Promise<string> {
    const apiKey = process.env.LEONARDO_API_KEY;
    if (!apiKey) throw new Error("LEONARDO_API_KEY is not configured");

    const { imageId, imageType = "GENERATED", prompt, resolution = "RESOLUTION_720" } = opts;

    const createRes = await fetch(`${this.baseUrl}/generations-image-to-video`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        imageId,
        imageType,
        isPublic: false,
        resolution,
        prompt,
        frameInterpolation: true,
        promptEnhance: false,
      }),
    });

    if (!createRes.ok) {
      const detail = await createRes.text();
      throw new Error(`Leonardo video request failed (${createRes.status}): ${detail.slice(0, 300)}`);
    }

    const created = (await createRes.json()) as {
      sdGenerationJob?: { generationId?: string };
      motionVideoGenerationJob?: { generationId?: string };
    };
    // Image-to-video returns motionVideoGenerationJob (NOT sdGenerationJob).
    const generationId =
      created.motionVideoGenerationJob?.generationId ?? created.sdGenerationJob?.generationId;
    if (!generationId) throw new Error("Leonardo did not return a video generationId");
    return generationId;
  }

  /**
   * Polls for a video generation result.
   * Leonardo stores the video URL in generated_images[0].motionMP4URL
   * once the generation completes.
   */
  async pollForVideoResult(
    generationId: string,
    apiKey?: string,
    maxAttempts = 30,
    intervalMs = 3000,
  ): Promise<string | null> {
    const key = apiKey ?? process.env.LEONARDO_API_KEY;
    if (!key) throw new Error("LEONARDO_API_KEY is not configured");

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      try {
        const poll = await fetch(`${this.baseUrl}/generations/${generationId}`, {
          headers: { accept: "application/json", Authorization: `Bearer ${key}` },
        });
        if (!poll.ok) continue;

        const data = (await poll.json()) as {
          generations_by_pk?: {
            status?: string;
            generated_images?: { motionMP4URL?: string | null; url?: string }[];
          };
        };

        const status = data.generations_by_pk?.status;
        const img = data.generations_by_pk?.generated_images?.[0];
        const videoUrl = img?.motionMP4URL;

        if (videoUrl) return videoUrl;
        if (status === "FAILED") return null;
      } catch {
        continue;
      }
    }
    return null;
  }
}