import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NightClock } from "@/components/night-clock";
import { sessionUserId } from "@/lib/session";
import emblem from "@/public/brand/emblem.webp";

const FEATURES = [
  { icon: "🌍", title: "Swipe the world", body: "Right to like, left to pass, on people in every time zone. Match from Medellín to Tokyo." },
  { icon: "📹", title: "Face-to-face video", body: "Matched? Jump on a video call in one tap, right in the app. No numbers swapped, no other apps." },
  { icon: "🔥", title: "Out tonight", body: "Flip one switch to see only who's free tonight, and let people know you are too." },
  { icon: "✈️", title: "Passport", body: "Swipe in your next city before you land, and have plans waiting when you arrive." },
];

const STEPS = [
  { n: "01", title: "Make your profile", body: "Photos, where you're from, and what you're in the mood for." },
  { n: "02", title: "Swipe & match", body: "When you both swipe right, it's a match and the chat opens." },
  { n: "03", title: "Video chat", body: "Say hi face to face before you ever meet. Safer, and way more fun." },
];

const RULES = [
  ["18+ only", "Adults only. Under-18 accounts are removed on sight."],
  ["Consent", "Enthusiastic, ongoing, and yours to take back any time."],
  ["No pay", "No escorts, no sugar deals, no money for meetups. Instant ban."],
  ["Shielded", "Messages asking for money or pushing off-app get flagged."],
];

export default async function Home() {
  if (await sessionUserId()) redirect("/swipe");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
          <div className="order-2 lg:order-1">
            <p className="rise flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              <span className="live-dot" aria-hidden="true" /> Swipe · Match · Video chat
            </p>
            <h1 className="rise mt-6 font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl" style={{ animationDelay: "80ms" }}>
              <span className="text-gold">Swipe the world.</span>
              <br />
              <span className="text-sunset neon">Video chat tonight.</span>
            </h1>
            <p className="rise mt-6 max-w-lg text-lg text-ink-dim" style={{ animationDelay: "160ms" }}>
              Girls Around the Globe is swiping without borders. Match with people from every corner of
              the world, then see each other live on a video call, right in the app.
            </p>
            <div className="rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
              <Link href="/join" className="btn btn-primary !px-8 !py-3.5 text-base">Join free</Link>
              <Link href="/login" className="btn btn-ghost !px-8 !py-3.5 text-base">Log in</Link>
            </div>
            <p className="rise mt-5 text-xs text-ink-mute" style={{ animationDelay: "320ms" }}>
              Free to join · 18+ only · Consent first
            </p>
          </div>

          <div className="rise relative order-1 mx-auto w-full max-w-[520px] lg:order-2" style={{ animationDelay: "120ms" }}>
            <div className="absolute inset-[12%] -z-10 rounded-full bg-[radial-gradient(closest-side,rgb(255_31_143/0.35),rgb(233_185_92/0.15),transparent)] blur-2xl" />
            <Image
              src={emblem}
              alt="Girls Around the Globe"
              priority
              sizes="(min-width: 1024px) 520px, 90vw"
              className="edge-fade h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="gold-rule" />
        <ul className="grid gap-px overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li key={f.title} className="p-7">
              <span className="text-3xl">{f.icon}</span>
              <h2 className="mt-4 font-display text-lg font-bold uppercase tracking-wide">{f.title}</h2>
              <p className="mt-2 text-sm text-ink-dim">{f.body}</p>
            </li>
          ))}
        </ul>
        <div className="gold-rule" />
      </section>

      {/* Live clock */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">
          It&rsquo;s always night <span className="text-sunset">somewhere</span>
        </h2>
        <p className="mt-2 max-w-xl text-ink-dim">Cities lit up in pink are out right now.</p>
        <div className="mt-6">
          <NightClock />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">
          How it <span className="text-gold">works</span>
        </h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="card p-7">
              <p className="font-display text-5xl font-extrabold text-transparent [-webkit-text-stroke:1.5px_var(--gold)]">{s.n}</p>
              <h3 className="mt-5 font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-ink-dim">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* House rules */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-night p-8 sm:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">House rules</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-extrabold uppercase sm:text-4xl">
            Fun works better when everyone feels safe.
          </h2>
          <dl className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {RULES.map(([term, body]) => (
              <div key={term} className="border-t border-white/10 pt-4">
                <dt className="font-display text-lg font-bold uppercase text-accent-deep">{term}</dt>
                <dd className="mt-1 text-sm text-ink-dim">{body}</dd>
              </div>
            ))}
          </dl>
          <Link href="/safety" className="btn btn-ghost mt-10">Read the safety guide</Link>
        </div>
      </section>

      {/* Globe+ */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">✦ Globe+</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold uppercase">
              <span className="text-gold">Land with plans.</span>
            </h2>
            <p className="mt-4 max-w-md text-ink-dim">
              Passport into any city before you fly, see everyone who already swiped right on you, and never run out
              of likes.
            </p>
            <Link href="/premium" className="btn btn-gold mt-7">See Globe+</Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["✈️", "Passport", "Swipe any city before you land"],
              ["👀", "Likes you", "See who already swiped right"],
              ["♥", "Unlimited", "No daily like cap"],
              ["★", "5 super likes", "Every single day"],
            ].map(([icon, title, sub]) => (
              <li key={title} className="card border-gold/20 p-5">
                <span className="text-2xl">{icon}</span>
                <p className="mt-3 font-display font-bold">{title}</p>
                <p className="text-xs text-ink-mute">{sub}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 pt-24 text-center sm:px-6">
        <h2 className="font-display text-4xl font-extrabold uppercase sm:text-5xl">
          The world is <span className="text-sunset neon">waiting.</span>
        </h2>
        <p className="mt-4 text-ink-dim">Free to join. Two minutes to your first swipe.</p>
        <Link href="/join" className="btn btn-primary mt-8 !px-9 !py-3.5 text-base">Join free</Link>
      </section>
    </>
  );
}
