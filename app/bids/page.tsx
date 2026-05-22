'use client'

import Link from 'next/link'
import { ListChecks, Trophy, AlertTriangle } from 'lucide-react'
import { SEED_LISTINGS } from '@/lib/data'
import { useStore } from '@/lib/store'
import { Countdown } from '@/components/countdown'
import { PropertyArt } from '@/components/property-art'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'

export default function BidsPage() {
  const hydrated = useStore((s) => s.hydrated)
  const username = useStore((s) => s.username)
  const grouped = useStore((s) => s.myBidsGrouped())
  const userListings = useStore((s) => s.userListings)
  const endsAtOverrides = useStore((s) => s.endsAtOverrides)
  const all = [...userListings, ...SEED_LISTINGS]

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-muted-foreground">Loading your bids…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
          <ListChecks className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">My bids</h1>
          <p className="text-sm text-muted-foreground">
            Auctions you&apos;re actively in {username && <>as <span className="font-medium text-foreground">{username}</span></>}.
          </p>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-lg font-semibold">No bids yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Find a property you like, then place a bid to start tracking it here.
          </p>
          <Button asChild className="mt-4">
            <Link href="/">Browse auctions</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {grouped.map(({ listingId, myTop, currentTop, isLeader }) => {
            const listing = all.find((l) => l.id === listingId)
            if (!listing) return null
            const endsAt = endsAtOverrides[listing.id] ?? listing.endsAt
            const ended = Date.now() >= endsAt
            const outbidGap = currentTop.amount - myTop.amount
            return (
              <li key={listingId}>
                <Link
                  href={`/listing/${listingId}`}
                  className="grid grid-cols-[110px_1fr_auto] gap-4 rounded-xl border border-border bg-card p-3 transition hover:shadow-md"
                >
                  <PropertyArt listing={listing} className="rounded-lg" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {ended ? (
                        isLeader ? (
                          <Badge variant="primary"><Trophy className="h-3 w-3" /> Won</Badge>
                        ) : (
                          <Badge variant="muted">Lost</Badge>
                        )
                      ) : isLeader ? (
                        <Badge variant="primary">Leading</Badge>
                      ) : (
                        <Badge variant="warn"><AlertTriangle className="h-3 w-3" /> Outbid by {formatCurrency(outbidGap)}</Badge>
                      )}
                    </div>
                    <h3 className="mt-1 line-clamp-1 font-semibold">{listing.title}</h3>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {listing.city}, {listing.state}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Your bid: <span className="font-semibold text-foreground tabular-nums">{formatCurrency(myTop.amount)}</span></span>
                      <span>Top bid: <span className="font-semibold text-foreground tabular-nums">{formatCurrency(currentTop.amount)}</span></span>
                    </div>
                  </div>
                  <div className="self-center text-right text-sm">
                    <p className="text-xs text-muted-foreground">{ended ? 'Ended' : 'Time left'}</p>
                    <p className="font-semibold tabular-nums">
                      <Countdown endsAt={endsAt} />
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
