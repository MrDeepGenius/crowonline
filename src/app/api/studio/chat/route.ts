import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { chatAboutBlueprint } from "@/lib/ai/assistant";
import { parseBlueprint } from "@/lib/ai/blueprint";
import { hasRole } from "@/lib/rbac";
import type { Role } from "@/lib/domain";

/** Conversational Studio chat: answers + returns the refreshed blueprint. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!hasRole(user.roleList as Role[], "CREATOR")) {
    return NextResponse.json({ error: "creator role required" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const payload = body as { message?: string; blueprint?: unknown };
  const blueprint = parseBlueprint(payload.blueprint);
  const message = (payload.message ?? "").trim();

  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 422 });
  }
  if (!blueprint) {
    return NextResponse.json(
      { error: "blueprint required", hint: "Genera el blueprint primero" },
      { status: 422 },
    );
  }

  try {
    const result = await chatAboutBlueprint({ message, blueprint });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        error: "chat_failed",
        message: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 },
    );
  }
}