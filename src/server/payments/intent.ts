import { createHash } from "node:crypto";
import { atomicAmount } from "./config";
import { checkPaymentNetwork } from "./rpc";

export async function paymentIntent(reference: string, amount: number) {
  const config = await checkPaymentNetwork();
  const amountAtomic = atomicAmount(amount, config.decimals);
  // Standard ERC20 transfer calldata + immutable order tag. Only a test token
  // accepting trailing calldata may be configured; verify it before real use.
  const tag = createHash("sha256").update(`CROW:97:${reference}`).digest("hex");
  const transferData = `0xa9059cbb${config.destination.slice(2).padStart(64, "0")}${BigInt(amountAtomic).toString(16).padStart(64, "0")}${tag}`;
  return {
    provider: "bsc_testnet", network: "BSC TESTNET (97) · BEP-20 · TOKEN DE PRUEBA",
    address: config.destination, chainId: config.chainId, tokenAddress: config.token,
    tokenDecimals: config.decimals, amountAtomic, transferData,
    startBlock: config.head, scannedBlock: config.head - 1,
    requiredConfirmations: config.confirmations,
  };
}
