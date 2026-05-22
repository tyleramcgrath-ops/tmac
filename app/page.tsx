import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight, Gavel, ShieldCheck, Sparkles, Timer } from 'lucide-react'
import { FilterBar } from '@/components/filters'
import { ListingsGrid } from '@/components/listings-grid'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <section className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-amber-100 to-rose-100 p-8 md:p-12 dark:from-primary/15 dark:via-zinc-800 dark:to-zinc-900">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
            <Sparkles className="h-3 w-3" /> Live now · 12 auctions
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Bid on homes like it&apos;s eBay.
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground md:text-lg">
            Browse real-estate auctions, place bids in real-time, and take the keys.
            Every property is escrow-backed and title-insured.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="#listings">
                Browse auctions <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/how-it-works">How bidding works</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Gavel className="h-4 w-4" /> Real auctions</span>
            <span className="flex items-center gap-1.5"><Timer className="h-4 w-4" /> Anti-snipe extensions</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Escrow + title</span>
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 hidden h-72 w-72 rotate-12 rounded-3xl bg-foreground/5 md:block" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 right-16 hidden h-56 w-56 -rotate-6 rounded-3xl bg-foreground/5 md:block" />
      </section>

      <div id="listings" className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Suspense fallback={null}>
            <FilterBar />
          </Suspense>
        </aside>
        <div>
          <Suspense fallback={null}>
            <ListingsGrid />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
