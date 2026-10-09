"use client";

import { useEffect, useRef, useState } from "react";
import {
  buyNowAvailable,
  increment,
  isOpen,
  minimumNextBid,
  placeBid,
  reserveMet,
  settle,
  type AuctionState,
  type BidError,
} from "@/lib/auction";
import { auctionEndsAt, formatRemaining, useNow } from "@/lib/clock";
import { type Listing, usd } from "@/lib/listings";
import { seededAuction } from "@/lib/seed";

const YOU = "you";

const errorText: Record<BidError, string> = {
  "auction-closed": "This auction has closed.",
  "blocked-bidder": "Sellers and their linked accounts can't bid.",
  "below-minimum": "Your bid is below the minimum.",
  "over-buying-power": "That's above your verified buying power. Upload a higher pre-approval to bid more.",
  "not-higher-than-own-max": "You're already leading — raise your max above your current max.",
};

type Verification = { id: boolean; funds: number | null; deposit: boolean };

export function BidPanel({ listing }: { listing: Listing }) {
  const now = useNow();
  const [state, setState] = useState<AuctionState | null>(null);
  const [verify, setVerify] = useState<Verification>({ id: false, funds: null, deposit: false });
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<{ tone: "good" | "bad" | "info"; text: string } | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const rivalUsed = useRef(false);

  useEffect(() => {
    // Built after mount: the end time depends on the visitor's clock.
    const s = seededAuction(listing, auctionEndsAt(listing.endsInHours), Date.now() - 3_600_000);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(s);
    setAmount(String(minimumNextBid(s)));
  }, [listing]);

  // A rival bidder with a hidden ceiling answers once after you take the lead,
  // so the prototype shows proxy bidding and outbid alerts in action.
  useEffect(() => {
    if (!state || state.leaderId !== YOU || rivalUsed.current || listing.seedBids.length === 0) return;
    const rival = [...listing.seedBids].sort((a, b) => b.max - a.max)[0].bidder;
    const ceiling = Math.round((listing.estimate * 1.03) / 2_500) * 2_500;
    const t = setTimeout(() => {
      rivalUsed.current = true;
      // The effect re-runs (and this timer resets) whenever state changes, so
      // `state` here is current.
      if (ceiling < minimumNextBid(state)) return;
      const r = placeBid(state, { bidderId: rival, maxAmount: ceiling, now: Date.now(), buyingPower: Infinity });
      if (!r.ok) return;
      setState(r.state);
      setFlashKey((k) => k + 1);
      setAmount(String(minimumNextBid(r.state)));
      setMessage(
        r.state.leaderId === YOU
          ? { tone: "good", text: `${rival} bid, but your max held. You're still leading at ${usd(r.state.price!)}.` }
          : { tone: "bad", text: `Outbid — ${rival} now leads at ${usd(r.state.price!)}. Raise your max to get back on top.` },
      );
    }, 5_000);
    return () => clearTimeout(t);
  }, [state, listing]);

  if (listing.status === "sold") {
    return (
      <div className="card p-6">
        <p className="text-xs uppercase tracking-wide text-ink-mute">Sold</p>
        <p className="font-mono text-4xl font-semibold">{usd(listing.soldPrice!)}</p>
        <p className="mt-2 text-sm text-ink-dim">
          {usd(listing.soldPrice! - listing.estimate)} over the Gavel estimate. Seller paid $499 instead of about{" "}
          {usd(listing.soldPrice! * 0.055)} in commission.
        </p>
      </div>
    );
  }

  if (!state || now === null) return <div className="card h-96 animate-pulse p-6" />;

  const open = isOpen(state, now) && listing.status === "live";
  const verified = verify.id && verify.funds !== null && verify.deposit;
  const min = minimumNextBid(state);
  const leading = state.leaderId === YOU;
  const result = settle(state, now);

  function submit(max: number) {
    if (!state || now === null) return;
    const r = placeBid(state, { bidderId: YOU, maxAmount: max, now: Date.now(), buyingPower: verify.funds ?? 0 });
    if (!r.ok) {
      setMessage({ tone: "bad", text: `${errorText[r.error]} Minimum is ${usd(r.minimum)}.` });
      return;
    }
    setState(r.state);
    setFlashKey((k) => k + 1);
    setAmount(String(minimumNextBid(r.state)));
    const parts: string[] = [];
    if (r.state.boughtNow) parts.push(`You bought it now for ${usd(r.state.price!)}. Your contract is ready to sign.`);
    else if (r.outbid) parts.push(`Another bidder's max beat yours — the price is now ${usd(r.state.price!)}.`);
    else parts.push(`You're the high bidder at ${usd(r.state.price!)}. We'll bid for you up to ${usd(max)}.`);
    if (r.extended) parts.push("Bid in the final minutes — the clock was extended 5 minutes.");
    setMessage({ tone: r.outbid ? "bad" : "good", text: parts.join(" ") });
  }

  const label = (id: string) => (id === YOU ? "You" : id);

  return (
    <div className="card overflow-hidden">
      <div key={flashKey} className="flash space-y-1 p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-ink-mute">
            {listing.status === "upcoming" ? "Starting bid" : state.price === null ? "Starting bid" : "Current bid"}
          </p>
          {listing.status === "live" && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-live">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-live" /> Live
            </span>
          )}
        </div>
        <p className="font-mono text-4xl font-semibold">{usd(state.price ?? listing.startingBid)}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-dim">
          <span>
            {listing.status === "upcoming" ? "Bidding opens after the open house" : <>Ends in <b className="text-ink">{formatRemaining(state.endsAt - now)}</b></>}
          </span>
          <span>{new Set(state.history.map((h) => h.bidderId)).size} bidders</span>
          <span>
            {listing.reserve === null ? (
              <b className="text-accent">No reserve</b>
            ) : reserveMet(state) ? (
              <b className="text-live">Reserve met</b>
            ) : (
              "Reserve not met"
            )}
          </span>
        </div>
        {leading && open && (
          <p className="pt-2 text-sm font-semibold text-live">
            You&apos;re the high bidder · your max {usd(state.maxes[YOU])}
          </p>
        )}
      </div>

      <div className="space-y-4 border-t p-6">
        {result.outcome !== "open" && listing.status === "live" ? (
          <p className="font-semibold">
            {result.outcome === "sold"
              ? result.winnerId === YOU
                ? `You won at ${usd(result.price)}. Sign the purchase contract and wire earnest money to escrow within 48 hours.`
                : `Sold for ${usd(result.price)}.`
              : result.outcome === "reserve-not-met"
                ? "Auction ended below the reserve. The seller can counter the high bidder."
                : "Auction ended with no bids."}
          </p>
        ) : !verified ? (
          <VerifySteps listing={listing} verify={verify} setVerify={setVerify} />
        ) : listing.status === "upcoming" ? (
          <p className="text-sm text-ink-dim">
            You&apos;re verified up to <b className="text-ink">{usd(verify.funds!)}</b>. We&apos;ll notify you the moment bidding opens.
          </p>
        ) : (
          <>
            <p className="text-sm text-ink-dim">
              Verified up to <b className="text-ink">{usd(verify.funds!)}</b>. Enter the most you&apos;d pay — we only bid as much as needed.
            </p>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center rounded-xl border bg-surface px-3 focus-within:border-ink">
                <span className="text-ink-mute">$</span>
                <input
                  inputMode="numeric"
                  value={Number(amount || 0).toLocaleString("en-US")}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full bg-transparent px-1 py-3 font-mono text-lg outline-none"
                  aria-label="Your maximum bid"
                />
              </div>
              <button
                onClick={() => submit(Number(amount))}
                className="rounded-xl bg-accent px-5 font-semibold text-white hover:bg-accent-deep"
              >
                Place max bid
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {[min, min + increment(min) * 2, min + increment(min) * 4].map((v) => (
                <button key={v} onClick={() => setAmount(String(v))} className="rounded-full border px-3 py-1 font-mono hover:border-ink">
                  {usd(v)}
                </button>
              ))}
            </div>
            {buyNowAvailable(state) && (
              <button
                onClick={() => submit(listing.buyNow!)}
                className="w-full rounded-xl border-2 border-ink py-3 font-semibold hover:bg-ink hover:text-white"
              >
                Buy it now for {usd(listing.buyNow!)}
              </button>
            )}
          </>
        )}
        {message && (
          <p
            className={`rounded-xl p-3 text-sm ${
              message.tone === "good" ? "bg-live/10 text-live" : message.tone === "bad" ? "bg-accent/10 text-accent-deep" : "bg-surface-2"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>

      {state.history.length > 0 && (
        <div className="border-t p-6">
          <p className="mb-2 text-xs uppercase tracking-wide text-ink-mute">Bid history</p>
          <ul className="space-y-1.5 text-sm">
            {[...state.history].reverse().slice(0, 8).map((h, i) => (
              <li key={i} className="flex justify-between">
                <span className={h.bidderId === YOU ? "font-semibold" : "text-ink-dim"}>
                  {label(h.bidderId)}
                  {h.auto && <span className="ml-1.5 rounded bg-surface-2 px-1.5 text-xs text-ink-mute">auto</span>}
                </span>
                <span className="font-mono">{usd(h.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function VerifySteps({
  listing,
  verify,
  setVerify,
}: {
  listing: Listing;
  verify: Verification;
  setVerify: (v: Verification) => void;
}) {
  const options = [0.9, 1.1, 1.3].map((m) => Math.round((listing.estimate * m) / 5_000) * 5_000);
  const step = "flex items-start gap-3 rounded-xl border p-3";
  const done = <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-live text-xs text-white">✓</span>;
  return (
    <div className="space-y-2">
      <p className="font-semibold">Get verified to bid — about 4 minutes</p>
      <div className={step}>
        {verify.id ? done : <span className="mt-0.5 h-5 w-5 rounded-full border-2" />}
        <div className="flex-1 text-sm">
          <p className="font-medium">Verify your identity</p>
          <p className="text-ink-dim">Photo ID + selfie. Stops fake and shill bidders.</p>
          {!verify.id && (
            <button onClick={() => setVerify({ ...verify, id: true })} className="mt-2 rounded-full bg-ink px-3 py-1 text-white">
              Scan ID
            </button>
          )}
        </div>
      </div>
      <div className={step}>
        {verify.funds !== null ? done : <span className="mt-0.5 h-5 w-5 rounded-full border-2" />}
        <div className="flex-1 text-sm">
          <p className="font-medium">Prove your buying power</p>
          <p className="text-ink-dim">Upload a lender pre-approval or link a bank account. This caps your max bid.</p>
          {verify.id && verify.funds === null && (
            <div className="mt-2 flex flex-wrap gap-2">
              {options.map((o) => (
                <button key={o} onClick={() => setVerify({ ...verify, funds: o })} className="rounded-full border px-3 py-1 font-mono hover:border-ink">
                  {usd(o)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={step}>
        {verify.deposit ? done : <span className="mt-0.5 h-5 w-5 rounded-full border-2" />}
        <div className="flex-1 text-sm">
          <p className="font-medium">$2,500 refundable bid deposit</p>
          <p className="text-ink-dim">
            A hold, not a charge. Released when you lose; applied to earnest money if you win. Kept only if a winner walks away.
          </p>
          {verify.funds !== null && !verify.deposit && (
            <button onClick={() => setVerify({ ...verify, deposit: true })} className="mt-2 rounded-full bg-ink px-3 py-1 text-white">
              Authorize hold
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
