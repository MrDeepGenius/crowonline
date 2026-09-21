#!/usr/bin/env tsx
/**
 * Test live NVIDIA connection and blueprint generation.
 */

// Load env manually
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

import { NvidiaProvider } from "../src/lib/ai/providers/nvidia";
import { buildBlueprintPrompt, extractJson, parseBlueprint } from "../src/lib/ai/blueprint";

async function main() {
  console.log("🧠 Testing NVIDIA NIM...\n");

  const nvidia = new NvidiaProvider();

  if (!nvidia.isConfigured()) {
    console.error("❌ NVIDIA_API_KEY not set");
    process.exit(1);
  }

  console.log(`Provider: ${nvidia.label}`);
  console.log(`Model:    ${nvidia.model}\n`);

  // Short ping first
  console.log("--- Ping test ---");
  const ping = await nvidia.complete([
    { role: "user", content: "Responde solo: OK" },
  ], { maxTokens: 10, temperature: 0 });
  console.log(`Response: "${ping.text}"`);
  console.log(`Provider confirmed: ${ping.provider}\n`);

  // Blueprint generation test
  console.log("--- Blueprint generation ---");
  const idea = "Introducción a la Criminalística para principiantes";
  const prompt = buildBlueprintPrompt(idea, "COURSE");
  console.log(`Sending prompt (${prompt.length} chars)...`);

  const start = Date.now();
  const completion = await nvidia.complete(
    [{ role: "user", content: prompt }],
    { temperature: 0.65, maxTokens: 4096, json: true },
  );
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`✓ Response in ${elapsed}s (${completion.text.length} chars)`);
  console.log(`Provider: ${completion.provider}, Model: ${completion.model}`);

  const parsed = parseBlueprint(extractJson(completion.text));
  if (parsed) {
    console.log(`\n✅ Valid blueprint generated:`);
    console.log(`   Title:   ${parsed.title}`);
    console.log(`   Modules: ${parsed.modules.length}`);
    const lessons = parsed.modules.flatMap((m) => m.lessons);
    console.log(`   Lessons: ${lessons.length}`);
    const quizzes = lessons.flatMap((l) => l.exercises.filter((e) => e.kind === "QUIZ"));
    console.log(`   Quizzes: ${quizzes.length}`);
    console.log(`   Price:   ${parsed.recommendedPriceUsdt} USDT`);
    console.log(`\n   First module: ${parsed.modules[0]?.title}`);
    console.log(`   First lesson: ${parsed.modules[0]?.lessons[0]?.title}`);
  } else {
    console.log(`\n⚠️  Response was not a valid blueprint JSON.`);
    console.log(`   Raw (first 500 chars):\n${completion.text.slice(0, 500)}`);
  }
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
