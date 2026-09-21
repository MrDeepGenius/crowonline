import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const product = await prisma.product.findFirst({
    where: { title: { contains: "Criminalística" }, status: "PUBLISHED" },
    select: { id: true, coverImageUrl: true },
    orderBy: { createdAt: "asc" },
  });
  console.log("coverImageUrl:", product?.coverImageUrl?.slice(0,80));

  const lessons = await prisma.lesson.findMany({
    where: { module: { course: { productId: product!.id } } },
    select: { id: true, title: true, imageUrl: true, imageGenerationStatus: true },
    take: 10,
    orderBy: [{ module: { position: "asc" } }, { position: "asc" }],
  });
  console.log(`\nLessons (${lessons.length}):`);
  for (const l of lessons) {
    console.log(`  [${l.imageGenerationStatus ?? "null"}] "${l.title.slice(0,40)}" → imageUrl: ${l.imageUrl ? "✅" : "null"}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
