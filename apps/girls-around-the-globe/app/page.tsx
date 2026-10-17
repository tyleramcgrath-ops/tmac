import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CityExplorer } from "@/components/home/city-explorer";
import { IntentPicker } from "@/components/home/intent-picker";
import { SwipeDemo } from "@/components/home/swipe-demo";
import { Wordmark } from "@/components/logo";
import { PREMIUM_PRICE_LABEL } from "@/lib/billing";
import { sessionUserId } from "@/lib/session";
import hero from "@/public/home/hero.jpg";

const TRUST = [
  { icon: "heart", text: "Everyone says what they're looking for" },
  { icon: "video", text: "Video dates in the app" },
  { icon: "shield", text: "Scam shield in every chat" },
] as const;

const ICONS = {
  heart: "M12 20.5s-7-4.3-9.2-8.7A5.3 5.3 0 0 1 12 6.4a5.3 5.3 0 0 1 9.2 5.4c-2.2 4.4-9.2 8.7-9.2 8.7z",
  video: "M3 7.5A1.5 1.5 0 0 1 4.5 6h10A1.5 1.5 0 0 1 16 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 3 16.5zM16 10.5l5-3v9l-5-3",
  translate: "M4 5h9M8.5 3v2M6 5c0 4 3 7 6 8M11 5c-1 4-4 7-7 8M13 21l4-10 4 10M14.5 17.5h5",
  shield: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM9 12l2 2 4-4",
  check: "M5 12.5l4.5 4.5L19 7.5",
};

const STEPS = [
  { n: "01", title: "Tell us what you want", body: "Two minutes: a few photos, where you live, and the kind of relationship you're after." },
  { n: "02", title: "Match when it's mutual", body: "Browse women across Latin America and beyond. When you both like each other, the chat opens." },
  { n: "03", title: "Video date, then visit", body: "See each other face to face in the app first. When it feels right, plan the trip." },
];

const FEATURES = [
  { icon: "heart", title: "Her intentions, up front", body: "A relationship, marriage, or dating to see: every profile says it plainly." },
  { icon: "video", title: "Video dates first", body: "Talk face to face before anyone books a ticket. No phone numbers swapped." },
  { icon: "translate", title: "Chat across languages", body: "Write in English. Her languages are on her profile, so you know where to start." },
  { icon: "shield", title: "Scam shield", body: "Chats that mention money, gift cards or crypto get flagged on the spot." },
] as const;

const PERKS = [
  "Passport: match in a city before you land",
  "See everyone who likes you",
  "Unlimited likes",
  "5 super likes a day",
];

const FAQS = [
  { q: "Is it free to join?", a: "Yes. Creating a profile, swiping, matching, messaging and video dates are free. Globe+ is optional and adds Passport, unlimited likes, and seeing who likes you." },
  { q: "Are the women real?", a: "Members sign up as themselves, adults only, with their own photos. Anyone can be reported in one tap, and fake profiles are removed. Sample profiles are clearly labelled, and a video date is the surest way to know." },
  { q: "Do I need to speak Spanish or Portuguese?", a: "No. Every profile lists the languages she speaks, and plenty of members speak English. A video date is the fastest way to find your rhythm." },
  { q: "How do video dates work?", a: "Once you match, either of you can start a video call right in the chat. No phone numbers or other apps, and you can hang up anytime." },
  { q: "How do you stop scams?", a: "Messages that ask for money, gift cards or crypto are flagged in the chat, and anyone who asks is removed. Real love never needs a wire transfer." },
  { q: "Can I cancel Globe+ anytime?", a: "Yes. Cancel from your account in a couple of taps, and you keep Globe+ until the end of the month you paid for." },
];

