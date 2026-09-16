import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

import { canAccessPath } from "@/lib/rbac";
import { normalizeRoles } from "@/lib/auth/roles";

const SESSION_COOKIE = "crow_session";

function getSecret() {
  const secret =
    process.env.SESSION_SECRET ?? "crow-dev-session-secret-change-me-000";
  return new TextEncoder().encode(secret);
}

async function readRoles(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: String(payload.userId ?? ""),
      roles: normalizeRoles(payload.roles),
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Referral tracking: /r/CODE → marketplace with the code persisted.
  if (pathname.startsWith("/r/")) {
    const code = pathname.replace("/r/", "").split("/")[0];
    const url = request.nextUrl.clone();
    url.pathname = "/marketplace";
    url.searchParams.set("ref", code);
    const response = NextResponse.redirect(url);
    response.cookies.set("crow_ref", code, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  }

  const session = await readRoles(request);

  if (!session && !pathname.startsWith("/login") && !pathname.startsWith("/register")) {
    const protectedPrefixes = [
      "/dashboard",
      "/creator",
      "/affiliate",
      "/wallet",
      "/library",
      "/admin",
    ];
    if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (session && !canAccessPath(session.roles, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.set("denied", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/r/:path*",
    "/dashboard/:path*",
    "/creator/:path*",
    "/affiliate/:path*",
    "/wallet/:path*",
    "/library/:path*",
    "/admin/:path*",
  ],
};