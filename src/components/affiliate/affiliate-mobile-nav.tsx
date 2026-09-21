"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type NavItem = {
  readonly label: string;
  readonly href: string;
  readonly icon: string;
};

function NavIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function AffiliateMobileNav({
  navItems,
  activePath,
  userInitials,
  userName,
}: {
  navItems: readonly NavItem[];
  activePath: string;
  userInitials: string;
  userName: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#9B98A8] transition hover:bg-white/[0.08] hover:text-[#F7F7FA] lg:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" aria-hidden onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/[0.07] backdrop-blur-xl transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ background: "#0A0810" }}
      >
        <div className="flex h-[64px] items-center justify-between border-b border-white/[0.07] px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold" style={{ background: "linear-gradient(135deg,#8B5CF6,#6A00FF)" }}>
              {userInitials}
            </div>
            <span className="text-[13.5px] font-medium text-[#F7F7FA]">{userName}</span>
          </div>
          <button type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9B98A8] hover:text-[#F7F7FA]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-5 scrollbar-none">
          {navItems.map((item) => {
            const active = activePath === item.href || (item.href !== "/affiliate" && activePath.startsWith(item.href));
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "relative flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors",
                  active ? "bg-[rgba(168,85,247,0.10)] text-white" : "text-[#9B98A8] hover:bg-white/[0.04] hover:text-[#F7F7FA]",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full" style={{ background: "linear-gradient(180deg,#A855F7,#6A00FF)" }} />
                )}
                <span className={active ? "text-[#A855F7]" : "text-[#9B98A8]"}><NavIcon d={item.icon} /></span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
