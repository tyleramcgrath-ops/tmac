# SaySites — Plan and Timeline

**Date:** 2026-09-24 (revised after first decisions)
**Status:** Draft. Nothing here is built yet.
**Name:** **SaySites**, its own brand (chosen 2026-09-24; domains not yet registered).

---

## The pitch

> **Tell it about your business. It builds a clean, fast website that ranks, and
> changes it whenever you ask. Cheaper than Shopify, and we take 0% of your sales.**

Who it's for: the simple business owner who wants a good-looking, modern site without
learning a builder, hiring a designer or understanding SEO.

What sells it, in order:
1. **Talk, don't build.** A friendly chat assistant with a name and face (like "Angie")
   is the main way to use the product. You tell it what your business is and what you
   want, and it builds the site. After that, "make the header darker", "add my new
   service", "put a sale banner up until Friday" and it's done, the way you work with
   Claude today.
2. **Always fast, always SEO-clean.** Every published page scores **95+ on mobile
   PageSpeed**, guaranteed. It's a publish gate, not a goal: a change that would drop a
   page below 95 is fixed or blocked before it goes live. Clean semantic code and schema
   come standard.
3. **A builder when you want to fine-tune.** An Elementor-style editor that's lighter
   and less clunky, for people (and designers) who want to drag things around themselves.
4. **Cheaper than Shopify, with 0% taken from your sales.**

Two people to win over: the WordPress/SEO person (clean code, real SEO tools) and the
Shopify/designer person (beautiful themes, easy store). The chat assistant serves both,
because nobody has to learn anything.

---

## What we are building

A hosted website **and online store** builder for small businesses that:

1. **Has Elementor-level design freedom** (drag-and-drop containers and widgets, per-device
   styling, a theme builder, popups, motion) without WordPress, plugins or hosting to manage.
2. **Sells products out of the box.** Store, cart and checkout are included; no plugin needed.
3. **Beats Shopify on SEO and design, and costs less.**
4. **Sets itself up.** The owner signs in with Google. We import their Google Business
   Profile, connect Search Console and Analytics, and AI builds the site, theme, first
   content and product pages.
5. **Offers the RankForge SEO tools as a paid monthly add-on.** Recommendations, the
   Operator's one-click fixes, rank tracking, AI citations, backlinks, competitors and
   content plans all run directly on the CMS's own pages.

The unfair advantage is point 5. Wix, Squarespace and Shopify bolt SEO on as a checklist.
We already have a real SEO engine, and in our own CMS it can **write the fix directly**
instead of going through WordPress.

---

## Decisions made

| # | Decision | Answer |
|---|---|---|
| D1 | Brand | **Own brand.** The SEO tools are a **paid monthly add-on** inside it. |
| D2 | Selling products | **Yes, out of the box** in v1. |
| D3 | First customers | **Local service businesses and small shops** (GBP-first setup). |
| D4 | Editor style | **Chat first**, with an Elementor-style builder (lighter, less clunky) for fine-tuning. |
| D5 | Platform fee on sales | **0% on every plan.** A headline selling point against Shopify. |
| D6 | Speed | **95+ mobile PageSpeed on every published page**, enforced at publish. |

---

## Core design decisions

### 1. Pages are an element tree stored as data, not code

Like Elementor, a page is **Containers** (flexbox or grid, nestable) that hold
**Widgets** (Heading, Text, Image, Button, Gallery, Form, Product grid, …). Every element
has **content settings** and **style settings**, and a style setting can differ per
device (desktop, tablet, mobile).

Unlike Elementor, the tree is stored as JSON validated with `zod`, and we render it
ourselves into lean HTML. That keeps what Elementor gets wrong out of our sites:
- **No DOM bloat.** Elementor pages are notorious for deep div nesting and heavy CSS/JS.
  We render the minimum HTML, generate only the CSS a page actually uses, and ship no
  client JavaScript unless a widget needs it (a slider, a popup, the cart).
- **AI design is safe.** The AI can only output valid elements, so it can't break a site.
- **SEO guard-rails.** One H1 per page, alt text required, a heading order that makes
  sense, and correct schema.org markup for each widget. The builder warns before publish.
- **SEO fixes are exact.** The Operator changes one field on one element and can verify
  and roll back the change, the same model as `wp-execution.ts` today.

### 1b. The chat assistant edits the same element tree

The assistant (like "Angie") is not a separate system. It is Claude with tools that
read and change the same element tree and global styles the builder uses:
`add_section`, `update_element`, `set_global_colors`, `create_page`, `add_product`,
and so on. That means:
- Every chat change shows up in the builder, and the reverse is also true.
- Every change is **previewed before it's applied** ("Here's the darker header, keep it?")
  and can be undone. Changes are saved as revisions.
