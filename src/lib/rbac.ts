import type { Role } from "@/lib/domain";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  description?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

const MARKETPLACE_NAV: NavSection = {
  title: "Explorar",
  items: [
    { href: "/marketplace", label: "Marketplace", icon: "store" },
    { href: "/library", label: "Mi biblioteca", icon: "bookOpen" },
  ],
};

const CREATOR_NAV: NavSection = {
  title: "Creator",
  items: [
    { href: "/creator", label: "Resumen", icon: "sparkles" },
    { href: "/creator/studio", label: "Creator Studio", icon: "wand" },
    { href: "/creator/products", label: "Mis productos", icon: "package" },
    { href: "/creator/analytics", label: "Analytics", icon: "chart" },
  ],
};

const AFFILIATE_NAV: NavSection = {
  title: "Afiliados",
  items: [
    { href: "/affiliate", label: "Resumen", icon: "network" },
    { href: "/affiliate/links", label: "Mis enlaces", icon: "link" },
    { href: "/affiliate/sales", label: "Ventas", icon: "receipt" },
    { href: "/affiliate/team", label: "Equipo", icon: "users" },
  ],
};

const WALLET_NAV: NavSection = {
  title: "Wallet",
  items: [
    { href: "/wallet", label: "Saldo e historial", icon: "wallet" },
    { href: "/wallet/withdrawals", label: "Retiros", icon: "arrowUpRight" },
  ],
};

const ADMIN_NAV: NavSection = {
  title: "Administración",
  items: [
    { href: "/admin", label: "Panel", icon: "gauge" },
    { href: "/admin/users", label: "Usuarios", icon: "users" },
    { href: "/admin/products", label: "Productos", icon: "package" },
    { href: "/admin/orders", label: "Órdenes", icon: "receipt" },
    { href: "/admin/payments", label: "Pagos", icon: "creditCard" },
    { href: "/admin/withdrawals", label: "Retiros", icon: "arrowUpRight" },
    { href: "/admin/affiliates", label: "Afiliados", icon: "network" },
    { href: "/admin/creators", label: "Creators", icon: "sparkles" },
  ],
};

export function dashboardNav(roles: Role[]): NavSection[] {
  if (roles.includes("ADMIN")) {
    return [MARKETPLACE_NAV, CREATOR_NAV, AFFILIATE_NAV, WALLET_NAV, ADMIN_NAV];
  }

  const sections: NavSection[] = [MARKETPLACE_NAV];
  if (roles.includes("CREATOR")) sections.push(CREATOR_NAV);
  if (roles.includes("AFFILIATE")) sections.push(AFFILIATE_NAV);
  sections.push(WALLET_NAV);
  return sections;
}

export function hasRole(roles: Role[], role: Role) {
  return roles.includes("ADMIN") || roles.includes(role);
}

/**
 * Route access rules.
 * BUYER → marketplace, library, purchases.
 * AFFILIATE → marketplace, affiliate area, wallet.
 * CREATOR → studio, products, analytics, wallet, marketplace.
 * ADMIN → everything.
 */
export const ROUTE_RULES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/dashboard", roles: ["BUYER", "AFFILIATE", "CREATOR", "ADMIN"] },
  { prefix: "/library", roles: ["BUYER", "AFFILIATE", "CREATOR", "ADMIN"] },
  { prefix: "/wallet", roles: ["AFFILIATE", "CREATOR", "ADMIN"] },
  { prefix: "/creator", roles: ["CREATOR", "ADMIN"] },
  { prefix: "/affiliate", roles: ["AFFILIATE", "ADMIN"] },
  { prefix: "/admin", roles: ["ADMIN"] },
];

export function canAccessPath(roles: Role[], pathname: string) {
  if (roles.includes("ADMIN")) return true;
  const rule = ROUTE_RULES.find(
    (item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`),
  );
  if (!rule) return true; // public route
  return rule.roles.some((role) => roles.includes(role));
}

export function primaryRole(roles: Role[]): Role {
  if (roles.includes("ADMIN")) return "ADMIN";
  if (roles.includes("CREATOR")) return "CREATOR";
  if (roles.includes("AFFILIATE")) return "AFFILIATE";
  return "BUYER";
}

export const ICON_PATHS: Record<string, string> = {
  store: "M3 9l1.5-4.5h15L21 9M4 9h16v11a1 1 0 01-1 1H5a1 1 0 01-1-1V9z",
  bookOpen: "M12 6.5S9.5 4.5 4 5v14c5.5-.5 8 1.5 8 1.5M12 6.5S14.5 4.5 20 5v14c-5.5-.5-8 1.5-8 1.5",
  sparkles: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  wand: "M15 4l5 5M4 20l11-11M9 5l1 2M5 9l2 1",
  package: "M12 3l8 4.5v9L12 21l-8-4.5v-9z M4 7.5l8 4.5 8-4.5 M12 12v9",
  chart: "M4 20h16M7 16V9M12 16V5M17 16v-4",
  network: "M12 4v4M6 20v-4M18 20v-4M6 16h12M12 8l-6 4M12 8l6 4",
  link: "M10 13a5 5 0 007 0l2-2a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-2 2a5 5 0 007 7l1-1",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  users: "M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 7a3 3 0 11-6 0 3 3 0 016 0M21 20v-1a4 4 0 00-3-3.9M16 4.1a3 3 0 010 5.8",
  wallet: "M3 8V6a2 2 0 012-2h12M3 8h16a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2zM16 13h2",
  arrowUpRight: "M7 17L17 7M8 7h9v9",
  gauge: "M12 14l4-4M4 20a9 9 0 1116 0z",
  creditCard: "M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z",
};