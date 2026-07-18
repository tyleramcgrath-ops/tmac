import Link from "next/link";
import { TickerTape } from "@/components/ticker-tape";
import { PLATFORMS } from "@/lib/sample-data";

const PROBLEMS = [
  {
    stat: "6–9 hrs",
    label: "spent per week manually re-listing the same items across apps",
  },
  {
    stat: "38%",
    label: "of resale returns are fit-related, not condition-related",
  },
  {
    stat: "$0",
    label: "of real pricing data most sellers have before they list",
  },
];

const PILLARS = [
  {
    tag: "01 — Distribution",
    title: "Cross-list once, everywhere",
    body:
      "Upload a photo, review the AI-drafted listing, publish to every platform at once. Sell on one, and Reloop delists it everywhere else in seconds — automatically.",
    href: "/cross-list",
    cta: "See the listing flow",
  },
  {
    tag: "02 — Data",
    title: "Price it like a trader, not a guess",
    body:
      "Real sold-comp data aggregated across every major resale platform. Know your fair price, your sell-through velocity, and your trend line before you list — not after it sits for three weeks.",
    href: "/price-intel",
    cta: "Look up a comp",
  },
  {
    tag: "03 — Trust",
    title: "SafeBuy, on any platform",
    body:
      "Escrow-backed protection and independent authentication that follows the buyer, not the app. Your reputation is portable — one score, wherever you sell.",
    href: "/safebuy",
    cta: "How escrow works",
  },
];

const COMPETITORS = [
  { name: "Reloop", fee: "6% flat", data: "Cross-platform", trust: "Portable SafeBuy escrow", relist: "Automatic, everywhere" },
  { name: "Depop", fee: "10%", data: "Depop only", trust: "Platform-siloed", relist: "Manual, one app" },
  { name: "Poshmark", fee: "20% / $2.95", data: "Poshmark only", trust: "Platform-siloed", relist: "Manual, one app" },
  { name: "Vinted", fee: "Buyer-paid", data: "Vinted only", trust: "Platform-siloed", relist: "Manual, one app" },
];

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="grid-fade absolute inset-0 h-[640px]" />
        <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-16 text-center sm:pt-28">
          <div className="rise rise-1 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 font-mono text-[12px] text-ink-dim">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
            Now tracking 6 marketplaces in real time
          </div>

          <h1 className="rise rise-2 font-display mt-8 text-5xl font-medium leading-[1.05] tracking-tight text-ink sm:text-7xl">
            List once.
            <br />
            <span className="italic text-accent">Sell everywhere.</span>
          </h1>

          <p className="rise rise-3 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-dim">
            Reloop isn&apos;t another resale marketplace fighting Depop and
            Poshmark for your closet. It&apos;s the pricing and distribution
            layer that sits on top of all of them — so you list smarter, sell
            faster, and get paid safely, no matter where the buyer is.
          </p>

          <div className="rise rise-4 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/cross-list"
              className="w-full rounded-full bg-accent px-7 py-3.5 text-center font-mono text-sm font-medium text-bg transition-transform hover:scale-[1.03] sm:w-auto"
            >
              Try the listing flow →
            </Link>
            <Link
              href="/price-intel"
              className="w-full rounded-full border border-border px-7 py-3.5 text-center font-mono text-sm text-ink transition-colors hover:border-accent hover:text-accent sm:w-auto"
            >
              Look up a price
            </Link>
          </div>
        </div>
      </section>

      <TickerTape />

      {/* Problem stats */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 max-w-xl">
          <span className="font-mono text-[12px] uppercase tracking-wider text-fall">
            The category&apos;s actual problem
          </span>
          <h2 className="font-display mt-3 text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            Everyone built a marketplace. Nobody built the intelligence layer.
          </h2>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          {PROBLEMS.map((p) => (
            <div key={p.label} className="bg-bg p-8">
              <div className="font-display text-4xl font-medium text-accent">{p.stat}</div>
              <p className="mt-3 text-sm leading-relaxed text-ink-dim">{p.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-12 max-w-xl">
          <span className="font-mono text-[12px] uppercase tracking-wider text-accent">
            How Reloop wins
          </span>
          <h2 className="font-display mt-3 text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            Three moats. Zero cold-start problem.
          </h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <Link
              key={p.title}
              href={p.href}
              className="card-soft group flex flex-col rounded-2xl border border-border/70 bg-surface p-8 transition-colors hover:border-accent/50"
            >
              <span className="font-mono text-[12px] text-ink-mute">{p.tag}</span>
              <h3 className="font-display mt-4 text-2xl font-medium text-ink">{p.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-dim">{p.body}</p>
              <span className="mt-6 inline-flex items-center gap-1 font-mono text-[13px] text-accent opacity-80 transition-opacity group-hover:opacity-100">
                {p.cta} <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Platform grid */}
      <section className="border-y border-border/80 bg-surface/40 py-14">
        <div className="mx-auto max-w-6xl px-6">
          <span className="font-mono text-[12px] uppercase tracking-wider text-ink-mute">
            Cross-lists directly to
          </span>
          <div className="mt-6 flex flex-wrap gap-3">
            {PLATFORMS.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-full border border-border bg-bg px-4 py-2"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="font-mono text-[13px] text-ink-dim">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 max-w-xl">
          <span className="font-mono text-[12px] uppercase tracking-wider text-accent">
            The numbers
          </span>
          <h2 className="font-display mt-3 text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            Stated plainly. No asterisks.
          </h2>
        </div>
        <div className="card-soft scrollbar-thin overflow-x-auto rounded-2xl border border-border/70">
          <table className="w-full min-w-[640px] border-collapse font-mono text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-ink-mute">
                <th className="px-6 py-4 font-normal">Platform</th>
                <th className="px-6 py-4 font-normal">Seller fee</th>
                <th className="px-6 py-4 font-normal">Pricing data</th>
                <th className="px-6 py-4 font-normal">Buyer trust</th>
                <th className="px-6 py-4 font-normal">Re-listing</th>
              </tr>
            </thead>
            <tbody>
              {COMPETITORS.map((c) => (
                <tr
                  key={c.name}
                  className={`border-b border-border-soft last:border-0 ${
                    c.name === "Reloop" ? "bg-accent/[0.06]" : ""
                  }`}
                >
                  <td className={`px-6 py-4 ${c.name === "Reloop" ? "text-accent" : "text-ink"}`}>
                    {c.name}
                  </td>
                  <td className="px-6 py-4 text-ink-dim">{c.fee}</td>
                  <td className="px-6 py-4 text-ink-dim">{c.data}</td>
                  <td className="px-6 py-4 text-ink-dim">{c.trust}</td>
                  <td className="px-6 py-4 text-ink-dim">{c.relist}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-28">
        <div className="card-soft relative overflow-hidden rounded-3xl border border-border/70 bg-surface px-8 py-16 text-center sm:px-16">
          <div className="grid-fade absolute inset-0 opacity-60" />
          <h2 className="font-display relative text-3xl font-medium tracking-tight text-ink sm:text-5xl">
            Your closet is worth more
            <br />
            than one app can tell you.
          </h2>
          <Link
            href="/cross-list"
            className="relative mt-8 inline-flex rounded-full bg-accent px-8 py-4 font-mono text-sm font-medium text-bg transition-transform hover:scale-[1.03]"
          >
            Start selling, everywhere →
          </Link>
        </div>
      </section>
    </div>
  );
}
