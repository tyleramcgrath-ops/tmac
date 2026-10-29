import { NextResponse } from "next/server";
import { one, query } from "@/lib/db";
import { isMatch } from "@/lib/members";
import { sessionUserId } from "@/lib/session";

// Member photos are only visible to signed-in members, and a Discreet
// member's photos only to the member and their matches.
export async function GET(_request: Request, ctx: RouteContext<"/api/photos/[id]">) {
  const viewer = await sessionUserId();
  if (!viewer) return new NextResponse(null, { status: 401 });
  const { id } = await ctx.params;
  const photo = await one<{ mime: string; data: Uint8Array; user_id: string; discreet: boolean }>(
    "select p.mime, p.data, p.user_id, u.discreet from photos p join users u on u.id = p.user_id where p.id = $1",
    [id],
  );
  if (!photo) return new NextResponse(null, { status: 404 });
  if (photo.discreet && photo.user_id !== viewer && !(await isMatch(viewer, photo.user_id))) {
    return new NextResponse(null, { status: 404 });
  }
  return new NextResponse(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.mime,
      // Short cache, so turning on Discreet or unmatching takes effect quickly.
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/photos/[id]">) {
  const userId = await sessionUserId();
  if (!userId) return new NextResponse(null, { status: 401 });
  const { id } = await ctx.params;
  const rows = await query("delete from photos where id = $1 and user_id = $2 returning id", [id, userId]);
  return new NextResponse(null, { status: rows.length ? 204 : 404 });
}