function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default async function Home() {
  if (await sessionUserId()) redirect("/swipe");

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[calc(100svh-4.5rem)] flex-col overflow-hidden">
        {/* On phones the photo takes the top of the screen and the copy sits below. */}
        <div className="absolute inset-0 overflow-hidden max-sm:bottom-auto max-sm:h-[58svh]">
          <Image
            src={hero}
            alt="A woman lying on the sand at the beach, looking at the camera"
            fill
            priority
            sizes="100vw"
            placeholder="blur"
            className="slow-zoom object-cover object-[65%_45%] max-sm:object-[64%_40%]"
          />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-bg via-bg/70 to-transparent sm:hidden" />
        </div>
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-bg/95 via-bg/80 via-35% to-bg/10 max-sm:bg-gradient-to-t max-sm:from-bg max-sm:from-45% max-sm:via-bg/60 max-sm:via-55% max-sm:to-transparent max-sm:to-75%" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-bg to-transparent" />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-end px-4 pb-14 pt-[44svh] sm:items-center sm:px-6 sm:pb-16 sm:pt-16">
          <div className="max-w-xl space-y-7">
            <p className="rise text-xs font-bold uppercase tracking-[0.22em] text-accent">Serious dating, worldwide</p>
            <h1 className="rise font-display text-6xl leading-[0.96] sm:text-7xl lg:text-8xl" style={{ animationDelay: "80ms" }}>
              Meet someone <em className="text-gold">worth the flight.</em>
            </h1>
            <p className="rise max-w-md text-lg leading-relaxed text-ink-dim" style={{ animationDelay: "180ms" }}>
              Real women from Cartagena to Rio who want something serious. See what she&rsquo;s looking for, get to
              know her on video, then go meet her.
            </p>
            <div className="rise" style={{ animationDelay: "300ms" }}>
              <IntentPicker />
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-ink/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-5 text-sm text-ink-dim sm:px-6">
            <ul className="flex flex-wrap gap-x-9 gap-y-3">
              {TRUST.map((t) => (
                <li key={t.text} className="flex items-center gap-2.5">
                  <span className="text-accent"><Icon d={ICONS[t.icon]} className="h-[18px] w-[18px]" /></span>
                  {t.text}
                </li>
              ))}
            </ul>
            <span className="text-xs text-ink-mute">Photos show models, for illustration</span>
          </div>
        </div>
      </section>

      {/* Try it */}
      <section id="try" className="relative scroll-mt-20 overflow-hidden">
        <div aria-hidden="true" className="absolute -right-40 top-20 h-[46rem] w-[46rem] rounded-full bg-[radial-gradient(circle,rgb(233_207_150/0.1),transparent_65%)]" />
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-16 px-4 py-28 sm:px-6">
          <div className="min-w-0 flex-[1_1_380px] space-y-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Try it now</p>
            <h2 className="font-display text-5xl leading-none sm:text-6xl">Swipe like <em className="text-gold">you mean it.</em></h2>
            <p className="max-w-md text-lg leading-relaxed text-ink-dim">
              Drag the card, or tap the buttons. Every profile tells you what she&rsquo;s looking for, the languages
              she speaks, and a little about the life she wants.
            </p>
            <ul className="space-y-3.5 text-ink-dim">
              <li className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent"><Icon d={ICONS.heart} className="h-4 w-4" /></span>Right or the heart to like</li>
              <li className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/10 text-sm">✕</span>Left or the cross to pass</li>
              <li className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/10"><Icon d={ICONS.video} className="h-4 w-4" /></span>When it&rsquo;s mutual, start a video date</li>
            </ul>
            <p className="text-xs text-ink-mute">Illustrative profiles. Photos show models.</p>
          </div>
          <div className="min-w-0 flex-[1_1_360px]">
            <SwipeDemo />
          </div>
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="scroll-mt-20 border-y bg-surface">
        <div className="mx-auto max-w-6xl space-y-12 px-4 py-28 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Where will you meet her?</p>
              <h2 className="mt-4 font-display text-5xl leading-none sm:text-6xl">Pick a city. <em className="text-gold">See her evening.</em></h2>
            </div>
            <p className="max-w-sm text-ink-dim">Local times are live, so you know when she&rsquo;s free for a video date.</p>
          </div>
          <CityExplorer />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl space-y-14 px-4 py-28 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-2xl font-display text-5xl leading-none sm:text-6xl">Three steps from hello <em className="text-gold">to her city.</em></h2>
            <p className="max-w-sm text-ink-dim">No swiping into silence. Everyone here has said what they want, so conversations go somewhere.</p>
          </div>
          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-3xl border bg-surface p-8 transition hover:-translate-y-1 hover:border-accent/45">
                <p className="text-gold font-display text-6xl leading-none">{s.n}</p>
                <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-ink-dim">{s.body}</p>
              </li>
            ))}
          </ol>
          <ul className="grid gap-x-8 gap-y-10 border-t pt-10 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="space-y-2.5">
                <span className="text-accent"><Icon d={ICONS[f.icon]} className="h-6 w-6" /></span>
                <h3 className="font-bold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-ink-dim">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Globe+ */}
      <section className="px-4 pb-28 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-[28px] bg-[linear-gradient(120deg,rgb(185_138_69/0.9),rgb(241_220_170/0.9)_40%,rgb(196_154_85/0.4)_70%,rgb(233_207_150/0.9))] p-px">
          <div className="flex flex-wrap items-center gap-12 rounded-[27px] bg-[#0f0c0b] p-8 sm:p-12">
            <div className="min-w-0 flex-[1_1_340px] space-y-4">
              <p className="text-gold text-xs font-bold uppercase tracking-[0.22em]">Globe+</p>
              <h2 className="font-display text-5xl leading-none">Get there faster.</h2>
              <p className="flex items-baseline gap-2.5">
                <span className="text-4xl font-extrabold tracking-tight">{PREMIUM_PRICE_LABEL}</span>
                <span className="text-ink-dim">cancel anytime</span>
              </p>
              <Link href="/premium" className="btn btn-primary">See Globe+</Link>
            </div>
            <ul className="grid min-w-0 flex-[1_1_400px] gap-4 sm:grid-cols-2">
              {PERKS.map((p) => (
                <li key={p} className="flex gap-3 text-ink-dim">
                  <span className="mt-0.5 text-accent"><Icon d={ICONS.check} /></span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-14 px-4 py-28 sm:px-6">
          <div className="min-w-0 flex-[1_1_300px] space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Questions</p>
            <h2 className="font-display text-5xl leading-none sm:text-6xl">Good to <em className="text-gold">know.</em></h2>
            <p className="max-w-xs text-ink-dim">
              Anything else? Read the <Link href="/safety" className="underline underline-offset-4 hover:text-accent">safety center</Link>.
            </p>
          </div>
          <div className="min-w-0 flex-[2_1_520px]">
            {FAQS.map((f, i) => (
              <details key={f.q} className="group border-b" open={i === 0}>
                <summary className="flex min-h-[72px] cursor-pointer list-none items-center justify-between gap-5 text-lg font-bold hover:text-accent [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/20 text-lg transition group-open:rotate-45 group-open:border-accent group-open:text-accent">+</span>
                </summary>
                <p className="pb-7 pr-14 leading-relaxed text-ink-dim">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final call */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute left-1/2 top-[40%] h-[56rem] w-[56rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(233_207_150/0.14),transparent_62%)]" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-7 px-4 pb-32 pt-28 text-center sm:px-6">
          <Wordmark height={190} />
          <h2 className="mt-2 max-w-3xl font-display text-5xl leading-none sm:text-7xl">She&rsquo;s out there. <em className="text-gold">Go find her.</em></h2>
          <p className="max-w-md text-lg text-ink-dim">Free to join. Two minutes to set up. Start meeting women who want the same thing you do.</p>
          <Link href="/join" className="btn btn-primary !px-9 !py-4 text-base">Create your free profile</Link>
        </div>
      </section>
    </>
  );
}
