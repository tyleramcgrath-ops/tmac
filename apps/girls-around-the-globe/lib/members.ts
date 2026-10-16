import "server-only";
import { randomBytes } from "node:crypto";
import { one, query } from "./db";
import type { Vibe } from "./profiles";

export const FREE_DAILY_LIKES = 25;
export const FREE_DAILY_SUPER_LIKES = 1;
export const PREMIUM_DAILY_SUPER_LIKES = 5;
export const MAX_PHOTOS = 6;

export type Member = {
  id: string;
  name: string;
  age: number;
  gender: "woman" | "man" | "nonbinary";
  showMe: "women" | "men" | "everyone";
  city: string;
  country: string;
  flag: string;
  bio: string;
  vibe: Vibe;
  languages: string[];
  interests: string[];
  occupation: string;
  traveling: string | null;
  prompts: { q: string; a: string }[];
  palette: [string, string];
  verified: boolean;
  isSeed: boolean;
  photos: string[];
  premium: boolean;
  passport: string | null;
  lastActive: string;
};

type UserRow = {
  id: string;
  name: string;
  birthdate: string | Date;
  gender: Member["gender"];
  show_me: Member["showMe"];
  city: string;
  country: string;
  flag: string;
  bio: string;
  vibe: Vibe;
  languages: string;
  interests: string;
  occupation: string;
  traveling: string | null;
  prompts: unknown;
  palette: string;
  verified: boolean;
  is_seed: boolean;
  passport: string | null;
  premium_until: string | Date | null;
  last_active: string | Date;
  photo_ids: string[] | null;
};

const SELECT = `
  select u.*,
    (select array_agg(p.id order by p.position, p.created_at) from photos p where p.user_id = u.id) as photo_ids
  from users u`;

export function newId(): string {
  return randomBytes(12).toString("base64url");
}

export function ageFrom(birthdate: string | Date): number {
  const d = new Date(birthdate);
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--;
  return age;
}

function split(list: string): string[] {
  return list.split(",").map((s) => s.trim()).filter(Boolean);
}

function activeLabel(at: string | Date): string {
  const mins = (Date.now() - new Date(at).getTime()) / 60000;
  if (mins < 15) return "Active now";
  if (mins < 60 * 24) return "Active today";
  if (mins < 60 * 24 * 7) return "Active this week";
  return "Active a while ago";
}

function toMember(r: UserRow): Member {
  const [a, b] = r.palette.split(",");
  const prompts = typeof r.prompts === "string" ? JSON.parse(r.prompts) : r.prompts;
  return {
    id: r.id,
    name: r.name,
    age: ageFrom(r.birthdate),
    gender: r.gender,
    showMe: r.show_me,
    city: r.city,
    country: r.country,
    flag: r.flag,
    bio: r.bio,
    vibe: r.vibe,
    languages: split(r.languages),
    interests: split(r.interests),
    occupation: r.occupation,
    traveling: r.traveling,
    prompts: Array.isArray(prompts) ? prompts : [],
    palette: [a ?? "#e8436a", b ?? "#1b1838"],
    verified: r.verified,
    isSeed: r.is_seed,
    photos: (r.photo_ids ?? []).map((id) => `/api/photos/${id}`),
    premium: !!r.premium_until && new Date(r.premium_until) > new Date(),
    passport: r.passport,
    lastActive: r.is_seed ? "Active today" : activeLabel(r.last_active),
  };
}

export async function getMember(id: string): Promise<Member | null> {
  const row = await one<UserRow>(`${SELECT} where u.id = $1`, [id]);
  return row ? toMember(row) : null;
}

export async function touch(id: string) {
  await query("update users set last_active = now() where id = $1 and last_active < now() - interval '5 minutes'", [id]);
}

const GENDER_FOR_SHOW_ME = { women: "woman", men: "man" } as const;

