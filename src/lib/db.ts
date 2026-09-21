import { AsyncLocalStorage } from "node:async_hooks";
import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
const root = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = root;

// A payment settlement scopes existing commission/access/ledger services to the
// SAME database transaction without changing their commercial rules or APIs.
const paymentScope = new AsyncLocalStorage<Prisma.TransactionClient>();
export const prisma = new Proxy(root, {
  get(target, property) {
    const client = paymentScope.getStore() ?? target;
    const value = Reflect.get(client, property);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
export async function paymentTransaction<T>(work: () => Promise<T>): Promise<T> {
  if (paymentScope.getStore()) return work();
  for (let attempt = 0; ; attempt++) {
    try {
      return await root.$transaction((tx) => paymentScope.run(tx, work), { timeout: 30000 });
    } catch (error) {
      if (attempt >= 4 || !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          !["P2034", "P1008"].includes(error.code)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }
}
export default prisma;
