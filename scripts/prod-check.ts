/**
 * CROW MARKET — Pre-deploy environment check
 *
 * Run with: npx tsx scripts/prod-check.ts
 *
 * Exits with code 1 if any critical check fails.
 * Safe to add to your CI/CD pipeline before `npm run build`.
 */

type Check = {
  name: string;
  level: "error" | "warn";
  pass: boolean;
  message: string;
};

const env = process.env;
const isProd = env.NODE_ENV === "production";

const DEV_SECRET = "crow-dev-session-secret-change-me";

function present(key: string) {
  return typeof env[key] === "string" && env[key]!.trim().length > 0;
}

function isHex40(val: string | undefined) {
  return typeof val === "string" && /^0x[0-9a-fA-F]{40}$/.test(val);
}

const checks: Check[] = [
  // ── Database ─────────────────────────────────────────────────────────────
  {
    name: "DATABASE_URL set",
    level: "error",
    pass: present("DATABASE_URL"),
    message: "DATABASE_URL is required. Set it to your PostgreSQL connection string in production.",
  },
  {
    name: "DATABASE_URL is PostgreSQL in production",
    level: "warn",
    pass: !isProd || (env.DATABASE_URL?.startsWith("postgresql://") ?? false) || (env.DATABASE_URL?.startsWith("postgres://") ?? false),
    message: "DATABASE_URL looks like a SQLite path. Production should use PostgreSQL.",
  },

  // ── Session ───────────────────────────────────────────────────────────────
  {
    name: "SESSION_SECRET set",
    level: "error",
    pass: present("SESSION_SECRET"),
    message: "SESSION_SECRET is required. Generate with: openssl rand -hex 32",
  },
  {
    name: "SESSION_SECRET is not the default",
    level: "error",
    pass: !isProd || !(env.SESSION_SECRET ?? "").includes(DEV_SECRET.split("-").slice(-1)[0]),
    message: "SESSION_SECRET is still the default dev placeholder. Use a strong random value in production.",
  },
  {
    name: "SESSION_SECRET length >= 32 bytes",
    level: "error",
    pass: new TextEncoder().encode(env.SESSION_SECRET ?? "").byteLength >= 32,
    message: "SESSION_SECRET is too short. Minimum 32 bytes (64 hex chars recommended).",
  },

  // ── App URL ───────────────────────────────────────────────────────────────
  {
    name: "NEXT_PUBLIC_APP_URL set",
    level: "warn",
    pass: present("NEXT_PUBLIC_APP_URL"),
    message: "NEXT_PUBLIC_APP_URL is not set. OAuth callbacks and referral links may break.",
  },
  {
    name: "NEXT_PUBLIC_APP_URL is HTTPS in production",
    level: "warn",
    pass: !isProd || (env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ?? false),
    message: "NEXT_PUBLIC_APP_URL should use HTTPS in production.",
  },

  // ── Payments ─────────────────────────────────────────────────────────────
  {
    name: "TEST MODE off in production",
    level: "error",
    pass: !(isProd && env.PAYMENTS_TEST_MODE === "true"),
    message: "PAYMENTS_TEST_MODE=true is not allowed in production.",
  },
  {
    name: "PAYMENT_BSC_RPC_URL set",
    level: "warn",
    pass: present("PAYMENT_BSC_RPC_URL"),
    message: "PAYMENT_BSC_RPC_URL is not set. Blockchain payment verification will fail.",
  },
  {
    name: "PAYMENT_USDT_BEP20_ADDRESS is valid",
    level: "warn",
    pass: !present("PAYMENT_USDT_BEP20_ADDRESS") || isHex40(env.PAYMENT_USDT_BEP20_ADDRESS),
    message: "PAYMENT_USDT_BEP20_ADDRESS does not look like a valid EVM address (0x + 40 hex chars).",
  },
  {
    name: "PAYMENT_TOKEN_ADDRESS is valid",
    level: "warn",
    pass: !present("PAYMENT_TOKEN_ADDRESS") || isHex40(env.PAYMENT_TOKEN_ADDRESS),
    message: "PAYMENT_TOKEN_ADDRESS does not look like a valid EVM address.",
  },
  {
    name: "Receiving wallet != token contract",
    level: "error",
    pass: !present("PAYMENT_USDT_BEP20_ADDRESS") || !present("PAYMENT_TOKEN_ADDRESS") ||
      env.PAYMENT_USDT_BEP20_ADDRESS!.toLowerCase() !== env.PAYMENT_TOKEN_ADDRESS!.toLowerCase(),
    message: "PAYMENT_USDT_BEP20_ADDRESS and PAYMENT_TOKEN_ADDRESS must be different addresses.",
  },

  // ── AI providers (optional) ───────────────────────────────────────────────
  {
    name: "At least one AI provider configured",
    level: "warn",
    pass: present("GROQ_API_KEY") || present("NVIDIA_API_KEY"),
    message: "No AI provider API key set (GROQ_API_KEY or NVIDIA_API_KEY). App will use demo/skeleton mode.",
  },
];

// ── Run ───────────────────────────────────────────────────────────────────────

let errors = 0;
let warnings = 0;

console.log("\n══════════════════════════════════════════════");
console.log("  CROW MARKET — Pre-deploy environment check");
console.log(`  NODE_ENV: ${env.NODE_ENV ?? "(not set)"}`);
console.log("══════════════════════════════════════════════\n");

for (const check of checks) {
  const icon = check.pass ? "✓" : check.level === "error" ? "✗" : "⚠";
  const label = check.pass ? "PASS" : check.level.toUpperCase();
  console.log(`  ${icon} [${label}] ${check.name}`);
  if (!check.pass) {
    console.log(`         → ${check.message}`);
    if (check.level === "error") errors++;
    else warnings++;
  }
}

console.log("\n──────────────────────────────────────────────");
console.log(`  ${errors} error(s)  ·  ${warnings} warning(s)`);
console.log("──────────────────────────────────────────────\n");

if (errors > 0) {
  console.error("  ✗ Pre-deploy check FAILED. Fix errors before deploying.\n");
  process.exit(1);
} else {
  console.log("  ✓ All required checks passed.\n");
  process.exit(0);
}
