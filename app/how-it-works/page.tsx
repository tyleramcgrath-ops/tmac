import Link from 'next/link'
import { ArrowRight, Gavel, ShieldCheck, Timer, Trophy, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'How bidding works — Bidly' }

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">How Bidly works</h1>
        <p className="mt-2 text-muted-foreground">
          Bidly takes the model that built eBay — auctions, snipes, ratings — and points it at real estate.
          Here&apos;s the whole thing in one page.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">For buyers</h2>
        <Step
          n={1}
          icon={<Users className="h-5 w-5" />}
          title="Browse open auctions"
          body="Filter by city, type, beds, or price. Watch anything you might bid on — you'll get notified before it closes."
        />
        <Step
          n={2}
          icon={<Gavel className="h-5 w-5" />}
          title="Place a bid"
          body="Bids must beat the current top by the increment (e.g. $5,000 over $1M). Bids are binding — if you win, you close."
        />
        <Step
          n={3}
          icon={<Timer className="h-5 w-5" />}
          title="Anti-snipe extension"
          body="Bids in the final 2 minutes push the auction out by another 2 minutes. Last-second wins are still possible, just not cheap-shotted."
        />
        <Step
          n={4}
          icon={<Trophy className="h-5 w-5" />}
          title="Win & close"
          body="The high bidder wires earnest within 48 hours. Standard 30-day closing through licensed escrow with full title insurance."
        />
      </section>

      <section id="sellers" className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold">For sellers</h2>
        <Step
          n={1}
          icon={<Gavel className="h-5 w-5" />}
          title="Set your terms"
          body="Choose a starting bid, an optional reserve (the secret minimum you'll accept), and an optional Buy It Now price."
        />
        <Step
          n={2}
          icon={<Timer className="h-5 w-5" />}
          title="Pick a duration"
          body="1 to 14 days. Most sellers run 7 — long enough for inspections, short enough to stay momentum-positive."
        />
        <Step
          n={3}
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Get paid"
          body="Once title clears, funds are released from escrow. Bidly takes a flat 1% commission — no buyer's-agent split needed."
        />
      </section>

      <section id="fees" className="mt-12 rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">Fees, plainly</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• <span className="text-foreground font-medium">Buyers:</span> $0 to bid. Standard closing costs apply.</li>
          <li>• <span className="text-foreground font-medium">Sellers:</span> 1% of final sale price at close. No listing fee.</li>
          <li>• <span className="text-foreground font-medium">Failed reserves:</span> No charge. Re-list at any time.</li>
        </ul>
      </section>

      <section id="trust" className="mt-12 rounded-xl border border-border bg-muted/40 p-6">
        <h2 className="text-xl font-semibold">Trust &amp; safety</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Every listing on Bidly is verified for ownership and lien status before it goes live.
          Earnest deposits sit in escrow with a licensed third party. Title insurance is built in.
          Seller ratings are public and tied to closed transactions — like eBay feedback, but for keys.
        </p>
      </section>

      <section id="contact" className="mt-12 text-center">
        <h2 className="text-xl font-semibold">Ready to bid?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Auctions are live right now. Some end in hours.
        </p>
        <Button asChild size="lg" className="mt-4">
          <Link href="/">Browse auctions <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </section>
    </div>
  )
}

function Step({
  n, icon, title, body,
}: { n: number; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Step {n}</p>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  )
}
