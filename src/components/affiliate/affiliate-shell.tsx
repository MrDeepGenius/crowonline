import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { initials } from "@/lib/utils";

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/affiliate",
    icon: "M3 12l9-9 9 9M5 10v10h14V10",
  },
  {
    label: "Mis ventas",
    href: "/affiliate/sales",
    icon: "M3 3v18h18M7 15l4-5 3 3 5-7",
  },
  {
    label: "Mis enlaces",
    href: "/affiliate/links",
    icon: "M9 15l6-6M13 5l1.5-1.5a3.5 3.5 0 015 5L18 10M11 19l-1.5 1.5a3.5 3.5 0 01-5-5L6 14",
  },
  {
    label: "Marketplace",
    href: "/marketplace",
    icon: "M3 9l1-5h16l1 5M4 9h16v11a1 1 0 01-1 1H5a1 1 0 01-1-1V9zM9 13a3 3 0 006 0",
  },
  {
    label: "Mi red",
    href: "/affiliate/team",
    icon: "M12 4v4M6 20v-4M18 20v-4M6 16h12M12 8l-6 4M12 8l6 4",
  },
  {
    label: "Comisiones",
    href: "/affiliate",
    icon: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  },
  {
    label: "Wallet",
    href: "/wallet",
    icon: "M3 6h18M3 10h18M5 6v14a1 1 0 001 1h12a1 1 0 001-1V6M10 14h.01M14 14h.01",
  },
  {
    label: "Retiros",
    href: "/wallet/withdrawals",
    icon: "M12 19V5M6 11l6-6 6 6",
  },
  {
    label: "CROW Points",
    href: "/dashboard",
    icon: "M12 2l2.9 6 6.6.9-4.8 4.6 1.1 6.5L12 17.8 6.2 21l1.1-6.5-4.8-4.6 6.6-.9z",
  },
] as const;

function NavIcon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────
export async function AffiliateShell({
  children,
  activePath = "/affiliate",
}: {
  children: ReactNode;
  activePath?: string;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="crow-card mx-auto max-w-sm p-8 text-center">
          <p className="text-sm text-crow-muted">Sesión requerida.</p>
          <Link href="/login" className="mt-4 inline-block text-crow-glow underline text-sm">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  const userInitials = initials(user.name);
  const firstName = user.name.split(" ")[0];

  return (
    <div
      className="relative flex min-h-screen"
      style={{ background: "#07070A", color: "#F7F7FA", fontFamily: "Inter, sans-serif" }}
    >
      {/* ── Ambient glow ── */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div
          className="absolute -top-40 -left-20 h-[560px] w-[560px] rounded-full blur-[110px] opacity-30"
          style={{ background: "radial-gradient(circle,#6A00FF,transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 -right-32 h-[480px] w-[480px] rounded-full blur-[110px] opacity-20"
          style={{ background: "radial-gradient(circle,#A855F7,transparent 70%)" }}
        />
      </div>

      {/* ── SIDEBAR (desktop) ── */}
      <aside className="relative z-10 hidden h-screen w-[264px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0A0810]/80 backdrop-blur-xl lg:sticky lg:top-0 lg:flex">
        {/* Brand */}
        <div className="flex h-[72px] items-center gap-2.5 border-b border-white/[0.07] px-6">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/crow-logo.png" alt="CROW" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-semibold tracking-tight" style={{ fontFamily: "Space Grotesk, Inter, sans-serif", fontSize: 17 }}>
              CROW
            </span>
          </Link>
          <span className="ml-auto rounded-full border border-[rgba(168,85,247,0.35)] bg-[rgba(168,85,247,0.08)] px-2 py-1 text-[10.5px] font-semibold tracking-[0.08em] text-[#A855F7]">
            AFFILIATE
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-5">
          {NAV_ITEMS.map((item) => {
            const active = activePath === item.href || (item.href !== "/affiliate" && activePath.startsWith(item.href));
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={[
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                  active
                    ? "bg-[rgba(168,85,247,0.10)] text-white"
                    : "text-[#9B98A8] hover:bg-white/[0.04] hover:text-[#F7F7FA]",
                ].join(" ")}
              >
                {active && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
                    style={{ background: "linear-gradient(180deg,#A855F7,#6A00FF)", boxShadow: "0 0 12px rgba(168,85,247,0.6)" }}
                  />
                )}
                <span className={active ? "text-[#A855F7]" : "text-[#9B98A8]"}>
                  <NavIcon d={item.icon} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-white/[0.07] p-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
              style={{ background: "linear-gradient(135deg,#8B5CF6,#6A00FF)" }}
            >
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-medium">{user.name}</p>
              <p className="text-[11.5px] text-[#9B98A8]">Affiliate</p>
            </div>
            <form action={logoutAction} className="ml-auto">
              <button
                type="submit"
                title="Cerrar sesión"
                className="rounded-lg p-1.5 text-[#9B98A8] transition hover:text-[#FF4D6D]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">

        {/* Header */}
        <header
          className="sticky top-0 z-30 border-b border-white/[0.07] backdrop-blur-xl"
          style={{ background: "rgba(7,7,10,0.75)" }}
        >
          <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6">
            {/* Breadcrumb */}
            <div className="hidden items-center gap-1.5 text-[13px] text-[#9B98A8] sm:flex">
              <span>CROW</span>
              <span className="opacity-40">/</span>
              <span className="text-[#F7F7FA]">Affiliate</span>
            </div>

            {/* Search */}
            <div className="relative ml-2 hidden max-w-md flex-1 md:block">
              <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B98A8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Buscar ventas, productos o afiliados..."
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-4 text-[13.5px] placeholder:text-[#9B98A8] outline-none transition focus:border-[rgba(168,85,247,0.5)] focus:bg-white/[0.06]"
              />
            </div>

            {/* Right actions */}
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              {/* Status pill */}
              <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] px-3 py-2 text-[12px] text-[#9B98A8] sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[#A855F7]" />
                <span>Vista con datos</span>
              </div>

              {/* Notification bell */}
              <button className="relative flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/[0.06]">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#A855F7] shadow-[0_0_8px_#A855F7]" />
              </button>

              {/* Avatar */}
              <div
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[12.5px] font-semibold"
                style={{ background: "linear-gradient(135deg,#8B5CF6,#6A00FF)" }}
              >
                {userInitials}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-[1400px] space-y-7 px-4 py-7 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
