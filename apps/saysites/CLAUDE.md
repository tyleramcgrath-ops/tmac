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
  nothing that looks AI-built. Exception (the owner, October 8, 2026): trades
  use the contractor layout modelled on a site the owner built for an
  electrician (eec-fl.com: bright photo hero with a request bar on its edge,
  slanted photo panels, a "need help?" block, numbered service cards, a call
  band), Poppins headings, and may start in the bright "Electric" palette.
  Never copy that site; keep its structure and quality.
- **Every site different (the owner's rule, October 8, 2026).** No two
  customer sites may look alike, and never one template for everyone. New
  small-business home pages are assembled by `uniqueHome` (lib/starter.ts)
  from interchangeable parts chosen by a number from the business's name:
  the top of the page (inset photo frame with a frosted card, split, giant
  cover type, photo with a request bar, bento tiles, side fade), how
  services show (bento, numbered rows, photo cards, slanted panels, dark
  index, zigzag, numbered cards), the "why us" part, the closing call, the
  heading font (Poppins, Archivo, Sora, Syne, Bricolage, DM Serif,
  Newsreader, Fraunces), corner style, headline and lead photo. Cool,
  modern and premium from the first look, not just a colour change. When
  adding to it, add whole new compositions, and check a contact sheet of
  several businesses (two in the same trade and town must differ) before
  shipping. Reference sites the owner shares show the quality bar, never a
  layout to copy.
- Sofie never invents facts, reviews, results or credentials.
- Photos: a photo appears once per site unless the owner asks for it again,
  and a stock photo belongs to one customer's site (`lib/photo-rules.ts`,
  table `ss_photos`). Owners' own uploads are exempt.

## Positioning (October 6, 2026, the owner's decision)

