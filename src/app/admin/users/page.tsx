import { AdminUserTable } from "@/components/admin/admin-user-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/ui/card";
import { listUsersForAdmin } from "@/server/services/admin";
import { ButtonLink } from "@/components/ui/button";
import { ROLES, ROLE_LABEL } from "@/lib/domain";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin · Usuarios" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const [all, users] = await Promise.all([
    listUsersForAdmin(params.q),
    listUsersForAdmin(params.q, params.role),
  ]);

  return (
    <DashboardShell
      title="Usuarios"
      description="Consulta roles, saldos y actividad. Puedes suspender o reactivar cuentas."
      activePath="/admin/users"
      action={<ButtonLink href="/admin" variant="secondary">Volver al panel</ButtonLink>}
    >
      {params.updated ? (
        <p className="mb-5 rounded-xl border border-crow-success/30 bg-crow-success/10 px-4 py-3 text-[12.5px] text-crow-success">
          Estado actualizado a {params.updated.toUpperCase()}.
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Usuarios (filtro)" value={users.length} />
        <StatCard label="Total en CROW" value={all.length} />
        <StatCard
          label="Saldos en wallets"
          value={`${all
            .reduce((sum, user) => sum + (user.wallet?.availableUsdt ?? 0), 0)
            .toFixed(2)} USDT`}
          tone="violet"
        />
        <StatCard
          label="Suspendidos"
          value={all.filter((user) => user.status !== "ACTIVE").length}
          tone="warn"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/admin/users"
          className={
            !params.role
              ? "rounded-full border border-crow-violet/50 bg-crow-violet/15 px-3.5 py-1.5 text-[12.5px] text-crow-glow"
              : "rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 py-1.5 text-[12.5px] text-crow-muted hover:text-crow-text"
          }
        >
          Todos ({all.length})
        </Link>
        {ROLES.map((role) => {
          const count = all.filter((user) => user.roleList.includes(role)).length;
          return (
            <Link
              key={role}
              href={`/admin/users?role=${role}`}
              className={
                params.role === role
                  ? "rounded-full border border-crow-violet/50 bg-crow-violet/15 px-3.5 py-1.5 text-[12.5px] text-crow-glow"
                  : "rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 py-1.5 text-[12.5px] text-crow-muted hover:text-crow-text"
              }
            >
              {ROLE_LABEL[role]} ({count})
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        <AdminUserTable users={users} />
      </div>
    </DashboardShell>
  );
}