'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUp, Gavel, Heart, Lock, Sparkles, TriangleAlert } from 'lucide-react'
import type { Listing } from '@/lib/data'
import { nextMinBid, useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Countdown } from './countdown'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

type Props = { listing: Listing }

export function BidPanel({ listing }: Props) {
  const router = useRouter()
  const hydrated = useStore((s) => s.hydrated)
  const username = useStore((s) => s.username)
  const setUsername = useStore((s) => s.setUsername)
  const placeBid = useStore((s) => s.placeBid)
  const topBid = useStore((s) => s.topBidFor(listing.id))
  const bidsFor = useStore((s) => s.bidsFor(listing.id))
  const isWatched = useStore((s) => s.isWatched(listing.id))
  const toggleWatch = useStore((s) => s.toggleWatch)
  const effectiveEndsAt = useStore((s) => s.effectiveEndsAt(listing))

  const current = topBid?.amount ?? listing.startingBid
  const minNext = useMemo(() => nextMinBid(topBid?.amount, listing.startingBid), [topBid, listing.startingBid])

  const [amount, setAmount] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [askName, setAskName] = useState(false)
  const [draftName, setDraftName] = useState('')

  const isEnded = hydrated && Date.now() >= effectiveEndsAt
  const meetsReserve = !listing.reservePrice || current >= listing.reservePrice
  const iAmLeader = hydrated && topBid && topBid.bidder === username

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const value = Number(amount.replace(/[^0-9.]/g, ''))
    if (!username) {
      setAskName(true)
      return
    }
    const res = placeBid(listing.id, value, minNext, listing.endsAt)
    if (!res.ok) {
      setError(res.reason)
      return
    }
    setSuccess(
      res.newEndsAt
        ? `Bid accepted! Auction extended 2 minutes (anti-snipe).`
        : `Bid of ${formatCurrency(value)} accepted — you're the top bidder.`,
    )
    setAmount('')
    router.refresh()
  }

  function buyItNow() {
    if (!listing.buyItNow) return
    if (!username) {
      setAskName(true)
      return
    }
    const res = placeBid(listing.id, listing.buyItNow, listing.buyItNow, listing.endsAt)
    if (!res.ok) {
      setError(res.reason)
      return
    }
    setSuccess(`Sold! You bought it now at ${formatCurrency(listing.buyItNow)}.`)
    router.refresh()
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-gradient-to-br from-muted/60 to-card p-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-1.5">
            {isEnded ? (
              <>Auction ended</>
            ) : (
              <>
                <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                Live auction
              </>
            )}
          </span>
          <span className="tabular-nums">
            <Countdown endsAt={effectiveEndsAt} variant="long" />
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              {topBid ? `Top bid · ${bidsFor.length} bid${bidsFor.length === 1 ? '' : 's'}` : 'Starting bid'}
            </p>
            <p className="text-3xl font-bold tabular-nums">{formatCurrency(current)}</p>
            {topBid && (
              <p className="text-xs text-muted-foreground">
                by <span className="font-medium text-foreground">{topBid.bidder}</span>
              </p>
            )}
          </div>
          <div className="text-right text-xs">
            {listing.reservePrice && (
              <Badge variant={meetsReserve ? 'primary' : 'outline'}>
                {meetsReserve ? 'Reserve met' : 'Reserve not met'}
              </Badge>
            )}
            {iAmLeader && (
              <div className="mt-2">
                <Badge variant="primary"><Sparkles className="h-3 w-3" /> You're winning</Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {!isEnded ? (
          <>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Your bid (min {formatCurrency(minNext)})
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={minNext.toLocaleString()}
                      className="pl-7 text-lg font-semibold tabular-nums"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(String(minNext))}
                    className="whitespace-nowrap"
                  >
                    <ArrowUp className="h-3.5 w-3.5" /> Min
                  </Button>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full">
                <Gavel className="h-4 w-4" />
                Place bid
              </Button>
            </form>

            {listing.buyItNow && (
              <div className="rounded-lg border border-dashed border-border p-4 text-center">
                <p className="text-xs text-muted-foreground">Skip the bidding</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{formatCurrency(listing.buyItNow)}</p>
                <Button onClick={buyItNow} variant="accent" className="mt-3 w-full">
                  Buy It Now
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg bg-muted p-4 text-center text-sm">
            <Lock className="mx-auto mb-1 h-5 w-5" />
            This auction has ended. {topBid ? (
              <> Won by <span className="font-semibold">{topBid.bidder}</span> at {formatCurrency(topBid.amount)}.</>
            ) : (
              <> No bids were placed.</>
            )}
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => toggleWatch(listing.id)}
        >
          <Heart className={cn('h-4 w-4', hydrated && isWatched ? 'fill-red-500 text-red-500' : '')} />
          {hydrated && isWatched ? 'In your watchlist' : 'Add to watchlist'}
        </Button>

        {error && (
          <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
            {success}
          </p>
        )}

        {askName && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setUsername(draftName)
              setAskName(false)
              setError('Picked a bidder handle — tap Place bid again.')
            }}
            className="rounded-lg border border-border bg-muted/40 p-3"
          >
            <p className="mb-2 text-xs font-medium">Pick a bidder handle to continue</p>
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="e.g. cascade_owl"
              />
              <Button type="submit" size="sm">Save</Button>
            </div>
          </form>
        )}

        <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
          <p>• Bids are binding. By bidding you commit to closing if you win.</p>
          <p>• Bids placed in the final 2 minutes extend the auction by 2 minutes.</p>
          <p>• Earnest deposit due within 48h of winning. Closing within 30 days.</p>
        </div>
      </div>
    </div>
  )
}
