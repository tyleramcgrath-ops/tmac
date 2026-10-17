import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { NightClock } from "@/components/night-clock";
import { PROFILES, VIBE_EMOJI, VIBE_LABEL } from "@/lib/profiles";
import { sessionUserId } from "@/lib/session";

const STEPS = [
  { n: "01", title: "Set your vibe", body: "Free tonight, this weekend, or while you're passing through. Everyone can see what you're up for." },
  { n: "02", title: "Swipe the night", body: "Right to like, left to pass. Flip on Out tonight to see only who's free now, or Passport into your next city." },
  { n: "03", title: "Match & meet", body: "Both swipe right and the chat opens. Keep it short, keep it real, and meet somewhere public first." },
];

const RULES = [
  ["18+", "Adults only. Under-18 accounts are removed on sight."],
  ["Consent", "Enthusiastic, ongoing, and yours to take back any time."],
  ["Upfront", "Casual only. Say what you want and take no for an answer."],
  ["No pay", "No escorts, no sugar deals, no money. Instant ban."],
  ["Shielded", "Messages asking for money or pushing off-app get flagged."],
  ["One tap", "Report and block from any chat. A person reviews every report."],
];

export default async function Home() {
  if (await sessionUserId()) redirect("/swipe");
  const tonight = PROFILES.filter((p) => p.gender === "woman" && p.vibe === "tonight");
  const [front, ...behind] = tonight;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:pt-20">
          <div>
            <p className="rise flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent-deep">
              <span className="live-dot" aria-hidden="true" /> Casual encounters · Worldwide
            </p>
            <h1 className="rise mt-6 font-display text-6xl font-semibold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl" style={{ animationDelay: "80ms" }}>
              It&rsquo;s always night <em className="text-sunset neon font-medium">somewhere.</em>
            </h1>
            <p className="rise mt-6 max-w-lg text-lg text-ink-dim" style={{ animationDelay: "160ms" }}>
              No-strings fun with people who want the same thing, from Medellín to Tokyo. See who&rsquo;s
              out tonight, or line something up before your flight lands.
            </p>
            <div className="rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
              <Link href="/join" className="btn btn-primary !px-7 !py-3.5 text-base">Get in free</Link>
              <Link href="/login" className="btn btn-ghost !px-7 !py-3.5 text-base">I have an account</Link>
            </div>
            <p className="rise mt-5 text-xs text-ink-mute" style={{ animationDelay: "320ms" }}>
              18+ only · Consent first · No paid arrangements
            </p>
          </div>

          {/* Phone */}
          <div className="rise relative mx-auto w-[290px]" style={{ animationDelay: "200ms" }}>
            <div className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgb(255_46_136/0.35),transparent)] blur-2xl" />
            <div className="rotate-[2deg] rounded-[2.75rem] border border-white/10 bg-night p-2.5 shadow-[0_50px_100px_-30px_rgb(255_46_136/0.6)]">
              <div className="overflow-hidden rounded-[2.2rem] bg-bg">
                <div className="flex items-center justify-between px-5 pb-2 pt-4 text-[11px] text-ink-dim">
                  <span className="rounded-full border border-accent/50 bg-accent-soft px-2 py-0.5 font-semibold text-accent-deep">🔥 Out tonight</span>
                  <span className="font-mono">11:42 pm</span>
                </div>
                <div className="relative mx-3 aspect-[3/4.3]">
                  {behind.slice(0, 2).reverse().map((p, i) => (
                    <div key={p.id} className="card absolute inset-0 overflow-hidden" style={{ transform: `rotate(${i === 0 ? 7 : -5}deg) scale(0.94)` }}>
                      <Avatar profile={p} size="lg" />
                    </div>
                  ))}
                  <div className="card absolute inset-0 overflow-hidden">
                    <Avatar profile={front} size="lg" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-16 text-white">
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold">
                        {VIBE_EMOJI[front.vibe]} {VIBE_LABEL[front.vibe]}
                      </span>
                      <p className="mt-1 font-display text-2xl font-semibold">{front.name} <span className="font-normal">{front.age}</span></p>
                      <p className="text-xs text-white/80">{front.flag} {front.city}, {front.country}</p>
                    </div>
                    <span className="absolute left-4 top-6 -rotate-12 rounded-md border-4 border-emerald-400 px-2 text-xl font-black text-emerald-400">LIKE</span>
                  </div>
                </div>
                <div className="flex justify-center gap-4 py-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border bg-surface text-xl text-rose-400">✕</span>
                  <span className="flex h-10 w-10 items-center justify-center self-center rounded-full border bg-surface text-sky-400">★</span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border bg-surface text-xl text-emerald-400">♥</span>
                </div>
              </div>
            </div>
            <div className="card glow absolute -left-20 top-28 hidden -rotate-3 px-4 py-3 text-sm sm:block">
              <p className="font-semibold text-accent-deep">It&rsquo;s a match 💘</p>
              <p className="text-xs text-ink-dim">Isabela 🇧🇷 liked you back</p>
            </div>
            <div className="card absolute -right-16 bottom-24 hidden rotate-2 px-4 py-3 text-sm sm:block">
              <p className="text-xs text-ink-mute">Valentina 🇨🇴 · now</p>
              <p className="font-semibold">&ldquo;Drinks when you land? 😏&rdquo;</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live clock */}
      <section className="border-y bg-night/60">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <NightClock />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <h2 className="max-w-xl font-display text-4xl font-semibold sm:text-5xl">
          From swipe to <em className="text-sunset">sorted</em> in three moves.
        </h2>
        <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl border bg-border md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="bg-bg p-8">
              <p className="font-display text-6xl font-semibold italic text-transparent [-webkit-text-stroke:1.5px_var(--accent)]">{s.n}</p>
              <h3 className="mt-6 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-ink-dim">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* House rules */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-accent/40 bg-night p-8 sm:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">House rules</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold sm:text-5xl">
            Fun works better when everyone feels safe.
          </h2>
          <dl className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {RULES.map(([term, body]) => (
              <div key={term} className="border-t border-white/10 pt-4">
                <dt className="font-display text-2xl italic text-accent-deep">{term}</dt>
                <dd className="mt-1 text-sm text-ink-dim">{body}</dd>
              </div>
            ))}
          </dl>
          <Link href="/safety" className="btn btn-ghost mt-10">Read the safety guide</Link>
        </div>
      </section>

      {/* Globe+ */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">✦ Globe+</p>
            <h2 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Land with plans.</h2>
            <p className="mt-4 max-w-md text-ink-dim">
              Passport into any city before you fly, see everyone who already swiped right on you, and never
              run out of likes mid-night.
            </p>
            <Link href="/premium" className="btn btn-primary mt-7">See Globe+</Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["✈️", "Passport", "Swipe any city before you land"],
              ["👀", "Likes you", "See who already swiped right"],
              ["♥", "Unlimited", "No daily like cap"],
              ["★", "5 super likes", "Every single day"],
            ].map(([icon, title, sub]) => (
              <li key={title} className="card p-5">
                <span className="text-2xl">{icon}</span>
                <p className="mt-3 font-semibold">{title}</p>
                <p className="text-xs text-ink-mute">{sub}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 pt-28 text-center sm:px-6">
        <h2 className="font-display text-5xl font-semibold sm:text-6xl">
          Tonight&rsquo;s <em className="text-sunset neon">wide open.</em>
        </h2>
        <p className="mt-4 text-ink-dim">Free to join. Two minutes to your first swipe.</p>
        <Link href="/join" className="btn btn-primary mt-8 !px-8 !py-3.5 text-base">Get in free</Link>
      </section>
    </>
  );
}
