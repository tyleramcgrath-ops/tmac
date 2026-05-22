'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { SEED_LISTINGS, type Listing } from './data'

export type Bid = {
  id: string
  listingId: string
  bidder: string
  amount: number
  placedAt: number
}

export type UserListing = Omit<Listing, 'palette' | 'emoji'> & {
  palette: Listing['palette']
  emoji: string
  userCreated: true
}

type PlaceBidResult =
  | { ok: true; bid: Bid; newEndsAt?: number }
  | { ok: false; reason: string }

type Store = {
  hydrated: boolean
  username: string
  setUsername: (name: string) => void

  bids: Bid[]
  watchlist: string[]
  userListings: Listing[]
  endsAtOverrides: Record<string, number>

  toggleWatch: (id: string) => void
  isWatched: (id: string) => boolean

  placeBid: (
    listingId: string,
    amount: number,
    minNextBid: number,
    endsAt: number,
  ) => PlaceBidResult

  topBidFor: (listingId: string) => Bid | undefined
  bidsFor: (listingId: string) => Bid[]
  myBidsGrouped: () => { listingId: string; myTop: Bid; isLeader: boolean; currentTop: Bid }[]

  addListing: (listing: Listing) => void
  allListings: () => Listing[]
  effectiveEndsAt: (listing: Listing) => number
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function generateName() {
  const adj = ['breezy', 'crimson', 'lucky', 'silver', 'mellow', 'fox', 'sturdy', 'jolly', 'nimble', 'sunny']
  const animal = ['otter', 'falcon', 'badger', 'fern', 'maple', 'whale', 'lynx', 'koi', 'crane', 'wren']
  return `${adj[Math.floor(Math.random() * adj.length)]}_${animal[Math.floor(Math.random() * animal.length)]}${Math.floor(Math.random() * 99)}`
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      hydrated: false,
      username: '',
      setUsername: (name) => set({ username: name.trim() || generateName() }),

      bids: [],
      watchlist: [],
      userListings: [],
      endsAtOverrides: {},

      toggleWatch: (id) =>
        set((s) => ({
          watchlist: s.watchlist.includes(id)
            ? s.watchlist.filter((x) => x !== id)
            : [...s.watchlist, id],
        })),

      isWatched: (id) => get().watchlist.includes(id),

      placeBid: (listingId, amount, minNextBid, endsAt) => {
        const state = get()
        const effectiveEnd = state.endsAtOverrides[listingId] ?? endsAt
        if (Date.now() >= effectiveEnd) {
          return { ok: false, reason: 'Auction has ended.' }
        }
        if (!Number.isFinite(amount) || amount < minNextBid) {
          return {
            ok: false,
            reason: `Bid must be at least $${minNextBid.toLocaleString()}.`,
          }
        }
        const bidder = state.username || generateName()
        const bid: Bid = {
          id: uid(),
          listingId,
          bidder,
          amount,
          placedAt: Date.now(),
        }
        // eBay-style anti-snipe: if a bid lands in the final 2 minutes,
        // extend the auction by 2 minutes.
        const remaining = effectiveEnd - Date.now()
        let newEndsAt: number | undefined
        const overrides = { ...state.endsAtOverrides }
        if (remaining < 2 * 60 * 1000) {
          newEndsAt = Date.now() + 2 * 60 * 1000
          overrides[listingId] = newEndsAt
        }
        set({
          bids: [...state.bids, bid],
          username: bidder,
          endsAtOverrides: overrides,
        })
        return { ok: true, bid, newEndsAt }
      },

      topBidFor: (listingId) => {
        const bids = get().bids.filter((b) => b.listingId === listingId)
        if (!bids.length) return undefined
        return bids.reduce((a, b) => (b.amount > a.amount ? b : a))
      },

      bidsFor: (listingId) =>
        get()
          .bids.filter((b) => b.listingId === listingId)
          .sort((a, b) => b.placedAt - a.placedAt),

      myBidsGrouped: () => {
        const { bids, username } = get()
        const mine = bids.filter((b) => b.bidder === username)
        const byListing = new Map<string, Bid>()
        for (const b of mine) {
          const prev = byListing.get(b.listingId)
          if (!prev || b.amount > prev.amount) byListing.set(b.listingId, b)
        }
        const out: { listingId: string; myTop: Bid; isLeader: boolean; currentTop: Bid }[] = []
        for (const [listingId, myTop] of byListing) {
          const allForListing = bids.filter((b) => b.listingId === listingId)
          const top = allForListing.reduce((a, b) => (b.amount > a.amount ? b : a))
          out.push({
            listingId,
            myTop,
            currentTop: top,
            isLeader: top.id === myTop.id,
          })
        }
        return out.sort((a, b) => b.myTop.placedAt - a.myTop.placedAt)
      },

      addListing: (listing) =>
        set((s) => ({ userListings: [listing, ...s.userListings] })),

      allListings: () => {
        const userListings = get().userListings
        return [...userListings, ...SEED_LISTINGS]
      },

      effectiveEndsAt: (listing) => {
        const override = get().endsAtOverrides[listing.id]
        return override ?? listing.endsAt
      },
    }),
    {
      name: 'bidly-store-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        username: state.username,
        bids: state.bids,
        watchlist: state.watchlist,
        userListings: state.userListings,
        endsAtOverrides: state.endsAtOverrides,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true
      },
    },
  ),
)

export function nextMinBid(currentTop: number | undefined, startingBid: number): number {
  const base = currentTop ?? startingBid
  // Standard auction increment ladders
  if (base < 100_000) return base + 1_000
  if (base < 500_000) return base + 2_500
  if (base < 1_000_000) return base + 5_000
  if (base < 5_000_000) return base + 10_000
  return base + 25_000
}
