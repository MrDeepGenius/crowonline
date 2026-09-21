#!/usr/bin/env tsx
/**
 * Test live Leonardo image generation.
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

import { LeonardoProvider } from "../src/lib/ai/providers/leonardo";

async function main() {
  console.log("🎨 Testing Leonardo AI...\n");

  const leonardo = new LeonardoProvider();

  if (!leonardo.isConfigured()) {
    console.error("❌ LEONARDO_API_KEY not set");
    process.exit(1);
  }

  console.log("✓ Leonardo configured");
  console.log("Starting image generation: forensic science lab...\n");

  const prompt =
    "Professional forensic science laboratory, microscope, evidence bags, educational illustration, cinematic lighting";

  try {
    const start = Date.now();
    console.log("Calling startGeneration()...");
    const generationId = await leonardo.startGeneration(prompt, { width: 1024, height: 640 });
    console.log(`✓ generationId: ${generationId}`);
    console.log("Polling for result (up to 40s)...");

    const url = await leonardo.pollForResult(generationId);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    if (url) {
      console.log(`\n✅ Image generated in ${elapsed}s`);
      console.log(`   URL: ${url}`);
      console.log(`   GenerationId: ${generationId}`);
    } else {
      console.log(`\n⚠️  Generation timed out after ${elapsed}s`);
      console.log(`   GenerationId (for retry): ${generationId}`);
    }
  } catch (err) {
    console.error("❌ Error:", err instanceof Error ? err.message : err);
  }
}

main().catch((e) => {
  console.error("❌ Fatal:", e.message);
  process.exit(1);
});
