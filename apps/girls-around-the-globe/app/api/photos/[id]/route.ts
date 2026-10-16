import { NextResponse } from "next/server";
import { one, query } from "@/lib/db";
import { sessionUserId } from "@/lib/session";

// Member photos are only visible to signed-in members.
export async function GET(_request: Request, ctx: RouteContext<"/api/photos/[id]">) {
  if (!(await sessionUserId())) return new NextResponse(null, { status: 401 });
  const { id } = await ctx.params;
  const photo = await one<{ mime: string; data: Uint8Array }>("select mime, data from photos where id = $1", [id]);
  if (!photo) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.mime,
      "Cache-Control": "private, max-age=86400, immutable",
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
