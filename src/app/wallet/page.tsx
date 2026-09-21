import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ButtonLink } from "@/components/ui/button";
import {
  TransactionTable,
} from "@/components/wallet/wallet-tables";
import {
  WalletBalanceCards,
  WithdrawalRulesCard,
} from "@/components/wallet/wallet-balance";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getWalletOverview } from "@/server/services/wallet";

export const metadata = { title: "Wallet" };

export default async function WalletPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const overview = await getWalletOverview(user.id);

  return (
    <DashboardShell
      title="Wallet USDT"
      description="Saldo disponible, pendiente, ganado total y todos los movimientos de tu cuenta CROW."
      activePath="/wallet"
      action={
        <ButtonLink href="/wallet/withdrawals">Solicitar retiro</ButtonLink>
      }
    >
      {overview.transactions.some((entry) => entry.status === "TEST") ? <p className="mb-5 rounded-xl border border-crow-warn p-4 text-crow-warn">TEST MODE · Los movimientos TEST son simulados. No forman parte del saldo disponible ni se pueden retirar.</p> : null}
      <WalletBalanceCards
        available={overview.wallet.availableUsdt}
        pending={overview.wallet.pendingUsdt}
        totalEarned={overview.wallet.totalEarnedUsdt}
        totalWithdrawn={overview.wallet.totalWithdrawnUsdt}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <TransactionTable transactions={overview.transactions} />
        <div className="space-y-6">
          <WithdrawalRulesCard minWithdrawal={overview.minWithdrawal} />
        </div>
      </div>
    </DashboardShell>
  );
}