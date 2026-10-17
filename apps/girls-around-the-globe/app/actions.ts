"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { one, query } from "@/lib/db";
import { PREMIUM_NAME, PREMIUM_PRICE_CENTS, siteUrl, stripe } from "@/lib/billing";
import { countryByCode } from "@/lib/countries";
import {
  FREE_NOW_HOURS,
  ageFrom,
  getMember,
  isMatch,
  newId,
  recordSwipe,
  report,
  sendMessage,
  setFreeNow,
  unmatch,
  type SwipeResult,
} from "@/lib/members";
import { answerCall, endCall, startCall } from "@/lib/calls";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createPlan } from "@/lib/plans";
import { INTO_TAGS, PASSPORT_CITIES, VIBE_LABEL, type Vibe } from "@/lib/profiles";
import { createSession, destroySession, requireUserId, sessionUserId } from "@/lib/session";

export type FormState = { error?: string; ok?: string } | undefined;

const GENDERS = ["woman", "man", "nonbinary"] as const;
const SHOW_ME = ["women", "men", "everyone"] as const;
const VIBES = Object.keys(VIBE_LABEL) as Vibe[];

function text(form: FormData, key: string, max: number): string {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function pick<T extends string>(value: string, allowed: readonly T[]): T | null {
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

// Only same-site paths, so ?next= can't bounce people to another domain.
function safeNext(value: FormDataEntryValue | null): string {
  const next = String(value ?? "");
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/swipe";
}

// ---------- Accounts ----------

export async function signup(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email", 200).toLowerCase();
  const password = String(form.get("password") ?? "");
  const name = text(form, "name", 40);
  const birthdate = text(form, "birthdate", 10);
  const gender = pick(text(form, "gender", 20), GENDERS);
  const showMe = pick(text(form, "showMe", 20), SHOW_ME);
  const city = text(form, "city", 60);
  const country = countryByCode(text(form, "country", 2));
  const bio = text(form, "bio", 300);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Use a password with at least 8 characters." };
  if (!name) return { error: "Add your first name." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate) || Number.isNaN(Date.parse(birthdate))) {
    return { error: "Add your date of birth." };
  }
  const age = ageFrom(birthdate);
  if (age < 18) return { error: "Girls Around the Globe is for adults 18 and over only." };
  if (age > 100) return { error: "Check your date of birth." };
  if (!gender || !showMe) return { error: "Tell us who you are and who you'd like to see." };
  if (!city || !country) return { error: "Add your city and country." };
  if (form.get("agree") !== "on") return { error: "Please agree to the community guidelines to continue." };

  if (await one("select 1 from users where email = $1", [email])) {
    return { error: "An account with that email already exists. Log in instead." };
  }

  const id = newId();
  await query(
    `insert into users (id, email, password_hash, name, birthdate, gender, show_me, city, country, flag, bio)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [id, email, await hashPassword(password), name, birthdate, gender, showMe, city, country.name, country.flag, bio],
  );
  await createSession(id);
  redirect("/me?welcome=1");
}

// Slows down password guessing per email. In-memory, so it resets on deploy
// and is per-instance; swap for a shared store (e.g. Redis) at scale.
const failures = new Map<string, { count: number; until: number }>();

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email", 200).toLowerCase();
  const password = String(form.get("password") ?? "");
  const lock = failures.get(email);
  if (lock && lock.count >= 5 && lock.until > Date.now()) {
    return { error: "Too many attempts. Try again in 15 minutes." };
  }

  const user = await one<{ id: string; password_hash: string | null }>(
    "select id, password_hash from users where email = $1",
    [email],
  );
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    const count = (lock && lock.until > Date.now() ? lock.count : 0) + 1;
    failures.set(email, { count, until: Date.now() + 15 * 60 * 1000 });
    return { error: "Email or password is incorrect." };
  }
  failures.delete(email);
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function deleteAccount() {
  const id = await requireUserId("/me");
  await query("delete from users where id = $1 and not is_seed", [id]);
  await destroySession();
  redirect("/");
}

// ---------- Profile ----------

export async function updateProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const id = await requireUserId("/me");
  const showMe = pick(text(form, "showMe", 20), SHOW_ME);
  const vibe = pick(text(form, "vibe", 30), VIBES);
  const country = countryByCode(text(form, "country", 2));
  const city = text(form, "city", 60);
  if (!showMe || !vibe || !country || !city) return { error: "Fill in your city, country, vibe and who you'd like to see." };

  const prompts = [1, 2]
    .map((n) => ({ q: text(form, `q${n}`, 80), a: text(form, `a${n}`, 160) }))
    .filter((p) => p.q && p.a);
  // Only tags from the fixed list are kept.
  const into = form
    .getAll("into")
    .map(String)
    .filter((t): t is (typeof INTO_TAGS)[number] => (INTO_TAGS as readonly string[]).includes(t));

  await query(
    `update users set bio = $2, show_me = $3, vibe = $4, city = $5, country = $6, flag = $7,
       languages = $8, interests = $9, occupation = $10, traveling = $11, prompts = $12,
       into_tags = $13, discreet = $14
     where id = $1`,
    [
      id,
      text(form, "bio", 300),
      showMe,
      vibe,
      city,
      country.name,
      country.flag,
      text(form, "languages", 120),
      text(form, "interests", 160),
      text(form, "occupation", 60),
      text(form, "traveling", 80) || null,
      JSON.stringify(prompts),
      [...new Set(into)].join(", "),
      form.get("discreet") === "on",
    ],
  );
  revalidatePath("/me");
  return { ok: "Profile saved." };
}

export async function setFreeNowAction(hours: number) {
  const id = await requireUserId("/swipe");
  const valid = (FREE_NOW_HOURS as readonly number[]).includes(Number(hours)) ? Number(hours) : null;
  await setFreeNow(id, valid);
  revalidatePath("/swipe");
}

export async function sharePlanAction(
  matchId: string,
  input: { place: string; startsAt: string; note?: string },
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const me = await sessionUserId();
  if (!me) return { ok: false, error: "Not signed in." };
  const res = await createPlan(me, String(matchId), {
    place: String(input?.place ?? ""),
    startsAt: String(input?.startsAt ?? ""),
    note: String(input?.note ?? ""),
  });
  return res.ok ? { ok: true, url: `${siteUrl()}/plan/${res.token}` } : res;
}

// ---------- Swiping ----------

export async function swipe(targetId: string, liked: boolean, isSuper = false): Promise<SwipeResult> {
  const id = await sessionUserId();
  const me = id ? await getMember(id) : null;
  if (!me) return { ok: false, reason: "not-found" };
  return recordSwipe(me, String(targetId), !!liked, !!isSuper);
}

export async function setVibe(vibe: string) {
  const id = await requireUserId("/swipe");
  const valid = pick(String(vibe), VIBES);
  if (!valid) return;
  await query("update users set vibe = $2 where id = $1", [id, valid]);
  revalidatePath("/swipe");
}

export async function setPassport(city: string | null) {
  const id = await requireUserId("/swipe");
  const me = await getMember(id);
  const valid = city && PASSPORT_CITIES.some((c) => c.city === city) ? city : null;
  if (valid && !me?.premium) redirect("/premium?feature=passport");
  await query("update users set passport = $2 where id = $1", [id, valid]);
  revalidatePath("/swipe");
}

// ---------- Chat ----------

export async function send(otherId: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const me = await sessionUserId();
  if (!me) return { ok: false, error: "Not signed in." };
  const message = String(body ?? "").trim().slice(0, 1000);
  if (!message) return { ok: false, error: "Message is empty." };
  if (!(await isMatch(me, otherId))) return { ok: false, error: "You can only message your matches." };
  await sendMessage(me, otherId, message);
  return { ok: true };
}

export async function unmatchAction(otherId: string) {
  const me = await requireUserId("/matches");
  await unmatch(me, otherId);
  redirect("/matches");
}

export async function reportAction(otherId: string, reason: string) {
  const me = await requireUserId("/matches");
  await report(me, otherId, String(reason).slice(0, 500) || "No reason given");
  redirect("/matches?reported=1");
}

// ---------- Premium ----------

export async function startCheckout() {
  const id = await requireUserId("/premium");
  const client = stripe();
  if (!client) redirect("/premium?error=not-configured");

  const user = await one<{ email: string; stripe_customer_id: string | null }>(
    "select email, stripe_customer_id from users where id = $1",
    [id],
  );
  const session = await client.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: id,
    ...(user?.stripe_customer_id ? { customer: user.stripe_customer_id } : { customer_email: user?.email }),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: PREMIUM_PRICE_CENTS,
          recurring: { interval: "month" },
          product_data: { name: PREMIUM_NAME },
        },
      },
    ],
    success_url: `${siteUrl()}/premium?success=1`,
    cancel_url: `${siteUrl()}/premium`,
  });
  redirect(session.url!);
}

export async function openBillingPortal() {
  const id = await requireUserId("/premium");
  const client = stripe();
  const user = await one<{ stripe_customer_id: string | null }>("select stripe_customer_id from users where id = $1", [id]);
  if (!client || !user?.stripe_customer_id) redirect("/premium");
  const portal = await client.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${siteUrl()}/premium`,
  });
  redirect(portal.url);
}

// Lets you try premium locally without Stripe. Disabled in production.
export async function demoUpgrade() {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_DEMO_PREMIUM) redirect("/premium");
  const id = await requireUserId("/premium");
  await query("update users set premium_until = now() + interval '30 days' where id = $1", [id]);
  redirect("/premium?success=1");
}

// ---------- Video calls ----------

export async function startCallAction(otherId: string): Promise<{ ok: false; error: string } | never> {
  const me = await requireUserId("/matches");
  const res = await startCall(me, String(otherId));
  if (!res.ok) return { ok: false, error: res.reason };
  redirect(`/call/${res.callId}`);
}

export async function answerCallAction(callId: string): Promise<{ ok: boolean; error?: string }> {
  const me = await sessionUserId();
  if (!me) return { ok: false, error: "Not signed in." };
  const res = await answerCall(me, String(callId));
  return res.ok ? { ok: true } : { ok: false, error: res.reason };
}

export async function endCallAction(callId: string) {
  const me = await sessionUserId();
  if (me) await endCall(me, String(callId));
}
