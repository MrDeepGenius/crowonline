"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NavIcon } from "@/components/layout/dashboard-nav";

type NavSection = {
  title: string;
  items: { href: string; label: string; icon: string }[];
};

/** Hamburger button + full-screen drawer for the dashboard on mobile. */
export function MobileNav({
  sections,
  activePath,
  balanceFormatted,
}: {
  sections: NavSection[];
  activePath?: string;
  balanceFormatted: string;
}) {
  const [open, setOpen] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on route change (any link click inside drawer)
  function handleLinkClick() {
    setOpen(false);
  }

  return (
    <>
      {/* Hamburger button — only visible on mobile (<lg) */}
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-crow-muted transition hover:bg-white/[0.08] hover:text-crow-text lg:hidden"
      >
        {open ? (
          // X icon
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          // Hamburger icon
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/[0.06] bg-[#0A0A0C] transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Menú de navegación"
      >
        {/* Drawer header */}
        <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-5">
          <Link href="/" onClick={handleLinkClick}>
            <span className="text-sm font-semibold tracking-[0.2em] text-crow-text">CROW</span>
            <span className="ml-1.5 text-[10px] uppercase tracking-[0.28em] text-crow-muted">Market</span>
          </Link>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-crow-muted hover:text-crow-text"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5 scrollbar-none">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-crow-muted/70">
                {section.title}
              </p>
              <ul className="mt-2 space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    activePath === item.href ||
                    (activePath?.startsWith(`${item.href}/`) ?? false);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={handleLinkClick}
                        className={cn(
                          "flex min-h-[44px] items-center gap-2.5 rounded-xl px-2.5 py-2 text-[14px] transition",
                          active
                            ? "border border-crow-violet/30 bg-crow-violet/12 text-crow-text"
                            : "border border-transparent text-crow-muted hover:bg-white/[0.04] hover:text-crow-text",
                        )}
                      >
                        <span className={active ? "text-crow-glow" : "text-crow-muted/80"}>
                          <NavIcon name={item.icon} />
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Balance widget */}
        <div className="border-t border-white/[0.06] p-4">
          <div className="rounded-xl border border-white/[0.06] bg-crow-surface/80 p-3.5">
            <p className="text-[10px] uppercase tracking-wider text-crow-muted">
              Saldo disponible
            </p>
            <p className="mt-1 text-lg font-semibold text-crow-text">{balanceFormatted}</p>
            <Link
              href="/wallet"
              onClick={handleLinkClick}
              className="mt-3 flex min-h-[36px] w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-[13px] text-crow-text transition hover:bg-white/[0.1]"
            >
              Ir a wallet
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
