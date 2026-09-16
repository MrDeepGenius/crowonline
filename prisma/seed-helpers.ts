import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import type { SeedProduct } from "./seed-types";

export const SEED_PASSWORD = "crow12345";

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 70);
}

export function reference(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 5)
    .toUpperCase()}`;
}

export async function createUser(
  prisma: PrismaClient,
  {
    name,
    email,
    roles,
    country,
    password = SEED_PASSWORD,
  }: {
    name: string;
    email: string;
    roles: string[];
    country?: string;
    password?: string;
  },
) {
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      roles: JSON.stringify(roles),
      country: country ?? "ES",
      profile: { create: { headline: `${roles[0]} en CROW` } },
      wallet: { create: {} },
    },
  });
}

export async function createProduct(
  prisma: PrismaClient,
  product: SeedProduct,
  creatorId: string,
  meta: { sales?: number; qualityScore?: number } = {},
) {
  const slug = slugify(product.title);
  const lessons = product.modules.flatMap((module) => module.lessons);
  const durationMin = lessons.reduce((sum, lesson) => sum + (lesson.durationMin ?? 22), 0);
  const sales = meta.sales ?? 24;

  return prisma.product.create({
    data: {
      creatorId,
      slug,
      title: product.title,
      shortDescription: product.short,
      description: product.description,
      type: product.type,
      category: product.category,
      priceUsdt: product.price,
      coverEmoji: product.emoji,
      coverGradient: product.gradient,
      tags: JSON.stringify(product.tags),
      includes: JSON.stringify(product.includes),
      previewContent: lessons[0]?.content ?? null,
      status: "PUBLISHED",
      qualityScore: meta.qualityScore ?? 92,
      ratingAvg: 4.8,
      ratingCount: 12,
      salesCount: sales,
      revenueUsdt: sales * product.price,
      publication: {
        create: {
          slug,
          visibility: "PUBLIC",
          revenueShare: JSON.stringify({
            creator: 0.45,
            platform: 0.1,
            directAffiliate: 0.3,
            levels: [0.05, 0.03, 0.02, 0.02, 0.01],
          }),
        },
      },
      course:
        product.type === "COURSE"
          ? {
              create: {
                durationMin,
                certificateEnabled: true,
                learningGoals: JSON.stringify([
                  `Dominar los fundamentos de ${product.category}`,
                  "Aplicar el método con plantillas",
                  "Medir resultados con métricas simples",
                ]),
                modules: {
                  create: product.modules.map((module, moduleIndex) => ({
                    title: module.title,
                    summary: module.summary,
                    position: moduleIndex,
                    lessons: {
                      create: module.lessons.map((lesson, lessonIndex) => ({
                        title: lesson.title,
                        content: lesson.content,
                        durationMin: lesson.durationMin ?? 22,
                        isFreePreview: Boolean(lesson.preview),
                        position: lessonIndex,
                        exercises: {
                          create: [
                            {
                              title: `Ejercicio: ${lesson.title}`,
                              instructions: lesson.exercise,
                              kind: "PRACTICE",
                              position: 0,
                            },
                          ],
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
}