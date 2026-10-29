import { NextResponse } from "next/server";
import { one, query } from "@/lib/db";
import { MAX_PHOTOS, newId } from "@/lib/members";
import { MAX_PHOTO_BYTES, sniffImageType } from "@/lib/photos";
import { sessionUserId } from "@/lib/session";

export async function POST(request: Request) {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ error: "Log in to upload photos." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  if (file.size > MAX_PHOTO_BYTES) return NextResponse.json({ error: "Photos must be 4 MB or smaller." }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImageType(bytes);
  if (!mime) return NextResponse.json({ error: "Use a JPEG, PNG or WebP image." }, { status: 415 });

  const count = await one<{ n: number; next: number }>(
    "select count(*)::int as n, coalesce(max(position), -1)::int + 1 as next from photos where user_id = $1",
    [userId],
  );
  if ((count?.n ?? 0) >= MAX_PHOTOS) {
    return NextResponse.json({ error: `You can have up to ${MAX_PHOTOS} photos.` }, { status: 409 });
  }

  const id = newId();
  await query("insert into photos (id, user_id, mime, data, position) values ($1, $2, $3, $4, $5)", [
    id,
    userId,
    mime,
    Buffer.from(bytes),
    count?.next ?? 0,
  ]);
  return NextResponse.json({ id, url: `/api/photos/${id}` }, { status: 201 });
}