// People the member hasn't swiped on yet, who are open to the member's gender.
// Real members come first, most recently active first; sample members follow
// in their seeded order.
export async function deckFor(me: Member, limit = 20): Promise<Member[]> {
  const params: unknown[] = [me.id, me.gender === "woman" ? "women" : me.gender === "man" ? "men" : "everyone"];
  let where = `u.id <> $1
    and not exists (select 1 from swipes s where s.swiper_id = $1 and s.target_id = u.id)
    and (u.show_me = 'everyone' or u.show_me = $2)`;
  if (me.showMe !== "everyone") {
    params.push(GENDER_FOR_SHOW_ME[me.showMe]);
    where += ` and u.gender = $${params.length}`;
  }
  if (me.premium && me.passport) {
    params.push(me.passport);
    where += ` and lower(u.city) = lower($${params.length})`;
  }
  params.push(limit);
  const rows = await query<UserRow>(
    `${SELECT} where ${where}
     order by u.is_seed, case when u.is_seed then u.created_at end, u.last_active desc
     limit $${params.length}`,
    params,
  );
  return rows.map(toMember);
}

export type SwipeQuota = { likesLeft: number | null; superLeft: number };

export async function quotaFor(me: Member): Promise<SwipeQuota> {
  const [counts] = await query<{ likes: number; supers: number }>(
    `select count(*) filter (where liked)::int as likes, count(*) filter (where super)::int as supers
     from swipes where swiper_id = $1 and created_at > now() - interval '24 hours'`,
    [me.id],
  );
  return {
    likesLeft: me.premium ? null : Math.max(0, FREE_DAILY_LIKES - counts.likes),
    superLeft: Math.max(0, (me.premium ? PREMIUM_DAILY_SUPER_LIKES : FREE_DAILY_SUPER_LIKES) - counts.supers),
  };
}

export type SwipeResult =
  | { ok: true; match: boolean }
  | { ok: false; reason: "out-of-likes" | "out-of-super-likes" | "not-found" };

export async function recordSwipe(me: Member, targetId: string, liked: boolean, isSuper: boolean): Promise<SwipeResult> {
  if (targetId === me.id) return { ok: false, reason: "not-found" };
  const target = await one<{ id: string; is_seed: boolean; seed_likes_back: boolean }>(
    "select id, is_seed, seed_likes_back from users where id = $1",
    [targetId],
  );
  if (!target) return { ok: false, reason: "not-found" };

  if (liked) {
    const quota = await quotaFor(me);
    if (quota.likesLeft === 0) return { ok: false, reason: "out-of-likes" };
    if (isSuper && quota.superLeft === 0) return { ok: false, reason: "out-of-super-likes" };
  }

  await query(
    `insert into swipes (swiper_id, target_id, liked, super) values ($1, $2, $3, $4)
     on conflict (swiper_id, target_id) do update set liked = excluded.liked, super = excluded.super, created_at = now()`,
    [me.id, targetId, liked, liked && isSuper],
  );

  // Sample members stand in for the other side of the swipe.
  if (liked && target.is_seed && target.seed_likes_back) {
    await query(
      `insert into swipes (swiper_id, target_id, liked) values ($1, $2, true) on conflict do nothing`,
      [targetId, me.id],
    );
  }

  return { ok: true, match: liked && (await isMatch(me.id, targetId)) };
}

export async function isMatch(a: string, b: string): Promise<boolean> {
  const row = await one<{ n: number }>(
    `select count(*)::int as n from swipes
     where liked and ((swiper_id = $1 and target_id = $2) or (swiper_id = $2 and target_id = $1))`,
    [a, b],
  );
  return row?.n === 2;
}

export type MatchSummary = {
  member: Member;
  lastMessage: { body: string; mine: boolean; at: string } | null;
};

