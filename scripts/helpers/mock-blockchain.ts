import { randomBytes } from "node:crypto";
import type { Payment } from "@prisma/client";
import { addressTopic, hexNumber, TRANSFER_TOPIC } from "@/server/payments/config";

/** Test-only JSON-RPC double; never imported by application code. */
export function mockBlockchain() {
  process.env.PAYMENT_CHAIN_ID = "97";
  process.env.PAYMENT_BSC_RPC_URL = "http://localhost:19997";
  process.env.PAYMENT_USDT_BEP20_ADDRESS = `0x${"11".repeat(20)}`;
  process.env.PAYMENT_TOKEN_ADDRESS = `0x${"22".repeat(20)}`;
  process.env.PAYMENT_TOKEN_DECIMALS = "18";
  process.env.PAYMENT_REQUIRED_CONFIRMATIONS = "3";
  const original = globalThis.fetch;
  const state = {
    chain: 97, head: 100, time: Math.floor(Date.now() / 1000), unavailable: false,
    blockHash: `0x${"bb".repeat(32)}`,
    transactions: new Map<string, { transaction: Record<string, unknown>; receipt: Record<string, unknown>; log: Record<string, unknown> }>(),
  };
  globalThis.fetch = async (_url, init) => {
    if (state.unavailable) throw new Error("RPC offline");
    const { method, params } = JSON.parse(String(init?.body));
    let result: unknown;
    switch (method) {
      case "eth_chainId": result = hexNumber(state.chain); break;
      case "eth_getCode": result = "0x60006000"; break;
      case "eth_call": result = "0x12"; break;
      case "eth_blockNumber": result = hexNumber(state.head); break;
      case "eth_getTransactionByHash": result = state.transactions.get(params[0])?.transaction ?? null; break;
      case "eth_getTransactionReceipt": result = state.transactions.get(params[0])?.receipt ?? null; break;
      case "eth_getBlockByNumber": result = { hash: state.blockHash, number: params[0], timestamp: hexNumber(state.time) }; break;
      case "eth_getLogs": result = [...state.transactions.values()].map((t) => t.log).filter((log) =>
        Number(log.blockNumber) >= Number(params[0].fromBlock) && Number(log.blockNumber) <= Number(params[0].toBlock)); break;
      default: throw new Error(`Unexpected RPC ${method}`);
    }
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), { headers: { "content-type": "application/json" } });
  };
  function mine(payment: Payment) {
    // Blocks use the current clock so time-window validations behave like a real chain
    // even when the suite runs for a while.
    state.time = Math.floor(Date.now() / 1000);
    const hash = `0x${randomBytes(32).toString("hex")}`;
    const sender = `0x${"33".repeat(20)}`;
    const log = {
      address: payment.tokenAddress!, topics: [TRANSFER_TOPIC, addressTopic(sender), addressTopic(payment.address)],
      data: `0x${BigInt(payment.amountAtomic!).toString(16).padStart(64, "0")}`,
      transactionHash: hash, blockHash: state.blockHash, blockNumber: hexNumber(state.head), logIndex: "0x0", removed: false,
    };
    const transaction = { hash, from: sender, to: payment.tokenAddress, input: payment.transferData,
      blockHash: state.blockHash, blockNumber: hexNumber(state.head), value: "0x0" };
    const receipt = { transactionHash: hash, blockHash: state.blockHash, blockNumber: hexNumber(state.head), status: "0x1", logs: [log] };
    state.transactions.set(hash, { transaction, receipt, log });
    return { hash, transaction, receipt, log };
  }
  return { state, mine, restore: () => { globalThis.fetch = original; } };
}
