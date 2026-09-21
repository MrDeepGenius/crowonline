/**
 * CROW — Video provider abstraction.
 *
 * Independent from `generateImage()` / `MultimediaProvider` on purpose:
 * images (Leonardo text-to-image) and videos (Leonardo image-to-video)
 * have different lifecycles, quotas and failure modes, and the video
 * provider must be swappable in the future without touching Creator Studio.
 *
 * Contract:
 *   VideoProvider
 *   - generateVideo()  → start a job, resolves with { generationId }
 *                        (async providers MUST NOT block waiting for the URL)
 *   - getVideoStatus() → poll a job, resolves with { status, videoUrl? }
 *   - cancelVideo()?   → optional, only if the provider supports it
 *
 * Current provider: Leonardo.ai image-to-video (Motion).
 * Official docs:
 *   POST https://cloud.leonardo.ai/api/rest/v1/generations-image-to-video
 *   "This endpoint will generate a video using an uploaded or generated image."
 *   (docs.leonardo.ai/reference/createimagetovideogeneration)
 * Result is read back from GET /generations/{generationId} →
 *   generations_by_pk.generated_images[0].motionMP4URL
 *
 * API key lives ONLY in env (LEONARDO_API_KEY). Never hardcoded.
 * If no key is configured, `getVideoProvider()` returns null and callers
 * MUST surface "Proveedor de video no configurado." — never fake URLs.
 */

export type VideoStatus = "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";

export const VIDEO_STATUSES: VideoStatus[] = [
  "PENDING",
  "GENERATING",
  "COMPLETED",
  "FAILED",
];

export type VideoSource = "AI" | "CREATOR";

export type StartVideoJob = {
  /** Leonardo imageId (generated_images[].id) used as the motion source. */
  imageId: string;
  imageType?: "GENERATED" | "UPLOADED";
  prompt: string;
  /** Seconds requested by the creator (provider clamps to what it supports). */
  durationSec?: number;
  style?: string;
};

export type VideoJobState = {
  status: VideoStatus;
  /** Real, playable URL — only present when status === COMPLETED. */
  videoUrl?: string | null;
  providerJobId?: string;
};

export interface VideoProvider {
  readonly id: string;
  readonly label: string;
  /** True only when credentials are present in env. */
  isConfigured(): boolean;
  /** Starts an async job. Resolves fast with the provider job id. */
  generateVideo(job: StartVideoJob): Promise<{ generationId: string }>;
  /** Reads the current state of a job. Never throws for unknown ids — returns FAILED. */
  getVideoStatus(generationId: string): Promise<VideoJobState>;
  /**
   * Resolves a concrete image id from an image generation id.
   * Leonardo image-to-video requires the generated_images[].id, not the
   * generation id — callers use this when only the generation id was stored.
   */
  resolveImageId?(imageGenerationId: string): Promise<string | null>;
  /** Optional — providers that support cancellation implement it. */
  cancelVideo?(generationId: string): Promise<void>;
}

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

/**
 * Leonardo.ai implementation of VideoProvider.
 * Uses ONLY the official image-to-video endpoint. No invented endpoints.
 */
export class LeonardoVideoProvider implements VideoProvider {
  readonly id = "leonardo";
  readonly label = "Leonardo";
  private readonly baseUrl: string;

