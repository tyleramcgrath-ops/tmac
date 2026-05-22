'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { SEED_LISTINGS, type Listing } from '@/lib/data'
import { useStore } from '@/lib/store'
import { ListingCard } from './listing-card'

type SortKey = 'ending' | 'newest' | 'price-low' | 'price-high' | 'bids'

function matches(listing: Listing, q: string): boolean {
  if (!q) return true
  const hay = [
    listing.title,
    listing.address,
    listing.city,
    listing.state,
    listing.zip,
    listing.propertyType,
    ...listing.features,
  ]
    .join(' ')
    .toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((tok) => hay.includes(tok))
}

export function ListingsGrid({ scope = 'all' }: { scope?: 'all' | 'watchlist' }) {
  const params = useSearchParams()
  const allListings = useStore((s) => s.userListings)
  const watchlist = useStore((s) => s.watchlist)
  const hydrated = useStore((s) => s.hydrated)
  const bids = useStore((s) => s.bids)
  const endsAtOverrides = useStore((s) => s.endsAtOverrides)

  const filtered = useMemo(() => {
    let list: Listing[] = [...allListings, ...SEED_LISTINGS]
    if (scope === 'watchlist') {
      list = list.filter((l) => watchlist.includes(l.id))
    }

    const q = params.get('q') ?? ''
    const type = params.get('type') ?? ''
    const min = Number(params.get('min') ?? '') || 0
    const max = Number(params.get('max') ?? '') || Infinity
    const beds = Number(params.get('beds') ?? '') || 0
    const sort = (params.get('sort') as SortKey) || 'ending'

    list = list.filter((l) => {
      if (!matches(l, q)) return false
      if (type && l.propertyType !== type) return false
      if (l.beds < beds) return false
      const top = bids
        .filter((b) => b.listingId === l.id)
        .reduce((a, b) => (b.amount > a ? b.amount : a), 0)
      const current = top || l.startingBid
      if (current < min || current > max) return false
      return true
    })

    const topFor = (id: string) =>
      bids.filter((b) => b.listingId === id).reduce((a, b) => (b.amount > a ? b.amount : a), 0)
    const endFor = (l: Listing) => endsAtOverrides[l.id] ?? l.endsAt
    const bidCount = (id: string) => bids.filter((b) => b.listingId === id).length

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'price-low':
          return (topFor(a.id) || a.startingBid) - (topFor(b.id) || b.startingBid)
        case 'price-high':
          return (topFor(b.id) || b.startingBid) - (topFor(a.id) || a.startingBid)
        case 'bids':
          return bidCount(b.id) - bidCount(a.id)
        case 'newest':
          return b.startsAt - a.startsAt
        case 'ending':
        default:
          return endFor(a) - endFor(b)
      }
    })

    return list
  }, [allListings, watchlist, params, bids, endsAtOverrides, scope])

  if (!hydrated) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="aspect-[4/3] animate-pulse bg-muted" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-8 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <p className="text-lg font-semibold">No listings match those filters.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try clearing some filters, or check back later — sellers add inventory all the time.
        </p>
      </div>
    )
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        Showing {filtered.length} listing{filtered.length === 1 ? '' : 's'}
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </>
  )
}
