import { Google } from "arctic";

/**
 * Google OAuth2 provider (arctic v1).
 * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in env.
 * Callback URL must be registered in Google Cloud Console.
 */
export function createGoogleProvider() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set to use Google OAuth",
    );
  }

  const redirectUri = `${appUrl}/api/auth/google/callback`;
  return new Google(clientId, clientSecret, redirectUri);
}

/** Returns true only when both Google env vars are present. */
export function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}
