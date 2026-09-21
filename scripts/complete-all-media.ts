import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });
import { PrismaClient } from "@prisma/client";
import { generateModuleImages, generateProductImages } from "../src/lib/ai/image-generation";

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findFirst({
    where: { title: { contains: "Criminalística" }, status: "PUBLISHED" },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  });
  if (!product) { console.log("Not found"); return; }
  console.log(`Completing media for: ${product.title}\n`);

  // Generate remaining 5 module images
  console.log("=== Module images ===");
  const mods = await generateModuleImages(product.id, { maxModules: 5 });
  console.log(`Done: ${mods.filter(r=>r.status==="COMPLETED").length}/${mods.length}`);
  for (const r of mods) { if (r.imageUrl) console.log(`  ✅ ${r.imageUrl.slice(0,70)}...`); }

  // Generate remaining 13 lesson images (run twice to get up to 10+)
  console.log("\n=== Lesson images (round 1 - 6 lessons) ===");
  const lessons1 = await generateProductImages(product.id, { maxLessons: 6 });
  console.log(`Done: ${lessons1.filter(r=>r.status==="COMPLETED").length}/${lessons1.length}`);

  console.log("\n=== Lesson images (round 2 - 6 more) ===");
  const lessons2 = await generateProductImages(product.id, { maxLessons: 6 });
  console.log(`Done: ${lessons2.filter(r=>r.status==="COMPLETED").length}/${lessons2.length}`);

  const totalLessons = await prisma.lesson.count({ where: { imageGenerationStatus: "COMPLETED" } });
  const totalModules = await prisma.module.count({ where: { course: { productId: product.id }, imageUrl: { not: null } } });
  console.log(`\n✅ Final counts: modules=${totalModules}/8, lessons=${totalLessons}/21`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