SaySites is for **small businesses**, with **Sofie at the centre**: you say
anything, in your own words, and your site does it. That's the product and
the fun of it, and it's why the site is yours: you said what goes on it.
The homepage is back to the original self-serve look (dark photo hero, the
"say what you do" box posting to /signup?idea=, the editor mockup with
Sofie) with a "Meet Sofie" section of things owners say and what happens.
Every example there must map to a tool Sofie really has (lib/sofie.ts).
Lead with the lowest prices: the homepage and /pricing use the original
cards (`components/ClassicPlans.tsx`: Site, Store, and Law firms from the
Starter price) with the unnamed builder comparison from
`lib/builder-prices.ts`; /pricing then lists the law plans
(`PricingPlans only="law"`). Every other marketing page uses
`MarketingShell`: dark nav, dark `.page-hero`, and the closing say box
(`components/SayBox.tsx`; `closing={false}` on legal pages). Industry pages, the free redesign
and "Let's talk" (#talk on /) stay, but don't lead.

**Prices are public** and come only from `PRICES` (lib/billing.ts) through
`components/PricingPlans.tsx` or template strings; never type a dollar
amount in a marketing page (a test checks). Price comparisons stay
unnamed and aggregate ("the three best-known website builders, checked
September 2026"); never name or make claims about a competitor, and
re-check those prices quarterly before keeping the claim. /about (questions
to ask any website company) stays. /trades and the old /compare pages
redirect. Never promise a number of leads or rankings.

## Money check (the owner asked for this, permanently)

Before building anything new, ask: will this help get or keep paying
customers soon? If not, say so plainly and point back to what does:
- Selling first: small businesses signing up themselves, with Sofie as
  the pitch; law firms (the owner's network) through the law firm plans
  and the free redesign preview.
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
- **Law Firm Starter, $79/month or $790/year** (October 4, 2026): the
  complete law firm site without the paid lookups (Google positions, AI
  citations, Citation Gap stay on Law $299 and built-for-you $599, which
  `paidLookupsAllowed` checks), Sofie allowance $8. It's in `AUTO_PRICED`:
  without `STRIPE_PRICE_LAW_STARTER(_YEARLY)`, checkout finds or creates its
  Stripe price by lookup key (`ensurePrice`, `saysites_lawstarter_month`).
- Never advertise a feature that isn't built. Competitor prices on the homepage must come from their own
  pricing pages, with the date checked and sources linked; re-check them
  quarterly.

## Owner's ideas, planned (September 2026)

- **Varied layouts, never "hero + 3 cards" everywhere.** See "Every site
  different" above (uniqueHome). Sofie's prompt says the same. Keep adding
  compositions, not colours.
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

## Free redesign preview (October 2026, rebuilt October 22)

The owner wants firms to see their own site first, and said plainly: the
copy must look **identical** to their site, the redesign must look **better**
than it, and neither ships if it doesn't. A preview (`lib/redesign.ts`) has:
- **"Your site, as it is"** (`lib/classic.ts`): each page *exactly* as it
  looks, from their own markup and stylesheets (inlined, trimmed to the
  rules the page uses), with no scripts (stripped, and `CLASSIC_CSP` blocks
  any left), lazy photos and scroll-reveal content shown, links moved to the
  new addresses, and their forms posting to SaySites (`form=classic`, read
  by `classicFields` in lib/serve). Stored on the page as `page.classic`,
  served instead of the body; the body holds the SaySites design for when
  the owner switches that page over (Pages tab, or Sofie's
  `use_saysites_design`). Sofie edits a kept page's words with
  `replace_words` (text only, never code; phone changes update call links)
  and its Google title/description apply on top (`withSeo`).
- **Only exact copies are offered, and only once checked in a browser.**
  `jsOnly` and `scriptedCarousels` rule out what can't be copied without
  scripts (Wix, app shells, any slideshow or carousel with two or more
  slides, Themify, pagespeed-rewritten scripts, priority menus); if the home
  page or a menu page fails, `asIs` is false. Even then the copy isn't shown
  until `scripts/compare-preview.ts <their url> --preview <id>` (Chromium:
  the team's machine or Claude's cloud session) has scored it against their
  live site and recorded `asIsCheck` through `POST /api/redesign/<id>/check`
  (needs `PREVIEW_CHECK_TOKEN`, 24+ characters, on the host and where the
  check runs): both computer and phone at `COPY_PASS` (97%) or more.
  `offersCopy` is the rule; the preview page and claiming follow it. No
  token set means no copy is ever offered. Pop-ups on their site can fail a
  check; that errs on the side of not offering a copy, which is the point.
- **"A fresh redesign"** (`redesign`): their real details and words in one
  of the redesign's own hand-made designs (`lib/redesign-design.ts`). The
  owner's bar is "better than their site, not a generic template", so each
  page is raw designed HTML/CSS (no scripts), stored as
  `page.classic` with `design: true` (served like a kept page; Sofie changes
  its words with `replace_words`; `use_saysites_design` falls back to the
  `buildStarterSite` body built underneath). Three looks (`noir` dark with
  their photo full-bleed, `gazette` light editorial, `atelier` modern), two
  type pairings each and their brand colour calmed (`accentFor`), picked by
  their name, so firms differ. Built around what convinces on their own
  site, read by `lib/redesign-assets.ts` (`readAssets`): their banner and
  photos of their people first (named portraits need a sign it's a person:
  "Esq.", a middle initial, a role in the file name, a team page), their
  published results (largest first, always with the "past results"
  caution), English reviews with real names only (never the firm's own "we/our"
  copy from a quote box, and no name when a box holds several reviews), award badges (never
  stock photos), never photos with words baked in. Headlines are their H1
  in sentence case, never just their name; their own slogan ("Every Client.
  Every Day.", from their banner or title, never a review, announcement or
  call to action) is set large with the H1 small above it. Every page opens on a full, dark hero
  (`fullHero`; the owner found light heroes too plain): their banner edge to
  edge, a photo of them filling the right side, or with no photo a glow of
  their colour behind their initial, with grain, a scroll cue, the header over
  it and their results in it (glass cards, a line of figures, or a strip
  beneath). SEO on every designed page: their
  own questions as a home-page FAQ (`homeFaq`) with FAQPage data, the firm's
  LegalService data (area, hours, profiles, photo), Service + FAQPage data on
  service pages, share tags with their photo; fonts load after the content
  and every image is sized, so pages pass `checkSpeed` (the preview report
  now measures the designed page, not the starter one). A design's facts all come
  from their pages; designs are tuned by screenshotting them beside the
  real site (`compare-preview.ts`), never by guessing.
  The pages underneath come from SaySites' starter designs
  (`buildStarterSite`) filled with their real details and words. Services are the links under their menu's "Practice
  Areas"/"Services" heading (`menuTree`; without one, menu links that read
  like that business's services, `SERVICE_WORDS`), each written from its
  own page (`writtenFrom`: intro, their headings as sections, their
  questions as the FAQ); their about text, attorneys from their bio pages,
  their name as their address spells it (`businessName`), their town from
  their pages when the home page doesn't say (`placeFromText`), their
  headline. Every other page comes across with its words; old addresses
  redirect. Nothing invented. **Only offered with enough of their own
  substance** (`REDESIGN_NEEDS`: 3+ services, 2+ written from their pages,
  `freshReady`); otherwise SaySites' general wording would be most of it,
  which isn't better than their site. Outreach skips those prospects.
- **"Your site, rebuilt"** (the owner, October 28, 2026: "what happened to the
  option of having it redesigned or us rebuilding a better version"): the
  owner always gets a choice. Beside the redesign, every preview offers their
  pages in SaySites' own starter design (`rebuiltOf`: the redesign's pages
  without the hand-made layer, served at /redesign/<id>/rebuilt, claimed with
  `?v=rebuilt` or claim code suffix "r"). Same gate as the redesign
  (`offersFresh`). The preview page also links "Or have us build it for you".
- A preview showing neither says so and offers to build from their details.
  Previews made before this (no `asIs` field) rebuild themselves in place
  on their next view (`rebuildPreview`, same id and links).
- Claiming the copy copies their old host's photos and fonts to SaySites
  (`lib/classic-assets.ts`, `ss_media` kind 'asset', hidden from the photo
  library), since the old host goes away when the domain moves.
- Tune `lib/classic.ts` and `lib/redesign.ts` against real sites with
  `npx tsx scripts/compare-preview.ts <url>` (builds a preview locally and
  screenshots their site, the copy and the redesign), never by guessing.

## SEO tab, powered by RankForge (October 2026)

Every site's dashboard has an SEO tab (`app/dashboard/sites/[id]/seo`,
`lib/seo-intel.ts`) run by RankForge's engines, vendored into
`lib/rankforge` because SaySites deploys alone (`apps/saysites` only).
Refresh them with `scripts/sync-rankforge.sh`; never edit the copies.
- Free (costs nothing): the site audit (every published page rendered
  in-process, scored, ranked fixes with "Fix with Sofie") and competitor
  comparison (up to 3 sites, 12 pages each, SSRF-guarded crawler).
- Paid lookups, law firm plans only, once per item per day: Google
  positions (`SERPAPI_KEY`), Perplexity citations (`PERPLEXITY_API_KEY`),
  backlinks (`MAJESTIC_API_KEY`). Each is off until its key is set and
  shows only what the provider returned. State lives in `ss_seo`.
- It's part of every site, not a separate tool: the audit re-runs by itself
  when the site changed or is a week old (on opening Overview or SEO), the
  Overview SEO tile shows its score, and duplicate or too-short titles and
  duplicate descriptions are fixed in one click (`applySeoFix`, words taken
  only from the site itself). Pages our originality check holds back show
  that check's reason, not RankForge's generic "not indexable".
- The homepage's "SEO, built in" section (#seo) lists all of it, with a
  real audit of the Hale & Porter example site (computed once per server
  start). Keep its claims to what's built; tracking needs the keys above.

## Leads (October 2026)

The Messages tab became **Leads** (`app/dashboard/sites/[id]/leads`,
`lib/leads.ts`): a pipeline (New, Contacted, Booked, Won, Lost) with a page
per lead (call, text, email, notes, follow-up date, timeline), stats
(response time, win rate), a list view and a CSV export.
- Automations: an instant reply to each lead, an alert to the owner, a
  reminder when a lead is still New, an optional follow-up email. Sent by
  `lib/mail.ts` through a saysites.com mailbox on SiteGround (SMTP_USER,
  SMTP_PASS, optional SMTP_HOST/SMTP_PORT/MAIL_FROM); off until set. The
  scheduler runs every 10 minutes from `instrumentation.ts`. Leads that
  arrived before a site's pipeline existed are never emailed.
- Integrations (`lib/crm-sync.ts`), each with the CRM's own documented
  intake and a key the owner pastes: HubSpot (private app token),
  Salesforce (Web-to-Lead org ID), Pipedrive (API token), Clio Grow (Lead
  Inbox token), Zapier/Make (signed webhook, SSRF-guarded). Free for us, so
  free on every plan. Only show "synced" when the CRM said so.
- The default wording never promises anything to the lead.
- Where leads came from (`lib/lead-source.ts`): the visit beacon (never
  cached) reads the landing page's ad and campaign tags (gclid, fbclid,
  msclkid, utm_…) from its Referer and keeps them in one first-party cookie
  (`ss_src`, 90 days); the form handler stamps the lead with it. Untagged
  visits are "Search or direct", never guessed; owners tag their Google
  Business Profile link (`googleMapsLink`) to count Maps. Both privacy pages
  say so; keep them in step if this changes.
- Review requests: one email after a lead is marked Won (default 1 day),
  through the site's /review link; off without a review link.
- Monthly results email (`lib/report.ts`, page at /leads/report): on the 1st
  (first week, once per month), only real numbers, quiet months not sent.
- The homepage's "Leads, handled" section (#leads) lists it all. Its
  pipeline card is labelled an example; keep it that way (no real data).

## Hosting (moved October 2026)

saysites.com runs on SiteGround's Node.js hosting (GrowBig), not Vercel. It
deploys from the `saysites-host` branch, which `.github/workflows/
saysites-host.yml` keeps in sync with `apps/saysites` on main. Builds use
webpack (`next build --webpack`). SiteGround keeps every deploy in its own
folder; `lib/prune-releases.ts` deletes old ones on start, because they
pushed the plan over its inode (file count) limit.
SiteGround's own Builds History counts too and isn't cleared by the app:
when it fills, deploys fail and Site Tools locks until old builds are
deleted there. Admins can see what's using the limit, run the cleanup, send
a test email and see the scheduler's last runs at /dashboard/health
(`lib/hosting-health.ts`). Batch changes into fewer deploys.

## Intake questions and staff logins (October 2026)

- **Intake questions** (`lib/intake.ts`, Leads → Intake questions): the
  owner picks a question set per page with a request form (personal
  injury, estate planning, family, criminal, employment, business, new
  patient, med spa consult, home services). The form gets plain selects and
  date fields, all optional; `handleFormPost` keeps only answers that fit
  each question and appends them to the lead. Law sets ask the other
  party's name for a conflict check; medical sets ask nothing clinical.
  English sites only for now.
- **Staff logins** (`lib/team.ts`, Leads → Team, tables `ss_members`,
  `ss_invites`): the owner invites by email; the invite link
  (/invite/<code>) works once, for that address, through sign-up or log-in.
  Staff see only the Leads tab (pipeline, lead pages, report): they move,
  call, email, note, follow up and assign leads. Automations,
  integrations, intake, team, export, deleting leads and the rest of the
  site stay the owner's (`owned()` in leads/actions.ts). Every timeline
  entry records who made it (`stamp`).

## Citation Gap in the SEO tab (October 2026)

The SEO tab's "Beat the pages that rank" card runs Citation Gap
(apps/citation-gap) in-process: `lib/gap-scan.ts` drives its resumable scan
job with our own pages rendered as served, competitors through an
SSRF-guarded fetch (`fetchPublicHtml`), and its Google reader with
`SERPAPI_KEY`. No headless browser on our hosting, so scans use served HTML.
The engines are vendored into `lib/citation-gap` by
`scripts/sync-citation-gap.sh`; never edit the copies. Each scan is about
four Google searches, so it's a premium (law plan) feature, at most
`GAP_LIMITS.scans` per site and once a day each. "Fix with Sofie" asks
always tell Sofie to use only facts the owner has or gives (the engine asks
for numbers and claims; Sofie must never invent them). FAQ questions render
as headings inside `<summary>` so search and answer engines read them as
questions.
The homepage's "Citation Gap" section (#citation-gap) describes it; its
scan card is labelled an example (no real data). Keep it that way.

## Store (October 14, 2026, the owner's request: "model it on Shopify, but better")

The Store tab (`app/dashboard/sites/[id]/store`: Home, Orders, Products,
Discounts, Customers, Settings) replaced the old Products tab. Research
notes and the comparison: `marketing/store-research.md` at the repo root.
- **Money:** checkout runs on the owner's own Stripe account (Stripe
  Connect, Accounts v2, direct charges; `lib/checkout.ts`). The owner
  connects on Stripe's hosted form (`store/connect`); SaySites takes no
  application fee, ever: "0% of sales" is a promise. Stripe's own card fee
  is the only cost. Shops without Stripe connected fall back to the old
  per-product Stripe payment link or "Ask about this".
