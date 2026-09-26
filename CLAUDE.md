# SaySites: rules for anyone building here

Read `README.md` first. Two rules there are non-negotiable:

1. **Search guidelines.** Every site follows Google Search Essentials and
   Google's spam policies. Win on merit, never with tricks.
   The list lives in `lib/guidelines.ts`: when Google changes a guideline,
   update that entry, its check and `GUIDELINES_REVIEWED` together (review
   quarterly and at every core or spam update). Never promise rankings.
2. **Pricing rule.** Free when it costs us nothing; charge when it costs us
   money (AI tokens, paid APIs such as SerpApi, any metered service), priced
   above cost. Build everything to spend as little as possible: plain code
   first, AI only where it's genuinely needed, cached and rate-limited.

Also:
- Every page must pass the 95+ speed check before it can go live.
- Design: calm colours (nothing bright), no bold-plus-cursive font pairings,
  nothing that looks AI-built.
- Sofie never invents facts, reviews, results or credentials.
- Photos: a photo appears once per site unless the owner asks for it again,
  and a stock photo belongs to one customer's site (`lib/photo-rules.ts`,
  table `ss_photos`). Owners' own uploads are exempt.

## Money check (the owner asked for this, permanently)

Before building anything new, ask: will this help get or keep paying
customers soon? If not, say so plainly and point back to what does:
- Selling first: law firms (the owner's network), using the free redesign
  preview as the pitch. Goal: 10 paying firms, then trades.
- Proof: track those firms' rankings for 60–90 days and turn real results
  into case studies.
- Reliability of what exists beats new features.
Nice-to-haves (games, extra styles, clever extras) wait until customers ask.

## Talking to the owner

When the owner has to do something on another site (Vercel, Unsplash, a
registrar), give numbered steps, one click per step, with the direct link.
If they ask again, make the steps even simpler and ask for a screenshot.

## North star (the owner's goal, permanent)

Every customer should feel "damn, I built this whole website myself," and
their site should bring them at least one phone call a month (the exact
number is still to be decided). Build and write everything toward that.

- **The owner is in control.** SaySites and Sofie are their tools, not an AI
  that does it for them. Copy says "you build / you change / your site",
  never "AI builds it for you". Show what the owner did and what it earned
  them (calls, messages, visitors, rankings). Saying the site "builds itself
  as you type" is fine, because it does; the owner still describes it, picks
  the look and makes every change.
- **Permanent tagline: "Your site. Your say."**
- Say "SEO fully optimized", not "Google-ready".
- Nothing that looks AI-built, on SaySites or on any customer site, ever:
  no "early access" / "beta" / "free while we build" pills with a glowing
  dot, no "Live" or "New" tag stamped on every card, no sparkle icons, no
  gradient text. Tags only where they carry real information (a plan
  label, an unread count). Pricing copy says "7-day free trial".
- Brand colours: black, white and the calm neutrals already in the app.
  The logo mark follows the text colour (white on dark, black on light).
  The owner tried a blue and an orange accent and said no; don't add one.
- Dog photos in SaySites' own product and marketing (demos, ads, posts):
  only ever the founder's French bulldog, Buju. His photos are in
  `public/birthday/buju-*.jpg`. Never stock dogs. (Customers' own sites
  pick their own photos as usual.)
- Never mention the founder's name in the product or marketing. Only the
  birthday page speaks in the first person about the founder's years of
  experience with websites and search.

## Pricing (decided September 2026)

- **Site $15/month or $150/year; Store $25/month or $250/year** (yearly is
  two months free). 7-day free trial, 0% of sales, always. Prices live in
  `PRICES` (lib/billing.ts); each plan/interval is its own Stripe price
  (`STRIPE_PRICE_ID`, `STRIPE_PRICE_SITE_YEARLY`, `STRIPE_PRICE_STORE`,
  `STRIPE_PRICE_STORE_YEARLY`).
- **Sofie is the only real cost**, so paying accounts get a monthly AI
  allowance per site (lib/usage.ts): Site $5, Store $8 of model cost. Even
  fully used, Site keeps ~$8.75 of $15 after Stripe and hosting. Trial
  accounts keep the $10 lifetime cap. When the allowance runs out, Sofie
  pauses until the 1st; owners can still edit everything by hand.
- Selling online (products) is the Store plan after the trial (`canSell`).
- Never advertise a feature that isn't built (the SEO Suite is "Coming
  soon"). Competitor prices on the homepage must come from their own
  pricing pages, with the date checked and sources linked; re-check them
  quarterly.

## Owner's ideas, planned (September 2026)

- **Varied layouts, never "hero + 3 cards" everywhere.** Starter sites now
  mix alternating numbered rows (editorial), a photo mosaic (warm,
  upscale), a full-width photo band, and a "How it works" strip (bold).
  Sofie's prompt says the same. Keep adding compositions, not colours.
- **Connect Google, Instagram, Facebook** (homepage says "Coming soon"):
  Google Business Profile reviews appear as testimonials (the real words,
  never edited); Instagram/Facebook photos become the gallery; Facebook
  hours and details stay in sync. Needs a Google Business Profile API
  approval and a Meta app review, owner-authorized with OAuth. Nothing is
  ever posted to their accounts.
- **Kids mode** (/kids preview, noindex, not linked): parent-owned account,
  parent approves before anything goes live, first names only, no photos
  of the child, messages go to the parent, hidden from search, a kind
  Sofie. Don't advertise it ("so easy kids can make one") until it exists.

