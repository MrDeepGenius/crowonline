import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { OR: [{ email: { contains: "buyer" } }, { email: { contains: "demo" } }, { email: "user@crow.market" }] },
    select: { email: true, name: true, roles: true, status: true },
  });
  console.log(JSON.stringify(users, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
