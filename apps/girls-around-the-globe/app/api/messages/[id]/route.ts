import { NextResponse } from "next/server";
import { isMatch, messagesBetween } from "@/lib/members";
import { sessionUserId } from "@/lib/session";

// Polled by the chat screen for new messages.
export async function GET(request: Request, ctx: RouteContext<"/api/messages/[id]">) {
  const me = await sessionUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await ctx.params;
  if (!(await isMatch(me, id))) return NextResponse.json({ error: "Not matched." }, { status: 403 });
  const after = Number(new URL(request.url).searchParams.get("after") ?? 0) || 0;
  return NextResponse.json({ messages: await messagesBetween(me, id, after) });
}
