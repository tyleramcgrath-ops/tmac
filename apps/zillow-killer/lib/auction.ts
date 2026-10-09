// Gavel bid engine — pure, deterministic, no I/O.
//
// The same rules run in the browser prototype and are meant to run server-side
// (inside a row-locked transaction) in production. Every rule a bidder or seller
// is told about on /how-it-works is enforced here:
//
//   - proxy bidding: you enter the most you'll pay; the engine bids for you one
//     increment at a time, only as high as needed to stay on top
//   - bids are capped by verified buying power (pre-approval or proof of funds)
//   - sellers (and anyone linked to them) can never bid — no shill bidding
//   - soft close: a bid in the final minutes extends the clock, so no sniping
//   - hidden reserve: once someone's max reaches it, the price jumps to it
//   - Buy Now: available until the reserve is met, then it disappears
//   - ties go to whoever bid first
//   - at settlement the runner-up is kept as the backup (second-chance) buyer

export type AuctionConfig = {
  startingBid: number;
  /** Hidden minimum the seller will accept. null = absolute auction. */
  reserve: number | null;
  /** Instant-win price. null = no Buy Now. */
  buyNow: number | null;
  endsAt: number;
  /** A bid placed with less than this left on the clock extends the auction. */
  softCloseMs: number;
  /** How long the clock is pushed out to when soft close triggers. */
  extendMs: number;
  /** Bidder ids that may never bid: the seller and their linked accounts. */
  blockedBidders: string[];
};

export type BidEvent = {
  bidderId: string;
  amount: number;
  at: number;
  /** true when the engine placed this bid on the bidder's behalf. */
  auto: boolean;
};

export type AuctionState = {
  config: AuctionConfig;
  endsAt: number;
  price: number | null;
  leaderId: string | null;
  /** Secret max of every bidder who has bid. Never shown to other bidders. */
  maxes: Record<string, number>;
  /** When each bidder first reached their current max (tie-break). */
  maxSetAt: Record<string, number>;
  history: BidEvent[];
  extensions: number;
  boughtNow: boolean;
};

export type BidRequest = {
  bidderId: string;
  maxAmount: number;
  now: number;
  /** Verified buying power. Bids above it are rejected. */
  buyingPower: number;
};

export type BidError =
  | "auction-closed"
  | "blocked-bidder"
  | "below-minimum"
  | "over-buying-power"
  | "not-higher-than-own-max";

export type BidResult =
  | { ok: true; state: AuctionState; outbid: boolean; extended: boolean }
  | { ok: false; error: BidError; minimum: number };

export function createAuction(config: AuctionConfig): AuctionState {
  return {
    config,
    endsAt: config.endsAt,
    price: null,
    leaderId: null,
    maxes: {},
    maxSetAt: {},
    history: [],
    extensions: 0,
    boughtNow: false,
  };
}

/** Bid increment at a given price — the same ladder for every listing. */
export function increment(price: number): number {
  if (price < 100_000) return 1_000;
  if (price < 500_000) return 2_500;
  if (price < 1_000_000) return 5_000;
  return 10_000;
}

export function minimumNextBid(state: AuctionState): number {
  if (state.price === null) return state.config.startingBid;
  return state.price + increment(state.price);
}

export function isOpen(state: AuctionState, now: number): boolean {
  return !state.boughtNow && now < state.endsAt;
}

export function reserveMet(state: AuctionState): boolean {
  const { reserve } = state.config;
  if (reserve === null) return true;
  return state.price !== null && state.price >= reserve;
}

export function buyNowAvailable(state: AuctionState): boolean {
  return state.config.buyNow !== null && !reserveMet(state);
}

