"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import { CrowMark } from "@/components/brand/crow-mark";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PUBLIC_LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/#creator-studio", label: "Creator Studio" },
  { href: "/#afiliados", label: "Afiliados" },
  { href: "/#planes", label: "Planes" },
];

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          aria-hidden
          onClick={onClose}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[280px] flex-col border-l border-white/[0.06] bg-[#0B0B0B] transition-transform duration-300 md:hidden",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-5">
          <span className="text-sm font-semibold tracking-[0.18em]">CROW</span>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-crow-muted hover:text-crow-text"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-5">
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex min-h-[44px] items-center rounded-xl px-3 py-2.5 text-[15px] text-crow-muted transition hover:bg-white/[0.05] hover:text-crow-text"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2.5 border-t border-white/[0.06] p-4">
          <Link href="/login" onClick={onClose} className={cn(buttonClass("secondary", "md"), "w-full")}>
            Iniciar sesión
          </Link>
          <Link href="/register" onClick={onClose} className={cn(buttonClass("primary", "md"), "w-full")}>
            Crear cuenta gratis
          </Link>
        </div>
      </div>
    </>
  );
}

export function SiteHeaderClient({
  sessionName,
  roleLabel,
}: {
  sessionName?: string;
  roleLabel?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0B0B0B]/85 backdrop-blur-xl">
      <div className="crow-container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <CrowMark size={32} />
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-[0.18em] text-crow-text">CROW</span>
            <span className="mt-0.5 text-[9px] uppercase tracking-[0.3em] text-crow-muted">Market</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {PUBLIC_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-[13px] text-crow-muted transition hover:bg-white/[0.05] hover:text-crow-text">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          {sessionName ? (
            <>
              <span className="hidden text-[12px] text-crow-muted sm:block">{roleLabel ?? "Mi cuenta"}</span>
              <Link href="/dashboard" className={buttonClass("secondary", "sm")}>{sessionName.split(" ")[0]}</Link>
              <Link href="/dashboard" className={cn(buttonClass("secondary", "sm"), "sm:hidden")}>{sessionName.split(" ")[0]}</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden rounded-lg px-3 py-2 text-[13px] text-crow-muted transition hover:text-crow-text sm:block">
                Iniciar sesión
              </Link>
              <Link href="/register" className={cn(buttonClass("primary", "sm"), "hidden sm:inline-flex")}>
                Crear cuenta
              </Link>
              <button
                type="button"
                aria-label="Abrir menú"
                onClick={() => setMenuOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-crow-muted transition hover:bg-white/[0.08] hover:text-crow-text md:hidden"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