- **Catalog** lives in `Site.store` (lib/schema: options up to 3, 100
  variants, compare-at, cost, SKU, sections, draft/unlisted, no-shipping
  items). **Stock counts** live in `ss_stock` (not in the site JSON, so
  Sofie's draft can't overwrite them); **orders** in `ss_orders`, numbered
  #1001 on per site (`markOrderPaid`, exactly once).
- **Storefront** (`lib/shop-render.ts`, `lib/shop-serve.ts`): every product
  has its own page at /shop/<slug> with ProductGroup/Offer data (shipping
  and return policy included); the shop page carries an ItemList. Cart is
  one HttpOnly cookie and plain form posts; prices are always re-read from
  the shop. No client JavaScript, speed gate still applies. /returns is made
  from the owner's policy.
- **Orders** (`lib/orders.ts`): settled from the thank-you page or the
  Connect webhook (`/api/stripe/shop`, STRIPE_CONNECT_WEBHOOK_SECRET),
  whichever comes first. Emails: confirmation, owner alert (with low stock),
  shipped / ready for pickup / out for delivery, refund. Refunds go through
  the owner's Stripe and can restock.
- **Shipping:** flat rate with free-over threshold and express, pickup,
  local delivery by ZIP list (prefix*) with a minimum. Discounts: codes and
  automatic, percent / amount / free shipping, minimum, dates, use limit;
  one money-off plus free shipping can combine. Tax: optional Stripe Tax.
