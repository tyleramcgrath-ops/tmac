import Link from "next/link";
import { redirect } from "next/navigation";
import { sessionUserId } from "@/lib/session";
import { Avatar } from "@/components/avatar";
import { PASSPORT_CITIES, PROFILES, VIBE_EMOJI, VIBE_LABEL } from "@/lib/profiles";

const STEPS = [
  {
    n: "01",
    title: "Make your profile",
    body: "A few photos, where you are, and what you're in the mood for: tonight, this weekend, or while you're travelling.",
  },
  {
    n: "02",
    title: "Swipe the world",
    body: "Right to like, left to pass. Swipe worldwide, or use Passport to swipe in a city before you land.",
  },
  {
    n: "03",
    title: "Match and chat",
    body: "When you both swipe right, it's a match. Chat, set the vibe, and meet up when you're both ready.",
  },
];

const PILLARS = [
  { title: "Casual, upfront", body: "Everyone here is after the same thing: no-strings fun. Nobody has to guess what you're looking for." },
  { title: "Report & block in one tap", body: "Anyone who makes you uncomfortable is one tap from gone, and a person reviews every report." },
  { title: "Scam shield", body: "Messages asking for money, gift cards, crypto or payment get flagged before you reply." },
  { title: "Adults only, always", body: "Strictly 18+, consent first, and no paid arrangements. Breaking that means a permanent ban." },
];

export default async function Home() {
  if (await sessionUserId()) redirect("/swipe");
  const stack = PROFILES.filter((p) => p.gender === "woman").slice(0, 3);
  const [front] = stack;

  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-20">
          <div>
            <p className="chip !bg-accent-soft !text-accent-deep">🌍 Casual encounters, worldwide</p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Swipe right on <em className="text-sunset">the whole world.</em>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-dim">
              Girls Around the Globe is for casual encounters, nothing more. Swipe on people from
              Medellín to Tokyo who want the same no-strings fun you do, and line something up before
              your flight even lands.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/join" className="btn btn-primary">Create your free profile</Link>
              <Link href="/swipe" className="btn btn-ghost">Start swiping</Link>
            </div>
            <p className="mt-4 text-xs text-ink-mute">Free to join · 18+ only · No strings attached</p>
          </div>

          {/* Phone mockup */}
          <div className="relative mx-auto w-[300px]">
            <div className="rounded-[2.75rem] border-[10px] border-ink bg-ink shadow-[0_40px_80px_-30px_rgb(232_67_106/0.55)]">
              <div className="overflow-hidden rounded-[2rem] bg-bg">
                <div className="flex items-center justify-between px-5 pb-2 pt-4 text-xs text-ink-dim">
                  <span>✈️ Passport: Lisbon</span>
                  <span>💬 3</span>
                </div>
                <div className="relative mx-3 aspect-[3/4.3]">
                  {stack.slice(1).reverse().map((p, i) => (
                    <div key={p.id} className="card absolute inset-0 overflow-hidden" style={{ transform: `rotate(${i === 0 ? 6 : -4}deg) scale(0.95)` }}>
                      <Avatar profile={p} size="lg" />
                    </div>
                  ))}
                  <div className="card absolute inset-0 overflow-hidden">
                    <Avatar profile={front} size="lg" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16 text-white">
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">
                        {VIBE_EMOJI[front.vibe]} {VIBE_LABEL[front.vibe]}
                      </span>
                      <p className="mt-1 font-display text-2xl font-semibold">{front.name} <span className="font-normal">{front.age}</span></p>
                      <p className="text-xs text-white/85">{front.flag} {front.city}, {front.country}</p>
                    </div>
                    <span className="absolute left-4 top-6 -rotate-12 rounded-md border-4 border-emerald-400 px-2 text-xl font-black text-emerald-400">LIKE</span>
                  </div>
                </div>
                <div className="flex justify-center gap-4 py-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border bg-surface text-xl text-rose-500 shadow">✕</span>
                  <span className="flex h-10 w-10 items-center justify-center self-center rounded-full border bg-surface text-sky-500 shadow">★</span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border bg-surface text-xl text-emerald-500 shadow">♥</span>
                </div>
              </div>
            </div>
            <div className="card absolute -left-16 top-24 hidden px-4 py-3 text-sm sm:block">
              <p className="font-semibold text-accent">It&rsquo;s a match! 💘</p>
              <p className="text-xs text-ink-dim">Elena 🇵🇹 liked you back</p>
            </div>
            <div className="card absolute -right-14 bottom-28 hidden px-4 py-3 text-sm sm:block">
              <p className="text-xs text-ink-dim">Valentina 🇨🇴</p>
              <p className="font-semibold">&ldquo;Drinks when you land? 😏&rdquo;</p>
            </div>
          </div>
        </div>
      </section>

      {/* Passport cities */}
      <section className="border-y bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-4 py-6 sm:px-6">
          <span className="mr-2 text-sm text-ink-mute">Passport to</span>
          {PASSPORT_CITIES.map((c) => (
            <Link key={c.city} href="/swipe" className="chip hover:!bg-accent-soft hover:!text-accent-deep">
              {c.flag} {c.city}
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="card p-6">
              <p className="font-display text-3xl text-accent">{s.n}</p>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-ink-dim">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="card overflow-hidden !bg-ink p-8 text-white sm:p-12">
          <h2 className="max-w-2xl font-display text-3xl font-semibold sm:text-4xl">
            Meeting someone from across the world should feel exciting, not risky.
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <div key={p.title}>
                <h3 className="font-semibold text-gold">{p.title}</h3>
                <p className="mt-2 text-sm text-white/75">{p.body}</p>
              </div>
            ))}
          </div>
          <Link href="/safety" className="btn mt-10 bg-white !text-ink hover:bg-white/90">Safety center</Link>
        </div>
      </section>

      {/* Globe+ */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">✦ Globe+</p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Travel smarter. Match faster.</h2>
            <p className="mt-3 max-w-lg text-ink-dim">
              Passport to any city before you land, see everyone who already liked you, and never run out of likes.
            </p>
            <Link href="/premium" className="btn btn-primary mt-6">See Globe+</Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["✈️", "Passport to any city"],
              ["👀", "See who likes you"],
              ["♥", "Unlimited likes"],
              ["★", "5 super likes a day"],
            ].map(([icon, label]) => (
              <li key={label} className="card p-4">
                <span className="text-2xl">{icon}</span>
                <p className="mt-2 font-semibold">{label}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 pt-20 text-center sm:px-6">
        <h2 className="font-display text-4xl font-semibold">Your next match is a time zone away.</h2>
        <p className="mt-4 text-ink-dim">Join free in under two minutes.</p>
        <Link href="/join" className="btn btn-primary mt-8">Get started</Link>
      </section>
    </>
  );
}