export async function matchesFor(meId: string): Promise<MatchSummary[]> {
  const rows = await query<UserRow & { last_body: string | null; last_sender: string | null; last_at: string | null; matched_at: string }>(
    `select u.*,
       (select array_agg(p.id order by p.position, p.created_at) from photos p where p.user_id = u.id) as photo_ids,
       lm.body as last_body, lm.sender_id as last_sender, lm.created_at as last_at,
       greatest(mine.created_at, theirs.created_at) as matched_at
     from swipes mine
     join swipes theirs on theirs.swiper_id = mine.target_id and theirs.target_id = mine.swiper_id and theirs.liked
     join users u on u.id = mine.target_id
     left join lateral (
       select body, sender_id, created_at from messages m
       where (m.sender_id = $1 and m.recipient_id = u.id) or (m.sender_id = u.id and m.recipient_id = $1)
       order by m.id desc limit 1
     ) lm on true
     where mine.swiper_id = $1 and mine.liked
     order by coalesce(lm.created_at, greatest(mine.created_at, theirs.created_at)) desc`,
    [meId],
  );
  return rows.map((r) => ({
    member: toMember(r),
    lastMessage: r.last_body
      ? { body: r.last_body, mine: r.last_sender === meId, at: new Date(r.last_at!).toISOString() }
      : null,
  }));
}

// People who liked the member and are still waiting in the member's deck.
export async function likedMe(meId: string): Promise<(Member & { superLiked: boolean })[]> {
  const rows = await query<UserRow & { super: boolean }>(
    `select u.*, s.super,
       (select array_agg(p.id order by p.position, p.created_at) from photos p where p.user_id = u.id) as photo_ids
     from swipes s join users u on u.id = s.swiper_id
     where s.target_id = $1 and s.liked
       and not exists (select 1 from swipes mine where mine.swiper_id = $1 and mine.target_id = s.swiper_id)
     order by s.super desc, s.created_at desc`,
    [meId],
  );
  return rows.map((r) => ({ ...toMember(r), superLiked: r.super }));
}

export type ChatMessage = { id: number; body: string; mine: boolean; at: string };

export async function messagesBetween(meId: string, otherId: string, afterId = 0): Promise<ChatMessage[]> {
  const rows = await query<{ id: string | number; body: string; sender_id: string; created_at: string }>(
    `select id, body, sender_id, created_at from messages
     where id > $3 and ((sender_id = $1 and recipient_id = $2) or (sender_id = $2 and recipient_id = $1))
     order by id limit 500`,
    [meId, otherId, afterId],
  );
  return rows.map((r) => ({
    id: Number(r.id),
    body: r.body,
    mine: r.sender_id === meId,
    at: new Date(r.created_at).toISOString(),
  }));
}

const SEED_REPLIES = [
  "Haha hi! Where are you writing from? 😊",
  "I love that you're not from here. Tell me something about your city.",
  "Are you ever travelling my way?",
  "Okay you're funny. What are you up to this weekend?",
];

export async function sendMessage(meId: string, otherId: string, body: string) {
  await query("insert into messages (sender_id, recipient_id, body) values ($1, $2, $3)", [meId, otherId, body]);
  const other = await one<{ is_seed: boolean }>("select is_seed from users where id = $1", [otherId]);
  if (other?.is_seed) {
    const [{ n }] = await query<{ n: number }>(
      "select count(*)::int as n from messages where sender_id = $1 and recipient_id = $2",
      [meId, otherId],
    );
    await query("insert into messages (sender_id, recipient_id, body) values ($1, $2, $3)", [
      otherId,
      meId,
      SEED_REPLIES[(n - 1) % SEED_REPLIES.length],
    ]);
  }
}

export async function unmatch(meId: string, otherId: string) {
  await query("update swipes set liked = false, super = false where swiper_id = $1 and target_id = $2", [meId, otherId]);
}

export async function report(meId: string, otherId: string, reason: string) {
  await query("insert into reports (reporter_id, reported_id, reason) values ($1, $2, $3)", [meId, otherId, reason]);
  await query(
    `insert into swipes (swiper_id, target_id, liked) values ($1, $2, false)
     on conflict (swiper_id, target_id) do update set liked = false, super = false`,
    [meId, otherId],
  );
}
