import { NextResponse } from "next/server";
import { getCallFor, pushSignal, signalsFor, type Signal } from "@/lib/calls";
import { sessionUserId } from "@/lib/session";

const KINDS: Signal["kind"][] = ["offer", "answer", "ice"];

// Call state plus the other side's signalling messages since `after`.
export async function GET(request: Request, ctx: RouteContext<"/api/calls/[id]">) {
  const me = await sessionUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await ctx.params;
  const call = await getCallFor(me, id);
  if (!call) return NextResponse.json({ error: "Call not found." }, { status: 404 });
  const after = Number(new URL(request.url).searchParams.get("after") ?? 0) || 0;
  return NextResponse.json({ status: call.status, signals: await signalsFor(me, id, after) });
}

export async function POST(request: Request, ctx: RouteContext<"/api/calls/[id]">) {
  const me = await sessionUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as { kind?: string; payload?: unknown } | null;
  const kind = KINDS.find((k) => k === body?.kind);
  if (!kind || body?.payload === undefined || JSON.stringify(body.payload).length > 20_000) {
    return NextResponse.json({ error: "Bad signal." }, { status: 400 });
  }
  const ok = await pushSignal(me, id, kind, body.payload);
  return NextResponse.json({ ok }, { status: ok ? 200 : 409 });
}
