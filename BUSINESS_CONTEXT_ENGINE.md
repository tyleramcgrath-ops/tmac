# Business Context Engine (Phase C §2, §7)

## Purpose

Phase B's headline weakness was that RankForge had **no business understanding** — it treated a pricing page and a privacy policy identically, so a title nit on a policy page could outrank a schema gap on the money page. Phase C adds a lightweight, honest business-context layer so revenue-relevant pages are weighted appropriately.

Nothing here is fabricated: money pages are derived from real page classifications and the URL graph, and profile inputs are the user's own.

## Inputs

1. **Project profile** (already stored on every project): `industry`, `businessProfile`, `goals`. The scans API passes these into the engine.
2. **The crawl itself**: the set of page types actually present.

## What it derives (`business.ts`)

- **Money-page types** for this site — a base set (pricing, product, category, service, contact, comparison, landing) refined by profile keywords:
  - local/legal/healthcare profile → adds `location`, `contact` (these convert for local businesses)
  - content/media/publisher profile → adds `blog_article` (articles are the product)
  - if the crawl has no obvious money page, the homepage is treated as the primary conversion surface so it isn't deprioritized to zero
- **Locality** — whether the business appears local (affects LocalBusiness/location value)
- **Page business-weight** (0.4–1.0): homepage 1.0; money pages 0.9; about/team 0.6; legal/search 0.4; everything else 0.7

## Priority engine (§7)

Priority is computed, not read from a static severity table:

```
priorityScore = businessWeight × importance × seoImpact × (confidence/100)
              × effortFactor × riskDamp × 100
```

- `businessWeight` — from the business context above
- `importance` — the finding's intrinsic value (rule-defined)
- `seoImpact` — high 1.0 / medium 0.6 / low 0.3
- `effortFactor` — low 1.0 / medium 0.7 / high 0.45 (cheaper wins rank higher)
- `riskDamp` — low 1.0 / medium 0.9 / high 0.75

The result is a deterministic `priorityRank` (1 = do first). **This is what stops a technical nit from outranking a revenue opportunity**: a schema gap on the pricing page (businessWeight 0.9) outranks a title-length nit on a policy page (businessWeight 0.4) even if both are "warnings."

## Verified behavior

- On the real github.com data, the top of the list is the missing meta description on a content page and **page-appropriate schema on the money pages** (Product/Offer on pricing, Product on the product page); the multiple-H1 and FAQ items sit at the bottom and are flagged for review.
- Unit test: "the missing `<title>` on the product page is highest priority (rank 1)" — a high-importance, high-certainty fix on a money page correctly leads.
- Unit test: "a rare high-certainty fix outranks a ubiquitous low-value one" — priority + confidence both favor importance over frequency.

## Honest limitations

- This is **coarse business context**, not deep business intelligence. It classifies page *types* and weights money pages; it does **not** model conversion funnels, revenue attribution, or audience segments (the brief lists these as goals). It deliberately does not invent revenue figures.
- Money-page inference leans on the user-supplied profile. With an empty profile it falls back to the generic money-page set + homepage, which is reasonable but less tailored.
- "Technical fixes should never outrank revenue opportunities without evidence": enforced via `businessWeight`, but the weights are principled constants, not learned. Tuning them against real human-priority data is future work (the `status`/`history` substrate exists for it).
