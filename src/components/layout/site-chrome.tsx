import Link from "next/link";

import { CrowMark } from "@/components/brand/crow-mark";
import { buttonClass } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { ROLE_LABEL } from "@/lib/domain";
import { primaryRole } from "@/lib/rbac";

const PUBLIC_LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/#creator-studio", label: "Creator Studio" },
  { href: "/#afiliados", label: "Afiliados" },
  { href: "/#planes", label: "Planes" },
];

export async function SiteHeader() {
  const session = await getSession();
  const role = session ? primaryRole(session.roles) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0B0B0B]/85 backdrop-blur-xl">
      <div className="crow-container flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <CrowMark size={32} />
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-[0.18em] text-crow-text">
              CROW
            </span>
            <span className="mt-0.5 text-[9px] uppercase tracking-[0.3em] text-crow-muted">
              Market
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-[13px] text-crow-muted transition hover:bg-white/[0.05] hover:text-crow-text"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          {session ? (
            <>
              <span className="hidden text-[12px] text-crow-muted sm:block">
                {role ? ROLE_LABEL[role] : "Mi cuenta"}
              </span>
              <Link href="/dashboard" className={buttonClass("secondary", "sm")}>
                {session.name.split(" ")[0]}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-lg px-3 py-2 text-[13px] text-crow-muted transition hover:text-crow-text sm:block"
              >
                Iniciar sesión
              </Link>
              <Link href="/register" className={buttonClass("primary", "sm")}>
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/[0.06] bg-[#0A0A0C]">
      <div className="crow-container grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <CrowMark size={30} />
            <span className="text-sm font-semibold tracking-[0.18em]">CROW</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-crow-muted">
            La plataforma que convierte ideas en productos digitales con IA y las
            distribuye con una red de afiliados de 5 niveles.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-crow-text">
            Producto
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-crow-muted">
            <li>
              <Link href="/marketplace" className="hover:text-crow-text">
                Marketplace
              </Link>
            </li>
            <li>
              <Link href="/creator/studio" className="hover:text-crow-text">
                Creator Studio
              </Link>
            </li>
            <li>
              <Link href="/affiliate" className="hover:text-crow-text">
                Programa de afiliados
              </Link>
            </li>
            <li>
              <Link href="/wallet" className="hover:text-crow-text">
                Wallet USDT
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-crow-text">
            Acceso
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-crow-muted">
            <li>
              <Link href="/login" className="hover:text-crow-text">
                Iniciar sesión
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-crow-text">
                Crear cuenta gratis
              </Link>
            </li>
            <li>
              <Link href="/library" className="hover:text-crow-text">
                Mi biblioteca
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-crow-text">
                Panel admin
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/[0.06] py-6">
        <div className="crow-container flex flex-col items-center justify-between gap-3 text-xs text-crow-muted sm:flex-row">
          <span>© {new Date().getFullYear()} CROW MARKET</span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-crow-violet" />
            Pagos en USDT · BEP-20
          </span>
        </div>
      </div>
    </footer>
  );
}