  constructor(
    baseUrl = env("LEONARDO_BASE_URL") ?? "https://cloud.leonardo.ai/api/rest/v1",
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  isConfigured(): boolean {
    return Boolean(env("LEONARDO_API_KEY"));
  }

  async generateVideo(job: StartVideoJob): Promise<{ generationId: string }> {
    const apiKey = env("LEONARDO_API_KEY");
    if (!apiKey) throw new Error("LEONARDO_API_KEY is not configured");

    const createRes = await fetch(`${this.baseUrl}/generations-image-to-video`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        imageId: job.imageId,
        imageType: job.imageType ?? "GENERATED",
        isPublic: false,
        resolution: "RESOLUTION_720",
        prompt: job.prompt.slice(0, 1000),
        frameInterpolation: true,
        promptEnhance: false,
      }),
    });

    if (!createRes.ok) {
      const detail = await createRes.text();
      throw new Error(
        `Leonardo video request failed (${createRes.status}): ${detail.slice(0, 300)}`,
      );
    }

    const created = (await createRes.json()) as {
      sdGenerationJob?: { generationId?: string };
      motionVideoGenerationJob?: { generationId?: string };
    };
    // Image-to-video returns motionVideoGenerationJob (NOT sdGenerationJob).
    const generationId =
      created.motionVideoGenerationJob?.generationId ?? created.sdGenerationJob?.generationId;
    if (!generationId) throw new Error("Leonardo did not return a video generationId");
    return { generationId };
  }

  async getVideoStatus(generationId: string): Promise<VideoJobState> {
    const apiKey = env("LEONARDO_API_KEY");
    if (!apiKey) return { status: "FAILED" };

    let poll: Response;
    try {
      poll = await fetch(`${this.baseUrl}/generations/${generationId}`, {
        headers: { accept: "application/json", Authorization: `Bearer ${apiKey}` },
      });
    } catch {
      // Transient network error — caller retries later via reconcile.
      return { status: "GENERATING", providerJobId: generationId };
    }
    if (!poll.ok) {
      if (poll.status === 404) return { status: "FAILED", providerJobId: generationId };
      return { status: "GENERATING", providerJobId: generationId };
    }

    const data = (await poll.json()) as {
      generations_by_pk?: {
        status?: string;
        generated_images?: { motionMP4URL?: string | null; url?: string }[];
      } | null;
    };
    // Unknown job id (deleted/never existed) → FAILED so reconcile stops.
    if (!data.generations_by_pk) return { status: "FAILED", providerJobId: generationId };
    const status = data.generations_by_pk?.status;
    const videoUrl = data.generations_by_pk?.generated_images?.[0]?.motionMP4URL ?? null;

    if (videoUrl && isHttpUrl(videoUrl)) {
      return { status: "COMPLETED", videoUrl, providerJobId: generationId };
    }
    if (status === "FAILED") return { status: "FAILED", providerJobId: generationId };
    // PENDING | COMPLETE (image ready, video still rendering) → keep polling.
    return {
      status: generationId ? "GENERATING" : "PENDING",
      providerJobId: generationId,
    };
  }

  /**
   * GET /generations/{imageGenerationId} → generated_images[0].id.
   * Returns null when the generation has no concrete image yet.
   */
  async resolveImageId(imageGenerationId: string): Promise<string | null> {
    const apiKey = env("LEONARDO_API_KEY");
    if (!apiKey) return null;
    try {
      const res = await fetch(`${this.baseUrl}/generations/${imageGenerationId}`, {
        headers: { accept: "application/json", Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        generations_by_pk?: { generated_images?: { id?: string }[] };
      };
      return data.generations_by_pk?.generated_images?.[0]?.id ?? null;
    } catch {
      return null;
    }
  }
}

/** Singleton + registry. Add future providers here without touching callers. */
const leonardoVideo = new LeonardoVideoProvider();

export function getVideoProvider(): VideoProvider | null {
  return leonardoVideo.isConfigured() ? leonardoVideo : null;
}

export function videoProviderStatus() {
  return {
    id: leonardoVideo.id,
    label: leonardoVideo.label,
    configured: leonardoVideo.isConfigured(),
    endpoint: "POST /generations-image-to-video (api.rest.v1)",
  };
}

// ─── Quality gate (spec §14) ────────────────────────────────────────────────

/** A video only counts as COMPLETED when every field below holds. */
export function isVideoCompleted(lesson: {
  videoGenerationId?: string | null;
  videoProvider?: string | null;
  videoGenerationStatus?: string | null;
  videoUrl?: string | null;
}): boolean {
  return (
    Boolean(lesson.videoGenerationId) &&
    Boolean(lesson.videoProvider) &&
    lesson.videoGenerationStatus === "COMPLETED" &&
    Boolean(lesson.videoUrl) &&
    isHttpUrl(lesson.videoUrl ?? "")
  );
}

export function isHttpUrl(url: string): boolean {
  return /^https?:\/\/.+\..+/.test(url.trim());
}
