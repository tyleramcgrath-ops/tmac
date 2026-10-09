import Link from "next/link";
import { listings } from "@/lib/listings";
import { HomeCard } from "@/components/home-card";
import { SavingsCalculator } from "@/components/savings-calculator";

const viewModes = [
  { title: "Guided photo capture", body: "Our app walks the seller shot-by-shot — or book a $149 pro shoot. Every edit is labeled; no fake skies, no hidden cracks." },
  { title: "3D walkthrough", body: "Captured with a phone's LiDAR in 20 minutes. Walk every room, measure any wall, from your couch." },
  { title: "Auto floor plan", body: "Generated from the 3D scan with room dimensions, so you know if your couch fits before you bid." },
  { title: "Live-streamed open house", body: "The owner walks the home live. Ask in chat: “Open the panel under the sink.” Recorded for later." },
  { title: "Self-tour, no agent", body: "Verify your ID once, pick a time, and a smart lock opens for your window only. The seller is notified in real time." },
  { title: "Everything up front", body: "Inspection, disclosures, insurance quote, flood zone, utility bills and title preview — before you bid, not after." },
];

const steps = [
  { n: "01", title: "Owner lists", body: "Flat fee from $0. Set a starting bid, an optional hidden reserve, and an auction window." },
  { n: "02", title: "You tour on your own", body: "3D, video, live open houses, self-tours, and a full data room with the inspection already done." },
  { n: "03", title: "Get verified, then bid", body: "Pre-approval or proof of funds sets your bid limit. Proxy bidding and a soft close keep it fair." },
  { n: "04", title: "Close online", body: "Winning bid becomes a signed contract. Escrow, title and e-closing are tracked step-by-step." },
];

const compare = [
  ["Seller cost on a $450K home", "~$24,750 (5.5%)", "Flat fee + MLS", "$0–$999 flat"],
  ["Price discovery", "Private offers, blind", "Private offers, blind", "Open, live bidding"],
  ["Inspection before you offer", "Rarely", "Rarely", "Always, in the data room"],
  ["Tour without an agent", "No", "Varies", "Yes — smart-lock self-tours"],
  ["Know you were outbid", "Maybe, by phone", "Maybe", "Instantly, with a chance to respond"],
];

export default function Home() {
  const live = listings.filter((l) => l.status !== "sold");
  const liveCount = listings.filter((l) => l.status === "live").length;
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
          <div className="rise space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-1 text-sm text-ink-dim">
              <span className="pulse-dot h-2 w-2 rounded-full bg-live" /> {liveCount} homes taking bids now in Palm Beach County
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
              Bid on homes.
              <br />
              <span className="italic text-accent">Skip the 6%.</span>
            </h1>
            <p className="max-w-xl text-lg text-ink-dim">
              Owners list directly. You tour on your own — in 3D, on a live stream, or in person with a self-tour code —
              then bid in the open against verified buyers. No listing agent. No secret offers. No commission.
            </p>
            <form action="/homes" className="flex max-w-xl gap-2">
              <input
                name="q"
                placeholder="City, neighborhood, or ZIP"
                className="flex-1 rounded-full border bg-surface px-5 py-3 outline-none focus:border-ink"
              />
              <button className="rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-deep">
                Find homes
              </button>
            </form>
            <div className="flex gap-8 pt-2 text-sm">
              <div>
                <p className="font-mono text-2xl font-semibold">$499</p>
                <p className="text-ink-dim">flat to list with pro media</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-semibold">7–10 days</p>
                <p className="text-ink-dim">typical auction window</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-semibold">100%</p>
                <p className="text-ink-dim">bidders verified</p>
              </div>
            </div>
          </div>
          <div className="rise grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" style={{ animationDelay: "0.15s" }}>
            {live.slice(0, 2).map((l) => (
              <HomeCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-4 md:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="card p-5">
              <p className="font-mono text-sm text-accent">{s.n}</p>
              <p className="mt-2 text-lg font-semibold">{s.title}</p>
              <p className="mt-1 text-sm text-ink-dim">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Live and upcoming</h2>
          <Link href="/homes" className="text-sm font-semibold text-accent">
            See all on the map →
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <HomeCard key={l.id} listing={l} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">Six ways to see a home without an agent</h2>
        <p className="mt-2 max-w-2xl text-ink-dim">
          Agents were the gatekeepers to the front door and the paperwork. We replaced both.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {viewModes.map((v) => (
            <div key={v.title} className="card p-6">
              <p className="text-lg font-semibold">{v.title}</p>
              <p className="mt-2 text-sm text-ink-dim">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">How much would you keep?</h2>
          <p className="mt-3 text-ink-dim">
            On a median-priced home, traditional commissions run about $25,000. Gavel is a flat fee whether your home
            sells for $200K or $2M — and open bidding means buyers set the price, not a pricing guess.
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border bg-surface text-sm">
            <table className="w-full">
              <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-ink-mute">
                <tr>
                  <th className="p-3"></th>
                  <th className="p-3">Agent + MLS</th>
                  <th className="p-3">Flat-fee MLS sites</th>
                  <th className="p-3 text-accent">Gavel</th>
                </tr>
              </thead>
              <tbody>
                {compare.map((row) => (
                  <tr key={row[0]} className="border-t">
                    <td className="p-3 font-medium">{row[0]}</td>
                    <td className="p-3 text-ink-dim">{row[1]}</td>
                    <td className="p-3 text-ink-dim">{row[2]}</td>
                    <td className="p-3 font-semibold">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <SavingsCalculator />
      </section>

      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
        <div className="card flex flex-col items-start justify-between gap-6 bg-navy p-8 text-white sm:flex-row sm:items-center sm:p-12">
          <div>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Your home, your auction.</h2>
            <p className="mt-2 max-w-xl text-white/70">
              List in about 30 minutes. We schedule the capture, set up the smart lock, and handle the contract, escrow
              and closing.
            </p>
          </div>
          <Link href="/sell" className="rounded-full bg-accent px-7 py-3 font-semibold text-white hover:bg-accent-deep">
            Start listing →
          </Link>
        </div>
      </section>
    </>
  );
}
