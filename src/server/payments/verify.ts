import type { Payment } from "@prisma/client";
import { addressTopic, atomicAmount, hexNumber, rpcNumber, TRANSFER_TOPIC } from "./config";
import { blockSchema, checkPaymentNetwork, hashSchema, receiptSchema, rpc, transactionSchema } from "./rpc";

export async function verifyPayment(payment: Payment, hash: string) {
  const txHash = hashSchema.parse(hash).toLowerCase();
  const config = await checkPaymentNetwork();
  if (payment.chainId !== 97 || payment.tokenAddress !== config.token ||
      payment.address !== config.destination || payment.tokenDecimals !== config.decimals ||
      !payment.transferData || payment.amountAtomic !== atomicAmount(payment.amountUsdt, config.decimals)) {
    throw new Error("Configuración de la orden no coincide; no se acredita");
  }
  const receiptRaw = await rpc<unknown>("eth_getTransactionReceipt", [txHash]);
  if (!receiptRaw) return null;
  const receipt = receiptSchema.parse(receiptRaw);
  const transaction = transactionSchema.parse(await rpc("eth_getTransactionByHash", [txHash]));
  const height = rpcNumber(receipt.blockNumber);
  const block = blockSchema.parse(await rpc("eth_getBlockByNumber", [hexNumber(height), false]));
  if (receipt.status !== "0x1" || receipt.transactionHash.toLowerCase() !== txHash ||
      transaction.hash.toLowerCase() !== txHash || transaction.to?.toLowerCase() !== config.token ||
      transaction.input.toLowerCase() !== payment.transferData || BigInt(transaction.value) !== 0n ||
      transaction.blockHash !== receipt.blockHash || transaction.blockNumber !== receipt.blockNumber ||
      block.hash !== receipt.blockHash || rpcNumber(block.number) !== height ||
      height < (payment.startBlock ?? Number.MAX_SAFE_INTEGER) || height > config.head) {
    throw new Error("TX inválida, revertida, reorganizada o de otra orden");
  }
  const blockTime = new Date(rpcNumber(block.timestamp) * 1000);
  if (!payment.expiresAt || blockTime >= payment.expiresAt || blockTime.getTime() < payment.createdAt.getTime() - 15000) {
    throw new Error("Transferencia fuera del plazo de pago");
  }
  const matches = receipt.logs.filter((log) =>
    !log.removed && log.address.toLowerCase() === config.token && log.topics.length === 3 &&
    log.topics[0].toLowerCase() === TRANSFER_TOPIC &&
    log.topics[1].toLowerCase() === addressTopic(transaction.from) &&
    log.topics[2].toLowerCase() === addressTopic(payment.address) &&
    /^0x[\da-f]{64}$/i.test(log.data) && BigInt(log.data) === BigInt(payment.amountAtomic!) &&
    log.blockHash === receipt.blockHash && log.blockNumber === receipt.blockNumber &&
    log.transactionHash.toLowerCase() === txHash,
  );
  if (matches.length !== 1) throw new Error("Transferencia de token, destino o monto incorrectos");
  // Re-read the canonical block after collecting evidence to catch an in-flight reorg.
  const canonical = blockSchema.parse(await rpc("eth_getBlockByNumber", [hexNumber(height), false]));
  if (canonical.hash !== block.hash) throw new Error("Reorganización detectada; reintentar");
  return {
    txHash, senderAddress: transaction.from.toLowerCase(), blockNumber: height,
    blockHash: block.hash, blockTime, logIndex: rpcNumber(matches[0].logIndex),
    confirmations: config.head - height + 1,
    raw: JSON.stringify({ chainId: 97, receipt, transaction, block }),
  };
}
