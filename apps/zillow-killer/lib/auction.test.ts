import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createAuction,
  placeBid,
  settle,
  minimumNextBid,
  reserveMet,
  buyNowAvailable,
  type AuctionConfig,
  type AuctionState,
} from "./auction.ts";

const HOUR = 3_600_000;
const MIN = 60_000;

function auction(overrides: Partial<AuctionConfig> = {}): AuctionState {
  return createAuction({
    startingBid: 300_000,
    reserve: 340_000,
    buyNow: null,
    endsAt: 10 * HOUR,
    softCloseMs: 5 * MIN,
    extendMs: 5 * MIN,
    blockedBidders: ["seller"],
    ...overrides,
  });
}

function bid(state: AuctionState, bidderId: string, maxAmount: number, now = 0) {
  const r = placeBid(state, { bidderId, maxAmount, now, buyingPower: 1_000_000 });
  if (!r.ok) throw new Error(`bid rejected: ${r.error}`);
  return r;
}

test("first bid opens at the starting bid, not at the bidder's max", () => {
  const { state } = bid(auction(), "a", 320_000);
  assert.equal(state.price, 300_000);
  assert.equal(state.leaderId, "a");
  assert.equal(minimumNextBid(state), 302_500);
});

test("proxy bidding: challenger with a higher max wins at one increment over the old max", () => {
  let s = bid(auction(), "a", 320_000).state;
  s = bid(s, "b", 330_000).state;
  assert.equal(s.leaderId, "b");
  assert.equal(s.price, 322_500);
});

test("proxy bidding: leader defends automatically and the challenger is told they were outbid", () => {
  let s = bid(auction(), "a", 330_000).state;
  const r = bid(s, "b", 310_000);
  s = r.state;
  assert.equal(r.outbid, true);
  assert.equal(s.leaderId, "a");
  assert.equal(s.price, 312_500);
});

test("ties go to the earlier bidder", () => {
  let s = bid(auction(), "a", 325_000).state;
  s = bid(s, "b", 325_000).state;
  assert.equal(s.leaderId, "a");
  assert.equal(s.price, 325_000);
});

test("price jumps to the reserve once the leader's max reaches it", () => {
  const s = bid(auction(), "a", 350_000).state;
  assert.equal(s.price, 340_000);
  assert.equal(reserveMet(s), true);
});

test("leader raising their own max does not raise the price below the reserve", () => {
  let s = bid(auction(), "a", 310_000).state;
  s = bid(s, "a", 320_000).state;
  assert.equal(s.price, 300_000);
  assert.equal(reserveMet(s), false);
});

test("sellers and linked accounts cannot bid", () => {
  const r = placeBid(auction(), { bidderId: "seller", maxAmount: 400_000, now: 0, buyingPower: 1e9 });
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.error, "blocked-bidder");
});

test("bids above verified buying power are rejected", () => {
  const r = placeBid(auction(), { bidderId: "a", maxAmount: 400_000, now: 0, buyingPower: 350_000 });
  assert.equal(!r.ok && r.error, "over-buying-power");
});

test("bids below the minimum are rejected", () => {
  const s = bid(auction(), "a", 320_000).state;
  const r = placeBid(s, { bidderId: "b", maxAmount: 301_000, now: 0, buyingPower: 1e9 });
  assert.equal(!r.ok && r.error, "below-minimum");
  assert.equal(!r.ok && r.minimum, 302_500);
});

test("soft close: a bid in the last minutes extends the clock", () => {
  const s0 = auction();
  const late = s0.endsAt - 2 * MIN;
  const r = bid(s0, "a", 320_000, late);
  assert.equal(r.extended, true);
  assert.equal(r.state.endsAt, late + 5 * MIN);
  const early = bid(auction(), "a", 320_000, 0);
  assert.equal(early.extended, false);
});

test("bids after close are rejected", () => {
  const s0 = auction();
  const r = placeBid(s0, { bidderId: "a", maxAmount: 320_000, now: s0.endsAt, buyingPower: 1e9 });
  assert.equal(!r.ok && r.error, "auction-closed");
});

test("Buy Now ends the auction immediately and disappears once the reserve is met", () => {
  const withBuyNow = auction({ buyNow: 375_000 });
  const r = bid(withBuyNow, "a", 380_000, HOUR);
  assert.equal(r.state.boughtNow, true);
  assert.equal(r.state.price, 375_000);
  const s = settle(r.state, HOUR);
  assert.equal(s.outcome, "sold");

  const met = bid(auction({ buyNow: 375_000 }), "b", 345_000).state;
  assert.equal(buyNowAvailable(met), false);
});

test("settlement: sold with the runner-up kept as backup buyer", () => {
  let s = bid(auction(), "a", 345_000).state;
  s = bid(s, "b", 360_000).state;
  const result = settle(s, s.endsAt);
  assert.deepEqual(result, {
    outcome: "sold",
    price: 347_500,
    winnerId: "b",
    backup: { bidderId: "a", amount: 345_000 },
  });
});

test("settlement: reserve not met and no bids", () => {
  const s = bid(auction(), "a", 310_000).state;
  assert.equal(settle(s, s.endsAt).outcome, "reserve-not-met");
  const empty = auction();
  assert.equal(settle(empty, empty.endsAt).outcome, "no-bids");
  assert.equal(settle(empty, 0).outcome, "open");
});
