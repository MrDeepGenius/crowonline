#!/usr/bin/env tsx
/**
 * Seed script: Curso completo de Criminalística
 * 
 * Crea un curso real educativo listo para ser comprado y estudiado.
 * Idempotente: puede ejecutarse múltiples veces sin duplicar.
 * 
 * Uso: npx tsx scripts/seed-criminalistica.ts
 */

import { PrismaClient } from "@prisma/client";
import { criminalisticaSpec } from "../src/data/courses/criminalistica";
import { specToBlueprint } from "../src/lib/ai/demo";
import { createProductFromBlueprint } from "../src/server/services/product-writes";

const prisma = new PrismaClient();

async function main() {
  console.log("🔬 Seeding: Curso de Criminalística\n");

  // Buscar o crear usuario creador
  const creatorEmail = "creator@crow.market";
  let creator = await prisma.user.findUnique({
    where: { email: creatorEmail },
  });

  if (!creator) {
    console.log("Creating creator user...");
    creator = await prisma.user.create({
      data: {
        email: creatorEmail,
        name: "Instituto Forense CROW",
    passwordHash: "$2a$10$YourHashedPasswordHere", // dummy hash
        roles: JSON.stringify(["BUYER", "CREATOR"]),
        wallet: {
          create: {},
        },
      },
    });
    console.log(`✓ Creator created: ${creator.email}\n`);
  } else {
    console.log(`✓ Creator exists: ${creator.email}\n`);
  }

  // Verificar si el producto ya existe
  const existingProduct = await prisma.product.findFirst({
    where: {
      title: criminalisticaSpec.title,
      creatorId: creator.id,
    },
  });

  if (existingProduct) {
    console.log(`⚠ Product already exists: ${existingProduct.title}`);
    console.log(`   ID: ${existingProduct.id}`);
    console.log(`   Status: ${existingProduct.status}`);
    console.log("\nSkipping creation. To recreate, delete the product first.\n");
    return;
  }

  // Convertir spec a blueprint
  console.log("Converting spec to blueprint...");
  const blueprint = specToBlueprint(criminalisticaSpec);
  console.log(`✓ Blueprint ready: ${blueprint.modules.length} modules\n`);

  // Crear producto con todo el contenido
  console.log("Creating product from blueprint...");
  const product = await createProductFromBlueprint({
    creatorId: creator.id,
    blueprint,
    status: "DRAFT",
  });
  console.log(`✓ Product created: ${product.id}\n`);

  // Contar contenido creado
  const courseData = await prisma.course.findUnique({
    where: { productId: product.id },
    include: {
      modules: {
        include: {
          lessons: {
            include: {
              exercises: true,
            },
          },
        },
      },
    },
  });

  const modules = courseData?.modules.length ?? 0;
  const lessons = courseData?.modules.flatMap((m) => m.lessons).length ?? 0;
  const exercises =
    courseData?.modules.flatMap((m) => m.lessons.flatMap((l) => l.exercises)).length ?? 0;
  const resources = await prisma.resource.count({ where: { productId: product.id } });

  console.log("📊 Content summary:");
  console.log(`   Modules: ${modules}`);
  console.log(`   Lessons: ${lessons}`);
  console.log(`   Exercises: ${exercises}`);
  console.log(`   Resources: ${resources}`);
  console.log();

  // Publicar el producto
  console.log("Publishing product...");
  await prisma.product.update({
    where: { id: product.id },
    data: {
      status: "PUBLISHED",
      publication: {
        create: {
          slug: product.slug,
        },
      },
    },
  });
  console.log(`✓ Product published: /marketplace/${product.slug}\n`);

  console.log("✅ Seed completed successfully!");
  console.log(`\nProduct: ${product.title}`);
  console.log(`Price: ${product.priceUsdt} USDT`);
  console.log(`Slug: ${product.slug}`);
  console.log(`\nAccess: http://localhost:3000/marketplace/${product.slug}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
