import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });
import { PrismaClient } from "@prisma/client";
import { retryLessonVideo } from "../src/lib/ai/image-generation";

const prisma = new PrismaClient();

async function main() {
  // Find the first lesson that has an image but no video
  const product = await prisma.product.findFirst({
    where: { title: { contains: "Criminalística" }, status: "PUBLISHED" },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  });
  if (!product) { console.log("Product not found"); return; }
  console.log(`\nProduct: ${product.title}\n`);

  const lesson = await prisma.lesson.findFirst({
    where: {
      module: { course: { productId: product.id } },
      imageGenerationId: { not: null },
      videoUrl: null,
    },
    select: { id: true, title: true, imageGenerationId: true },
    orderBy: [{ module: { position: "asc" } }, { position: "asc" }],
  });

  if (!lesson) {
    console.log("No eligible lesson found (needs imageGenerationId, no videoUrl).");
    return;
  }

  console.log(`Lesson: "${lesson.title}"`);
  console.log(`ImageGenerationId: ${lesson.imageGenerationId}`);
  console.log("\nStarting video generation (Motion 2.0)...\n");

  const start = Date.now();
  const result = await retryLessonVideo(lesson.id);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`Status:    ${result.status} (${elapsed}s)`);
  if (result.videoUrl) {
    console.log(`VideoURL:  ${result.videoUrl}`);
    console.log(`GenID:     ${result.generationId}`);
  }
  if (result.error) console.log(`Error:     ${result.error}`);

  // Verify DB
  const updated = await prisma.lesson.findUnique({
    where: { id: lesson.id },
    select: { videoUrl: true, videoGenerationId: true, videoGenerationStatus: true },
  });
  console.log("\n=== DB Verification ===");
  console.log(`videoUrl:              ${updated?.videoUrl ?? "null"}`);
  console.log(`videoGenerationId:     ${updated?.videoGenerationId ?? "null"}`);
  console.log(`videoGenerationStatus: ${updated?.videoGenerationStatus ?? "null"}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
