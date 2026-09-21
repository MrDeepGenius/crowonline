/**
 * End-to-end validation script.
 * Checks DB state of the most recent published criminalística course.
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findFirst({
    where: { title: { contains: "Criminalística" }, status: "PUBLISHED" },
    orderBy: { createdAt: "asc" },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { position: "asc" },
            include: {
              lessons: {
                orderBy: { position: "asc" },
                include: { exercises: true },
              },
            },
          },
        },
      },
      resources: true,
    },
  });

  if (!product) { console.error("Product not found"); return; }

  const allLessons = product.course?.modules.flatMap(m => m.lessons) ?? [];
  const allExercises = allLessons.flatMap(l => l.exercises);
  const quizzes = allExercises.filter(e => e.kind === "QUIZ");
  const lessonsWithImage = allLessons.filter(l => l.imageUrl);
  const modulesWithImage = product.course?.modules.filter(m => m.imageUrl) ?? [];

  console.log("=== PRODUCT ===");
  console.log(`Title:          ${product.title}`);
  console.log(`Status:         ${product.status}`);
  console.log(`Slug:           ${product.slug}`);
  console.log(`CoverImageUrl:  ${product.coverImageUrl ? "✅ " + product.coverImageUrl.slice(0, 70) + "..." : "❌ MISSING"}`);

  console.log("\n=== STRUCTURE ===");
  console.log(`Modules:        ${product.course?.modules.length ?? 0}`);
  console.log(`Lessons:        ${allLessons.length}`);
  console.log(`Exercises:      ${allExercises.length}`);
  console.log(`Quizzes:        ${quizzes.length}`);
  console.log(`Resources:      ${product.resources.length}`);

  console.log("\n=== MULTIMEDIA ===");
  console.log(`Modules with image: ${modulesWithImage.length}/${product.course?.modules.length}`);
  console.log(`Lessons with image: ${lessonsWithImage.length}/${allLessons.length}`);

  console.log("\n=== MODULES ===");
  for (const mod of product.course?.modules ?? []) {
    const imgStatus = mod.imageUrl ? `✅ ${mod.imageUrl.slice(0, 60)}...` : `❌ no image`;
    console.log(`  [${mod.imageGenerationStatus ?? "null"}] "${mod.title}" → ${imgStatus}`);
  }

  console.log("\n=== LESSON IMAGES (first 10) ===");
  for (const lesson of allLessons.slice(0, 10)) {
    const img = lesson.imageUrl ? `✅` : `❌`;
    const status = lesson.imageGenerationStatus ?? "null";
    console.log(`  [${status}] ${img} "${lesson.title.slice(0, 50)}"`);
  }

  console.log("\n=== CONTENT SAMPLE ===");
  const sampleLesson = allLessons.find(l => l.content && l.content.length > 200);
  if (sampleLesson) {
    console.log(`Lesson: "${sampleLesson.title}"`);
    console.log(`Content length: ${sampleLesson.content.length} chars`);
    console.log(`Preview:\n${sampleLesson.content.slice(0, 400)}\n...`);
  }

  console.log("\n=== QUIZZES SAMPLE ===");
  for (const q of quizzes.slice(0, 3)) {
    const opts = JSON.parse(q.options || "[]") as string[];
    console.log(`  Q: "${q.title}"`);
    console.log(`  Options: ${opts.length > 0 ? opts.join(" | ") : "MISSING"}`);
    console.log(`  Answer: ${q.correctAnswer || "MISSING"}`);
    console.log(`  Explanation: ${q.explanation ? "✅" : "❌"}\n`);
  }

  console.log("\n=== RESOURCES ===");
  for (const r of product.resources) {
    console.log(`  [${r.kind}] "${r.title}"`);
  }

  console.log("\n=== CERTIFICATE ===");
  console.log(`Enabled: ${product.course?.certificateEnabled ? "✅" : "❌"}`);

  console.log("\n=== VIDEO STATUS ===");
  const withVideo = allLessons.filter(l => l.videoUrl);
  console.log(`Lessons with videoUrl: ${withVideo.length} (should be 0 — no video provider configured)`);
  console.log(`Verdict: ${withVideo.length === 0 ? "✅ No fake videos" : "❌ Fake video URLs found"}`);

  console.log("\n=== GENERATION IDs (sample) ===");
  for (const l of lessonsWithImage.slice(0, 3)) {
    console.log(`  Lesson: "${l.title.slice(0, 40)}"`);
    console.log(`    imageUrl:          ${l.imageUrl?.slice(0, 70)}...`);
    console.log(`    imageGenerationId: ${l.imageGenerationId}`);
    console.log(`    status:            ${l.imageGenerationStatus}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
