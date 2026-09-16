import { PrismaClient } from "@prisma/client";

import { SEED_PRODUCTS_A } from "./seed-a";
import { SEED_PRODUCTS_B } from "./seed-b";
import { SEED_PRODUCTS_C } from "./seed-c";
import { createProduct, reference } from "./seed-helpers";
import { seedReviewsAndWithdrawal, simulateSale } from "./seed-sales";
import { seedPeople } from "./seed-users";
import type { SeedProduct } from "./seed-types";

const prisma = new PrismaClient();

const SEED_PRODUCTS: SeedProduct[] = [
  ...SEED_PRODUCTS_A,
  ...SEED_PRODUCTS_B,
  ...SEED_PRODUCTS_C,
];

async function cleanDatabase() {
  await prisma.$transaction([
    prisma.lessonProgress.deleteMany(),
    prisma.certificate.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.commission.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.review.deleteMany(),
    prisma.exercise.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.module.deleteMany(),
    prisma.course.deleteMany(),
    prisma.productPublication.deleteMany(),
    prisma.product.deleteMany(),
    prisma.blueprint.deleteMany(),
    prisma.withdrawal.deleteMany(),
    prisma.walletTransaction.deleteMany(),
    prisma.wallet.deleteMany(),
    prisma.referralEvent.deleteMany(),
    prisma.referral.deleteMany(),
    prisma.affiliate.deleteMany(),
    prisma.creatorSubscription.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function main() {
  console.log("→ Limpiando datos previos…");
  await cleanDatabase();

  console.log("→ Creando usuarios, creators y afiliados…");
  const people = await seedPeople(prisma);

  console.log("→ Creando 6 productos publicados…");
  const products = [];
  for (const [index, seed] of SEED_PRODUCTS.entries()) {
    products.push(
      await createProduct(prisma, seed, people.creators[seed.creatorIndex].id, {
        sales: 18 + index * 4,
        qualityScore: 88 + index,
      }),
    );
  }

  console.log("→ Simulando ventas con la distribución real de CROW…");
  await simulateSale(prisma, {
    buyerId: people.buyers[0].id,
    productId: products[0].id,
    productTitle: products[0].title,
    price: products[0].priceUsdt,
    creatorId: products[0].creatorId,
    upline: people.upline,
    referralCode: "MARCO88",
  });

  await simulateSale(prisma, {
    buyerId: people.buyers[1].id,
    productId: products[1].id,
    productTitle: products[1].title,
    price: products[1].priceUsdt,
    creatorId: products[1].creatorId,
    upline: [people.mid.userId, people.root.userId],
    referralCode: "ELENA77",
  });

  await simulateSale(prisma, {
    buyerId: people.buyers[0].id,
    productId: products[4].id,
    productTitle: products[4].title,
    price: products[4].priceUsdt,
    creatorId: products[4].creatorId,
    upline: [],
  });

  await simulateSale(prisma, {
    buyerId: people.buyers[0].id,
    productId: products[2].id,
    productTitle: products[2].title,
    price: products[2].priceUsdt,
    creatorId: products[2].creatorId,
    upline: [people.root.userId],
    referralCode: "MARCO88",
  });

  await simulateSale(prisma, {
    buyerId: people.buyers[1].id,
    productId: products[5].id,
    productTitle: products[5].title,
    price: products[5].priceUsdt,
    creatorId: products[5].creatorId,
    upline: [people.root.userId],
    referralCode: "MARCO88",
  });

  console.log("→ Añadiendo reviews y un retiro pendiente…");
  const withdrawal = await seedReviewsAndWithdrawal(prisma, {
    productIds: products.map((product) => product.id),
    buyers: people.buyers,
    withdrawalUserId: people.root.userId,
  });

  await prisma.transaction.create({
    data: {
      reference: reference("CROW-TX"),
      kind: "ADJUSTMENT",
      status: "COMPLETED",
      amountUsdt: 0,
      userId: people.admin.id,
      metadata: JSON.stringify({
        note: "seed inicial de CROW MARKET",
        products: products.length,
      }),
    },
  });

  console.log("\n✅ Seed completado");
  console.log("   admin@crow.market     · creator@crow.market");
  console.log("   affiliate@crow.market · buyer@crow.market");
  console.log("   password para todos: crow12345");
  console.log(`   ${products.length} productos publicados`);
  console.log(`   Retiro pendiente: ${withdrawal ? "sí" : "no"}\n`);
}

main()
  .catch((error) => {
    console.error("Seed falló:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });