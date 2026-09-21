import { z } from "zod";
import { paymentConfig, rpcNumber } from "./config";

export async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const { rpcUrl } = paymentConfig();
  const response = await fetch(rpcUrl, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(15000), cache: "no-store",
  });
  if (!response.ok) throw new Error("RPC no disponible");
  const body = await response.json();
  if (body.error || !("result" in body)) throw new Error("RPC rechazó la consulta");
  return body.result as T;
}
export const hashSchema = z.string().regex(/^0x[\da-f]{64}$/i);
const hex = z.string().regex(/^0x[\da-f]+$/i);
const address = z.string().regex(/^0x[\da-f]{40}$/i);
export const logSchema = z.object({
  address, topics: z.array(hashSchema), data: hex, transactionHash: hashSchema,
  blockHash: hashSchema, blockNumber: hex, logIndex: hex, removed: z.boolean().optional(),
});
export const receiptSchema = z.object({
  transactionHash: hashSchema, blockHash: hashSchema, blockNumber: hex,
  status: hex, logs: z.array(logSchema),
});
export const transactionSchema = z.object({
  hash: hashSchema, from: address, to: address.nullable(), input: hex,
  blockHash: hashSchema.nullable(), blockNumber: hex.nullable(), value: hex,
});
export const blockSchema = z.object({ hash: hashSchema, number: hex, timestamp: hex });

export async function checkPaymentNetwork() {
  const config = paymentConfig();
  const chain = rpcNumber(await rpc<string>("eth_chainId", []));
  if (chain !== config.chainId || chain !== 97) throw new Error("RPC conectado a una red incorrecta");
  const code = await rpc<string>("eth_getCode", [config.token, "latest"]);
  if (!/^0x[\da-f]+$/i.test(code) || /^0x0*$/i.test(code)) throw new Error("El token no es un contrato");
  const decimals = rpcNumber(await rpc<string>("eth_call", [{ to: config.token, data: "0x313ce567" }, "latest"]));
  if (decimals !== config.decimals) throw new Error("Decimales del contrato distintos de ENV");
  return { ...config, head: rpcNumber(await rpc<string>("eth_blockNumber", [])) };
}
