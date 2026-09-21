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

console.log("=== NVIDIA Provider Test via CROW code ===");
console.log("NVIDIA_API_KEY:", process.env.NVIDIA_API_KEY ? "SET (len=" + process.env.NVIDIA_API_KEY.length + ")" : "NOT SET");
console.log("NVIDIA_MODEL:", process.env.NVIDIA_MODEL);
console.log("NVIDIA_BASE_URL:", process.env.NVIDIA_BASE_URL);

const { NvidiaProvider } = await import("../src/lib/ai/providers/nvidia.ts");
const p = new NvidiaProvider();
console.log("Provider ID:", p.id);
console.log("Provider Model:", p.model);
console.log("Is Configured:", p.isConfigured());

console.log("\n--- Test 1: Simple generation ---");
try {
  const r = await p.complete(
    [{ role: "user", content: "Decí hola en 5 palabras exactas." }],
    { maxTokens: 30, temperature: 0.1 },
  );
  console.log("Response:", r.text);
  console.log("Provider:", r.provider);
  console.log("Model:", r.model);
  console.log("PASS");
} catch (e) {
  console.log("FAIL:", e.message);
}

console.log("\n--- Test 2: Photography content (JSON) ---");
try {
  const r = await p.complete(
    [{ role: "user", content: "Generá un JSON con: {\"titulo\": \"Curso de foto con celular\", \"modulos\": [\"Fundamentos\", \"Composición\"]}. Solo el JSON, nada más." }],
    { maxTokens: 200, temperature: 0.3, json: true },
  );
  console.log("Response:", r.text.slice(0, 500));
  console.log("PASS");
} catch (e) {
  console.log("FAIL:", e.message);
}

console.log("\n--- Test 3: Full blueprint prompt (large) ---");
try {
  const r = await p.complete(
    [{ role: "user", content: "Generá un JSON válido con título y 2 módulos sobre fotografía con celular. Cada módulo tiene title y lessons array con 1 lesson (title, content de 20 palabras). Solo JSON." }],
    { maxTokens: 2000, temperature: 0.6, json: true },
  );
  console.log("Response length:", r.text.length);
  console.log("First 600 chars:", r.text.slice(0, 600));
  // Try to parse
  const start = r.text.indexOf("{");
  const end = r.text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const parsed = JSON.parse(r.text.slice(start, end + 1));
    console.log("Parsed OK, keys:", Object.keys(parsed));
    console.log("PASS");
  } else {
    console.log("FAIL: no JSON found");
  }
} catch (e) {
  console.log("FAIL:", e.message);
}
