# SaySites

Tell it about your business; it builds a clean, fast website that ranks. See
`CMS_PLAN.md` at the repo root for the product plan.

## Search guidelines (non-negotiable)

Every SaySites website must follow Google Search Essentials and Google's spam
policies. The product exists to win organic search on merit, as the better
alternative to paying for ads: fast pages, accurate business details, useful
content and real reviews. Nothing in SaySites (Sofie, the Visibility Score,
quests, the weekly standings) may reward or suggest keyword stuffing, hidden
text, doorway or near-duplicate location pages, fake or incentivized reviews,
link schemes or invented claims. When a feature could be gamed, it is scored
so the honest action is the one that earns points.

Keeping up with Google is part of the job, not a one-off. The guidelines are
tracked in `lib/guidelines.ts`, each with the check that enforces it. Review
them against Google's documentation every quarter and whenever Google
announces a core or spam update; when something changes, update the entry,
the check and `GUIDELINES_REVIEWED` together. Every site is rendered live by
the one platform, so the change reaches every site at once. Never promise
rankings: say sites follow the guidelines and keep up, not that they'll rank.

## Pricing rule (non-negotiable)

Free when it costs us nothing; charge when it costs us money.

- Anything SaySites does without paid services is free for the owner: the
  redesign preview, importing and moving a site, redirects, the review
  tools, the Visibility Score and standings. These are built without AI on
  purpose, so they cost only a few page reads.
- Anything that spends real money per use is charged, priced above its
  cost: Claude (AI) tokens, paid data such as SerpApi searches, and any
  other metered API. Examples: a done-for-you move where Sofie rewrites
  every imported page, Search Intelligence ($9/month), heavy Sofie use.
- Build every feature to spend as little as possible: deterministic code
  first, AI only where it is genuinely needed, cached where it can be, and
  limited so it can't be abused.
- The base plan stays low ($15/month, 0% of sales). The goal is volume.

One app, two jobs, split by host in `proxy.ts`:

- **saysites.com** (also www, the Vercel test address and localhost): the
  homepage, sign up / log in and the dashboard.
- **Customer websites** (`<name>.saysites.com`, `ss-<name>.vercel.app` for
  testing, `<name>.localhost` locally, or the customer's own domain): rewritten
  to `app/s-render/…`, where `lib/render.ts` turns each page's element tree
  into one lean HTML document. `/preview/<name>` shows any site from the main
  address.

```
lib/schema.ts   the content model (zod): element tree, styles, site, page, redirect
lib/render.ts   element tree → HTML + per-page CSS, no client JavaScript
lib/seo.ts      structured data, pre-publish checks, sitemap, robots, redirects
lib/speed.ts    static half of the 95+ mobile PageSpeed gate
lib/hosts.ts    host → main app or customer site
lib/sites.ts    host → site bundle (site, pages, redirects)
lib/serve.ts    path → page, sitemap, robots, redirect or 404
lib/store.ts    Postgres (DATABASE_URL) or in-memory "test mode"
lib/auth.ts     scrypt passwords, signed session cookie (SAYSITES_SECRET)
lib/starter.ts  a few facts about a business → a complete starter site
lib/sample.ts   the sample site: Rivertown Plumbing
app/            homepage, login, signup, dashboard, preview and s-render routes
```

Environment: `SAYSITES_SECRET` (32+ characters, required in production) and
`DATABASE_URL` (Postgres; without it the app runs in test mode and says so).

Tests live at the repo root: `pnpm vitest run tests/saysites.test.ts`.