export function placeBid(state: AuctionState, req: BidRequest): BidResult {
  const { bidderId, maxAmount, now, buyingPower } = req;
  const minimum = minimumNextBid(state);

  if (!isOpen(state, now)) return { ok: false, error: "auction-closed", minimum };
  if (state.config.blockedBidders.includes(bidderId)) {
    return { ok: false, error: "blocked-bidder", minimum };
  }
  if (maxAmount > buyingPower) return { ok: false, error: "over-buying-power", minimum };

  const next: AuctionState = {
    ...state,
    maxes: { ...state.maxes },
    maxSetAt: { ...state.maxSetAt },
    history: [...state.history],
  };

  // Buy Now short-circuits the auction at the Buy Now price.
  if (buyNowAvailable(state) && maxAmount >= state.config.buyNow!) {
    const price = state.config.buyNow!;
    next.maxes[bidderId] = price;
    next.maxSetAt[bidderId] = now;
    next.price = price;
    next.leaderId = bidderId;
    next.boughtNow = true;
    next.endsAt = now;
    next.history.push({ bidderId, amount: price, at: now, auto: false });
    return { ok: true, state: next, outbid: false, extended: false };
  }

  // The current leader raising their own max doesn't move the price
  // (except to meet the reserve).
  if (state.leaderId === bidderId) {
    if (maxAmount <= state.maxes[bidderId]) {
      return { ok: false, error: "not-higher-than-own-max", minimum };
    }
    next.maxes[bidderId] = maxAmount;
    next.maxSetAt[bidderId] = now;
    applyReserveJump(next, bidderId, now);
    return { ok: true, state: next, outbid: false, extended: extend(next, now) };
  }

  if (maxAmount < minimum) return { ok: false, error: "below-minimum", minimum };

  next.maxes[bidderId] = maxAmount;
  next.maxSetAt[bidderId] = now;

  const leaderId = state.leaderId;
  if (leaderId === null) {
    next.leaderId = bidderId;
    next.price = state.config.startingBid;
    next.history.push({ bidderId, amount: next.price, at: now, auto: false });
    applyReserveJump(next, bidderId, now);
    return { ok: true, state: next, outbid: false, extended: extend(next, now) };
  }

  const leaderMax = state.maxes[leaderId];
  let outbid: boolean;
  if (maxAmount > leaderMax) {
    // Challenger takes the lead, paying one increment over the old leader's max.
    // Record the old leader's proxy reaching its max, unless the history already ends there.
    const last = next.history[next.history.length - 1];
    if (!last || last.bidderId !== leaderId || last.amount !== leaderMax) {
      next.history.push({ bidderId: leaderId, amount: leaderMax, at: now, auto: true });
    }
    next.leaderId = bidderId;
    next.price = Math.min(maxAmount, leaderMax + increment(leaderMax));
    next.history.push({ bidderId, amount: next.price, at: now, auto: false });
    outbid = false;
  } else {
    // Leader's proxy defends. A tie goes to the earlier bidder (the leader).
    next.history.push({ bidderId, amount: maxAmount, at: now, auto: false });
    next.price = Math.min(leaderMax, maxAmount + increment(maxAmount));
    next.history.push({ bidderId: leaderId, amount: next.price, at: now, auto: true });
    outbid = true;
  }
  applyReserveJump(next, next.leaderId!, now);
  return { ok: true, state: next, outbid, extended: extend(next, now) };
}

// eBay rule: once the leader's max reaches the reserve, the visible price jumps
// straight to the reserve so the seller and bidders see "reserve met".
function applyReserveJump(state: AuctionState, leaderId: string, now: number) {
  const { reserve } = state.config;
  if (reserve === null || state.price === null) return;
  if (state.price < reserve && state.maxes[leaderId] >= reserve) {
    state.price = reserve;
    state.history.push({ bidderId: leaderId, amount: reserve, at: now, auto: true });
  }
}

function extend(state: AuctionState, now: number): boolean {
  const { softCloseMs, extendMs } = state.config;
  if (state.endsAt - now > softCloseMs) return false;
  state.endsAt = Math.max(state.endsAt, now + extendMs);
  state.extensions += 1;
  return true;
}

export type Settlement =
  | { outcome: "open" }
  | { outcome: "no-bids" }
  | { outcome: "reserve-not-met"; highBid: number; highBidderId: string }
  | {
      outcome: "sold";
      price: number;
      winnerId: string;
      /** Next-best bidder, offered the home at their max if the winner defaults. */
      backup: { bidderId: string; amount: number } | null;
    };

export function settle(state: AuctionState, now: number): Settlement {
  if (isOpen(state, now)) return { outcome: "open" };
  if (state.leaderId === null || state.price === null) return { outcome: "no-bids" };
  if (!reserveMet(state)) {
    return { outcome: "reserve-not-met", highBid: state.price, highBidderId: state.leaderId };
  }
  const runnerUp = Object.entries(state.maxes)
    .filter(([id]) => id !== state.leaderId)
    .sort((a, b) => b[1] - a[1] || state.maxSetAt[a[0]] - state.maxSetAt[b[0]])[0];
  return {
    outcome: "sold",
    price: state.price,
    winnerId: state.leaderId,
    backup: runnerUp ? { bidderId: runnerUp[0], amount: runnerUp[1] } : null,
  };
}
