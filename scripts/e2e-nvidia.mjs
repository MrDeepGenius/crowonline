import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

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
const TEST_IDEA = "Quiero crear un curso de fotografía con celular para principiantes, de 5 módulos, con imágenes, videos, ejercicios y certificado.";
const errors = [];
function fail(l, d) { errors.push(l + ": " + d); console.error("  FAIL " + l + ": " + d); }
function ok(l, d) { console.log("  OK   " + l + (d ? ": " + d : "")); }

async function main() {
  console.log("=== E2E NVIDIA TEST ===");
  console.log("Idea:", TEST_IDEA);
  console.log("NVIDIA_MODEL:", process.env.NVIDIA_MODEL);

  const { converse } = await import("../src/lib/ai/converse.js");
  const { createDraftFromBlueprint, saveBlueprint } = await import("../src/server/services/creator.js");

  // Verify NVIDIA is live
  const { listConversationalProviders } = await import("../src/lib/ai/providers/index.js");
  const nvidia = listConversationalProviders().find(p => p.id === "nvidia");
  console.log("NVIDIA configured:", nvidia?.isConfigured());
  console.log("NVIDIA model:", nvidia?.model);

  let spec = {};
  let phase = "DISCOVERY";
  let history = [];

  // Phase 1: DISCOVERY
  console.log("\n--- Phase 1: DISCOVERY ---");
  const r1 = await converse({ message: TEST_IDEA, history, phase, spec, blueprint: null });
  console.log("Reply:", r1.reply?.slice(0, 200));
  console.log("Phase:", r1.phase);
  console.log("Provider:", r1.provider, "Mode:", r1.mode);
  spec = r1.spec || spec;
  phase = r1.phase || phase;
  history.push({ role: "user", content: TEST_IDEA });
  history.push({ role: "assistant", content: r1.reply || "" });

  if (r1.provider !== "nvidia") fail("PROVIDER_DISCOVERY", "Expected nvidia, got " + r1.provider);

  ok("productType", spec.productType);
  ok("level", spec.level);
  ok("moduleCount", String(spec.moduleCount));
  ok("hasImages", String(spec.hasImages));
  ok("hasVideos", String(spec.hasVideos));
  ok("hasExercises", String(spec.hasExercises));
  ok("hasCertificate", String(spec.hasCertificate));
  ok("hasResources", String(spec.hasResources));

  // Phase 2: GATHERING
  console.log("\n--- Phase 2: GATHERING ---");
  if (phase !== "READY") {
    const answers = ["Curso online", "Principiantes", "Sí imágenes", "Sí videos", "Sí ejercicios", "Sí quiz", "Sí certificado", "Sí recursos", "5 módulos"];
    for (const msg of answers) {
      if (phase === "READY" || phase === "GENERATING" || phase === "REFINING") break;
      const r = await converse({ message: msg, history, phase, spec, blueprint: null });
      spec = { ...spec, ...(r.spec || {}) };
      phase = r.phase || phase;
      history.push({ role: "user", content: msg });
      history.push({ role: "assistant", content: r.reply || "" });
      console.log("  [" + phase + "] " + msg);
    }
  }

  // Phase 3: GENERATING
  console.log("\n--- Phase 3: GENERATING ---");
  if (phase !== "READY") {
    const r = await converse({ message: "dale listo", history, phase, spec, blueprint: null });
    spec = { ...spec, ...(r.spec || {}) };
    phase = r.phase || phase;
    history.push({ role: "user", content: "dale listo" });
    history.push({ role: "assistant", content: r.reply || "" });
  }

  console.log("Phase before generate:", phase);
  const gen = await converse({ message: "Sí, generá el curso", history, phase, spec, blueprint: null });
  console.log("Provider:", gen.provider);
  console.log("Mode:", gen.mode);
  console.log("Phase:", gen.phase);
  console.log("Reply:", (gen.reply || "").slice(0, 300));

  if (gen.mode !== "live") fail("MODE", "Expected live, got " + gen.mode);
  if (gen.provider !== "nvidia") fail("PROVIDER_GEN", "Expected nvidia, got " + gen.provider);

  const blueprint = gen.blueprint;
  if (!blueprint) { fail("BLUEPRINT", "No blueprint generated"); return; }

  console.log("\n--- Blueprint ---");
  console.log("Title:", blueprint.title);
  console.log("Modules:", blueprint.modules.length);

  const allLessons = blueprint.modules.flatMap(m => m.lessons);
  const allExercises = allLessons.flatMap(l => l.exercises);
  const quizzes = allExercises.filter(e => e.kind === "QUIZ");
  console.log("Lessons:", allLessons.length);
  console.log("Exercises:", allExercises.length);
  console.log("Quizzes:", quizzes.length);

  // Verify content
  console.log("\n--- Content Verification ---");
  const photoKw = ["fotograf", "foto", "celular", "imagen", "luz", "compos", "encuadre", "color", "editar", "edición", "cámara", "retrato", "paisaj", "selfie", "hdr", "brillo", "contraste", "expo", "foco", "pixel"];
  const presetKw = ["criminal", "homicidio", "forense", "mercado financiero", "inversión", "embudo", "marketing digital", "automatizar", "chatgpt"];

  let photoHits = 0, presetHits = 0;
  for (const l of allLessons) {
    const txt = (l.title + " " + l.content + " " + (l.imagePrompt || "")).toLowerCase();
    if (photoKw.some(kw => txt.includes(kw))) photoHits++;
    if (presetKw.some(kw => txt.includes(kw))) presetHits++;
  }
  console.log("Photography-specific:", photoHits + "/" + allLessons.length);
  console.log("Preset contamination:", presetHits);
  if (presetHits > 0) fail("NO_PRESETS", "Found " + presetHits);
  else ok("NO_PRESETS");
  if (photoHits > 0) ok("PHOTO_SPECIFIC", photoHits + "/" + allLessons.length);
  else fail("PHOTO_SPECIFIC", "No photography content");

  // Show sample content
  for (const mod of blueprint.modules.slice(0, 2)) {
    console.log("\n  Module:", mod.title);
    for (const l of mod.lessons.slice(0, 1)) {
      console.log("    Lesson:", l.title);
      console.log("    Content:", (l.content || "").slice(0, 300));
      console.log("    ImagePrompt:", (l.imagePrompt || "").slice(0, 150));
    }
  }

  // DB Persistence
  console.log("\n--- DB Persistence ---");
  const testUserId = "e2e-nvidia-" + Date.now();
  try {
    await prisma.user.create({ data: { id: testUserId, email: testUserId + "@test.com", name: "E2E NVIDIA Test", roles: "CREATOR", passwordHash: "test" } });
    console.log("  Created user:", testUserId);

    const saved = await saveBlueprint({ userId: testUserId, idea: TEST_IDEA, blueprint, provider: gen.provider });
    console.log("  Blueprint saved:", saved.id);

    const { product, quality } = await createDraftFromBlueprint({ creatorId: testUserId, blueprint, blueprintId: saved.id });
    console.log("  Product:", product.id, product.title);
    console.log("  Slug:", product.slug);
    console.log("  Quality:", quality.score);
    ok("DB_PERSIST", product.id);

    const modules = await prisma.module.findMany({ where: { course: { productId: product.id } } });
    const lessons = await prisma.lesson.findMany({ where: { moduleId: { in: modules.map(m => m.id) } } });
    const exercises = await prisma.exercise.findMany({ where: { lessonId: { in: lessons.map(l => l.id) } } });
    console.log("  DB modules:", modules.length);
    console.log("  DB lessons:", lessons.length);
    console.log("  DB exercises:", exercises.length);

    // Verify lesson content in DB
    const firstLesson = lessons[0];
    if (firstLesson?.content && firstLesson.content.length > 100) ok("LESSON_CONTENT", firstLesson.content.length + " chars");
    else fail("LESSON_CONTENT", "Short or missing content");

  } catch (e) {
    fail("DB", e.message);
  }

  // Cleanup
  try { await prisma.user.delete({ where: { id: testUserId } }).catch(() => {}); } catch {}
  await prisma.$disconnect();

  console.log("\n=== RESULT ===");
  console.log("Provider:", gen.provider);
  console.log("Mode:", gen.mode);
  console.log("Modules:", blueprint.modules.length);
  console.log("Lessons:", allLessons.length);
  console.log("Errors:", errors.length === 0 ? "NONE" : errors.join("; "));
  if (errors.length > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
