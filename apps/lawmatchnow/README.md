# LawMatchNow (rebuild)

A server-rendered Next.js rebuild of lawmatchnow.com: an attorney directory
and legal library in the mold of FindLaw, Lawyers.com and USAttorneys.com.

## Why Next.js and not WordPress

- **Every page is full HTML on arrival.** The old site was a client-side
  React app: crawlers got an empty `<div id="root">`. Google can render JS
  slowly; most AI crawlers (ChatGPT, Claude, Perplexity) can't. Here every
  listing, guide and FAQ is in the HTML.
- **Directories are programmatic.** States × cities × practice areas ×
  attorneys is thousands of pages generated from data, which is what Next.js
  does natively. In WordPress that means a stack of directory plugins,
  slower pages and more to patch.
- **Same stack as SaySites**, and hosted the same way: SiteGround Node.js
  hosting, deployed from the `lawmatchnow-host` branch.

## Features

| | |
|---|---|
| Search | Practice area + city/state search (`/find-a-lawyer`), works without JS |
| Browse | 45 practice areas, 50 states + DC, 54 city hubs, city × practice pages |
| Profiles | `/attorney/[slug]` with contact form, facts, claim notice, `Attorney` schema |
| Free case review | 3-step form at `/get-started` |
| Learn | 16 practice-area guides, 10 legal guides, 40 Q&As, 70-term dictionary, emergency steps, blog |
| Attorneys | `/for-attorneys`: plans and a profile claim form |
| SEO / AEO | Breadcrumb, FAQPage, Article, HowTo, DefinedTermSet, Organization, WebSite schema; answer boxes; sitemap; `llms.txt`; robots.txt that welcomes AI search bots; noindex on thin and filtered pages; 301s for old URLs |

## Data

Listings and blog posts are read from the existing PocketBase API
(`lib/directory.ts`), cached for an hour. Admin, imports and claims stay
in PocketBase.

Two deliberate filters:

- Records with `555-` phone numbers (about 65,000 of 65,660 at launch) are
  hidden. They are placeholder data. Showing them risks Google's spam
  policies and sends real people to fake contacts.
- `rating` / `reviews_count` aren't shown. Nothing records where they came
  from. Collect real reviews first.

## Environment

| Variable | Purpose |
|---|---|
| `LMN_API_URL` | PocketBase base URL (default `https://lawmatchnow.com`). See launch notes. |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, default `https://lawmatchnow.com` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Shown on contact pages |
| `LEAD_WEBHOOK_URL` | Where form submissions are POSTed as JSON (Zapier, CRM…) |
| `RESEND_API_KEY`, `LEAD_EMAIL_TO`, `LEAD_EMAIL_FROM` | Email delivery of submissions |
| `SHOW_PLACEHOLDER_LISTINGS=1` | Local testing only |
| `SHOW_UNVERIFIED_RATINGS=1` | Only once ratings are real |

If no lead delivery is configured, forms show an error rather than pretend
to succeed.

## Launch notes

1. **Move the API.** The current SiteGround host serves an anti-bot page to
   server requests (Node's fetch gets HTTP 202 HTML), so this site can't
   read the directory from it. Put PocketBase on its own subdomain
   (e.g. `api.lawmatchnow.com`) with the anti-bot check off for `/api/`,
   or allowlist the new host, then set `LMN_API_URL`.
2. Point `lawmatchnow.com` at this app. Old URLs keep working or 301
   (`next.config.ts`).
3. Set a lead delivery variable and send a test case review.
4. Set `/for-attorneys` prices in `PLANS` when they're decided.
5. Have a lawyer review `/privacy`, `/terms` and `/disclaimer`.

## Hosting (SiteGround, like SaySites)

SiteGround's Node.js hosting builds from the top of a branch, so
`.github/workflows/lawmatchnow-host.yml` copies `apps/lawmatchnow` to the
`lawmatchnow-host` branch on every merge to main. Builds use webpack, one
CPU and no worker threads to fit shared hosting; types are checked in CI.
`lib/prune-releases.ts` deletes old SiteGround release folders on start so
they don't eat the plan's file (inode) limit. Settings in Site Tools:
Node 22, install `npm install`, build `npm run build`, start `npm start`.

## Develop

```bash
pnpm install
pnpm dev
```
