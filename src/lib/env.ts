/**
 * CROW MARKET — Environment validation
 *
 * Called at runtime in server-only code paths.
 * Throws clearly if required production secrets are missing or insecure.
 * Never imported by client components (no "use client" anywhere in this chain).
 */

const DEV_SESSION_SECRET = "crow-dev-session-secret-change-me-000";
const MIN_SECRET_BYTES = 32;

/**
 * Returns the SESSION_SECRET as a Uint8Array ready for jose.
 * In production: throws if the secret is missing, too short, or still the
 * default dev placeholder — so a misconfigured deploy fails fast at the
 * first authenticated request rather than silently using a known secret.
 */
export function getSessionSecret(): Uint8Array {
  const raw = process.env.SESSION_SECRET ?? "";

  if (process.env.NODE_ENV === "production") {
    if (!raw) {
      throw new Error(
        "[CROW] SESSION_SECRET is not set. " +
          "Generate one with: openssl rand -hex 32",
      );
    }
    if (raw === DEV_SESSION_SECRET || raw.includes("change-me")) {
      throw new Error(
        "[CROW] SESSION_SECRET is still the default development value. " +
          "Set a strong random secret before deploying to production.",
      );
    }
    if (new TextEncoder().encode(raw).byteLength < MIN_SECRET_BYTES) {
      throw new Error(
        `[CROW] SESSION_SECRET is too short (< ${MIN_SECRET_BYTES} bytes). ` +
          "Generate one with: openssl rand -hex 32",
      );
    }
  }

  // In development fall back to the placeholder so the app still starts
  // without any config.
  return new TextEncoder().encode(raw || DEV_SESSION_SECRET);
}

/**
 * Asserts that PAYMENTS_TEST_MODE can never be active in production.
 * This is already enforced in test-mode.ts by the NODE_ENV check, but we
 * add a belt-and-suspenders assertion here that can be called at startup.
 */
export function assertPaymentsNotTestInProd(): void {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.PAYMENTS_TEST_MODE === "true"
  ) {
    throw new Error(
      "[CROW] PAYMENTS_TEST_MODE=true is not allowed in NODE_ENV=production. " +
        "Remove this variable from your production environment.",
    );
  }
}

/**
 * Logs a startup summary of which optional services are configured.
 * Safe to call from any server-side initialisation code.
 * Never logs secret values — only whether keys are present.
 */
export function logEnvSummary(): void {
  if (process.env.NODE_ENV === "production") {
    const checks = [
      ["DATABASE_URL", !!process.env.DATABASE_URL],
      ["SESSION_SECRET", !!process.env.SESSION_SECRET],
      ["NEXT_PUBLIC_APP_URL", !!process.env.NEXT_PUBLIC_APP_URL],
      ["GROQ_API_KEY", !!process.env.GROQ_API_KEY],
      ["NVIDIA_API_KEY", !!process.env.NVIDIA_API_KEY],
      ["LEONARDO_API_KEY", !!process.env.LEONARDO_API_KEY],
      ["PAYMENT_BSC_RPC_URL", !!process.env.PAYMENT_BSC_RPC_URL],
      ["PAYMENT_USDT_BEP20_ADDRESS", !!process.env.PAYMENT_USDT_BEP20_ADDRESS],
      ["GOOGLE_CLIENT_ID", !!process.env.GOOGLE_CLIENT_ID],
    ] as const;

    const missing = checks.filter(([, ok]) => !ok).map(([k]) => k);
    if (missing.length) {
      console.warn("[CROW] Optional/required vars not set:", missing.join(", "));
    }
  }
}