- **Numbers:** sales, orders, average order, profit (from costs),
  returning customers, best sellers, and a cookie-free funnel (product page
  views, #add, #checkout, paid), all from our own tables.
- **Sofie** adds and changes products (`save_product`, `remove_product`);
  `store` is otherwise locked for her. She never invents prices or stock.
- Abandoned checkouts are listed but never emailed (no marketing consent).
- To switch checkout on in production: STRIPE_SECRET_KEY (already set for
  billing), Connect enabled on the SaySites Stripe account, and a Connect
  webhook to https://saysites.com/api/stripe/shop for checkout.session.*
  events with its secret in STRIPE_CONNECT_WEBHOOK_SECRET.

### Amazon picks (October 22, 2026, the owner's request)

Products from Amazon in a SaySites shop (`lib/amazon.ts`, `lib/amazon-sync.ts`).
The owner pastes Amazon links (Store, Products, "Add from Amazon") or tells
Sofie (`add_amazon_products`); each becomes a product (`product.amazon`:
ASIN, marketplace, checkedAt) with a **Buy on Amazon** button carrying the
owner's own Associates tag, so they earn the commission.
- **Data only from Amazon's Creators API** (PA-API 5 was shut down in 2026):
  OAuth client credentials per region (NA 3.1 `api.amazon.com`, EU 3.2
  `api.amazon.co.uk`, FE 3.3 `api.amazon.co.jp`, scope `creatorsapi::default`),
  then `POST https://creatorsapi.amazon/catalog/v1/getItems` (10 ASINs per call,
  `x-marketplace` header). Never scrape Amazon pages. Short links are followed
  one hop (the redirect only).
- **Credentials** (Credential ID and Secret) live in `ss_amazon`
  (`store.amazonKeys`), never in the site JSON Sofie and the renderer read. The
  tag and marketplace are public, on `site.store.amazon`.
- **Amazon's rules:** a price shows only while under 24 hours old (else "See
  price on Amazon"); the scheduler refreshes picks every ~day
  (`refreshAllAmazon`, every 6 hours, items older than 20 hours); the
  disclosure "As an Amazon Associate, we earn from qualifying purchases" shows
  wherever picks do, and on /privacy; links are `rel="sponsored nofollow"`.
- **Never sold here:** picks can't go in the cart or checkout (`priceCart`,
  `handleCartPost`), have no stock, delivery or returns lines, and get no
  Product/Offer structured data (Amazon is the seller, not the business). The
  owner can change a pick's name, words, section, status and address; price
  and photos stay Amazon's (the product form and Sofie both enforce it).
