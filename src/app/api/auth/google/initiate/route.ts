import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { generateCodeVerifier, generateState } from "arctic";

import { createGoogleProvider } from "@/lib/auth/google";

/**
 * GET /api/auth/google
 * Initiates the Google OAuth2 flow.
 *
 * Accepts optional query params forwarded to the callback:
 *   ?next=/some/path   — post-login redirect
 *   ?ref=CODE          — referral code to persist through registration
 *   ?roles=CREATOR     — default roles hint for new accounts
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "";
  const ref = searchParams.get("ref") ?? "";
  const roles = searchParams.get("roles") ?? "";

  const google = createGoogleProvider();
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const url = await google.createAuthorizationURL(state, codeVerifier, {
    scopes: ["openid", "email", "profile"],
  });

  // Encode extra params in state-payload cookie so the callback can recover them.
  // The state value itself is the CSRF token; metadata rides alongside in a
  // separate httpOnly cookie so it never touches the URL.
  const store = await cookies();

  store.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  store.set("google_oauth_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  // Carry next/ref/roles through the OAuth round-trip.
  const meta = JSON.stringify({ next, ref, roles });
  store.set("google_oauth_meta", meta, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  redirect(url.toString());
}
