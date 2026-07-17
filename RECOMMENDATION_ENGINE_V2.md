# Recommendation Engine V2 (Phase C)

**Goal:** move from rule-driven recommendations (which Phase B proved untrustworthy) to evidence-driven, page-type-aware, business-aware recommendations that an experienced SEO agrees with. Fewer, better, defensible.

**Status:** built, wired, and tested. Measured on the real Phase B github.com data, V2 removes all three Phase B false positives, restores the missing false negatives, and fixes the inverted confidence — with **zero false positives** on that sample.

---

## Architecture (`lib/foundation/reco/`)

```
signals.ts     Normalize a crawl page into typed PageSignals; absent signals
               stay undefined so rules never fire on what they can't see.
classify.ts    Page Intelligence (§1): classify each page (homepage, pricing,
               product, blog_article, about, contact, legal, documentation, …)
               from URL structure + on-page signals, with a confidence.
business.ts    Business Intelligence (§2): derive money-page types + locality
               from the project's profile (industry/businessProfile/goals) and
               the crawl; page business-weight 0.4–1.0.
rules.ts       Page-type-aware rules (§5,§9). Each rule fires only where the
               advice is appropriate and returns a fully-explained Finding
               (evidence, Google guidance, importance, effort, risk, and the
               five explainability answers).
cross-page.ts  Cross-page analysis (§6): duplicate title/meta + orphan pages —
               the false negatives Phase B found.
engine.ts      Orchestrator: classify → page rules → cross-page → Confidence
               2.0 → Priority → grouping → self-evaluation.
```

`recommendations.ts` now delegates to `generateRecommendationsV2`; the scans API passes the project's business context and returns the self-evaluation.

## Pipeline

1. **Classify** every (non-duplicate) page → `PageType` + classifier confidence.
2. **Business context** → which page types are money pages for this site.
3. **Page rules** run per page, gated by page type. A rule that doesn't fit the page type does not fire (this is what removed the Phase B false positives).
4. **Cross-page rules** find duplicates and orphans across the scan.
5. **Confidence 2.0** scores each finding by evidence × rule-certainty × classification-context — **never prevalence** (see `CONFIDENCE_MODEL.md`).
6. **Priority engine** ranks by business-impact × SEO-impact × confidence ÷ effort, damped by risk (see `BUSINESS_CONTEXT_ENGINE.md`).
7. **Grouping**: page-appropriate schema groups by exact advice (homepage+about+team → one "Add Organization" rec); page-agnostic rules (multiple-H1, title-length) group **site-wide** so "8 pages have multiple H1s" is one recommendation, not eight.
8. **Self-evaluation** (§10): counts, needs-review set, and an honest "not analyzed" list.

## Every recommendation now carries (§4, §9)

- `pageType`, `priorityRank`, `priorityScore`
- `evidence`: affected URLs, verifiable facts, and specific supporting elements
- `googleGuidance` where applicable
- `explanation`: **why / why now / why this page / what if ignored / what could make this wrong**
- `confidence` + `confidenceBasis` (importance-based, labeled "NOT prevalence")
- `needsHumanReview` flag for lower-certainty items
- `expectedImpact`, `risk`

## Measured result on real github.com data (9 page archetypes)

| | V1 (Phase B) | V2 (Phase C) |
|---|---|---|
| Recommendations | 9 site-level | 10 page-appropriate |
| False positives | **3** (mixed-content, breadcrumb-on-home, FAQ-everywhere) | **0** |
| Confidence order | inverted (BreadcrumbList 85 > add-meta 43) | correct (missing-meta 80 > multiple-H1 53) |
| Schema advice | generic "add JSON-LD" | page-specific (Organization/Product/Article/TechArticle) |
| Duplicate detection | absent | restored (tested) |
| Self-flagged for review | none | 2/10, openly labeled |

V2 top-5 (priority order): missing meta description (docs) · Product/Offer schema (pricing) · Product schema · Organization schema (homepage+about+team, grouped) · Article schema (case study). The two debatable items (multiple-H1, FAQ) are ranked last and flagged `needsHumanReview`.

## Tests (`tests/reco-engine.test.ts`, 11)

Classifier; FP-1/2/3 elimination; page-appropriate schema; cross-page duplicate restoration; confidence-over-prevalence ordering; five-question explainability; honest self-evaluation; and a **human-agreement suite over the real github.com fixture** asserting V2 reproduces the independent human verdicts. Full suite: 73 passing (incl. real Postgres).

## Honest limitations

- **One-site golden fixture.** Agreement is measured against the author's independent Phase B verdicts on github.com — a real regression harness, not the 10-site/10-industry study the environment blocks. The 90%-agreement target is demonstrated on this sample and encoded as regression tests; it is **not** a claim of 90% across all sites.
- **Classifier is URL+signal heuristic** (~0.85 confidence on URL matches). Edge cases misclassify (e.g. GitHub's editorial `/readme` → documentation); such cases produce low-priority, review-flagged recs rather than confident wrong ones.
- **Coverage ceiling unchanged**: no CWV/backlinks/keyword analysis (external providers unreachable); the self-evaluation lists these as "not analyzed" rather than silently omitting them.
