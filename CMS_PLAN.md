# The CMS — Plan and Timeline

**Date:** 2026-09-24
**Status:** Draft for discussion. Nothing here is built yet.
**Working name:** "the CMS" (a name is decision D1 below).

---

## What we are building

A hosted website builder for small businesses that:

1. **Is as easy as WordPress** to edit, without plugins, updates or hosting to manage.
2. **Beats Shopify on SEO and design.** Every site is fast, semantic and schema-rich by
   default, and themes are design systems rather than locked templates.
3. **Costs less than Shopify** for people who only need a great site that ranks.
4. **Sets itself up.** The owner signs in with Google. We import their Google Business
   Profile, connect Search Console and Analytics, and AI builds the site, theme and first
   content for them.
5. **Has RankForge's SEO tools built in.** Recommendations, the Operator's auto-fixes, rank
   tracking, AI citations, backlinks, competitors and content plans all run on the CMS's
   own pages. Today they reach sites only through the WordPress connector.

The unfair advantage is point 5. Wix, Squarespace and Shopify bolt SEO on as a checklist.
We already have a real SEO engine, and in our own CMS it can **write the fix directly**
instead of going through WordPress.

---

## Core design decisions (recommended)

### 1. Pages are structured data, not code

Every page is a tree of **blocks** (Hero, Services grid, Reviews, FAQ, Map, Contact
form, Rich text, …) stored as JSON and validated with `zod`. Themes and AI never write
HTML or CSS. They produce JSON that must pass a schema.

This one decision makes three things possible:
- **AI design is safe.** The AI can only output valid blocks and tokens, so it can't break a site.
- **SEO is guaranteed.** Each block renders the right semantic HTML and schema.org markup,
  so an owner can't produce a page with no H1 or broken structured data.
- **SEO fixes are exact.** The Operator changes one field in one block and can verify and
  roll back that change, which is the same model as `wp-execution.ts` today.

### 2. Themes are design tokens plus section variants

A theme is colors, type scale, fonts, spacing, radius and shadows, plus a few layout
variants for each block (Hero: split, centered, full-bleed, …). This is how we beat
Shopify on design. The AI, or the owner, can restyle a whole site by changing tokens,
and every combination still looks deliberate.

### 3. One multi-tenant renderer serves every customer site

- An **editor/admin** that lives in the RankForge app. It reuses the existing auth,
  orgs, teams, projects, billing and scheduler. A CMS site *is* a project.
- A **public renderer**, a separate lean Next.js deployment that looks up the site by
  hostname and serves pages with React Server Components, static caching and on-demand
  revalidation. It ships no client JavaScript by default, which keeps Core Web Vitals
  green for every customer.
- **Custom domains and SSL** go through the host's domains API (the Vercel for
  Platforms pattern). Keep hosting behind one interface so we can move to cheaper
  hosting later if cost per site demands it.
- **Postgres** is the store: sites, pages (JSONB block trees), revisions, media,
  redirects, themes. It uses the existing migration system (`lib/foundation/migrations`).
- **Media** lives in object storage (Vercel Blob or S3/R2), resized to AVIF/WebP on upload.

### 4. SEO by construction, not by plugin

Built in from day one, with nothing for the owner to configure:
- Titles, meta descriptions, canonicals and Open Graph, with AI-drafted defaults.
- `sitemap.xml`, `robots.txt`, and a 301 redirect created automatically on every slug change.
- schema.org generated from real data: `LocalBusiness` from the Google Business Profile,
  plus `FAQPage`, `Service`, `BreadcrumbList`, `Article` and `Review`.
- Image alt text (AI-drafted), lazy loading, responsive sizes.
- A performance budget enforced at render time.
- `llms.txt` and clean semantic content for AI search. This ties into the AI citations
  work we already have.

### 5. The existing SEO engine plugs in through a CMS adapter

