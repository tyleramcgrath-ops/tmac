'use client'

import Link from 'next/link'
import { Bath, Bed, Heart, Ruler } from 'lucide-react'
import type { Listing } from '@/lib/data'
import { PropertyArt } from './property-art'
import { Countdown } from './countdown'
import { Badge } from '@/components/ui/badge'
import { useStore } from '@/lib/store'
import { formatCompact, formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

type Props = { listing: Listing }

export function ListingCard({ listing }: Props) {
  const isWatched = useStore((s) => s.isWatched(listing.id))
  const toggleWatch = useStore((s) => s.toggleWatch)
  const topBid = useStore((s) => s.topBidFor(listing.id))
  const bidsFor = useStore((s) => s.bidsFor(listing.id))
  const effectiveEndsAt = useStore((s) => s.effectiveEndsAt(listing))
  const hydrated = useStore((s) => s.hydrated)

  const current = topBid?.amount ?? listing.startingBid
  const bidCount = bidsFor.length
  const isEnded = hydrated && Date.now() >= effectiveEndsAt
  const isHot = bidCount >= 5
  const isClosing = hydrated && effectiveEndsAt - Date.now() < 24 * 60 * 60 * 1000

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative">
        <PropertyArt listing={listing} />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {isHot && <Badge variant="warn">🔥 Hot</Badge>}
          {!isEnded && isClosing && <Badge variant="live"><span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-white" /> Closing soon</Badge>}
          {isEnded && <Badge variant="muted">Ended</Badge>}
          {listing.buyItNow && !isEnded && <Badge variant="outline" className="bg-card/90">Buy It Now {formatCompact(listing.buyItNow)}</Badge>}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleWatch(listing.id)
          }}
          aria-label={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/95 shadow-sm transition hover:scale-105"
        >
          <Heart className={cn('h-4 w-4', hydrated && isWatched ? 'fill-red-500 text-red-500' : 'text-foreground')} />
        </button>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 font-semibold leading-tight">{listing.title}</h3>
          </div>
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {listing.address} · {listing.city}, {listing.state}
          </p>
        </div>

        {listing.propertyType !== 'Land' && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {listing.beds} bd</span>
            <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {listing.baths} ba</span>
            <span className="flex items-center gap-1"><Ruler className="h-3.5 w-3.5" /> {listing.sqft.toLocaleString()} sqft</span>
          </div>
        )}

        <div className="flex items-end justify-between border-t border-border pt-3">
          <div>
            <p className="text-xs text-muted-foreground">{topBid ? 'Top bid' : 'Starting bid'}</p>
            <p className="text-lg font-bold tabular-nums">{formatCurrency(current)}</p>
            {hydrated && bidCount > 0 && (
              <p className="text-[11px] text-muted-foreground">{bidCount} bid{bidCount === 1 ? '' : 's'}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Time left</p>
            <Countdown
              endsAt={effectiveEndsAt}
              className={cn('font-semibold tabular-nums', isClosing && !isEnded ? 'text-destructive' : '')}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
