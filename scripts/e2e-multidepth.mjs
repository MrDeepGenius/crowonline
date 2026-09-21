/**
 * E2E Multi-Depth Course Generation Test
 *
 * Tests 3 courses at different depth levels:
 *   1. BASIC:   "Recetas fáciles con el celular" (5-6 modules)
 *   2. ADVANCED: "Machine Learning desde cero hasta experto" (10-12 modules)
 *   3. PROFESIONAL: "Marketing digital completo" (12-16 modules, project, evaluations)
 *
 * Each course tests: structure generation, module content, quality, DB persistence.
 * Skips multimedia/publish/buy (covered by e2e-full-a.mjs).
 */

import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

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
const errors = [];
let passed = 0;

function fail(label, detail) { errors.push(label + ": " + detail); console.error("  FAIL " + label + ": " + detail); }
function ok(label, detail) { passed++; console.log("  OK   " + label + (detail ? ": " + detail : "")); }

// Depth config — mirrors DEPTH_CONFIG from converse.ts
const DEPTH = {
  basic:        { modules: [5, 6],   lessonsPerModule: [3, 5], label: "Básico" },
  advanced:     { modules: [10, 12], lessonsPerModule: [5, 8], label: "Avanzado" },
  professional: { modules: [12, 16], lessonsPerModule: [6, 10], label: "Profesional" },
};

const COURSES = [
  {
    name: "BASIC — Recetas fáciles con el celular",
    depth: "basic",
    idea: "Curso de recetas fáciles con el celular para principiantes, imágenes, videos, ejercicios y certificado.",
    spec: {
      topic: "recetas fáciles con el celular",
      productType: "COURSE",
      hasImages: true,
      hasVideos: true,
      hasExercises: true,
      hasQuizzes: true,
      hasCertificate: true,
      hasResources: true,
      level: "beginner",
      audience: "Principiantes sin experiencia culinaria",
      depth: "basic",
    },
  },
  {
    name: "ADVANCED — Machine Learning",
    depth: "advanced",
    idea: "Curso avanzado de Machine Learning, de 0 a 100, con Python, TensorFlow y proyectos reales.",
    spec: {
      topic: "machine learning con python y tensorflow",
      productType: "COURSE",
      hasImages: true,
      hasVideos: true,
      hasExercises: true,
      hasQuizzes: true,
      hasCertificate: true,
      hasResources: true,
      level: "advanced",
      audience: "Desarrolladores con experiencia en Python",
      depth: "advanced",
    },
  },
  {
    name: "PROFESSIONAL — Marketing Digital Completo",
    depth: "professional",
    idea: "Curso profesional de marketing digital completamente, master, con certificación profesional, proyecto final y casos de estudio.",
    spec: {
      topic: "marketing digital completo y estrategias avanzadas",
      productType: "COURSE",
      hasImages: true,
      hasVideos: true,
      hasExercises: true,
      hasQuizzes: true,
      hasCertificate: true,
      hasResources: true,
      level: "intermediate",
      audience: "Emprendedores y profesionales de marketing",
      depth: "professional",
    },
  },
];

