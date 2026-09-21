import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });
import { PrismaClient } from "@prisma/client";
import { LeonardoProvider } from "../src/lib/ai/providers/leonardo";

const prisma = new PrismaClient();

const PROMPTS: Record<string, string> = {
  "Observación Metódica":
    "Crime scene investigator systematically searching for evidence with methodical grid search technique, forensic equipment",
  "Fijación y Documentación":
    "Forensic photographer documenting crime scene evidence with professional camera, measuring scale ruler and numbered yellow markers",
  "Tipos de Evidencia Física":
    "Collection of labeled forensic evidence bags containing fingerprints, DNA swabs, bullet casings and fiber samples in forensic laboratory",
  "ADN Forense":
    "DNA forensic analysis laboratory with gel electrophoresis equipment showing genetic bands, scientist in white coat examining results",
  "Recolección y Embalaje":
    "Forensic technician collecting biological evidence with sterile swabs and tweezers, paper evidence bags and chain of custody labels",
  "Cadena de Custodia":
    "Chain of custody documentation process: forensic technician labeling evidence bags with case numbers, signatures and timestamps",
  "Sistemas de Identificación":
    "AFIS fingerprint comparison system on computer screen, forensic examiner comparing latent fingerprint with known print database",
  "Revelado de Huellas Latentes":
    "Forensic technician applying fingerprint powder with soft brush on glass surface revealing latent fingerprint patterns",
  "Balística Forense Introductoria":
    "Ballistics comparison microscope showing bullet striations, cartridge cases and trajectory analysis in forensic laboratory",
  "Principios de la Reconstrucción":
    "3D digital crime scene reconstruction showing trajectory paths, body position markers and spatial evidence mapping",
  "Informe Pericial":
    "Expert forensic witness presenting technical report in courtroom with evidence photographs and detailed documentation",
  "Ética del Criminalista":
    "Professional forensic scientist at workbench with oath certificate, scales of justice symbol representing ethics and integrity",
};

async function main() {
  console.log("🖼️  Adding image prompts to lessons...\n");

  for (const [title, prompt] of Object.entries(PROMPTS)) {
    const result = await prisma.lesson.updateMany({
      where: { title: { contains: title }, imagePrompt: null },
      data: { imagePrompt: prompt, imageGenerationStatus: "PENDING" },
    });
    if (result.count > 0) console.log(`✓ ${title}`);
  }

  console.log("\n🎨 Generating 2 additional images with Leonardo...\n");

  const leonardo = new LeonardoProvider();
  const pending = await prisma.lesson.findMany({
    where: {
      imagePrompt: { not: null },
      OR: [{ imageUrl: null }, { imageUrl: "" }],
      imageGenerationStatus: { not: "COMPLETED" },
    },
    select: { id: true, title: true, imagePrompt: true },
    take: 2,
  });

  let done = 0;
  for (const lesson of pending) {
    if (!lesson.imagePrompt) continue;
    console.log(`Generating: "${lesson.title}"`);
    try {
      await prisma.lesson.update({ where: { id: lesson.id }, data: { imageGenerationStatus: "GENERATING" } });
      const genId = await leonardo.startGeneration(lesson.imagePrompt);
      await prisma.lesson.update({ where: { id: lesson.id }, data: { imageGenerationId: genId } });
      const url = await leonardo.pollForResult(genId);
      if (url) {
        await prisma.lesson.update({ where: { id: lesson.id }, data: { imageUrl: url, imageGenerationStatus: "COMPLETED" } });
        console.log(`  ✅ ${url.slice(0, 80)}...`);
        done++;
      } else {
        await prisma.lesson.update({ where: { id: lesson.id }, data: { imageGenerationStatus: "FAILED" } });
        console.log(`  ⚠️  Timed out`);
      }
    } catch (e) {
      console.log(`  ❌ ${e instanceof Error ? e.message : e}`);
      await prisma.lesson.update({ where: { id: lesson.id }, data: { imageGenerationStatus: "FAILED" } }).catch(() => {});
    }
  }

  const total = await prisma.lesson.count({ where: { imageGenerationStatus: "COMPLETED" } });
  console.log(`\n✅ Total images COMPLETED in DB: ${total}`);
  console.log(`   Generated this run: ${done}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
