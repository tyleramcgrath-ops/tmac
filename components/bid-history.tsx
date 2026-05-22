'use client'

import { Trophy, User } from 'lucide-react'
import type { Listing } from '@/lib/data'
import { useStore } from '@/lib/store'
import { formatCurrency, relativeTime } from '@/lib/format'
import { Badge } from '@/components/ui/badge'

export function BidHistory({ listing }: { listing: Listing }) {
  const bids = useStore((s) => s.bidsFor(listing.id))
  const username = useStore((s) => s.username)
  const hydrated = useStore((s) => s.hydrated)

  if (!hydrated) return <div className="text-sm text-muted-foreground">Loading bid history…</div>

  if (bids.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No bids yet. Starting bid is{' '}
        <span className="font-semibold text-foreground">{formatCurrency(listing.startingBid)}</span>.
        Be the first.
      </div>
    )
  }

  const max = bids.reduce((a, b) => Math.max(a, b.amount), 0)

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {bids.map((b, idx) => {
        const isTop = b.amount === max && idx === 0
        const isMine = b.bidder === username
        return (
          <li key={b.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs font-semibold">
                {isTop ? <Trophy className="h-4 w-4 text-amber-500" /> : <User className="h-4 w-4" />}
              </div>
              <div>
                <p className="font-medium">
                  {b.bidder}
                  {isMine && <Badge variant="primary" className="ml-2">You</Badge>}
                  {isTop && <Badge variant="warn" className="ml-2">Top</Badge>}
                </p>
                <p className="text-xs text-muted-foreground">{relativeTime(b.placedAt)}</p>
              </div>
            </div>
            <p className="font-semibold tabular-nums">{formatCurrency(b.amount)}</p>
          </li>
        )
      })}
    </ul>
  )
}