- Every change passes the same schema validation and the **95+ speed gate**, so the AI
  can't publish something slow or broken.
- It can see the page (a screenshot of the preview), so "make that button bigger" works.
- Chat sits in a simple side panel next to a live preview of the site. Voice input comes
  later.

### 1c. The 95+ speed guarantee is enforced at publish

On every publish, the renderer builds the page and measures it: page weight, JS size,
image sizes, layout shift, and a Lighthouse run against the preview. If a page would
score under 95 on mobile, we fix what we can automatically (compress, resize, defer),
and otherwise show the owner, or the assistant, exactly what to change. Nothing goes
live below 95.

### 2. Global styles, then per-element overrides

Global colors, fonts, type scale, spacing and button styles (Elementor calls these
"Site Settings"). Elements use the globals by default, and the owner can override them
anywhere. The AI, or the owner, restyles a whole site by changing the globals. A theme
is a set of globals plus templates.

### 3. One multi-tenant platform

- An **editor/admin** app: the builder, store admin, settings and the SEO add-on. It
  reuses RankForge's foundation code (auth, orgs, teams, billing, scheduler, Google
  OAuth) but carries the new brand.
- A **public renderer**, a separate lean Next.js deployment that looks up the site by
  hostname and serves pages with React Server Components, static caching and on-demand
  revalidation. That keeps Core Web Vitals green on every customer site.
- **Custom domains and SSL** go through the host's domains API (the Vercel for
  Platforms pattern), behind one interface so we can move hosts if cost per site demands it.
- **Postgres** stores sites, pages (JSONB element trees), revisions, templates, media,
  redirects, products and orders.
- **Media** lives in object storage (Vercel Blob or S3/R2), resized to AVIF/WebP on upload.

### 4. Commerce is built on Stripe Connect

Each merchant connects their own Stripe account through **Stripe Connect**, so the money
goes straight to them. We never hold funds or card data, and PCI is handled by Stripe.
- Products, variants (size and color), inventory, collections, digital products.
- Cart and checkout: embedded Stripe Checkout, with Apple Pay and Google Pay.
- Tax through **Stripe Tax**; shipping zones and rates; discount codes.
- Orders dashboard, refunds, customer emails (order confirmation, shipped).
- **SEO advantage:** `Product` schema with price, stock and reviews; clean product URLs;
  an automatic **Google Merchant Center feed** for free Shopping listings.

### 5. SEO by construction, plus the SEO add-on

**Included on every plan:** titles, meta and canonicals; `sitemap.xml`, `robots.txt`
and `llms.txt`; a 301 redirect created on every slug change; schema.org generated from
real data (`LocalBusiness` from the GBP, `Product`, `FAQPage`, `Service`,
`BreadcrumbList`, `Article`); image optimization; a performance budget.

**The SEO add-on (paid monthly):** the RankForge engine, connected through a **CMS
execution adapter**. That adapter gives the Operator the same deploy → verify → rollback
interface it has for WordPress, but it writes to our own page store. On top of it: the
per-page SEO panel in the builder, one-click fixes, rank tracking, AI citations,
backlinks, competitors, and content plans that become AI-drafted posts.

---

## Elementor feature parity

Elementor features we will match, in the phase each one ships.

| Elementor feature | Our version | Phase |
|---|---|---|
| Drag-and-drop editor, live canvas | Same | 1 |
| Containers (flexbox and grid), nesting | Same | 1 |
| Core widgets (heading, text, image, button, icon, video, spacer, divider, list, map) | Same | 1 |
| Style tab: typography, colors, backgrounds, borders, shadows, spacing | Same, bound to globals by default | 1 |
| Responsive controls per breakpoint, hide on device | Same | 1 |
| Global colors and fonts (Site Settings) | Same, and AI-generated | 1 |
| Navigator (layer tree), undo/redo, revision history | Same | 1 |
| Copy/paste element and style | Same | 2 |
| Pro widgets (gallery, slider, tabs, accordion, testimonials, pricing table, countdown, reviews) | Same | 2 |
| Theme Builder: header, footer, single and archive templates, display conditions | Same | 2 |
| Popup builder with triggers and conditions | Same | 2 |
| Form builder with actions (email, webhook, lead storage) | Same, plus leads land in the CRM view | 2 |
| Motion effects, entrance animations, sticky elements | Same, using CSS rather than a JS library where possible | 2 |
| Template library and saved sections | Same, plus AI-generated sections | 2 |
| Custom CSS for each element | Same (advanced toggle) | 2 |
| Dynamic content (fields, business info, product data) | Same | 3 |
| WooCommerce widgets (product grid, add to cart, cart, checkout) | Native commerce widgets | 3 |
| Loop builder (repeaters for posts and products) | Same | 3 |
| AI assistant | Deeper: whole-site setup, restyling, copy, images, SEO | 4 |
| Custom code and plugin-style add-ons | Later, as a controlled apps API | 7 |

