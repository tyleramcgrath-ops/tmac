import { createAuction, placeBid, type AuctionState } from "./auction.ts";
import type { Listing } from "./listings.ts";

export const SOFT_CLOSE_MS = 5 * 60_000;

/** Build a listing's auction and replay its seeded bids through the real engine. */
export function seededAuction(listing: Listing, endsAt: number, seededAt = endsAt - 86_400_000): AuctionState {
  let state = createAuction({
    startingBid: listing.startingBid,
    reserve: listing.reserve,
    buyNow: listing.buyNow,
    endsAt,
    softCloseMs: SOFT_CLOSE_MS,
    extendMs: SOFT_CLOSE_MS,
    blockedBidders: ["seller"],
  });
  listing.seedBids.forEach((b, i) => {
    const r = placeBid(state, {
      bidderId: b.bidder,
      maxAmount: b.max,
      now: seededAt + i * 60_000,
      buyingPower: Number.MAX_SAFE_INTEGER,
    });
    if (r.ok) state = r.state;
  });
  return state;
}

/** Price shown on cards: the engine's current price after the seeded bids. */
export function displayPrice(listing: Listing): number {
  if (listing.status === "sold") return listing.soldPrice!;
  return seededAuction(listing, Number.MAX_SAFE_INTEGER, 0).price ?? listing.startingBid;
}
