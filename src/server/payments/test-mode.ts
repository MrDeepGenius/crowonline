export const TEST_PAYMENT_PROVIDER = "local_test";

export function paymentsTestModeEnabled() {
  return process.env.PAYMENTS_TEST_MODE === "true" &&
    (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test");
}

export function requirePaymentsTestMode() {
  if (!paymentsTestModeEnabled()) throw new Error("TEST MODE deshabilitado; solo disponible en development/test.");
}

export function localTestIntent() {
  requirePaymentsTestMode();
  return {
    provider: TEST_PAYMENT_PROVIDER, network: "TEST MODE · LOCAL · SIN BLOCKCHAIN",
    address: "TEST MODE — NO ENVIAR FONDOS", requiredConfirmations: 1,
    raw: JSON.stringify({ mode: "TEST", source: "local_checkout", withdrawable: false }),
  };
}