The Operator already has a deploy → verify → rollback pipeline for WordPress. We add a
**CMS execution adapter** with the same interface, which writes to our own page store
instead of the WP REST API. Everything upstream (recommendations, fixgen, safety,
policy, learning) keeps working unchanged. See Phase 4.

---

## Google auto-connect: what's possible and what needs approval

| Connection | Status today | What the CMS needs | Blocker to start early |
|---|---|---|---|
| Search Console | OAuth, read-only (`webmasters.readonly`) | **Auto-verify** the site (we control the HTML and DNS) and auto-submit the sitemap | Site Verification API scope; Google OAuth app verification for the new scopes |
| Analytics 4 | OAuth, read-only (`analytics.readonly`) | **Create** the GA4 property and data stream, then inject the tag automatically | `analytics.edit` scope; OAuth verification |
| Business Profile | Not built | Import name, address, hours, categories, photos, reviews; keep them in sync | **Google must approve API access** (application form, can take weeks). Apply in Phase 0. |

OAuth verification and GBP API approval are outside our control and take calendar
time, so both applications go in during Phase 0.

---

## Timeline

Assumes one developer working with Claude at close to full-time. At part-time, roughly
double every estimate. Each phase ends with something usable.

### Phase 0: Foundations and decisions (weeks 1–3)
- Settle the open decisions below.
- **Apply for Google Business Profile API access** and start OAuth verification for the new scopes.
- Clean up the repo per `ARCHITECTURE_REALITY.md`: archive the orphaned template code so
  the CMS isn't built next to dead code.
- Write the specs: content model (site, page, block, revision, media, redirect), block
  schema v1, theme token schema v1.
- Set up the renderer deployment skeleton: hostname → site lookup → "hello" page.

**Done when:** a test site loads on a subdomain from a row in Postgres.

### Phase 1: Core CMS MVP (months 1–3)
- Sites, pages, draft/publish, revision history, restore.
- About 15 core blocks with semantic HTML and schema.org output.
- A **simple editor**: a sidebar form for each block, a live preview, and reorder,
  add and remove blocks. This is not drag-and-drop yet.
- Media library with upload, resizing and alt text.
- Navigation menus, header and footer.
- All of the "SEO by construction" list above.
- **Dogfood:** move the RankForge marketing site onto the CMS.

**Done when:** we can build and publish a real 5-page business site without touching code.

### Phase 2: Themes and the visual editor (months 3–5)
- The theme token system, 4–6 starter themes, and section variants for each block.
- Visual editing: click-to-edit text on the preview, drag to reorder, and mobile,
  tablet and desktop preview.
- Custom domains with automatic SSL; subdomains for free or trial sites.
- Forms, with leads stored and emailed. Reuse the existing `leads` and widget code.
- Blog: posts, categories, authors, RSS.

**Done when:** a non-technical tester can restyle and edit a site with no help.

### Phase 3: AI setup and Google auto-connect (months 5–7)
- **Onboarding wizard:** sign in with Google → pick the business → import the GBP →
  answer 3–5 questions (services, area, tone).
- **AI site generation:** a page plan from services and locations plus keyword research
  (`lib/engine/keywords.ts`, `serp.ts`), then page block trees and copy.
