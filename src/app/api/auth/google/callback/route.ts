import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OAuth2RequestError } from "arctic";

import prisma from "@/lib/db";
import { createGoogleProvider } from "@/lib/auth/google";
import {
  normalizeRoles,
  serializeRoles,
  setSessionCookie,
} from "@/lib/auth/session";
import { ensureWallet } from "@/server/services/wallet";
import { ensureAffiliate, findAffiliateByCode, registerReferral } from "@/server/services/affiliate";
import { getCreatorPlan, planExpiryFrom } from "@/lib/plans";
import { primaryRole } from "@/lib/rbac";
import type { Role } from "@/lib/domain";
import { ROLES } from "@/lib/domain";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function redirectFor(roles: string[]) {
  const role = primaryRole(normalizeRoles(roles));
  if (role === "CREATOR") return "/creator";
  if (role === "AFFILIATE") return "/affiliate";
  if (role === "ADMIN") return "/admin";
  return "/dashboard";
}

function safeNext(next: string): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "";
}

/** Parse roles from the query-string hint; only allow known non-ADMIN roles. */
function parseRolesHint(raw: string): Role[] {
  if (!raw) return [];
  const allowed: Role[] = ["BUYER", "AFFILIATE", "CREATOR"];
  return raw
    .split(",")
    .map((r) => r.trim().toUpperCase() as Role)
    .filter((r) => allowed.includes(r) && ROLES.includes(r));
}

// ---------------------------------------------------------------------------
// Google userinfo shape
// ---------------------------------------------------------------------------
type GoogleUser = {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
};

async function fetchGoogleUser(accessToken: string): Promise<GoogleUser> {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Google userinfo failed: ${res.status}`);
  }
  return res.json() as Promise<GoogleUser>;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const store = await cookies();

  const storedState = store.get("google_oauth_state")?.value ?? null;
  const storedVerifier = store.get("google_oauth_verifier")?.value ?? null;
  const metaRaw = store.get("google_oauth_meta")?.value ?? "{}";

  // Clean up OAuth cookies immediately regardless of outcome.
  store.delete("google_oauth_state");
  store.delete("google_oauth_verifier");
  store.delete("google_oauth_meta");

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // User cancelled or Google returned an error.
  if (error) {
    redirect("/login?error=google_cancelled");
  }

  // CSRF / state validation.
  if (!code || !state || !storedState || !storedVerifier || state !== storedState) {
    redirect("/login?error=google_invalid_state");
  }

  // Parse metadata carried through the round-trip.
  let meta: { next?: string; ref?: string; roles?: string } = {};
  try {
    meta = JSON.parse(metaRaw);
  } catch {
    // ignore malformed meta
  }

  const nextPath = safeNext(meta.next ?? "");
  const referralCode = meta.ref ?? "";
  const rolesHint = parseRolesHint(meta.roles ?? "");

  try {
    const google = createGoogleProvider();
    const tokens = await google.validateAuthorizationCode(code, storedVerifier);
    const accessToken = tokens.accessToken;

    const googleUser = await fetchGoogleUser(accessToken);

    if (!googleUser.email || !googleUser.email_verified) {
      redirect("/login?error=google_unverified_email");
    }

    const email = googleUser.email.toLowerCase();

    // ------------------------------------------------------------------
    // Find or create user — never duplicate on email.
    // ------------------------------------------------------------------
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Existing account — just log in. Never modify roles via OAuth.
      if (user.status !== "ACTIVE") {
        redirect("/login?error=account_suspended");
      }
      await ensureWallet(user.id);
    } else {
      // New account — create with the roles hint (defaults to BUYER).
      const rolesWithBase: Role[] = Array.from(
        new Set(["BUYER" as Role, ...rolesHint]),
      );

      // Google accounts have no password; store an empty hash that can never
      // match any bcrypt verification (bcrypt hashes always start with "$2").
      const passwordHash = "";

      user = await prisma.user.create({
        data: {
          name: googleUser.name || email.split("@")[0],
          email,
          passwordHash,
          roles: serializeRoles(rolesWithBase),
          profile: { create: {} },
        },
      });

      await ensureWallet(user.id);

      // Creator plan bootstrap.
      if (rolesWithBase.includes("CREATOR")) {
        const plan = getCreatorPlan("START");
        await prisma.creatorSubscription.create({
          data: {
            userId: user.id,
            plan: plan.id,
            priceUsdt: plan.priceUsdt,
            productLimit: plan.productLimit,
            publishedLimit: plan.publishedLimit,
            expiresAt: planExpiryFrom(new Date(), plan.durationDays),
          },
        });
      }

      // Affiliate setup + referral attribution.
      if (rolesWithBase.includes("AFFILIATE")) {
        const parent = referralCode
          ? await findAffiliateByCode(referralCode)
          : null;
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
      } else if (referralCode) {
        // Durable buyer attribution (mirrors registerAction behaviour).
        await registerReferral(referralCode, user.id);
      }
    }

    // Issue the existing CROW JWT session — same as email/password login.
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      roles: normalizeRoles(user.roles),
    });

    const destination =
      nextPath || redirectFor(normalizeRoles(user.roles));
    redirect(destination);
  } catch (err) {
    if (err instanceof OAuth2RequestError) {
      redirect("/login?error=google_oauth_error");
    }
    // Re-throw Next.js redirect signals unchanged.
    throw err;
  }
}
