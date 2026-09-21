import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

// Force test mode
process.env.NODE_ENV = "development";
process.env.PAYMENTS_TEST_MODE = "true";

const envText = readFileSync(".env", "utf8");
for (const line of envText.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if ((v[0] === '"' && v.slice(-1) === '"') || (v[0] === "'" && v.slice(-1) === "'")) v = v.slice(1, -1);
  if (!process.env[k]) process.env[k] = v;
}

const prisma = new PrismaClient();
const IDEA = "Curso de fotografía con celular para principiantes, 5 módulos, imágenes, videos, ejercicios y certificado.";
const errors = [];
function fail(l, d) { errors.push(l + ": " + d); console.error("  FAIL " + l + ": " + d); }
function ok(l, d) { console.log("  OK   " + l + (d ? ": " + d : "")); }

async function main() {
  console.log("=== E2E FULL VALIDATION ===");
  console.log("Idea:", IDEA);

  // STEP 1: Generate blueprint
  console.log("\n=== STEP 1: GENERATE BLUEPRINT ===");
  const { runPipeline } = await import("../src/lib/ai/pipeline.js");
  const spec = {
    topic: IDEA, productType: "COURSE", moduleCount: 5,
    hasImages: true, hasVideos: true, hasExercises: true, hasQuizzes: true,
    hasCertificate: true, hasResources: true, level: "beginner",
    audience: "Principiantes sin experiencia previa",
  };
  const result = await runPipeline(spec, (p) => console.log("  [pipeline] " + p.message));
  const blueprint = result.blueprint;
  console.log("  Provider:", result.provider, "(" + result.mode + ")");
  console.log("  Title:", blueprint.title);
  const allLessons = blueprint.modules.flatMap(m => m.lessons);
  const allExercises = allLessons.flatMap(l => l.exercises);
  console.log("  Modules:", blueprint.modules.length);
  console.log("  Lessons:", allLessons.length);
  console.log("  Exercises:", allExercises.length);

  if (blueprint.modules.length !== 5) fail("MOD_COUNT", "Expected 5, got " + blueprint.modules.length); else ok("MOD_COUNT", "5");
  if (allLessons.length < 13) fail("LESSON_COUNT", "Expected >=13"); else ok("LESSON_COUNT", String(allLessons.length));

  const skeletonKw = ["Contenido pendiente de generación", "Paso 1", "Paso 2", "Paso 3"];
  let realContent = 0;
  for (const l of allLessons) {
    if (l.content && l.content.length > 100 && !skeletonKw.some(k => l.content.includes(k))) realContent++;
  }
  console.log("  Real content:", realContent + "/" + allLessons.length);
  if (realContent < 10) fail("REAL_CONTENT", String(realContent)); else ok("REAL_CONTENT", String(realContent));

  const withImg = allLessons.filter(l => l.imagePrompt && l.imagePrompt.length > 10);
  if (withImg.length < 10) fail("IMAGE_PROMPTS", String(withImg.length)); else ok("IMAGE_PROMPTS", String(withImg.length));

  const quizzes = allExercises.filter(e => e.kind === "QUIZ");
  if (quizzes.length < 5) fail("QUIZ_COUNT", String(quizzes.length)); else ok("QUIZ_COUNT", String(quizzes.length));

  for (const mod of blueprint.modules.slice(0, 2)) {
    console.log("  Module:", mod.title);
    const l = mod.lessons[0];
    if (l) {
      console.log("    Lesson:", l.title);
      console.log("    Content:", (l.content || "").slice(0, 200));
      console.log("    imagePrompt:", (l.imagePrompt || "").slice(0, 120));
    }
  }

  // STEP 2: Materialize
  console.log("\n=== STEP 2: MATERIALIZATION ===");
  const { saveBlueprint, createDraftFromBlueprint } = await import("../src/server/services/creator.js");
  const creatorId = "e2e-creator-" + Date.now();
  const buyerId = "e2e-buyer-" + Date.now();
  await prisma.user.create({ data: { id: creatorId, email: creatorId + "@test.com", name: "E2E Creator", roles: JSON.stringify(["CREATOR"]), passwordHash: "test" } });
  console.log("  Creator:", creatorId);

  const saved = await saveBlueprint({ userId: creatorId, idea: IDEA, blueprint, provider: result.provider });
  const { product, quality } = await createDraftFromBlueprint({ creatorId, blueprint, blueprintId: saved.id });
  console.log("  Product:", product.id, product.title);
  console.log("  Slug:", product.slug);
  console.log("  Quality:", quality.score);
  ok("MATERIALIZED", product.id);

  const dbModules = await prisma.module.findMany({ where: { course: { productId: product.id } }, orderBy: { position: "asc" } });
  const dbLessons = await prisma.lesson.findMany({ where: { moduleId: { in: dbModules.map(m => m.id) } }, orderBy: { position: "asc" } });
  const dbExercises = await prisma.exercise.findMany({ where: { lessonId: { in: dbLessons.map(l => l.id) } } });
  console.log("  DB:", dbModules.length, "modules,", dbLessons.length, "lessons,", dbExercises.length, "exercises");
  if (dbModules.length !== 5) fail("DB_MODULES", String(dbModules.length)); else ok("DB_MODULES", String(dbModules.length));
  if (dbLessons.length < 13) fail("DB_LESSONS", String(dbLessons.length)); else ok("DB_LESSONS", String(dbLessons.length));
  if (dbLessons[0]?.content && dbLessons[0].content.length > 100) ok("DB_LESSON_CONTENT", dbLessons[0].content.length + " chars");
  else fail("DB_LESSON_CONTENT", "Too short");

  // STEP 3: Multimedia
  console.log("\n=== STEP 3: MULTIMEDIA ===");
  const hasLeonardo = Boolean(process.env.LEONARDO_API_KEY);
  console.log("  Leonardo:", hasLeonardo);
  if (hasLeonardo) {
    const imgGen = await import("../src/lib/ai/image-generation.js");
    const vidGen = await import("../src/lib/ai/video-generation.js");

    console.log("  Generating cover...");
    try {
      const coverUrl = await imgGen.generateProductCover(product.id);
      if (coverUrl) ok("COVER", coverUrl.slice(0, 80)); else fail("COVER", "No URL");
    } catch (e) { fail("COVER", e.message); }

    console.log("  Generating module images...");
    try {
      await imgGen.generateModuleImages(product.id, { maxModules: 3 });
      const mods = await prisma.module.findMany({ where: { course: { productId: product.id } }, select: { imageUrl: true } });
      const ok2 = mods.filter(m => m.imageUrl && m.imageUrl.length > 10);
      ok("MODULE_IMAGES", ok2.length + "/" + mods.length);
    } catch (e) { fail("MODULE_IMAGES", e.message); }

    console.log("  Generating lesson images...");
    try {
      await imgGen.generateProductImages(product.id, { maxLessons: 6 });
      const ls = await prisma.lesson.findMany({ where: { moduleId: { in: dbModules.map(m => m.id) } }, select: { imageUrl: true } });
      const ok3 = ls.filter(l => l.imageUrl && l.imageUrl.length > 10);
      ok("LESSON_IMAGES", ok3.length + "/" + ls.length);
    } catch (e) { fail("LESSON_IMAGES", e.message); }

    console.log("  Generating video...");
    try {
      await prisma.lesson.update({ where: { id: dbLessons[0].id }, data: { videoEnabled: true, videoRequired: true, videoPrompt: "Cinematic pan of smartphone camera close-up showing lens detail, natural light" } });
      const vr = await vidGen.generateLessonVideos(product.id, { maxLessons: 1 });
      console.log("  Video result:", JSON.stringify(vr).slice(0, 200));
      const vl = await prisma.lesson.findMany({ where: { id: dbLessons[0].id }, select: { videoUrl: true, videoGenerationStatus: true } });
      if (vl[0]?.videoUrl) ok("VIDEO", vl[0].videoUrl.slice(0, 80));
      else if (vl[0]?.videoGenerationStatus === "PENDING" || vl[0]?.videoGenerationStatus === "GENERATING") ok("VIDEO", "Generating async");
      else fail("VIDEO", "No video");
    } catch (e) { fail("VIDEO", e.message); }
  }

  // STEP 4: Publish
  console.log("\n=== STEP 4: PUBLISH ===");
  const { publishProductRecord } = await import("../src/server/services/product-writes.js");
  try {
    const pub = await publishProductRecord({ productId: product.id, actorId: creatorId });
    ok("PUBLISHED", pub.slug);
  } catch (e) { fail("PUBLISH", e.message); }
  const pp = await prisma.product.findUnique({ where: { id: product.id } });
  if (pp?.status === "PUBLISHED") ok("PRODUCT_STATUS", "PUBLISHED"); else fail("PRODUCT_STATUS", String(pp?.status));

  // STEP 5: Buy (test mode)
  console.log("\n=== STEP 5: BUY (TEST MODE) ===");
  await prisma.user.create({ data: { id: buyerId, email: buyerId + "@test.com", name: "E2E Buyer", roles: JSON.stringify(["BUYER"]), passwordHash: "test" } });
  console.log("  Buyer:", buyerId);

  const { createOrderWithPayment } = await import("../src/server/services/orders.js");
  let orderId = null;
  try {
    const orderResult = await createOrderWithPayment({ buyerId, productId: product.id });
    orderId = orderResult.orderId;
    console.log("  Order:", orderId);
    console.log("  Reference:", orderResult.reference);
    console.log("  Provider:", orderResult.paymentIntent?.provider);
    console.log("  Test mode:", orderResult.testMode);
    ok("ORDER_CREATED", orderId);
  } catch (e) { fail("ORDER_CREATE", e.message); }

  if (orderId) {
    const { confirmLocalTestPayment } = await import("../src/server/payments/test-settlement.js");
    try {
      const settlement = await confirmLocalTestPayment({ orderId, buyerId });
      console.log("  Settlement:", JSON.stringify(settlement));
      if (settlement.alreadyPaid) ok("SETTLEMENT", "Already paid (idempotent)");
      else ok("SETTLEMENT", "Paid + commissions distributed");
    } catch (e) { fail("SETTLEMENT", e.message); }
  }

  // STEP 6: Verify everything
  console.log("\n=== STEP 6: VERIFICATION ===");

  // Check order status
  const order = orderId ? await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } }) : null;
  if (order?.status === "PAID") ok("ORDER_STATUS", "PAID"); else fail("ORDER_STATUS", String(order?.status));

  // Check commissions
  const commissions = orderId ? await prisma.commission.findMany({ where: { orderId } }) : [];
  console.log("  Commissions:", commissions.length);
  if (commissions.length > 0) {
    ok("COMMISSIONS", commissions.length + " records");
    for (const c of commissions.slice(0, 5)) {
      console.log("    " + c.role + ": " + c.amountUsdt + " USDT -> " + (c.earnerId || "").slice(0, 20));
    }
  } else fail("COMMISSIONS", "No commissions created");

  // Check wallet
  const creatorWallet = await prisma.wallet.findUnique({ where: { userId: creatorId } });
  if (creatorWallet) {
    console.log("  Creator wallet balance:", creatorWallet.availableUsdt, "USDT");
    ok("WALLET", "exists, balance=" + creatorWallet.availableUsdt);
  } else fail("WALLET", "Not found");

  // Check wallet transactions
  const walletTxns = creatorWallet ? await prisma.walletTransaction.findMany({ where: { walletId: creatorWallet.id } }) : [];
  console.log("  Wallet transactions:", walletTxns.length);
  if (walletTxns.length > 0) ok("WALLET_TXN", walletTxns.length + " entries"); else fail("WALLET_TXN", "No transactions");

  // Check enrollment
  const enrollment = await prisma.enrollment.findFirst({ where: { userId: buyerId, productId: product.id } });
  if (enrollment) ok("ENROLLMENT", "Active"); else fail("ENROLLMENT", "Not found");

  // Check course access
  const course = await prisma.course.findUnique({ where: { productId: product.id }, include: { modules: { include: { lessons: true } } } });
  if (course) ok("COURSE", course.modules.length + " modules"); else fail("COURSE", "Not found");

  // Check lesson images in DB
  const lessonsWithImages = await prisma.lesson.findMany({ where: { moduleId: { in: dbModules.map(m => m.id) } }, select: { imageUrl: true, title: true } });
  const imgCount = lessonsWithImages.filter(l => l.imageUrl && l.imageUrl.length > 10).length;
  console.log("  Lessons with images:", imgCount + "/" + lessonsWithImages.length);

  // Check video in DB
  const lessonsWithVideo = await prisma.lesson.findMany({ where: { moduleId: { in: dbModules.map(m => m.id) }, videoEnabled: true }, select: { videoUrl: true, videoGenerationStatus: true, title: true } });
  console.log("  Video lessons:", lessonsWithVideo.length);
  for (const vl of lessonsWithVideo) {
    console.log("    " + vl.title + ": status=" + vl.videoGenerationStatus + " url=" + (vl.videoUrl ? "YES" : "NO"));
  }

  // Check progress (no progress yet since buyer hasn't interacted)
  const progress = await prisma.lessonProgress.findMany({ where: { userId: buyerId } });
  console.log("  Progress entries:", progress.length);

  // Check certificate
  const cert = await prisma.certificate.findFirst({ where: { userId: buyerId, productId: product.id } });
  console.log("  Certificate:", cert ? "exists" : "not yet (expected - course not completed)");

  // Summary
  console.log("\n=== ERRORS ===");
  if (errors.length === 0) console.log("  NONE");
  else errors.forEach(e => console.log("  " + e));

  // Cleanup
  await prisma.user.delete({ where: { id: creatorId } }).catch(() => {});
  await prisma.user.delete({ where: { id: buyerId } }).catch(() => {});
  await prisma.$disconnect();

  if (errors.length > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