function validateCourse(course, blueprint) {
  const config = DEPTH[course.depth];
  const allLessons = blueprint.modules.flatMap(m => m.lessons);
  const allExercises = allLessons.flatMap(l => l.exercises);

  console.log(`  Modules: ${blueprint.modules.length} (expected ${config.modules[0]}-${config.modules[1]})`);
  console.log(`  Lessons: ${allLessons.length} (avg ${(allLessons.length / blueprint.modules.length).toFixed(1)}/module)`);
  console.log(`  Exercises: ${allExercises.length}`);

  // Module count
  if (blueprint.modules.length >= config.modules[0] && blueprint.modules.length <= config.modules[1] + 2) {
    ok("MODULE_COUNT", String(blueprint.modules.length));
  } else {
    fail("MODULE_COUNT", `${blueprint.modules.length} not in ${config.modules[0]}-${config.modules[1]}`);
  }

  // Lessons per module — at least half the modules should meet minimum
  let modulesWithEnoughLessons = 0;
  for (const mod of blueprint.modules) {
    if (mod.lessons.length >= config.lessonsPerModule[0] - 1) modulesWithEnoughLessons++;
  }
  const ratio = modulesWithEnoughLessons / blueprint.modules.length;
  if (ratio >= 0.6) {
    ok("LESSONS_PER_MODULE", `${modulesWithEnoughLessons}/${blueprint.modules.length} modules meet minimum`);
  } else {
    fail("LESSONS_PER_MODULE", `Only ${modulesWithEnoughLessons}/${blueprint.modules.length} modules meet minimum ${config.lessonsPerModule[0]}`);
  }

  // Real content (not skeleton/placeholder)
  const skeletonKw = ["Contenido pendiente de generación", "Paso 1", "Paso 2", "Paso 3", "placeholder"];
  let realContent = 0;
  for (const l of allLessons) {
    if (l.content && l.content.length > 80 && !skeletonKw.some(k => l.content.includes(k))) realContent++;
  }
  console.log(`  Real content: ${realContent}/${allLessons.length}`);
  if (realContent >= allLessons.length * 0.7) {
    ok("REAL_CONTENT", `${realContent}/${allLessons.length}`);
  } else {
    fail("REAL_CONTENT", `Only ${realContent}/${allLessons.length} have real content`);
  }

  // Image prompts
  const withImg = allLessons.filter(l => l.imagePrompt && l.imagePrompt.length > 10);
  console.log(`  Image prompts: ${withImg.length}/${allLessons.length}`);
  if (withImg.length >= allLessons.length * 0.5) {
    ok("IMAGE_PROMPTS", `${withImg.length}/${allLessons.length}`);
  } else {
    fail("IMAGE_PROMPTS", `Only ${withImg.length}/${allLessons.length}`);
  }

  // Quizzes
  const quizzes = allExercises.filter(e => e.kind === "QUIZ" && e.options?.length >= 2);
  console.log(`  Quizzes: ${quizzes.length}`);
  if (quizzes.length >= Math.ceil(allLessons.length * 0.3)) {
    ok("QUIZ_COUNT", String(quizzes.length));
  } else {
    fail("QUIZ_COUNT", `Only ${quizzes.length}, expected >=${Math.ceil(allLessons.length * 0.3)}`);
  }

  // Professional-only: project exercises and final project
  if (course.depth === "professional") {
    const projects = allExercises.filter(e => e.kind === "PROJECT");
    console.log(`  Projects: ${projects.length}`);
    if (projects.length > 0) ok("PROJECTS", String(projects.length));
    else fail("PROJECTS", "Professional course should have PROJECT exercises");
  }

  // Deduplication — no repeated lesson titles
  const titles = allLessons.map(l => l.title.toLowerCase().trim());
  const uniqueTitles = new Set(titles);
  if (uniqueTitles.size === titles.length) {
    ok("DEDUP_TITLES", "All lesson titles unique");
  } else {
    fail("DEDUP_TITLES", `${titles.length - uniqueTitles.size} duplicates found`);
  }

  // Content specificity — check first lessons for generic text
  const genericKw = ["lorem ipsum", "contenido de ejemplo", "ejemplo de contenido"];
  const genericCount = allLessons.filter(l => genericKw.some(k => l.content?.toLowerCase().includes(k))).length;
  if (genericCount === 0) {
    ok("NO_GENERIC_CONTENT", "No generic placeholder content");
  } else {
    fail("NO_GENERIC_CONTENT", `${genericCount} lessons have generic content`);
  }

  // Print first 2 modules preview
  for (const mod of blueprint.modules.slice(0, 2)) {
    console.log(`  Module: ${mod.title}`);
    const l = mod.lessons[0];
    if (l) {
      console.log(`    Lesson: ${l.title}`);
      console.log(`    Content: ${(l.content || "").slice(0, 150)}...`);
    }
  }

  return { allLessons, allExercises, realContent };
}

async function materializeAndVerify(course, blueprint, prisma, creatorId) {
  const { saveBlueprint, createDraftFromBlueprint } = await import("../src/server/services/creator.js");
  const saved = await saveBlueprint({ userId: creatorId, idea: course.idea, blueprint, provider: "nvidia" });
  const { product } = await createDraftFromBlueprint({ creatorId, blueprint, blueprintId: saved.id });
  ok("MATERIALIZED", product.id);

  const dbModules = await prisma.module.findMany({ where: { course: { productId: product.id } }, orderBy: { position: "asc" } });
  const dbLessons = await prisma.lesson.findMany({ where: { moduleId: { in: dbModules.map(m => m.id) } }, orderBy: { position: "asc" } });
  console.log(`  DB: ${dbModules.length} modules, ${dbLessons.length} lessons`);

  if (dbModules.length >= 3) ok("DB_MODULES", String(dbModules.length));
  else fail("DB_MODULES", `Only ${dbModules.length}`);

  if (dbLessons.length >= 10) ok("DB_LESSONS", String(dbLessons.length));
  else fail("DB_LESSONS", `Only ${dbLessons.length}`);

  const withContent = dbLessons.filter(l => l.content && l.content.length > 80);
  if (withContent.length >= dbLessons.length * 0.5) ok("DB_CONTENT", `${withContent.length}/${dbLessons.length}`);
  else fail("DB_CONTENT", `Only ${withContent.length}/${dbLessons.length} have content`);

  return { product, dbModules, dbLessons };
}

async function main() {
  console.log("=== E2E MULTI-DEPTH GENERATION TEST ===\n");

  const { runPipeline } = await import("../src/lib/ai/pipeline.js");

  const creatorId = "e2e-multidepth-" + Date.now();
  await prisma.user.create({
    data: {
      id: creatorId,
      email: creatorId + "@test.com",
      name: "E2E Multi-Depth Creator",
      roles: JSON.stringify(["CREATOR"]),
      passwordHash: "test",
    },
  });

  for (const course of COURSES) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`COURSE: ${course.name}`);
    console.log(`${"=".repeat(60)}`);

    const result = await runPipeline(course.spec, (p) => console.log("  [pipeline] " + p.message));
    const blueprint = result.blueprint;
    console.log(`  Title: ${blueprint.title}`);
    console.log(`  Provider: ${result.provider} (${result.mode})`);

    validateCourse(course, blueprint);
    await materializeAndVerify(course, blueprint, prisma, creatorId);
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("SUMMARY");
  console.log(`${"=".repeat(60)}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${errors.length}`);
  if (errors.length > 0) {
    console.log("\nFAILURES:");
    errors.forEach(e => console.log("  " + e));
  }

  // Cleanup
  await prisma.user.delete({ where: { id: creatorId } }).catch(() => {});
  await prisma.$disconnect();

  if (errors.length > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
