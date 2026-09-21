import prisma from "@/lib/db";
import { monitorPaymentsOnce } from "@/server/payments/monitor";
import { checkPaymentNetwork } from "@/server/payments/rpc";

let stopped = false;
process.on("SIGINT", () => { stopped = true; });
process.on("SIGTERM", () => { stopped = true; });
async function main() {
  const config = await checkPaymentNetwork();
  console.log(`CROW TESTNET ONLY · chain ${config.chainId} · token ${config.token} · destination ${config.destination}`);
  if (process.argv.includes("--check")) return;
  do {
    try { console.log(await monitorPaymentsOnce()); }
    catch { console.error("RPC/config unavailable; no payments credited. Retrying."); }
    if (process.argv.includes("--once")) break;
    await new Promise((resolve) => setTimeout(resolve, 10000));
  } while (!stopped);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
