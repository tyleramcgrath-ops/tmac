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
- **City reports** (/reports, /reports/<slug>): drafted automatically once a
  campaign has `REPORT_MIN_SITES` measured homepages; the team publishes.
  SaySites' own name, aggregate numbers, and by name only the lightest ten
  sites (good news people share). Never a list of who did worst; anyone can
  ask to be removed. These are the "content" the owner wants instead of
  thin city SEO pages, so keep each one real and measured.
