# Reloop

The pricing & distribution layer for secondhand fashion — not another resale
marketplace. Reloop cross-lists a seller's item to every major resale
platform at once, prices it against real cross-platform sold-comp data, and
wraps every purchase in portable SafeBuy escrow — regardless of which
underlying marketplace the item actually lives on.

This is a prototype: the UI and interaction flows are fully functional, but
pricing data, listings, and marketplace connections are seeded/sample data
rather than live integrations. See `lib/sample-data.ts` for what's mocked.

## Product pillars

- **`/cross-list`** — upload once, review the AI-drafted listing, publish to
  every connected platform simultaneously.
- **`/price-intel`** — search an item, see sold-comp history, a suggested
  price range, sell-through velocity, and recent cross-platform sales.
- **`/safebuy`** — escrow timeline and stated buyer-protection policy that
  follows the buyer across platforms rather than being siloed per-app.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use `localhost`, not
`127.0.0.1` — the dev server blocks cross-origin dev-resource requests from
plain IP addresses by default.

## Design

Warm, editorial aesthetic: ivory/cream base, a single terracotta accent, soft
elevation instead of hard borders, Fraunces for display type, Manrope for
body copy, JetBrains Mono for data labels and pricing.
