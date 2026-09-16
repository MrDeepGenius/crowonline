import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { SidebarNav } from "@/components/layout/dashboard-nav";
import { SiteFooter } from "@/components/layout/site-chrome";
import { logoutAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLE_LABEL, type Role } from "@/lib/domain";
import { dashboardNav, hasRole, primaryRole } from "@/lib/rbac";
import { cn, formatUsdt, initials } from "@/lib/utils";

export async function DashboardShell({
  children,
  title,
  description,
  action,
  activePath,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  activePath?: string;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="crow-container py-24">
        <div className="crow-card mx-auto max-w-md p-8 text-center">
          <h1 className="text-lg font-semibold">Sesión requerida</h1>
          <p className="mt-2 text-sm text-crow-muted">
            Inicia sesión para acceder a tu panel de CROW.
          </p>
          <Link href="/login" className={cn(buttonClass("primary"), "mt-6")}>
            Iniciar sesión
          </Link>
        </div>
      </main>
    );
  }

  const roles = user.roleList as Role[];
  const role = primaryRole(roles);
  const sections = dashboardNav(roles);
  const balance = user.wallet?.availableUsdt ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0A0A0C]/80 px-4 py-6 lg:flex">
          <Link href="/" className="px-2">
            <span className="text-sm font-semibold tracking-[0.2em] text-crow-text">
              CROW
            </span>
            <span className="ml-1.5 text-[10px] uppercase tracking-[0.28em] text-crow-muted">
              Market
            </span>
          </Link>

          <SidebarNav sections={sections} activePath={activePath} />

          <div className="crow-surface mt-4 p-3.5">
            <p className="text-[10px] uppercase tracking-wider text-crow-muted">
              Saldo disponible
            </p>
            <p className="mt-1 text-lg font-semibold text-crow-text">
              {formatUsdt(balance)}
            </p>
            <Link
              href="/wallet"
              className={cn(buttonClass("secondary", "sm"), "mt-3 w-full")}
            >
              Ir a wallet
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0B0B0B]/85 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between gap-4 px-5 sm:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Link href="/" className="lg:hidden">
                  <span className="text-sm font-semibold tracking-[0.18em]">CROW</span>
                </Link>
                <Badge tone="violet">{ROLE_LABEL[role]}</Badge>
                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-[13px] font-medium text-crow-text">
                    {user.name}
                  </p>
                  <p className="truncate text-[11px] text-crow-muted">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Link
                  href="/marketplace"
                  className="hidden text-[13px] text-crow-muted transition hover:text-crow-text sm:block"
                >
                  Marketplace
                </Link>
                {hasRole(roles, "CREATOR") ? (
                  <Link href="/creator/studio" className={buttonClass("primary", "sm")}>
                    Creator Studio
                  </Link>
                ) : null}
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-crow-violet/30 bg-crow-violet/15 text-[12px] font-semibold text-crow-glow">
                  {initials(user.name)}
                </span>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="rounded-lg px-2.5 py-2 text-[12px] text-crow-muted transition hover:text-crow-danger"
                  >
                    Salir
                  </button>
                </form>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-8 sm:px-8">
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                {description ? (
                  <p className="mt-1.5 max-w-2xl text-sm text-crow-muted">
                    {description}
                  </p>
                ) : null}
              </div>
              {action}
            </div>
            {children}
          </main>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}