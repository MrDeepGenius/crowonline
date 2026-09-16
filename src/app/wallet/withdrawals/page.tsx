import { DashboardShell } from "@/components/layout/dashboard-shell";
import { WithdrawalForm } from "@/components/wallet/withdrawal-form";
import { WithdrawalHistory } from "@/components/wallet/wallet-tables";
import { getCurrentUser } from "@/lib/auth/session";
import { getWalletOverview } from "@/server/services/wallet";
import { resolveWithdrawalFee } from "@/server/services/withdrawals";

export const metadata = { title: "Retiros" };

export default async function WithdrawalsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [overview, monthly] = await Promise.all([
    getWalletOverview(user.id),
    resolveWithdrawalFee(user.id, "MONTHLY"),
  ]);

  const lastAddress = overview.withdrawals[0]?.address ?? null;

  return (
    <DashboardShell
      title="Retiros"
      description="Solicita retiros en USDT BEP-20 desde 25 USDT. Todas las solicitudes requieren aprobación manual del equipo CROW."
      activePath="/wallet/withdrawals"
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <WithdrawalForm
          available={overview.wallet.availableUsdt}
          minWithdrawal={overview.minWithdrawal}
          monthlyEligible={monthly.eligible}
          lastAddress={lastAddress}
        />
        <div className="space-y-6">
          <WithdrawalHistory withdrawals={overview.withdrawals} />
        </div>
      </div>
    </DashboardShell>
  );
}