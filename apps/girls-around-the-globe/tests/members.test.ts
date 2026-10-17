import { beforeAll, describe, expect, it } from "vitest";
import { query } from "@/lib/db";
import {
  FREE_DAILY_LIKES,
  deckFor,
  getMember,
  isMatch,
  likedMe,
  matchesFor,
  messagesBetween,
  newId,
  quotaFor,
  recordSwipe,
  sendMessage,
  unmatch,
  type Member,
} from "@/lib/members";

async function makeUser(over: Partial<{ gender: string; showMe: string; city: string; premium: boolean }> = {}) {
  const id = newId();
  await query(
    `insert into users (id, email, password_hash, name, birthdate, gender, show_me, city, premium_until)
     values ($1, $2, 'x', 'Test', '1995-01-01', $3, $4, $5, $6)`,
    [id, `${id}@example.com`, over.gender ?? "man", over.showMe ?? "women", over.city ?? "Toronto",
      over.premium ? new Date(Date.now() + 86400000).toISOString() : null],
  );
  return (await getMember(id)) as Member;
}

describe("members", () => {
  let me: Member;
  beforeAll(async () => {
    me = await makeUser();
  });

  it("seeds sample members and serves a gender-filtered deck", async () => {
    const deck = await deckFor(me);
    expect(deck.length).toBeGreaterThan(5);
    expect(deck.every((m) => m.gender === "woman")).toBe(true);
    expect(deck.some((m) => m.id === me.id)).toBe(false);
  });

  it("filters the deck to people out tonight", async () => {
    const deck = await deckFor(me, 100, { tonightOnly: true });
    expect(deck.length).toBeGreaterThan(0);
    expect(deck.every((m) => m.vibe === "tonight" || m.freeUntil)).toBe(true);
  });

  it("respects the other person's preferences too", async () => {
    const onlyWantsWomen = await makeUser({ gender: "woman", showMe: "women" });
    const deck = await deckFor(me, 100);
    expect(deck.some((m) => m.id === onlyWantsWomen.id)).toBe(false);
  });

  it("matches when a sample member likes back, and opens chat", async () => {
    const valentina = "seed-valentina";
    const res = await recordSwipe(me, valentina, true, false);
    expect(res).toEqual({ ok: true, match: true });
    expect(await isMatch(me.id, valentina)).toBe(true);
    expect((await deckFor(me, 100)).some((m) => m.id === valentina)).toBe(false);

    await sendMessage(me.id, valentina, "Hola!");
    const thread = await messagesBetween(me.id, valentina);
    expect(thread.map((m) => m.mine)).toEqual([true, false]);
    expect((await matchesFor(me.id))[0].lastMessage?.mine).toBe(false);
  });

  it("does not match one-sided likes", async () => {
    const res = await recordSwipe(me, "seed-sakura", true, false);
    expect(res).toEqual({ ok: true, match: false });
  });

  it("matches two real members both ways and lists likes", async () => {
    const her = await makeUser({ gender: "woman", showMe: "men" });
    await recordSwipe(her, me.id, true, true);
    const likes = await likedMe(me.id);
    expect(likes.find((l) => l.id === her.id)?.superLiked).toBe(true);
    expect(await recordSwipe(me, her.id, true, false)).toEqual({ ok: true, match: true });
    expect((await likedMe(me.id)).some((l) => l.id === her.id)).toBe(false);

    await unmatch(me.id, her.id);
    expect(await isMatch(me.id, her.id)).toBe(false);
  });

  it("caps free likes and super likes per day, not premium likes", async () => {
    const free = await makeUser();
    const targets = [];
    for (let i = 0; i < FREE_DAILY_LIKES + 1; i++) targets.push((await makeUser({ gender: "woman", showMe: "everyone" })).id);

    expect(await recordSwipe(free, targets[0], true, true)).toMatchObject({ ok: true });
    expect(await recordSwipe(free, targets[1], true, true)).toEqual({ ok: false, reason: "out-of-super-likes" });
    for (let i = 1; i < FREE_DAILY_LIKES; i++) await recordSwipe(free, targets[i], true, false);
    expect((await quotaFor(free)).likesLeft).toBe(0);
    expect(await recordSwipe(free, targets[FREE_DAILY_LIKES], true, false)).toEqual({ ok: false, reason: "out-of-likes" });
    // Passing is always allowed.
    expect(await recordSwipe(free, targets[FREE_DAILY_LIKES], false, false)).toMatchObject({ ok: true });

    const plus = await makeUser({ premium: true });
    expect((await quotaFor(plus)).likesLeft).toBeNull();
  });

  it("only applies Passport for premium members", async () => {
    await query("update users set passport = 'Lisbon' where id = $1", [me.id]);
    const free = (await getMember(me.id))!;
    expect(new Set((await deckFor(free, 100)).map((m) => m.city)).size).toBeGreaterThan(1);

    const plus = await makeUser({ premium: true });
    await query("update users set passport = 'Lisbon' where id = $1", [plus.id]);
    const deck = await deckFor((await getMember(plus.id))!, 100);
    expect(deck.length).toBeGreaterThan(0);
    expect(deck.every((m) => m.city === "Lisbon")).toBe(true);
  });

  it("refuses self-swipes and unknown members", async () => {
    expect(await recordSwipe(me, me.id, true, false)).toEqual({ ok: false, reason: "not-found" });
    expect(await recordSwipe(me, "nobody", true, false)).toEqual({ ok: false, reason: "not-found" });
  });
});

describe("photos", () => {
  it("lists a member's photos in order", async () => {
    const m = await makeUser();
    await query("insert into photos (id, user_id, mime, data, position) values ('p2', $1, 'image/jpeg', $2, 1)", [m.id, Buffer.from([1])]);
    await query("insert into photos (id, user_id, mime, data, position) values ('p1', $1, 'image/jpeg', $2, 0)", [m.id, Buffer.from([2])]);
    expect((await getMember(m.id))!.photos).toEqual(["/api/photos/p1", "/api/photos/p2"]);
  });
});
