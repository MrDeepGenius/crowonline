/**
 * Genera portada + imágenes de lecciones para todos los productos sin portada.
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

import { PrismaClient } from "@prisma/client";
import { generateAllProductMedia } from "../src/lib/ai/image-generation";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED", OR: [{ coverImageUrl: null }, { coverImageUrl: "" }] },
    select: { id: true, title: true },
  });

  console.log(`📦 Products without cover: ${products.length}\n`);

  for (const product of products) {
    console.log(`\n🎨 "${product.title}"`);
    const result = await generateAllProductMedia(product.id, { maxLessons: 3 });

    if (result.coverImageUrl) {
      console.log(`  ✅ Cover: ${result.coverImageUrl.slice(0, 80)}...`);
    } else {
      console.log(`  ⚠️  Cover: not generated`);
    }

    const completed = result.lessons.filter((l) => l.status === "COMPLETED");
    const failed = result.lessons.filter((l) => l.status === "FAILED");
    const skipped = result.lessons.filter((l) => l.status === "SKIPPED");
    console.log(`  Lessons: ${completed.length} COMPLETED, ${failed.length} FAILED, ${skipped.length} SKIPPED`);
    for (const l of completed) {
      console.log(`    ✅ [${l.lessonId}] ${l.imageUrl?.slice(0, 70)}...`);
    }
  }

  // DB verification
  console.log("\n\n=== DB VERIFICATION ===");
  const withCover = await prisma.product.count({ where: { coverImageUrl: { not: null } } });
  const completedLessons = await prisma.lesson.count({ where: { imageGenerationStatus: "COMPLETED" } });
  console.log(`Products with coverImageUrl: ${withCover}`);
  console.log(`Lessons with COMPLETED images: ${completedLessons}`);

  const sample = await prisma.lesson.findMany({
    where: { imageGenerationStatus: "COMPLETED" },
    select: { id: true, title: true, imageUrl: true, imageGenerationId: true },
    take: 4,
  });
  console.log("\nSample completed lessons:");
  for (const l of sample) {
    console.log(`  [${l.id.slice(-8)}] "${l.title}"`);
    console.log(`    imageUrl:       ${l.imageUrl?.slice(0, 80)}...`);
    console.log(`    generationId:   ${l.imageGenerationId}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
