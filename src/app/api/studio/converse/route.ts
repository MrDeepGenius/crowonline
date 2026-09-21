import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/rbac";
import type { Role } from "@/lib/domain";
import { converse, type ConversationPhase, type ProductSpec } from "@/lib/ai/converse";
import { parseBlueprint } from "@/lib/ai/blueprint";

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({ role: z.string(), content: z.string() })).default([]),
  phase: z.enum(["DISCOVERY", "GATHERING", "READY", "GENERATING", "REFINING"]).default("DISCOVERY"),
  spec: z.record(z.unknown()).default({}),
  blueprint: z.unknown().optional(),
});

/**
 * POST /api/studio/converse
 *
 * Unified conversational endpoint for the Creator Studio.
 * Handles all phases: DISCOVERY → GATHERING → READY → GENERATING → REFINING.
 * Never requires a separate "generate blueprint" button — everything flows
 * through natural conversation.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!hasRole(user.roleList as Role[], "CREATOR")) {
    return NextResponse.json({ error: "creator role required" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload", details: parsed.error.flatten() }, { status: 422 });
  }

  const { message, history, phase, spec, blueprint: rawBlueprint } = parsed.data;

  try {
    const result = await converse({
      message,
      history: history as { role: "system" | "user" | "assistant"; content: string }[],
      phase: phase as ConversationPhase,
      spec: spec as ProductSpec,
      blueprint: rawBlueprint ? parseBlueprint(rawBlueprint) : null,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: "converse_failed", message: error instanceof Error ? error.message : "unknown error" },
      { status: 500 },
    );
  }
}
