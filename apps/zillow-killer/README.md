# Zillow Killer — Gavel Homes

eBay for houses: owners list for a flat fee, buyers tour on their own and bid live with verified buying power. No listing agent, no 6%.

- **[`PLAN.md`](./PLAN.md)**: the full plan (Palm Beach County launch).
- **[`PARTNER_PLAN.md`](./PARTNER_PLAN.md)**: the plan for our founding broker.
- **[`INVESTOR_PLAN.md`](./INVESTOR_PLAN.md)**: the investor brief.
- **[`demo/gavel-demo.html`](./demo/gavel-demo.html)**: a self-contained walkthrough of the whole project (seller → broker approval → buyer → live auction → closing), plus the broker console. Open it in any browser.
- This folder is also a clickable prototype (Next.js 16 + Tailwind 4).

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # bid engine tests (node --test)
pnpm build
```

Try it: open a live listing → **Scan ID → pick a buying power → Authorize hold → Place max bid**. After about 5 seconds a rival bidder answers, which shows proxy bidding and the outbid alert.

| Path | What |
|---|---|
| `lib/auction.ts` | Production bid engine: proxy bids, increments, buying-power cap, shill block, soft close, hidden reserve, Buy Now, settlement + backup bidder |
| `lib/listings.ts` | Fictional Palm Beach County sample listings |
| `app/homes/[id]` | Listing page: 3D, floor plan, livestream, data room, self-tour, live bid panel |
| `app/sell` | Pricing tiers, listing wizard, net sheet |
