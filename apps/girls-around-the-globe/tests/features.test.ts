import { describe, expect, it } from "vitest";
import { query } from "@/lib/db";
import {
  deckFor,
  getMember,
  isMatch,
  likedMe,
  matchesFor,
  newId,
  recordSwipe,
  sendMessage,
  setFreeNow,
  viewMember,
  type Member,
} from "@/lib/members";
import { createPlan, getPlan } from "@/lib/plans";

async function makeUser(gender: "woman" | "man", showMe: "women" | "men" | "everyone", over: { discreet?: boolean; into?: string } = {}) {
  const id = newId();
  await query(
    `insert into users (id, email, password_hash, name, birthdate, gender, show_me, city, discreet, into_tags)
     values ($1, $2, 'x', 'Test', '1995-01-01', $3, $4, 'Berlin', $5, $6)`,
    [id, `${id}@example.com`, gender, showMe, over.discreet ?? false, over.into ?? ""],
  );
  await query("insert into photos (id, user_id, mime, data, position) values ($1, $2, 'image/jpeg', $3, 0)", [`ph-${id}`, id, Buffer.from([1])]);
  return (await getMember(id)) as Member;
}

async function matchedPair(over: { discreet?: boolean } = {}) {
  const a = await makeUser("man", "women");
  const b = await makeUser("woman", "men", over);
  await recordSwipe(a, b.id, true, false);
  await recordSwipe(b, a.id, true, false);
  return [a, b] as const;
}

// Pretends the match happened `hours` ago.
async function ageMatch(a: string, b: string, hours: number) {
  await query(
    "update swipes set created_at = now() - make_interval(hours => $3) where (swiper_id = $1 and target_id = $2) or (swiper_id = $2 and target_id = $1)",
    [a, b, hours],
  );
}

describe("free to video chat", () => {
  it("counts down, puts you first in the deck and in the free-now filter, then switches off", async () => {
    const viewer = await makeUser("man", "women");
    const quiet = await makeUser("woman", "everyone");
    const free = await makeUser("woman", "everyone");
    await query("update users set last_active = now() + interval '1 minute' where id = $1", [quiet.id]);

    await setFreeNow(free.id, 2);
    const until = new Date((await getMember(free.id))!.freeUntil!).getTime();
    expect(until - Date.now()).toBeGreaterThan(115 * 60_000);
    expect(until - Date.now()).toBeLessThanOrEqual(120 * 60_000);

    const deck = (await deckFor(viewer, 200)).map((m) => m.id);
    expect(deck.indexOf(free.id)).toBeLessThan(deck.indexOf(quiet.id));
    expect((await deckFor(viewer, 200, { freeNowOnly: true })).some((m) => m.id === free.id)).toBe(true);

    await setFreeNow(free.id, null);
    expect((await getMember(free.id))!.freeUntil).toBeNull();
    expect((await deckFor(viewer, 200, { freeNowOnly: true })).some((m) => m.id === free.id)).toBe(false);
  });
});

describe("life & plans tags", () => {
  it("stores and returns a member's tags", async () => {
    const m = await makeUser("woman", "men", { into: "Wants kids, Loves to travel" });
    expect(m.into).toEqual(["Wants kids", "Loves to travel"]);
  });

  it("drops retired tags and maps old casual vibes to a relationship", async () => {
    const m = await makeUser("woman", "men", { into: "Drinks first, Wants kids, Can host" });
    await query("update users set vibe = 'tonight' where id = $1", [m.id]);
    const again = (await getMember(m.id))!;
    expect(again.into).toEqual(["Wants kids"]);
    expect(again.vibe).toBe("relationship");
  });
});

describe("private photos", () => {
  it("hides photos in the deck, likes and profile until you match", async () => {
    const viewer = await makeUser("man", "women");
    const shy = await makeUser("woman", "men", { discreet: true });

    const card = (await deckFor(viewer, 200)).find((m) => m.id === shy.id)!;
    expect(card.photos).toEqual([]);
    expect(card.photosHidden).toBe(true);
    expect((await viewMember(viewer.id, shy.id))!.photos).toEqual([]);
    expect((await viewMember(shy.id, shy.id))!.photos).toHaveLength(1);

    await recordSwipe(shy, viewer.id, true, false);
    expect((await likedMe(viewer.id)).find((m) => m.id === shy.id)!.photos).toEqual([]);

    await recordSwipe(viewer, shy.id, true, false);
    const seen = (await viewMember(viewer.id, shy.id))!;
    expect(seen.photos).toHaveLength(1);
    expect(seen.photosHidden).toBe(false);
  });
});

describe("24-hour matches", () => {
  it("closes a match nobody messaged within a day", async () => {
    const [a, b] = await matchedPair();
    const fresh = (await matchesFor(a.id)).find((m) => m.member.id === b.id)!;
    expect(new Date(fresh.expiresAt!).getTime() - Date.now()).toBeGreaterThan(23 * 3600_000);

    await ageMatch(a.id, b.id, 25);
    expect(await isMatch(a.id, b.id)).toBe(false);
    expect((await matchesFor(a.id)).some((m) => m.member.id === b.id)).toBe(false);
  });

  it("keeps a match once someone says hi", async () => {
    const [a, b] = await matchedPair();
    await sendMessage(a.id, b.id, "Hey");
    await ageMatch(a.id, b.id, 72);
    expect(await isMatch(a.id, b.id)).toBe(true);
    const m = (await matchesFor(a.id)).find((x) => x.member.id === b.id)!;
    expect(m.expiresAt).toBeNull();
  });
});

describe("share my plan", () => {
  const inAnHour = () => new Date(Date.now() + 3600_000).toISOString();

  it("creates a private link with the match's first name, age and city", async () => {
    const [a, b] = await matchedPair({ discreet: true });
    const res = await createPlan(a.id, b.id, { place: "Bar Tausend", startsAt: inAnHour(), note: "Text me by 11" });
    expect(res.ok).toBe(true);
    const plan = await getPlan((res as { token: string }).token);
    expect(plan).toMatchObject({
      place: "Bar Tausend",
      note: "Text me by 11",
      match: { name: b.name, age: b.age, city: "Berlin" },
    });
    expect(Object.keys(plan!.match)).not.toContain("photos");
    expect(await getPlan("not-a-real-token")).toBeNull();
  });

  it("only works for matches and sensible times", async () => {
    const a = await makeUser("man", "women");
    const stranger = await makeUser("woman", "men");
    expect(await createPlan(a.id, stranger.id, { place: "X", startsAt: inAnHour() })).toMatchObject({ ok: false });

    const [c, d] = await matchedPair();
    expect(await createPlan(c.id, d.id, { place: "", startsAt: inAnHour() })).toMatchObject({ ok: false });
    expect(await createPlan(c.id, d.id, { place: "X", startsAt: "soon" })).toMatchObject({ ok: false });
    const nextYear = new Date(Date.now() + 365 * 86400_000).toISOString();
    expect(await createPlan(c.id, d.id, { place: "X", startsAt: nextYear })).toMatchObject({ ok: false });
  });

  it("stops working 12 hours after the meetup", async () => {
    const [a, b] = await matchedPair();
    const res = await createPlan(a.id, b.id, { place: "Hotel lobby", startsAt: inAnHour() });
    const token = (res as { token: string }).token;
    await query("update plans set expires_at = now() - interval '1 second' where token = $1", [token]);
    expect(await getPlan(token)).toBeNull();
  });
});
