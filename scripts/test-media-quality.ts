import { runPipeline } from "@/lib/ai/pipeline";
import type { ProductSpec } from "@/lib/ai/converse";
import prisma from "@/lib/db";

const COURSES: Array<{ name: string; spec: ProductSpec }> = [
  {
    name: "PROGRAMMING",
    spec: {
      topic: "Curso de programación en TypeScript: de cero a avanzado, con APIs, React, Node.js y bases de datos",
      productType: "COURSE",
      title: "TypeScript Pro",
      level: "intermediate",
      audience: "Desarrolladores",
      depth: "basic",
      moduleCount: 5,
      hasImages: true,
      hasVideos: false,
      hasExercises: true,
      hasQuizzes: true,
      hasCertificate: true,
      hasResources: true,
    },
  },
  {
    name: "FINANCE",
    spec: {
      topic: "Curso de finanzas personales e inversiones: presupuesto, bolsa, impuestos y trading con análisis técnico",
      productType: "COURSE",
      title: "Finanzas 360",
      level: "beginner",
      audience: "Emprendedores",
      depth: "basic",
      moduleCount: 5,
      hasImages: true,
      hasVideos: false,
      hasExercises: true,
      hasQuizzes: true,
      hasCertificate: true,
      hasResources: true,
    },
  },
  {
    name: "MEDICINE",
    spec: {
      topic: "Curso de anatomía y fisiología humana para estudiantes de medicina, con casos clínicos",
      productType: "COURSE",
      title: "Anatomía Humana",
      level: "intermediate",
      audience: "Estudiantes de medicina",
      depth: "basic",
      moduleCount: 5,
      hasImages: true,
      hasVideos: false,
      hasExercises: true,
      hasQuizzes: true,
      hasCertificate: true,
      hasResources: true,
    },
  },
  {
    name: "PHOTOGRAPHY",
    spec: {
      topic: "Curso de fotografía profesional: exposición, composición, iluminación, encuadre y retoque con Lightroom",
      productType: "COURSE",
      title: "Fotografía Pro",
      level: "beginner",
      audience: "Principiantes",
      depth: "basic",
      moduleCount: 5,
      hasImages: true,
      hasVideos: false,
      hasExercises: true,
      hasQuizzes: true,
      hasCertificate: true,
      hasResources: true,
    },
  },
];