- On the Store plan, like selling.

## Blog (October 2026)

saysites.com/blog (`lib/articles.ts`, `app/blog`): guides and news on
getting found in Google and AI answers, for law firms, medical practices
and local businesses. The launch articles live in code; the team writes and
edits at /dashboard/blog (admins only, table `ss_articles`), and a saved
article replaces a launch one with the same address, so posting needs no
deploy. Each article has key points first (answer-first, for readers and AI
answers), Article/NewsArticle and breadcrumb JSON-LD, a contents list, the
sitemap and an RSS feed (/blog/rss.xml). Writing rules: no invented numbers,
studies, quotes or results; link every outside fact to its source (Google's
own documentation where possible); never promise rankings or leads; never
name a competitor; never mention the founder's name (byline is "SaySites").
**Evergreen guides** (October 22, 2026; the owner asked for separate
sections on the industries we concentrate on): /guides and one hub per
subject (`lib/topics.ts`: law firms, medical & dental, med spas, home
services, online shops, local search, AI search). Each hub is an evergreen
guide (same writing rules), a checklist, FAQs (FAQPage markup), the
/websites-for pages it belongs to and every article on the subject
(`topicsOf` matches an article by its address and title; a test requires
every article to land in at least one hub). Articles show their hub in the
breadcrumb, a "Part of a guide" box and related reading from the same hub;
industry pages link to their hub. Pillar checklists (`lib/articles-pillars.ts`,
scheduled one a day from October 23) follow the daily-article rules. Article
bodies can use tables, `- [ ]` checklists and `> **Tip:**` / `**Note:**` /
`**Watch out:**` boxes (`renderBody`). Core pages carry structured data via
`components/JsonLd.tsx` (Organization, WebSite and SoftwareApplication on
the home page; plan offers from PRICES on /pricing; breadcrumbs and item
lists on hubs). Long article titles drop the "| SaySites" suffix so search
results show the words, not the brand.
**One article a day** (the owner's request, October 8, 2026): articles are
written a week ahead in `lib/articles-scheduled.ts`, each dated a day apart;
`publishedArticles` hides each until its day, so a week ships in one deploy.
A weekly routine writes the next week. Each one must be genuinely useful
on its own (Google warns against mass-produced pages), built only on sources
checked that day, with every claim about SaySites true of what's built.

## Owner analytics (October 2026)

/dashboard/analytics (admins only; `lib/analytics.ts`, `store.analytics`):
money (monthly revenue from list prices, yearly as a twelfth; trials,
failed payments, cancellations, plans), growth (signups, sites, own
domains, staff), our own leads (Let's talk requests, free redesigns, blog
articles), what customers' sites bring in (visitors, leads, call taps, top
sites) and costs (Sofie), each against the previous period, with daily
charts (`components/DayBars.tsx`, server-drawn SVG) and a table of every
day. Only recorded numbers; saysites.com visitors live in Google Analytics,
so the page links there.

