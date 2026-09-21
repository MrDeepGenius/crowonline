import { z } from "zod";

const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/).refine((s) => !/^0x0{40}$/i.test(s));
const configSchema = z.object({
  chainId: z.coerce.number().refine((n) => n === 97, "Solo BSC TESTNET (97); mainnet bloqueada"),
  rpcUrl: z.string().url(),
  destination: address,
  token: address,
  decimals: z.coerce.number().int().min(0).max(18),
  confirmations: z.coerce.number().int().min(1).max(1000),
});
export function paymentConfig() {
  const config = configSchema.parse({
    chainId: process.env.PAYMENT_CHAIN_ID,
    rpcUrl: process.env.PAYMENT_BSC_RPC_URL,
    destination: process.env.PAYMENT_USDT_BEP20_ADDRESS,
    token: process.env.PAYMENT_TOKEN_ADDRESS,
    decimals: process.env.PAYMENT_TOKEN_DECIMALS,
    confirmations: process.env.PAYMENT_REQUIRED_CONFIRMATIONS,
  });
  if (config.destination.toLowerCase() === config.token.toLowerCase()) throw new Error("La wallet receptora no puede ser el contrato del token");
  return { ...config, destination: config.destination.toLowerCase(), token: config.token.toLowerCase() };
}
export function atomicAmount(amount: number, decimals: number) {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Monto inválido");
  const [whole, fraction = ""] = String(amount).split(".");
  if (!/^\d+$/.test(whole) || !/^\d*$/.test(fraction) || fraction.length > decimals) {
    throw new Error("Monto no representable en el token configurado");
  }
  return (BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, "0") || "0")).toString();
}
export const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
export const addressTopic = (address: string) => `0x${address.slice(2).toLowerCase().padStart(64, "0")}`;
export const hexNumber = (n: number) => `0x${n.toString(16)}`;
export function rpcNumber(value: string) {
  if (!/^0x[\da-f]+$/i.test(value)) throw new Error("Número RPC inválido");
  const result = Number(BigInt(value));
  if (!Number.isSafeInteger(result)) throw new Error("Número RPC fuera de rango");
  return result;
}
