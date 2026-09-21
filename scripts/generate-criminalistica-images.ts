#!/usr/bin/env tsx
/**
 * Genera imágenes reales para el curso de Criminalística usando Leonardo.
 * Usa el productId del curso ya seedeado en la DB.
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

import { PrismaClient } from "@prisma/client";
import { LeonardoProvider } from "../src/lib/ai/providers/leonardo";

const prisma = new PrismaClient();

async function main() {
  console.log("🎨 Generating images for Criminalística course\n");

  const leonardo = new LeonardoProvider();
  if (!leonardo.isConfigured()) {
    console.error("❌ LEONARDO_API_KEY not configured");
    process.exit(1);
  }

  // Find the course
  const product = await prisma.product.findFirst({
    where: { title: { contains: "Criminalística" } },
    include: {
      course: {
        include: {
          modules: {
            include: { lessons: { take: 2, orderBy: { position: "asc" } } },
            orderBy: { position: "asc" },
            take: 2,
          },
        },
      },
    },
  });

  if (!product) {
    console.error("❌ Product not found. Run seed first.");
    process.exit(1);
  }

  console.log(`Product: ${product.title}`);
  console.log(`ID: ${product.id}\n`);

  const lessons = product.course?.modules.flatMap((m) => m.lessons) ?? [];
  console.log(`Lessons with prompts: ${lessons.filter((l) => l.imagePrompt).length}`);

  // Generate up to 4 images
  const targets = lessons.filter((l) => l.imagePrompt).slice(0, 4);
  let completed = 0;

  for (const lesson of targets) {
    const prompt = lesson.imagePrompt!;
    console.log(`\n[${targets.indexOf(lesson) + 1}/${targets.length}] "${lesson.title}"`);
    console.log(`  Prompt: ${prompt.slice(0, 80)}...`);

    try {
      // Mark GENERATING
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { imageGenerationStatus: "GENERATING" },
      });

      const generationId = await leonardo.startGeneration(prompt, { width: 1024, height: 640 });
      console.log(`  GenerationId: ${generationId}`);

      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { imageGenerationId: generationId, imageGenerationStatus: "GENERATING" },
      });

      const url = await leonardo.pollForResult(generationId);
      if (url) {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { imageUrl: url, imageGenerationStatus: "COMPLETED" },
        });
        console.log(`  ✅ COMPLETED`);
        console.log(`  URL: ${url}`);
        completed++;
      } else {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { imageGenerationStatus: "FAILED" },
        });
        console.log(`  ⚠️  Timed out — status saved as FAILED`);
      }
    } catch (err) {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { imageGenerationStatus: "FAILED" },
      }).catch(() => {});
      console.log(`  ❌ Error: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\n📊 Summary: ${completed}/${targets.length} images generated`);

  // Verify DB state
  const updated = await prisma.lesson.findMany({
    where: {
      module: { course: { productId: product.id } },
      imageGenerationStatus: "COMPLETED",
    },
    select: { id: true, title: true, imageUrl: true, imageGenerationId: true, imageGenerationStatus: true },
  });

  console.log(`\n✅ DB verification — COMPLETED lessons:`);
  for (const l of updated) {
    console.log(`   [${l.id}] ${l.title}`);
    console.log(`      URL: ${l.imageUrl}`);
    console.log(`      GenID: ${l.imageGenerationId}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
