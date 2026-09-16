"use server";

import { redirect } from "next/navigation";

import prisma from "@/lib/db";
import {
  clearSessionCookie,
  createSessionToken,
  hashPassword,
  normalizeRoles,
  serializeRoles,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth/session";
import { loginSchema, registerSchema, type ActionState } from "@/lib/validation";
import { ensureWallet } from "@/server/services/wallet";
import { ensureAffiliate, findAffiliateByCode, registerReferral } from "@/server/services/affiliate";
import { getCreatorPlan } from "@/lib/plans";
import { primaryRole } from "@/lib/rbac";

function redirectFor(roles: string[]) {
  const role = primaryRole(normalizeRoles(roles));
  if (role === "CREATOR") return "/creator";
  if (role === "AFFILIATE") return "/affiliate";
  if (role === "ADMIN") return "/admin";
  return "/dashboard";
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const rawRoles = formData.getAll("roles").map(String);
  const parsed = registerSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? "").toLowerCase(),
    password: String(formData.get("password") ?? ""),
    roles: rawRoles.length ? rawRoles : ["BUYER"],
    referralCode: String(formData.get("referralCode") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los datos del formulario",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password, roles, referralCode } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, message: "Ya existe una cuenta con ese email" };
  }

  const rolesWithBase = Array.from(new Set(["BUYER", ...roles]));
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      roles: serializeRoles(rolesWithBase),
      profile: { create: {} },
    },
  });

  await ensureWallet(user.id);

  if (rolesWithBase.includes("CREATOR")) {
    const plan = getCreatorPlan("START");
    await prisma.creatorSubscription.create({
      data: {
        userId: user.id,
        plan: plan.id,
        priceUsdt: plan.priceUsdt,
        productLimit: plan.productLimit,
        publishedLimit: plan.publishedLimit,
        expiresAt: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
      },
    });
  }

  if (rolesWithBase.includes("AFFILIATE")) {
    const parent = referralCode ? await findAffiliateByCode(referralCode) : null;
    const affiliate = await ensureAffiliate(user.id, parent?.id ?? null);
    if (parent) {
      await registerReferral(parent.referralCode, user.id);
    }
    await prisma.referral.create({
      data: {
        affiliateId: affiliate.id,
        invitedEmail: email,
        code: affiliate.referralCode,
      },
    });
  }

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    roles: normalizeRoles(user.roles),
  });

  redirect(redirectFor(rolesWithBase));
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Email o contraseña inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return { ok: false, message: "Credenciales incorrectas" };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { ok: false, message: "Credenciales incorrectas" };
  }
  if (user.status !== "ACTIVE") {
    return { ok: false, message: "Tu cuenta está suspendida. Contacta a soporte." };
  }

  await ensureWallet(user.id);
  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    roles: normalizeRoles(user.roles),
  });

  redirect(redirectFor(normalizeRoles(user.roles)));
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

export async function previewSessionToken(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    roles: normalizeRoles(user.roles),
  });
}