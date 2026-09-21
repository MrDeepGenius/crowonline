import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { setUserStatusAction } from "@/server/actions/admin";
import { ROLE_LABEL, type Role } from "@/lib/domain";
import { formatDate, formatUsdt } from "@/lib/utils";

export function AdminUserTable({
  users,
}: {
  users: {
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt: Date;
    roleList: Role[];
    wallet: { availableUsdt: number } | null;
    affiliate: { referralCode: string; clicks: number } | null;
    creatorPlan: { plan: string } | null;
    _count: { products: number; orders: number };
  }[];
}) {
  return (
    <Card>
      <CardHeader
        title="Usuarios"
        description="Roles, saldo, productos y estado de la cuenta"
        action={<Badge tone="default">{users.length} usuarios</Badge>}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[12.5px]">
          <thead className="text-[11px] uppercase tracking-wider text-crow-muted">
            <tr>
              <th className="py-2">Usuario</th>
              <th className="py-2 hidden sm:table-cell">Roles</th>
              <th className="py-2 hidden md:table-cell">Wallet</th>
              <th className="py-2 hidden lg:table-cell">Actividad</th>
              <th className="py-2 hidden sm:table-cell">Estado</th>
              <th className="py-2">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="py-2.5">
                  <p className="text-crow-text">{user.name}</p>
                  <p className="text-[11px] text-crow-muted">{user.email}</p>
                  <p className="text-[10.5px] text-crow-muted">Alta {formatDate(user.createdAt)}</p>
                  {/* Roles inline on xs */}
                  <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                    {user.roleList.map((role) => (
                      <Badge key={role} tone={role === "ADMIN" ? "danger" : "violet"}>{ROLE_LABEL[role]}</Badge>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 hidden sm:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {user.roleList.map((role) => (
                      <Badge key={role} tone={role === "ADMIN" ? "danger" : "violet"}>{ROLE_LABEL[role]}</Badge>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 text-crow-muted hidden md:table-cell">
                  {formatUsdt(user.wallet?.availableUsdt ?? 0)}
                </td>
                <td className="py-2.5 text-crow-muted hidden lg:table-cell">
                  {user._count.products} productos · {user._count.orders} órdenes
                  {user.creatorPlan ? (
                    <span className="ml-1 text-[10.5px] text-crow-glow">{user.creatorPlan.plan}</span>
                  ) : null}
                </td>
                <td className="py-2.5 hidden sm:table-cell">
                  <StatusBadge status={user.status} />
                  {user.affiliate ? (
                    <p className="mt-1 font-mono text-[10.5px] text-crow-glow">
                      {user.affiliate.referralCode} · {user.affiliate.clicks} clics
                    </p>
                  ) : null}
                </td>
                <td className="py-2.5">
                  <form action={setUserStatusAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="status" value={user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"} />
                    <Button type="submit" size="sm" variant={user.status === "ACTIVE" ? "danger" : "secondary"}>
                      {user.status === "ACTIVE" ? "Suspender" : "Reactivar"}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!users.length ? (
        <p className="py-6 text-center text-[12.5px] text-crow-muted">
          Sin usuarios con este filtro.
        </p>
      ) : null}
    </Card>
  );
}