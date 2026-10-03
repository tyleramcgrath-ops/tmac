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

## Positioning (October 2026, the owner's decision)

SaySites presents itself like a website company for the industries that
compete hardest online: law firms first, then medical practices, med spas,
dental and home services. Law firms, medical practices and med spas share
three designs (lib/law-designs.ts: counsel, classic, modern) with their own
words per profession (VOCAB) and small print (FOOTER_NOTES). The public site
shows **no prices**: visitors "Let's talk" (form on / and /about, leads land
in the dashboard Feedback inbox marked "Let's talk") or get a free redesign.
Prices live only in the dashboard (account and billing). Why to switch from
an agency lives on /about only, written as questions to ask any website
company; never name or make claims about a competitor. /trades and the old
/compare pages redirect. Self-serve sign-up still works at /signup but isn't
promoted. The message is leads: every page is built to turn a
search into a call, a request or a booking, and owners see every message,
call tap and visit. Never promise a number of leads or rankings.

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
  early-access page (/early, formerly /birthday) and one small note on
  /about ("Where the SEO comes from") speak in the first person about the
  founder's years of experience with websites and search.

## Launch (reset September 29, 2026)

The birthday launch (September 28) was called off. Public launch is
**Tuesday, November 10, 2026** (`lib/launch.ts`), after a quiet early-access
test at /early (promo code EARLY) and the first paying law firms. /birthday
redirects to /early.

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
- **Built: personalities and finish** (October 2026). Heading fonts we host
  (Newsreader, Fraunces, Bricolage Grotesque; one per page, preloaded,
  font-display optional). Six personalities (`globals.flair`, lib/render.ts
  FLAIR_CSS): editorial, luxe, soft, bold, studio, clean, drawn from
  award-listed small-business sites; new sites get one that suits the
  business, picked from the address, so neighbours differ. CSS-only scroll
  motion (off with `globals.motion: false`, never for reduced-motion
  visitors), a services ticker under the hero. Settings has a Personality
  picker and a motion switch. Still no client JavaScript; mobile Lighthouse 100.
- **Connect Google, Instagram, Facebook** (homepage says "Coming soon"):
  Google Business Profile reviews appear as testimonials (the real words,
  never edited); Instagram/Facebook photos become the gallery; Facebook
  hours and details stay in sync. Needs a Google Business Profile API
  approval and a Meta app review, owner-authorized with OAuth. Nothing is
  ever posted to their accounts.
- **Built:** start a site from the owner's Google listing (Places API, off
  until `GOOGLE_PLACES_API_KEY` is set), a promotion bar and a Book online
  button (Promote tab, `lib/promote.ts`). In-page, never pop-ups.
- **Built:** an events list (Promote tab, `lib/events.ts`): upcoming events
  show on the home page and to Google as Events; past ones drop off.
- **Next ideas, not built:** Sofie drafting social posts, a chatbot (paid
  add-on, it costs tokens), Claude/ChatGPT connector.
- **Kids mode** (/kids preview, noindex; one "Also coming soon" line on the
  homepage links to it): parent-owned account,
  parent approves before anything goes live, first names only, no photos
  of the child, messages go to the parent, hidden from search, a kind
  Sofie. Don't advertise it ("so easy kids can make one") until it exists.

## Free redesign preview (October 2026)

The owner wants firms to see their own site first. A preview has two
versions: "Your site, as it is" (`lib/mirror.ts`: their sections, words,
photos, colours, menu, rebuilt section by section) and "A fresh redesign"
(`lib/restyle.ts`: the same pages and every word, in a clean modern
design). Both keep every page's address for SEO. The owner claims either.

## Hosting (moved October 2026)

saysites.com runs on SiteGround's Node.js hosting (GrowBig), not Vercel. It
deploys from the `saysites-host` branch, which `.github/workflows/
saysites-host.yml` keeps in sync with `apps/saysites` on main. Builds use
webpack (`next build --webpack`). SiteGround keeps every deploy in its own
folder; `lib/prune-releases.ts` deletes old ones on start, because they
pushed the plan over its inode (file count) limit.
