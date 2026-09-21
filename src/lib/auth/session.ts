import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

import prisma from "@/lib/db";
import { normalizeRoles, serializeRoles } from "@/lib/auth/roles";
import type { Role } from "@/lib/domain";

export { normalizeRoles, serializeRoles };

const SESSION_COOKIE = "crow_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  roles: Role[];
};

import { getSessionSecret } from "@/lib/env";

function getSecret() {
  return getSessionSecret();
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function readSessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const roles = normalizeRoles(payload.roles);
    if (!payload.userId || !payload.email) return null;
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      name: String(payload.name ?? ""),
      roles,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return readSessionToken(store.get(SESSION_COOKIE)?.value);
}

export type CurrentUser = NonNullable<
  Awaited<ReturnType<typeof loadUser>>
>;

async function loadUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallet: true,
      affiliate: true,
      creatorPlan: true,
      profile: true,
    },
  });
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await loadUser(session.userId);
  if (!user || user.status !== "ACTIVE") return null;
  return { ...user, roleList: normalizeRoles(user.roles) };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

export async function getSessionCookieName() {
  return SESSION_COOKIE;
}