async function main() {
  console.log("=== MEDIA QUALITY ENGINE TEST ===\n");

  const results: Array<{ name: string; blueprint: Awaited<ReturnType<typeof runPipeline>>["blueprint"] }> = [];

  for (const course of COURSES) {
    console.log(`\n--- Generating ${course.name} ---`);
    const t0 = Date.now();
    const result = await runPipeline(course.spec, (p) => console.log(`  [${p.step}] ${p.message}`));
    console.log(`  Done in ${((Date.now() - t0)/1000).toFixed(1)}s | ${result.blueprint.modules.length} modules | steps: ${result.steps.length}`);
    results.push({ name: course.name, blueprint: result.blueprint });

    // Print media distribution
    const specs = result.blueprint.modules.flatMap(m => m.lessons.map(l => (l as unknown as { mediaSpec?: { type: string; purpose: string; visualPrompt?: string; data?: unknown; overlays?: unknown[] } }).mediaSpec)).filter(Boolean) as Array<{ type: string; purpose: string }>;
    const dist = new Map<string, number>();
    for (const s of specs) dist.set(s.type, (dist.get(s.type) ?? 0) + 1);
    console.log(`  Media types: ${JSON.stringify(Object.fromEntries(dist))}`);
    console.log(`  Purposes: ${[...new Set(specs.map(s => s.purpose))].join(", ")}`);

    // Validate no IMAGE with text
    const badImages = result.blueprint.modules.flatMap(m => m.lessons).filter(l => {
      const ms = (l as unknown as { mediaSpec?: { type: string; visualPrompt?: string } }).mediaSpec;
      return ms?.type === "IMAGE" && ms.visualPrompt && /text|label|caption/i.test(ms.visualPrompt) && !ms.visualPrompt.includes("no text");
    });
    if (badImages.length > 0) console.log(`  WARN: ${badImages.length} IMAGE with text instructions`);

    // Print 2 examples
    const lessons = result.blueprint.modules.flatMap(m => m.lessons);
    for (const l of lessons.slice(0, 2)) {
      const ms = (l as unknown as { mediaSpec?: { type: string; purpose: string; reasoning?: string; visualPrompt?: string } }).mediaSpec;
      console.log(`    Lesson: "${l.title.slice(0,60)}" -> ${ms?.type} (${ms?.purpose}) | prompt: ${(ms?.visualPrompt ?? "").slice(0,80)}`);
    }

    // Quick SVG check
    const svgCount = result.blueprint.modules.flatMap(m => m.lessons).filter(l => (l as unknown as { mediaSvg?: string }).mediaSvg?.length ?? 0 > 100).length;
    console.log(`  SVGs generated: ${svgCount}/${specs.length}`);
  }

  console.log("\n=== SUMMARY ===");
  for (const r of results) {
    const specs = r.blueprint.modules.flatMap(m => m.lessons.map(l => (l as unknown as { mediaSpec?: { type: string } }).mediaSpec)).filter(Boolean) as Array<{ type: string }>;
    const dist = Object.fromEntries([...specs.reduce((m, s) => m.set(s.type, (m.get(s.type) ?? 0)+1), new Map<string,number>())]);
    console.log(`${r.name}: ${JSON.stringify(dist)}`);
  }

  // Diversity check: each course should have at least 2 different media types (except maybe very short)
  let diversityPass = true;
  for (const r of results) {
    const specs = r.blueprint.modules.flatMap(m => m.lessons.map(l => (l as unknown as { mediaSpec?: { type: string } }).mediaSpec)).filter(Boolean) as Array<{ type: string }>;
    const uniq = new Set(specs.map(s => s.type)).size;
    if (uniq < 2) {
      console.log(`FAIL ${r.name}: only ${uniq} media types`);
      diversityPass = false;
    } else {
      console.log(`PASS ${r.name}: ${uniq} distinct types`);
    }
  }

  // Cross-course diversity: not all courses same distribution
  const allTypes = results.map(r => {
    const specs = r.blueprint.modules.flatMap(m => m.lessons.map(l => (l as unknown as { mediaSpec?: { type: string } }).mediaSpec)).filter(Boolean) as Array<{ type: string }>;
    return new Set(specs.map(s => s.type));
  });
  const programmingHasCode = allTypes[0].has("CODE_VISUAL") || allTypes[0].has("DIAGRAM");
  const financeHasChart = allTypes[1].has("CHART") || allTypes[1].has("COMPARISON");
  const medicineHasDiagram = allTypes[2].has("DIAGRAM") || allTypes[2].has("IMAGE_WITH_OVERLAY");
  const photoHasImage = allTypes[3].has("IMAGE");

  console.log(`\nDomain checks:`);
  console.log(`  Programming has CODE/DIAGRAM: ${programmingHasCode ? "PASS" : "FAIL"}`);
  console.log(`  Finance has CHART/COMPARISON: ${financeHasChart ? "PASS" : "FAIL"}`);
  console.log(`  Medicine has DIAGRAM/OVERLAY: ${medicineHasDiagram ? "PASS" : "FAIL"}`);
  console.log(`  Photography has IMAGE: ${photoHasImage ? "PASS" : "FAIL"}`);

  const overall = diversityPass && programmingHasCode && financeHasChart && medicineHasDiagram && photoHasImage;
  console.log(`\nOVERALL: ${overall ? "PASS" : "FAIL"}`);

  await prisma.$disconnect();
  if (!overall) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
