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
import { createProductFromBlueprint } from "@/server/services/product-writes";
import { getCreatorPlan } from "@/lib/plans";

export type StudioGeneration = {
  blueprint: ProductBlueprint;
  provider: string;
  mode: "live" | "demo";
  notes: string[];
};

/** IDEA → IA → PRODUCTO. Always returns a usable blueprint. */
export async function generateBlueprintFromIdea(
  idea: string,
  productType?: string,
): Promise<StudioGeneration> {
  const notes: string[] = [];
  const answer = await askProviders(
    [{ role: "user", content: buildBlueprintPrompt(idea, productType) }],
    { temperature: 0.65, maxTokens: 4096, json: true },
  );

  if (answer) {
    const parsed = parseBlueprint(extractJson(answer.text));
    if (parsed) {
      notes.push(`Blueprint generado con ${answer.provider} (${answer.model}).`);
      return { blueprint: parsed, provider: answer.provider, mode: "live", notes };
    }
    notes.push(
      `Respuesta de ${answer.provider} no era un blueprint válido; se usó el motor demo de CROW.`,
    );
  } else {
    notes.push(
      "No hay proveedor de IA configurado (GROQ_API_KEY / NVIDIA_API_KEY). Se usó el motor demo de CROW.",
    );
  }

  const demo = buildDemoBlueprint(idea);
  return { blueprint: demo.blueprint, provider: "crow-demo", mode: "demo", notes };
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

  const plan = getCreatorPlan(user?.creatorPlan?.plan ?? "START");
  const total = counts.reduce((sum, row) => sum + row._count._all, 0);
  const published =
    counts.find((row) => row.status === "PUBLISHED")?._count._all ?? 0;

  return {
    plan,
    subscription: user?.creatorPlan ?? null,
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