import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const product = await prisma.product.findFirst({
    where: { title: { contains: "Criminalística" }, status: "PUBLISHED" },
    select: { id: true, course: { select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });
  const productId = product!.id;
  console.log("productId:", productId);

  // Test the exact query from image-generation.ts
  const modules = await prisma.module.findMany({
    where: { course: { productId } },
    orderBy: { position: "asc" },
    select: {
      position: true,
      lessons: {
        where: {
          OR: [{ imageUrl: null }, { imageUrl: "" }],
          NOT: { imageGenerationStatus: "GENERATING" },
        },
        orderBy: { position: "asc" },
        select: { id: true, title: true, content: true, imagePrompt: true },
      },
    },
  });

  const lessons = modules.flatMap((m) => m.lessons);
  console.log(`Found ${lessons.length} lessons without images`);
  for (const l of lessons.slice(0, 5)) {
    console.log(`  "${l.title.slice(0,40)}" content_len=${l.content.length} imagePrompt=${l.imagePrompt ? "✅" : "null"}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