- **AI theme generation:** tokens from the logo and photos, or from a described vibe.
- Auto-verify Search Console and submit the sitemap; auto-create GA4 and inject the tag.
- An AI assistant in the editor ("make this section more premium", "add an FAQ from my
  reviews"). Its output is always schema-validated blocks.

**Done when:** a new business goes from sign-up to a live, connected, indexed site in
under 10 minutes.

### Phase 4: The SEO tools come home (months 7–9)
- **CMS execution adapter** for the Operator: recommendations apply directly to pages,
  with verification and rollback.
- An SEO panel inside the editor for each page: real Search Console and GA4 numbers, the
  open recommendations, and a one-click fix for each.
- Rank tracking, AI citations, backlinks and competitor monitoring run automatically for
  every CMS site through the existing scheduler.
- Content plan → AI draft posts (`lib/foundation/content/*`), with internal links
  inserted automatically (`link-plan.ts`).
- Fold `seo-intel`'s stronger crawler and extractor in, as `ARCHITECTURE_REALITY.md`
  already recommends.

**Done when:** a site improves its own rankings from recommendations the owner approves
with one click.

### Phase 5: Billing, hardening and private beta (months 9–11)
- Stripe plans and limits (the billing code exists), with metered AI usage.
- Security review, per-site backups, uptime monitoring.
- **Abuse handling.** Hosting other people's sites brings phishing, spam and illegal
  content. We need reporting, takedown and screening of new sites.
- Help docs, onboarding emails, support inbox.
- **Private beta with 10–20 real local businesses.**

**Done when:** beta customers pay, and none of them need us to fix their site by hand.

### Phase 6: Public launch and growth (month 12 onward)
- **WordPress importer.** Our WordPress connector already reads WP sites, so migrating
  WP users becomes our acquisition channel.
- Booking and appointments, simple selling (Stripe Checkout for a handful of
  products or services), multi-location, multi-language.
- Agency plan with white-label, client sites and reports.
- A theme marketplace.

---

## Pricing direction (to be validated)

The competitor prices below are from memory and need checking before launch. Shopify's
Basic plan is roughly $29–39/month, and Wix and Squarespace entry plans are roughly
$16–25/month.

| Plan | Target price | Includes |
|---|---|---|
| Starter | ~$12–15/mo | 1 site, custom domain, AI setup, Google auto-connect, all built-in SEO |
| Growth | ~$29/mo | Adds recommendations, Operator one-click fixes, rank tracking, AI content credits |
| Agency | ~$79+/mo | Multiple sites, white-label, client reports |

**Unit economics to measure in Phase 1:** hosting cost per site per month, and AI cost
per site setup (likely a few dollars, paid once). Starter must stay profitable with AI
usage capped.

---

## Open decisions (to discuss)

- **D1. Name and brand.** Is the CMS part of RankForge, or its own brand with RankForge
  inside it?
- **D2. Selling products.** "Cheaper than Shopify" invites commerce comparisons. Full
  e-commerce (inventory, shipping, tax) is a second product in its own right.
  *Recommendation:* no store in v1. Add simple payments in Phase 6, then reassess.
- **D3. Who it's for first.** Local service businesses (plumbers, dentists, salons) fit
  the GBP-first setup best. *Recommendation:* start there.
- **D4. Editor style.** Section-based editing (like Squarespace) or freeform
  drag-anywhere (like Wix)? *Recommendation:* sections, which are easier and harder to
  make ugly.
- **D5. Focus.** The repo also has Citation Gap, Reloop and North Star HQ. The CMS is a
  year-long build and needs to be the main thing.
- **D6. Hosting provider** at scale: Vercel to start, reassessed on cost per site in Phase 5.

---

## Biggest risks

1. **The editor.** It's where most of the time and bugs go. Build on a proven library
   (Tiptap for rich text, dnd-kit for dragging) and never write one from scratch.
2. **Google approvals** (GBP API, OAuth verification) delay the headline feature, so
   start them first.
3. **Hosting and AI cost per site** at a low price point. Measure early.
4. **Abuse** on hosted sites. Plan for it before public sign-up.
5. **Scope creep.** Every phase has a "done when" line. Don't start the next phase until it's met.

---

## Next two weeks (concrete)

1. Decide D1–D4 together.
2. Submit the Google Business Profile API access request.
3. Write `lib/cms/schema/` with zod schemas for Site, Page, Block (first 5 blocks),
   ThemeTokens and Redirect, plus unit tests.
4. Add migration `013_cms_core.sql` for the sites, pages, page_revisions, media and redirects tables.
5. Build the renderer skeleton: hostname → site → render a page from its block tree.
