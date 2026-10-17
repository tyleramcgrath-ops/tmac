import { NextResponse } from "next/server";
import { incomingCall } from "@/lib/calls";
import { getMember } from "@/lib/members";
import { sessionUserId } from "@/lib/session";

// Polled by every signed-in page so an incoming call can ring anywhere.
export async function GET() {
  const me = await sessionUserId();
  if (!me) return NextResponse.json({ call: null });
  const call = await incomingCall(me);
  if (!call) return NextResponse.json({ call: null });
  const from = await getMember(call.callerId);
  if (!from) return NextResponse.json({ call: null });
  return NextResponse.json({
    call: { id: call.id, from: { name: from.name, flag: from.flag, city: from.city, palette: from.palette, photos: from.photos } },
  });
}
