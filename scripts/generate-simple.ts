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
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!product) return;

  // Simplest possible query — no OR, no NOT
  const modules = await prisma.module.findMany({
    where: { course: { productId: product.id } },
    orderBy: { position: "asc" },
    select: {
      lessons: {
        where: { imageUrl: null },
        orderBy: { position: "asc" },
        select: { id: true, title: true, content: true, imagePrompt: true, imageGenerationStatus: true },
      },
    },
  });

  const all = modules.flatMap((m) => m.lessons);
  console.log(`Lessons with imageUrl=null: ${all.length}`);
  // Filter out GENERATING in JS
  const candidates = all.filter((l) => l.imageGenerationStatus !== "GENERATING");
  console.log(`After excluding GENERATING: ${candidates.length}\n`);

  const leonardo = new LeonardoProvider();
  let done = 0;

  for (const lesson of candidates.slice(0, 4)) {
    const prompt = lesson.imagePrompt?.trim() || deriveImagePrompt(lesson.title, lesson.content);
    if (!prompt) { console.log(`SKIP: ${lesson.title}`); continue; }

    console.log(`Generating: "${lesson.title.slice(0, 50)}"`);
    try {
      await prisma.lesson.update({ where: { id: lesson.id }, data: { imageGenerationStatus: "GENERATING" } });
      const genId = await leonardo.startGeneration(prompt);
      await prisma.lesson.update({ where: { id: lesson.id }, data: { imageGenerationId: genId } });
      const url = await leonardo.pollForResult(genId);
      if (url) {
        await prisma.lesson.update({ where: { id: lesson.id }, data: { imageUrl: url, imageGenerationStatus: "COMPLETED" } });
        console.log(`  ✅ URL: ${url.slice(0, 80)}...`);
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
  console.log(`\nGenerated: ${done} | Total COMPLETED: ${total}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