## Law firm research (October 4, 2026)

We tested 105 top-ranking law firm websites (method, data and scripts:
`marketing/law-research/` at the repo root, outside the deployed app).
Aggregate numbers live in `lib/law-research.ts` and feed the law firms
page's "Measured, not claimed" table (#compared), the homepage proof note
and the blog article /blog/we-tested-top-ranking-law-firm-websites. Never
name a firm or vendor publicly with these numbers. From the findings, every
site now also describes each attorney card (Person) and each practice area
page (Service) in structured data, and nested pages carry one breadcrumb
trail (it was two). Review markup for a firm's own testimonials is left out
on purpose: Google treats it as self-serving for local businesses.

## Outreach, ownership and city reports (October 2026)

The owner's plan for getting the first customers: show businesses their own
site rebuilt, free to keep for a month. Admins run it at /dashboard/outreach
(`lib/outreach.ts`, `lib/prospects.ts`, tables `ss_campaigns`,
`ss_prospects`, `ss_reports`).
- **Find:** a trade and a city run a few Google searches (`SERPAPI_KEY`) and
  keep businesses' own websites (directories, social, .gov dropped), or the
  team pastes a list. Never pull Google Maps/Places data to build a list
  (Google's terms forbid it).
- **Build:** "Build the next 25" makes free redesign previews in the
  background (`after`), with the email from the business's own site. A site
  that asks not to get unsolicited email is marked `noEmail` and left out.
- **Email:** SaySites never sends these itself (an automatic sender was
  blocked in review; the owner decides that). The campaign's "Download the
  email list" CSV has each business's personal link (/r/<token>, counts
  opens), unsubscribe link (/unsubscribe/<token>, one click, never emailed
  again by address or website) and the wording (`outreachEmail`): it names
  SaySites, our postal address (`OUTREACH_ADDRESS`, CAN-SPAM) and the real
  price from `PRICES`. Send from a separate domain, slowly.
