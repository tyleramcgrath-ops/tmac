import "server-only";
import { randomBytes } from "node:crypto";
import { one, query } from "./db";
import { getMember, isMatch, type Member } from "./members";

// "Share my plan": before meeting a match, a member sends a friend a private
// link with who they're meeting, where and when. It shows the match's first
// name, age and city only, and stops working 12 hours after the meetup.

const LINK_HOURS_AFTER = 12;

export type Plan = {
  token: string;
  owner: Pick<Member, "name" | "flag" | "city">;
  match: Pick<Member, "name" | "age" | "flag" | "city" | "country" | "palette">;
  place: string;
  startsAt: string;
  note: string;
};

export type CreatePlanResult = { ok: true; token: string } | { ok: false; error: string };

export async function createPlan(
  ownerId: string,
  matchId: string,
  input: { place: string; startsAt: string; note?: string },
): Promise<CreatePlanResult> {
  if (!(await isMatch(ownerId, matchId))) return { ok: false, error: "You can only share plans with a match." };
  const place = input.place.trim().slice(0, 140);
  const note = (input.note ?? "").trim().slice(0, 300);
  const startsAt = new Date(input.startsAt);
  if (!place) return { ok: false, error: "Add where you're meeting." };
  if (Number.isNaN(startsAt.getTime())) return { ok: false, error: "Add when you're meeting." };
  const now = Date.now();
  if (startsAt.getTime() < now - 6 * 3600_000 || startsAt.getTime() > now + 30 * 24 * 3600_000) {
    return { ok: false, error: "Pick a time between now and the next 30 days." };
  }
  const token = randomBytes(16).toString("base64url");
  await query(
    `insert into plans (token, owner_id, match_id, place, starts_at, note, expires_at)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [token, ownerId, matchId, place, startsAt.toISOString(), note, new Date(startsAt.getTime() + LINK_HOURS_AFTER * 3600_000).toISOString()],
  );
  return { ok: true, token };
}

export async function getPlan(token: string): Promise<Plan | null> {
  const row = await one<{ owner_id: string; match_id: string; place: string; starts_at: string | Date; note: string }>(
    "select owner_id, match_id, place, starts_at, note from plans where token = $1 and expires_at > now()",
    [token],
  );
  if (!row) return null;
  const [owner, match] = await Promise.all([getMember(row.owner_id), getMember(row.match_id)]);
  if (!owner || !match) return null;
  return {
    token,
    owner: { name: owner.name, flag: owner.flag, city: owner.city },
    match: { name: match.name, age: match.age, flag: match.flag, city: match.city, country: match.country, palette: match.palette },
    place: row.place,
    startsAt: new Date(row.starts_at).toISOString(),
    note: row.note,
  };
}
