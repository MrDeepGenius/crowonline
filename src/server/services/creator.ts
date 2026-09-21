import prisma from "@/lib/db";
import { buildDemoBlueprint } from "@/lib/ai/demo";
import {
  buildBlueprintPrompt,
  extractJson,
  parseBlueprint,
  qualityCheck,
  type ProductBlueprint,
} from "@/lib/ai/blueprint";
import { askProviders } from "@/lib/ai/providers";
import { runPipeline } from "@/lib/ai/pipeline";
import { createProductFromBlueprint } from "@/server/services/product-writes";
import { getCreatorPlan } from "@/lib/plans";

export type StudioGeneration = {
  blueprint: ProductBlueprint;
  provider: string;
  mode: "live" | "skeleton";
  notes: string[];
};

/**
 * IDEA → AI → BLUEPRINT (modular pipeline).
 * Tries the modular pipeline first (structure + per-module content).
 * Only falls back to skeleton when NO provider is configured or all fail.
 */
export async function generateBlueprintFromIdea(
  idea: string,
  productType?: string,
): Promise<StudioGeneration> {
  const notes: string[] = [];

  // Build a minimal spec from the idea string
  const spec = {
    topic: idea,
    productType: (productType as "COURSE" | "EBOOK" | "PDF" | "INTERACTIVE_WEB" | "RESOURCE_KIT" | undefined) ?? "COURSE",
    moduleCount: 5,
    hasImages: true,
    hasVideos: true,
    hasExercises: true,
    hasQuizzes: true,
    hasCertificate: true,
    hasResources: true,
  };

  try {
    const result = await runPipeline(spec);
    if (result && result.mode === "live") {
      notes.push(`Blueprint generado con pipeline modular (${result.provider}).`);
      notes.push(result.steps.join(" | "));
      return { blueprint: result.blueprint, provider: result.provider, mode: "live", notes };
    }
  } catch (err) {
    console.error("[creator] pipeline failed:", err);
    notes.push(`Pipeline falló: ${err instanceof Error ? err.message : "unknown error"}`);
  }

  // Fallback: try monolithic generation
  const answer = await askProviders(
    [{ role: "user", content: buildBlueprintPrompt(idea, productType) }],
    { temperature: 0.65, maxTokens: 4096, json: true },
  );

  if (answer) {
    const parsed = parseBlueprint(extractJson(answer.text));
    if (parsed) {
      notes.push(`Blueprint generado con ${answer.provider} (${answer.model}) [monolithic].`);
      return { blueprint: parsed, provider: answer.provider, mode: "live", notes };
    }
    notes.push(
      `Respuesta de ${answer.provider} no era un blueprint válido; se usó el esqueleto básico.`,
    );
  } else {
    notes.push(
      "No hay proveedor de IA configurado (GROQ_API_KEY / NVIDIA_API_KEY). Se usó el esqueleto básico.",
    );
  }

  const skeleton = buildDemoBlueprint(idea);
  return { blueprint: skeleton.blueprint, provider: "crow-skeleton", mode: "skeleton", notes };
}

export async function saveBlueprint({
  userId,
  idea,
  blueprint,
  provider,
  blueprintId,
}: {
  userId: string;
  idea: string;
  blueprint: ProductBlueprint;
  provider: string;
  blueprintId?: string;
}) {
  if (blueprintId) {
    const existing = await prisma.blueprint.findFirst({
      where: { id: blueprintId, userId },
    });
    if (existing) {
      return prisma.blueprint.update({
        where: { id: blueprintId },
        data: {
          idea,
          title: blueprint.title,
          productType: blueprint.productType,
          provider,
          data: JSON.stringify(blueprint),
        },
      });
    }
  }

  return prisma.blueprint.create({
    data: {
      userId,
      idea,
      title: blueprint.title,
      productType: blueprint.productType,
      provider,
      data: JSON.stringify(blueprint),
    },
  });
}

export async function listBlueprints(userId: string) {
  return prisma.blueprint.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
}

export async function getPlanUsage(creatorId: string) {
  const [user, counts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: creatorId },
      include: { creatorPlan: true },
    }),
    prisma.product.groupBy({
      by: ["status"],
      where: { creatorId },
      _count: { _all: true },
    }),
  ]);

  const subscription = user?.creatorPlan ?? null;

  // La vigencia se evalúa en el backend: un plan vencido degrada a límites de
  // START y se marca EXPIRED para que los límites no queden activos de por vida.
  const isExpired =
    !!subscription?.expiresAt && new Date(subscription.expiresAt) < new Date();
  if (isExpired && subscription && subscription.status === "ACTIVE") {
    await prisma.creatorSubscription.update({
      where: { userId: creatorId },
      data: { status: "EXPIRED" },
    });
    subscription.status = "EXPIRED";
  }
  const effectivePlan = isExpired ? getCreatorPlan("START") : getCreatorPlan(subscription?.plan);

  const plan = effectivePlan;
  const total = counts.reduce((sum, row) => sum + row._count._all, 0);
  const published =
    counts.find((row) => row.status === "PUBLISHED")?._count._all ?? 0;

  return {
    plan,
    subscription,
    expired: isExpired,
    used: total,
    published,
    canCreateProduct: total < plan.productLimit,
    canPublishProduct: published < plan.publishedLimit,
  };
}

/** Draft step of Draft → Generate → Edit → Preview → Publish. */
export async function createDraftFromBlueprint({
  creatorId,
  blueprint,
  blueprintId,
}: {
  creatorId: string;
  blueprint: ProductBlueprint;
  blueprintId?: string;
}) {
  const usage = await getPlanUsage(creatorId);

  if (blueprintId) {
    const existing = await prisma.blueprint.findFirst({
      where: { id: blueprintId, userId: creatorId },
    });
    if (existing?.productId) {
      const product = await prisma.product.findUnique({
        where: { id: existing.productId },
      });
      if (product) {
        return {
          product,
          quality: qualityCheck(blueprint),
          reused: true,
          usage,
        };
      }
    }
  }

  if (!usage.canCreateProduct) {
    throw new Error(
      `Alcanzaste el límite de ${usage.plan.productLimit} infoproductos del plan ${usage.plan.name}. Mejora tu plan para publicar más.`,
    );
  }

  const product = await createProductFromBlueprint({
    creatorId,
    blueprint,
    blueprintId,
  });

  return { product, quality: qualityCheck(blueprint), reused: false, usage };
}