---

## Google auto-connect: what's possible and what needs approval

| Connection | Status today | What the CMS needs | Blocker to start early |
|---|---|---|---|
| Search Console | OAuth, read-only | **Auto-verify** the site (we control the HTML and DNS), auto-submit the sitemap | Site Verification scope; Google OAuth app verification |
| Analytics 4 | OAuth, read-only | **Create** the GA4 property and data stream, then inject the tag | `analytics.edit` scope; OAuth verification |
| Business Profile | Not built | Import name, address, hours, categories, photos, reviews; keep them in sync | **Google must approve API access** (application form, can take weeks) |
| Merchant Center | Not built | Auto product feed for free Shopping listings | Content API scope; OAuth verification |

OAuth verification and GBP API approval take calendar time, so both applications go in
during Phase 0.

---

## Timeline

Assumes one developer working with Claude at close to full-time. At part-time, roughly
double every estimate. Adding commerce and Elementor-level editing moved public launch
from about 12 months to about **15–16 months**. Each phase ends with something usable.

### Phase 0: Foundations and decisions (weeks 1–3)
- Choose the brand name and domain.
- **Apply for Google Business Profile API access**, start OAuth verification, and
  register as a **Stripe Connect platform**.
- Clean up the repo per `ARCHITECTURE_REALITY.md`: archive the orphaned template code.
- Write the specs: element tree schema (container and widget model, responsive style
  values), global styles schema, content model (site, page, revision, template, media,
  redirect).
- Set up the renderer skeleton: hostname → site lookup → render a page from its element tree.

**Done when:** a test site renders from a row in Postgres on a subdomain.

### Phase 1: The builder core (months 1–4)
- Drag-and-drop canvas, containers (flexbox and grid), and about 12 core widgets.
- Style panel with responsive controls, global colors and fonts.
- Navigator, undo/redo, draft/publish, revision history.
- Media library; menus; the "SEO by construction" basics.
- **The speed gate:** a Lighthouse check on publish; nothing goes live below 95.
- **The first chat assistant:** a side panel where you describe a change and it edits
  the page, with preview, accept and undo. It starts with the basics (text, colors,
  add/remove/reorder sections) and grows every phase after.
- **Dogfood:** rebuild the RankForge marketing site in it, mostly by chat.

**Done when:** we can design and publish a real business site with no code, partly by
chatting, and it scores 95+ on mobile PageSpeed.

### Phase 2: Builder power features (months 4–6)
- Theme Builder (header, footer, templates, display conditions), popups, form builder.
- Pro widgets, motion effects, sticky elements, custom CSS, copy/paste styles.
- Template library and saved sections; 4–6 starter themes.
- Blog: posts, categories, authors, RSS.
- Custom domains with automatic SSL.

**Done when:** an Elementor user can rebuild their current site in our builder without
missing a feature they use.

### Phase 3: Commerce (months 6–9)
- Stripe Connect onboarding for merchants.
- Products, variants, inventory, collections, digital products.
- Cart, checkout, Stripe Tax, shipping zones and rates, discount codes.
- Orders dashboard, refunds, customer emails.
- Commerce widgets (product grid, add to cart, cart); product and collection templates;
  dynamic content; loop builder.
- `Product` schema and the Google Merchant Center feed.

**Done when:** a real shop can sell, ship and refund an order end to end.

### Phase 4: AI setup and Google auto-connect (months 9–11)
- **Onboarding wizard:** sign in with Google → pick the business → import the GBP →
  answer 3–5 questions.
- **AI site generation:** a page plan from keyword research (`lib/engine/keywords.ts`,
  `serp.ts`), then element trees, copy, globals and product descriptions.
- Auto-verify Search Console, submit the sitemap, create GA4, connect Merchant Center.
- The assistant goes full power: it gets its name and face, and it can build a whole site
  from a description, restyle the theme, write copy, add products, create pages and
  generate images ("make this section more premium", "add an FAQ from my reviews").
  Its output is always schema-validated and speed-gated.

**Done when:** a new business goes from sign-up to a live, connected, indexed site in
under 10 minutes.

