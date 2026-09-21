import { readFileSync } from "fs";
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

const { NvidiaProvider } = await import("../src/lib/ai/providers/nvidia.ts");
const { extractJson, blueprintSchema } = await import("../src/lib/ai/blueprint.ts");

const p = new NvidiaProvider();

const prompt = `Eres un experto diseñador instruccional. Genera el blueprint COMPLETO de un curso de fotografía con celular.

Devuelve EXCLUSIVAMENTE un JSON con esta forma exacta:
{
  "title": string (máx 60 chars),
  "shortDescription": string (máx 120 chars),
  "description": string (2-4 párrafos),
  "audience": string,
  "promise": string,
  "productType": "COURSE",
  "category": "Cursos",
  "recommendedPriceUsdt": number,
  "includes": string[],
  "resources": string[],
  "commercialStrategy": string[],
  "qualityChecklist": string[],
  "learningGoals": string[],
  "tags": string[],
  "coverEmoji": string,
  "coverGradient": "violet",
  "modules": [
    {
      "title": string,
      "summary": string,
      "lessons": [
        {
          "title": string,
          "content": string (markdown, 200+ words),
          "durationMin": number,
          "imagePrompt": string,
          "videoEnabled": boolean,
          "videoPrompt": string,
          "videoDuration": 5,
          "videoStyle": "cinematic",
          "isFreePreview": boolean,
          "exercises": [
            {
              "title": string,
              "instructions": string,
              "kind": "PRACTICE",
              "options": [],
              "correctAnswer": "",
              "explanation": ""
            }
          ]
        }
      ]
    }
  ]
}

Crea 5 módulos con 3 lecciones cada uno. Solo el JSON, nada más.`;

console.log("Calling NVIDIA...");
const r = await p.complete([{ role: "user", content: prompt }], { maxTokens: 4096, temperature: 0.6, json: true });
console.log("Response length:", r.text.length);

// Show first and last 500 chars
console.log("\n--- FIRST 500 CHARS ---");
console.log(r.text.slice(0, 500));
console.log("\n--- LAST 500 CHARS ---");
console.log(r.text.slice(-500));

// Try extractJson
const json = extractJson(r.text);
console.log("\n--- extractJson result ---");
  if (json) {
  console.log("Keys:", Object.keys(json));
  console.log("title:", json.title);
  
  // Try Zod validation
  const validation = blueprintSchema.safeParse(json);
  if (validation.success) {
    console.log("Zod: VALID");
    console.log("Modules:", validation.data.modules.length);
  } else {
    console.log("Zod: INVALID");
    const errors = validation.error.format();
    console.log("Errors:", JSON.stringify(errors).slice(0, 1000));
  }
} else {
  console.log("extractJson returned null!");
  
  // Debug: show raw text to understand why
  console.log("\n--- DEBUG: Raw text analysis ---");
  const firstBrace = r.text.indexOf("{");
  const lastBrace = r.text.lastIndexOf("}");
  console.log("First { at:", firstBrace);
  console.log("Last } at:", lastBrace);
  
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const slice = r.text.slice(firstBrace, lastBrace + 1);
    console.log("Slice length:", slice.length);
    try {
      const parsed = JSON.parse(slice);
      console.log("Direct parse OK, keys:", Object.keys(parsed));
    } catch (e) {
      console.log("Direct parse FAILED:", (e.message || "unknown").slice(0, 200));
    }
  }
  
  // Check for markdown fences
  const fenceCount = (r.text.match(/```/g) || []).length;
  console.log("Markdown fence count:", fenceCount);
}
