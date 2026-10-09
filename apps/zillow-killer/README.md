# Zillow Killer — Gavel Homes

eBay for houses: owners list for a flat fee, buyers tour on their own and bid live with verified buying power. No listing agent, no 6%.

- **The full business plan is in [`PLAN.md`](./PLAN.md)**: thesis, product, auction rules, legal/licensing, go-to-market, unit economics, tech, roadmap, team, budget, and a launch checklist.
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
| `lib/listings.ts` | Fictional Tampa Bay sample listings |
| `app/homes/[id]` | Listing page: 3D, floor plan, livestream, data room, self-tour, live bid panel |
| `app/sell` | Pricing tiers, listing wizard, net sheet |
