import Link from "next/link";

import { ICON_PATHS } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const path = ICON_PATHS[name] ?? ICON_PATHS.sparkles;
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-[18px] w-[18px]", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={path} />
    </svg>
  );
}

export function SidebarNav({
  sections,
  activePath,
}: {
  sections: { title: string; items: { href: string; label: string; icon: string }[] }[];
  activePath?: string;
}) {
  return (
    <nav className="mt-8 flex-1 space-y-6 overflow-y-auto scrollbar-none">
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
                    className={cn(
                      "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition",
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
  );
}