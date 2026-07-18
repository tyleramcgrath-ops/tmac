# RankForge — Phase B False-Negative Audit

Issues an experienced SEO would raise on the 9-page github.com sample that RankForge's recommendation output did **not** surface. Each includes why it was missed and what's required.

---

## FN-1 — Duplicate meta descriptions across pages (missed by the recommendation builder)

- **Observation:** 5 of 9 pages (`about`, `security`, `team`, `enterprise`, `features/actions`) report meta-description **length 142** — a strong signal of shared/near-duplicate meta descriptions, a classic SEO issue (dilutes snippet relevance, wastes crawl signals).
- **Why missed:** `lib/foundation/recommendations.ts` groups **per-page fixes**; it performs **no cross-page comparison**. The legacy `/app` analyzer *did* compute duplicate titles/metas, but that cross-page logic was not carried into the foundation recommendation path.
- **Required improvement:** add a site-level pass in the recommendation builder that clusters identical/near-identical titles and meta descriptions across the scan's pages and emits one "N pages share a meta description" recommendation with the affected URLs as evidence. (The data is already in the scan; only the analysis is absent.)

---

## FN-2 — No page-intent / money-page schema guidance

- **Observation:** `/pricing` (a SaaS money page, 5,131 words) has no `Product`/`Offer`/`AggregateOffer` schema; the homepage has no `Organization`/`WebSite` schema. RankForge said only the generic "Add JSON-LD structured data."
- **Why missed:** RankForge has **no page-type classification** — it treats every URL identically, so it cannot recommend the *right* schema per page.
- **Required improvement:** a coarse page classifier (homepage / money page / article / product / support) driving type-specific schema recommendations. This is also the fix for FP-2/FP-3.

---

## FN-3 — Core Web Vitals / performance not in the audit

- **Observation:** no LCP/CLS/INP assessment for any page.
- **Why missed:** PageSpeed Insights (googleapis) is unreachable in this environment; RankForge honestly degrades rather than fabricating. **This is an environmental gap, not a code defect** — but from the client's perspective the audit surface is incomplete without it.
- **Required improvement:** none in code (the PSI integration exists and degrades honestly); requires a reachable PSI endpoint / key to exercise.

---

## FN-4 — Internal-link and heading-hierarchy quality not assessed in recommendations

- **Observation:** RankForge extracts internal-link counts (102 on the homepage) and H1/H2 counts, but the recommendation builder does not evaluate **anchor-text quality, orphan risk, or heading order (h1→h2 nesting)**. It only flags "N H1s."
- **Why missed:** these analyses exist partially in the `/app` crawl view but are not distilled into stored recommendations.
- **Required improvement:** surface orphan-page and heading-hierarchy findings as recommendations (the crawl already yields the inbound-link graph).

---

## FN-5 — Content / keyword gap not evaluated

- **Observation:** no assessment of whether each page targets and covers a relevant query.
- **Why missed:** keyword-driven analysis requires a target keyword (and, for competitor gap, a SERP API key) — none supplied/reachable here. Honest degradation.
- **Required improvement:** none forced; note that without a keyword or SERP access, RankForge's audit is purely technical/structural, which is a real coverage ceiling versus a full Semrush/Ahrefs audit.

---

## Root-cause summary

Two classes:
1. **Genuinely fixable in code, data already present:** FN-1 (cross-page duplicate detection) and FN-4 (orphans/heading hierarchy) — the scan holds the data; the recommendation builder just doesn't analyze it. FN-2 (page-intent schema) needs a lightweight classifier.
2. **Environmental / input-dependent:** FN-3 (CWV, needs PSI) and FN-5 (keyword/content, needs a keyword + SERP access). RankForge degrades honestly on these; they cap coverage but are not defects.

FN-1 is the highest-value miss: it's a real, common client issue, the data is already crawled, and only a small builder addition is required.
