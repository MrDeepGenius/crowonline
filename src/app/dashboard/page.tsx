import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ActivityPanel } from "@/components/dashboard/activity-panel";
import { AffiliatePanel } from "@/components/dashboard/affiliate-panel";
import { CreatorPanel } from "@/components/dashboard/creator-panel";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StatCard } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/rbac";
import { ROLE_LABEL, type Role } from "@/lib/domain";
import { formatUsdt } from "@/lib/utils";
import prisma from "@/lib/db";
import { getCreatorMetrics } from "@/server/services/catalog";
import { getAffiliateOverview } from "@/server/services/affiliate";
import { getWalletOverview } from "@/server/services/wallet";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const roles = user.roleList as Role[];
  const isCreator = hasRole(roles, "CREATOR");
  const isAffiliate = hasRole(roles, "AFFILIATE") || hasRole(roles, "ADMIN");

  const [wallet, purchases, certificates, creatorMetrics, affiliate] = await Promise.all([
    getWalletOverview(user.id),
    prisma.orderItem.count({ where: { order: { buyerId: user.id, status: "PAID" } } }),
    prisma.certificate.count({ where: { userId: user.id } }),
    isCreator ? getCreatorMetrics(user.id) : Promise.resolve(null),
    isAffiliate ? getAffiliateOverview(user.id) : Promise.resolve(null),
  ]);

  return (
    <DashboardShell
      title={`Hola, ${user.name.split(" ")[0]}`}
      description="Tu centro de control en CROW: contenido, ventas, red de afiliados y wallet."
      activePath="/dashboard"
      action={
        <div className="flex gap-2.5">
          <ButtonLink href="/marketplace" variant="secondary">
            Explorar marketplace
          </ButtonLink>
          {isCreator ? <ButtonLink href="/creator/studio">Creator Studio</ButtonLink> : null}
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {roles.map((role) => (
          <Badge key={role} tone={role === "ADMIN" ? "danger" : "violet"}>
            {ROLE_LABEL[role]}
          </Badge>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Saldo disponible"
          value={formatUsdt(wallet.wallet.availableUsdt)}
          hint={`En retiro: ${formatUsdt(wallet.pendingWithdrawals)}`}
          tone="violet"
        />
        <StatCard
          label="Ganado total"
          value={formatUsdt(wallet.wallet.totalEarnedUsdt)}
          hint={`Retirado: ${formatUsdt(wallet.wallet.totalWithdrawnUsdt)}`}
        />
        <StatCard label="Compras" value={purchases} hint="Productos en tu biblioteca" />
        <StatCard label="Certificados" value={certificates} hint="Cursos al 100%" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {creatorMetrics ? <CreatorPanel metrics={creatorMetrics} /> : null}
        {affiliate ? <AffiliatePanel data={affiliate} /> : null}
        <ActivityPanel transactions={wallet.transactions} />
      </div>
    </DashboardShell>
  );
}