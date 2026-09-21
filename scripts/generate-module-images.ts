import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

import { PrismaClient } from "@prisma/client";
import { generateModuleImages } from "../src/lib/ai/image-generation";

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findFirst({
    where: { title: { contains: "Criminalística" }, status: "PUBLISHED" },
    select: { id: true, title: true, coverImageUrl: true },
    orderBy: { createdAt: "asc" },
  });
  if (!product) { console.log("Product not found"); return; }
  console.log(`\nProduct: ${product.title}`);
  console.log(`Cover: ${product.coverImageUrl ? "✅" : "❌"}\n`);

  console.log("Generating module images (3 modules)...\n");
  const results = await generateModuleImages(product.id, { maxModules: 3 });

  for (const r of results) {
    const mod = await prisma.module.findUnique({ where: { id: r.moduleId }, select: { title: true } });
    console.log(`[${r.status}] "${mod?.title ?? r.moduleId}"`);
    if (r.imageUrl) console.log(`  → ${r.imageUrl.slice(0, 80)}...`);
    if (r.error) console.log(`  ⚠ ${r.error}`);
  }

  // Verify
  const done = await prisma.module.count({ where: { course: { productId: product.id }, imageUrl: { not: null } } });
  const total = await prisma.module.count({ where: { course: { productId: product.id } } });
  console.log(`\n✅ Modules with imageUrl: ${done}/${total}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
