import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ButtonLink } from "@/components/ui/button";
import {
  TransactionTable,
} from "@/components/wallet/wallet-tables";
import {
  WalletBalanceCards,
  WithdrawalRulesCard,
} from "@/components/wallet/wallet-balance";
import { getCurrentUser } from "@/lib/auth/session";
import { getWalletOverview } from "@/server/services/wallet";

export const metadata = { title: "Wallet" };

export default async function WalletPage() {
  const user = await getCurrentUser();
  if (!user) return null;

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