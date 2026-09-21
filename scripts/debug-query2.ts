import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const product = await prisma.product.findFirst({
    where: { title: { contains: "Criminalística" }, status: "PUBLISHED" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  const productId = product!.id;

  // Test 1: without the OR condition
  const t1 = await prisma.module.findMany({
    where: { course: { productId } },
    select: { lessons: { select: { id: true, imageUrl: true, title: true } } },
  });
  const all = t1.flatMap(m => m.lessons);
  console.log("ALL lessons:", all.length);
  console.log("With null imageUrl:", all.filter(l => l.imageUrl === null).length);
  console.log("With empty imageUrl:", all.filter(l => l.imageUrl === "").length);
  console.log("With imageUrl:", all.filter(l => l.imageUrl).length);

  // Test 2: only imageUrl IS NULL
  const t2 = await prisma.module.findMany({
    where: { course: { productId } },
    select: { lessons: { where: { imageUrl: null }, select: { id: true, title: true } } },
  });
  const nullOnly = t2.flatMap(m => m.lessons);
  console.log("\nWith imageUrl = null (direct):", nullOnly.length);
  for (const l of nullOnly.slice(0, 5)) console.log(" ", l.title.slice(0, 40));
}
main().catch(console.error).finally(() => prisma.$disconnect());
