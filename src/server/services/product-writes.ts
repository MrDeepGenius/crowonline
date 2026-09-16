import prisma from "@/lib/db";
import { slugify } from "@/lib/utils";
import { blueprintStats, qualityCheck, type ProductBlueprint } from "@/lib/ai/blueprint";

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "producto";
  let candidate = root;
  let counter = 1;
  for (;;) {
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
    counter += 1;
    candidate = `${root}-${counter}`;
  }
}

/** Persists a blueprint as a product (Draft step of the publish pipeline). */
export async function createProductFromBlueprint({
  creatorId,
  blueprint,
  blueprintId,
  status = "DRAFT",
}: {
  creatorId: string;
  blueprint: ProductBlueprint;
  blueprintId?: string;
  status?: string;
}) {
  const stats = blueprintStats(blueprint);
  const quality = qualityCheck(blueprint);
  const slug = await uniqueSlug(blueprint.title);

  const product = await prisma.product.create({
    data: {
      creatorId,
      slug,
      title: blueprint.title,
      shortDescription: blueprint.shortDescription,
      description: blueprint.description,
      type: blueprint.productType,
      category: blueprint.category,
      priceUsdt: blueprint.recommendedPriceUsdt,
      coverEmoji: blueprint.coverEmoji || "◆",
      coverGradient: blueprint.coverGradient || "violet",
      tags: JSON.stringify(blueprint.tags),
      includes: JSON.stringify(blueprint.includes),
      previewContent: blueprint.modules[0]?.lessons[0]?.content ?? null,
      status,
      qualityScore: quality.score,
      blueprintId: blueprintId ?? null,
      course:
        blueprint.productType === "COURSE"
          ? {
              create: {
                durationMin: stats.durationMin,
                learningGoals: JSON.stringify(blueprint.learningGoals),
                certificateEnabled: true,
                modules: {
                  create: blueprint.modules.map((module, moduleIndex) => ({
                    title: module.title,
                    summary: module.summary,
                    position: moduleIndex,
                    lessons: {
                      create: module.lessons.map((lesson, lessonIndex) => ({
                        title: lesson.title,
                        content: lesson.content,
                        durationMin: lesson.durationMin,
                        imagePrompt: lesson.imagePrompt || null,
                        videoUrl: lesson.videoUrl || null,
                        isFreePreview: lesson.isFreePreview,
                        position: lessonIndex,
                        exercises: {
                          create: lesson.exercises.map((exercise, exerciseIndex) => ({
                            title: exercise.title,
                            instructions: exercise.instructions,
                            kind: exercise.kind,
                            position: exerciseIndex,
                          })),
                        },
                      })),
                    },
                  })),
                },
              },
            }
          : undefined,
    },
  });

  if (blueprintId) {
    await prisma.blueprint.updateMany({
      where: { id: blueprintId, userId: creatorId },
      data: { productId: product.id },
    });
  }

  return product;
}

/** Publish step — creates the ProductPublication only once (no duplicates). */
export async function publishProductRecord({
  productId,
  actorId,
}: {
  productId: string;
  actorId: string;
}) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { publication: true },
  });
  if (!product) throw new Error("Producto no encontrado");

  if (product.publication) {
    await prisma.product.update({
      where: { id: productId },
      data: { status: "PUBLISHED" },
    });
    return { slug: product.publication.slug, alreadyPublished: true };
  }

  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { status: "PUBLISHED" },
    }),
    prisma.productPublication.create({
      data: {
        productId,
        actorId,
        slug: product.slug,
        visibility: "PUBLIC",
        revenueShare: JSON.stringify({
          creator: 0.45,
          platform: 0.1,
          directAffiliate: 0.3,
          levels: [0.05, 0.03, 0.02, 0.02, 0.01],
        }),
      },
    }),
  ]);

  return { slug: product.slug, alreadyPublished: false };
}

export async function updateProductDetails({
  productId,
  creatorId,
  data,
}: {
  productId: string;
  creatorId: string;
  data: {
    title?: string;
    shortDescription?: string;
    description?: string;
    priceUsdt?: number;
    category?: string;
    type?: string;
    coverEmoji?: string;
    coverGradient?: string;
    status?: string;
  };
}) {
  const owned = await prisma.product.findFirst({
    where: { id: productId, creatorId },
    select: { id: true },
  });
  if (!owned) throw new Error("Producto no encontrado");

  return prisma.product.update({ where: { id: productId }, data });
}

export async function updateLessonContent({
  lessonId,
  creatorId,
  data,
}: {
  lessonId: string;
  creatorId: string;
  data: {
    title?: string;
    content?: string;
    durationMin?: number;
    videoUrl?: string | null;
    isFreePreview?: boolean;
  };
}) {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { course: { product: { creatorId } } } },
    select: { id: true },
  });
  if (!lesson) throw new Error("Lección no encontrada");

  return prisma.lesson.update({ where: { id: lessonId }, data });
}

export async function countCreatorProducts(creatorId: string) {
  return prisma.product.count({ where: { creatorId } });
}