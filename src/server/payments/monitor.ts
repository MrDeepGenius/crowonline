import prisma, { paymentTransaction } from "@/lib/db";
import { confirmOrderPayment } from "@/server/services/settlement";
import { addressTopic, hexNumber, rpcNumber, TRANSFER_TOPIC } from "./config";
import { blockSchema, checkPaymentNetwork, logSchema, rpc, transactionSchema } from "./rpc";

/** Persistent per-intent cursor; overlapping unfinalized blocks handles reorgs.
 * Never advance a cursor on RPC/settlement failures. No keys, signing or funds. */
export async function monitorPaymentsOnce() {
  const config = await checkPaymentNetwork();
  const payments = await prisma.payment.findMany({
    where: { status: "PENDING", chainId: 97, order: { status: "PENDING", boost: { is: null } } },
    orderBy: { createdAt: "asc" },
  });
  for (const payment of payments) {
    try {
      if (payment.txHash) {
        await confirmOrderPayment({ orderId: payment.orderId, txHash: payment.txHash });
        continue;
      }
      const from = Math.max(payment.startBlock!, (payment.scannedBlock ?? payment.startBlock!) - payment.requiredConfirmations);
      const to = Math.min(config.head, from + 1999);
      if (from > to) continue;
      const logs = logSchema.array().parse(await rpc("eth_getLogs", [{
        address: payment.tokenAddress, fromBlock: hexNumber(from), toBlock: hexNumber(to),
        topics: [TRANSFER_TOPIC, null, addressTopic(payment.address)],
      }]));
      let matched = false;
      for (const log of logs) {
        if (log.removed) continue;
        const transaction = transactionSchema.parse(await rpc("eth_getTransactionByHash", [log.transactionHash]));
        if (transaction.input.toLowerCase() !== payment.transferData) continue;
        await confirmOrderPayment({ orderId: payment.orderId, txHash: log.transactionHash });
        matched = true;
        break;
      }
      if (matched) continue;
      const finalized = Math.min(to, config.head - payment.requiredConfirmations + 1);
      if (finalized < 0) continue;
      const block = blockSchema.parse(await rpc("eth_getBlockByNumber", [hexNumber(finalized), false]));
      await paymentTransaction(async () => {
        const fresh = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
        if (fresh.status !== "PENDING" || fresh.txHash) return;
        await prisma.payment.update({ where: { id: payment.id }, data: { scannedBlock: to, verificationError: null } });
        // Wait until the scanned block is beyond expiry AND has enough confirmations.
        if (payment.expiresAt && rpcNumber(block.timestamp) * 1000 >= payment.expiresAt.getTime() &&
            config.head - finalized + 1 >= payment.requiredConfirmations) {
          await prisma.order.updateMany({ where: { id: payment.orderId, status: "PENDING" }, data: { status: "EXPIRED" } });
          await prisma.payment.update({ where: { id: payment.id }, data: { status: "EXPIRED" } });
          await prisma.transaction.updateMany({ where: { orderId: payment.orderId, kind: "PAYMENT", status: "PENDING" }, data: { status: "EXPIRED" } });
        }
      });
    } catch {
      await prisma.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: {
        verificationError: "Verificación pendiente/rechazada. Revisar RPC, TX y configuración; no se acreditó.",
      } });
      console.error(`Payment verification deferred: ${payment.id}`);
    }
  }
  return { checked: payments.length, head: config.head, chainId: config.chainId };
}