- **Claim:** a preview from outreach claims with a free first month
  (`withFreeMonth`, 30 days of trial, no card).
- **Ownership (every preview claim):** anyone can preview any website, so a
  claimed site has `ownership: { verified: false }` and `serve.ts` keeps it
  off the public web until the owner proves it (`lib/ownership.ts`): a link
  to an address at the business's own domain, pointing that domain at us
  (`checkDomain`), or the team's hand check on /dashboard/outreach (call the
  number on their own site first). Sofie can't change `ownership`. Google
  Business Profile sign-in is the planned fourth way, once Google approves
  API access.
- **Free homepage mockups** (the owner, October 15, 2026): a business asks
  on /mockup or replies "mockup" to an outreach email; requests list at
  /dashboard/mockups (admins, `lib/mockups.ts`, table `ss_mockups`, team
  emailed via SAYSITES_ADMIN_EMAILS). `npx tsx scripts/mockup.ts <url>
  --name --type --city --services` makes one picture: their homepage today
  next to one of our premium starter designs filled with their real name,
  phone, town and services, on a computer and a phone. Needs Chromium, so it
  runs on the team's machine or Claude's cloud session, never the host.
  Pass `--services` from their own site (menu names are often junk),
  `--phone` from their site (never a fax line, never a guess) and
  `--no-today` when their site sits behind a bot check (never bypass it).
  The owner wants these to look striking: `--palette noir --style
  classic|counsel` plus a `--hero <unsplash id>` that fits the work (a
  Florida pool home for real estate, a family on the beach for family law,
  columns or a law library for probate), on a dark, warm stage.
  It also writes a ~250 KB JPEG: email tools can't attach big files, so
  those go in `public/mockups/` under an unguessable name and the email
  shows `https://saysites.com/mockups/<name>.jpg` (kept out of search by
  robots.ts).
- **Daily prospects** (the owner, October 15, 2026): a routine finds 20
  businesses with weak sites a day (measured: no mobile viewport, no https,
  old copyright, heavy pages), uses only emails published on their own
  sites, and sends each personal email from the owner's Gmail with the
  owner on CC (the owner asked for sending, not drafts, the same day).
  Write emails as HTML with real links: the Gmail connector rewrites bare
  URLs in plain text into google.com redirect links. Emails name SaySites,
  the mailing address and a "reply no thanks" opt-out, which is honoured.
- **City reports** (/reports, /reports/<slug>): drafted automatically once a
  campaign has `REPORT_MIN_SITES` measured homepages; the team publishes.
  SaySites' own name, aggregate numbers, and by name only the lightest ten
  sites (good news people share). Never a list of who did worst; anyone can
  ask to be removed. These are the "content" the owner wants instead of
  thin city SEO pages, so keep each one real and measured.
