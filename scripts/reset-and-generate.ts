/**
 * Resetea lessons bloqueadas en GENERATING sin imageUrl, luego genera.
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

import { PrismaClient } from "@prisma/client";
import { generateProductImages } from "../src/lib/ai/image-generation";

const prisma = new PrismaClient();

async function main() {
  // Reset stuck GENERATING
  const reset = await prisma.lesson.updateMany({
    where: {
      imageGenerationStatus: "GENERATING",
      OR: [{ imageUrl: null }, { imageUrl: "" }],
    },
    data: { imageGenerationStatus: "PENDING" },
  });
  console.log(`Reset ${reset.count} stuck GENERATING lessons to PENDING\n`);

  const product = await prisma.product.findFirst({
    where: { title: { contains: "Criminalística" }, status: "PUBLISHED" },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  });

  if (!product) { console.log("Product not found"); return; }
  console.log(`Generating for: ${product.title}\n`);

  const results = await generateProductImages(product.id, { maxLessons: 4 });

  const completed = results.filter((r) => r.status === "COMPLETED");
  const failed = results.filter((r) => r.status === "FAILED");
  const skipped = results.filter((r) => r.status === "SKIPPED");

  console.log(`✅ COMPLETED: ${completed.length}`);
  console.log(`❌ FAILED:    ${failed.length}`);
  console.log(`⏭️  SKIPPED:   ${skipped.length}`);

  for (const l of completed) {
    console.log(`\n  URL: ${l.imageUrl?.slice(0, 90)}`);
    console.log(`  GenID: ${l.generationId}`);
    console.log(`  Prompt: ${l.promptUsed?.slice(0, 80)}...`);
  }

  const total = await prisma.lesson.count({ where: { imageGenerationStatus: "COMPLETED" } });
  console.log(`\nTotal COMPLETED lessons in DB: ${total}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
