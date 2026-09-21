/**
 * Genera 4 imágenes de lecciones usando la query corregida (imageUrl: null directo).
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

import { PrismaClient } from "@prisma/client";
import { LeonardoProvider } from "../src/lib/ai/providers/leonardo";
import { deriveImagePrompt } from "../src/lib/ai/lesson-image-prompt";

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findFirst({
    where: { title: { contains: "Criminalística" }, status: "PUBLISHED" },
    select: { id: true, title: true, coverImageUrl: true },
    orderBy: { createdAt: "asc" },
  });
  if (!product) { console.log("Not found"); return; }
  console.log(`Product: ${product.title}`);
  console.log(`Cover: ${product.coverImageUrl ? "✅" : "❌"}\n`);

  const leonardo = new LeonardoProvider();

  // Load using fixed query
  const modules = await prisma.module.findMany({
    where: { course: { productId: product.id } },
    orderBy: { position: "asc" },
    select: {
      lessons: {
        where: { imageUrl: null, NOT: { imageGenerationStatus: "GENERATING" } },
        orderBy: { position: "asc" },
        select: { id: true, title: true, content: true, imagePrompt: true },
      },
    },
  });

  const lessons = modules.flatMap((m) => m.lessons).slice(0, 4);
  console.log(`Lessons to generate: ${lessons.length}\n`);

  let done = 0;
  for (const lesson of lessons) {
    const prompt = lesson.imagePrompt?.trim() || deriveImagePrompt(lesson.title, lesson.content);
    if (!prompt) { console.log(`  SKIP: ${lesson.title}`); continue; }

    console.log(`Generating: "${lesson.title.slice(0, 50)}"`);
    try {
      await prisma.lesson.update({ where: { id: lesson.id }, data: { imagePrompt: prompt, imageGenerationStatus: "GENERATING" } });
      const genId = await leonardo.startGeneration(prompt, { width: 1024, height: 640 });
      await prisma.lesson.update({ where: { id: lesson.id }, data: { imageGenerationId: genId } });
      const url = await leonardo.pollForResult(genId);
      if (url) {
        await prisma.lesson.update({ where: { id: lesson.id }, data: { imageUrl: url, imageGenerationStatus: "COMPLETED" } });
        console.log(`  ✅ ${url.slice(0, 70)}...`);
        done++;
      } else {
        await prisma.lesson.update({ where: { id: lesson.id }, data: { imageGenerationStatus: "FAILED" } });
        console.log(`  ⚠️  Timed out`);
      }
    } catch (e) {
      console.log(`  ❌ ${e instanceof Error ? e.message : e}`);
      await prisma.lesson.update({ where: { id: lesson.id }, data: { imageGenerationStatus: "FAILED" } }).catch(() => {});
    }
  }

  const total = await prisma.lesson.count({ where: { imageGenerationStatus: "COMPLETED" } });
  console.log(`\n✅ Generated this run: ${done}`);
  console.log(`✅ Total COMPLETED lessons in DB: ${total}`);
  console.log(`✅ Product coverImageUrl: ${product.coverImageUrl ? "EXISTS" : "MISSING"}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
