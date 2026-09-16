import { ROLES, type Role } from "@/lib/domain";

/**
 * Edge-safe role helpers (no Prisma / no bcrypt) so the middleware can run in
 * the Edge runtime. The server-side session module re-exports the same logic.
 */
export function normalizeRoles(input: unknown): Role[] {
  const list = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? parse(input)
      : [];

  const cleaned = list.filter((role): role is Role =>
    (ROLES as readonly string[]).includes(String(role)),
  );

  return cleaned.length ? Array.from(new Set(cleaned)) : ["BUYER"];
}

function parse(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return raw.split(",").map((item) => item.trim());
  }
}

export function serializeRoles(roles: unknown) {
  return JSON.stringify(normalizeRoles(roles));
}