### Phase 5: The SEO add-on (months 11–13)
- **CMS execution adapter** for the Operator: fixes apply directly to pages and products,
  with verification and rollback.
- An SEO panel in the builder for each page: real Search Console and GA4 numbers, open
  recommendations, one-click fixes.
- Rank tracking, AI citations, backlinks and competitors run through the existing scheduler.
- Content plan → AI draft posts with internal links inserted automatically.
- Fold in `seo-intel`'s stronger crawler and extractor.
- Add-on billing: an upgrade inside the app, with a free trial.

**Done when:** a site improves its own rankings from fixes the owner approves with one click.

### Phase 6: Billing, hardening and private beta (months 13–15)
- Plans, limits and metered AI usage through Stripe billing.
- Security review, backups for each site, uptime monitoring, fraud and chargeback handling.
- **Abuse handling** for hosted sites and stores (phishing, scam stores): reporting,
  takedown, and screening of new stores.
- Help docs, onboarding emails, support inbox.
- **Private beta with 20–30 real businesses**, some of them selling.

**Done when:** beta customers pay, sell, and never need us to fix their site by hand.

### Phase 7: Public launch and growth (month 15 onward)
- **Importers as the acquisition channel:** WordPress/Elementor (our WP connector
  already reads WP sites) and Shopify (products, pages, redirects).
- Bookings and appointments, subscriptions, multi-location, multi-language.
- Agency plan: white-label and client sites.
- Theme and template marketplace; an apps API for third-party add-ons.

---

## Pricing direction (to be validated)

Competitor prices are from memory and need checking before launch. Shopify's Basic plan
is roughly $29–39/month, and Wix and Squarespace entry plans are roughly $16–25/month.

| Plan | Target price | Includes |
|---|---|---|
| Site | ~$12–15/mo | Full builder, custom domain, AI setup, Google auto-connect, built-in SEO |
| Store | ~$25/mo | Everything in Site plus commerce, with **0% taken from sales**. Undercuts Shopify Basic. |
| **SEO add-on** | **+$15–29/mo** | The RankForge engine: recommendations, one-click fixes, rank tracking, AI citations, content plans |
| Agency | ~$79+/mo | Multiple sites, white-label, client reports |

**Unit economics to measure in Phase 1:** hosting cost per site, and AI cost per setup.

---

## Name: SaySites

Chosen because it says what the product does: **you say it, it builds your site.**
Availability checked on 2026-09-24 through GoDaddy and Vercel. An open domain is not
trademark clearance: run a USPTO search before launch.

| Domain | Status | Use |
|---|---|---|
| **saysites.com** | Available (standard price) | Main site. Register first. |
| **saysites.ai** | Available | Protect the brand; redirect to .com |
| saysites.app / .io / .co / .net | Available | Optional brand protection |
| saysite.com (singular) | **Taken** | Customers may type it; watch for confusion |
| saysite.ai / .io | Taken | — |

Runner-up names, in case the trademark search turns something up: **TellRank**
(tellrank.com and .ai), **TellSites** (tellsites.com), **SayBuilt** (.ai/.io),
**SayMade** (.ai/.co).

## Still open

- **Register saysites.com** (plus .ai) and run a trademark search on "SaySites".
- **The assistant's name and face** (like "Angie").
- **Hosting provider** at scale: Vercel to start, reassessed on cost per site in Phase 6.
- **Focus.** The repo also has Citation Gap, Reloop and North Star HQ. This is a
  15-month build and needs to be the main thing.

---

## Biggest risks

1. **The builder.** Elementor has a large team and ten years of work behind it. Build on
   proven libraries (dnd-kit for dragging, Tiptap for rich text) and ship parity in the
   order in the table, not all at once.
2. **Commerce edge cases:** tax, refunds, inventory races, fraud. Lean on Stripe for all of it.
3. **Google approvals** delay the headline feature, so start them first.
4. **Hosting and AI cost per site** at a low price point. Measure early.
5. **Abuse,** especially scam stores. Plan for it before public sign-up.
6. **Scope creep.** Every phase has a "done when" line. Don't start the next phase until it's met.

---

## Next two weeks (concrete)

1. Register saysites.com and saysites.ai; run a trademark search.
2. Submit the Google Business Profile API access request; register the Stripe Connect platform.
3. Write `lib/cms/schema/` with zod schemas for the element tree (Container plus 5
   widgets, responsive style values), GlobalStyles, Page, Site and Redirect, plus unit tests.
4. Add migration `013_cms_core.sql` for the sites, pages, page_revisions, templates,
   media and redirects tables.
5. Build the renderer skeleton: hostname → site → render a page from its element tree
   into lean HTML and CSS.
