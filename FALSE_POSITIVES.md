# RankForge — Phase B False-Positive Audit

Recommendations that should not have been made as stated, found in the 9-page github.com study. Each is reproduced from real output and traced to a root cause with a concrete fix.

---

## FP-1 — Mixed-content "critical" flags ordinary hyperlinks

- **What appeared:** `[critical] Fix mixed (http://) content on an HTTPS page` on `github.com/security` — the only critical finding across all 9 pages.
- **Why it appeared:** `app/api/seo-scan/analyze.ts:105`
  ```ts
  const mixedContent = https && /(?:src|href)=["']http:\/\//i.test(html)
  ```
  The pattern includes **`href`**. A navigational `<a href="http://...">` is a *link to* an http page, not an insecure sub-resource loaded into the current page. Real mixed content is only sub-resource loads: `<img/script/iframe src>`, `<link rel=stylesheet href>`, `<source>`, CSS `url()`. GitHub serves no insecure sub-resources, so the trigger was an http `href` (or similar), not genuine mixed content. (Live re-verification of the exact URL was blocked by GitHub rate-limiting during this run; the rule defect is nonetheless conclusive from the code.)
- **Root cause:** attribute over-matching — `href` conflated with `src`.
- **Severity of the error:** high. It is emitted as **critical**, the top of the priority list, so it front-runs real work.
- **Required fix:** match only sub-resource attributes. Restrict to `src=["']http://` and `<link[^>]+rel=["']stylesheet["'][^>]+href=["']http://`; exclude anchor `href`. Add a test with an `<a href="http://example.com">` (must NOT flag) and an `<img src="http://…">` (must flag).

---

## FP-2 — BreadcrumbList schema recommended on the homepage (and every page)

- **What appeared:** `[info] Add BreadcrumbList schema` on **9/9** pages, confidence **85**, including `github.com/` (the homepage).
- **Why it appeared:** `analyze.ts` adds the fix whenever `!s.schemaTypes.includes('BreadcrumbList')`, with no notion of page depth or type.
- **Root cause:** page-blind rule. A homepage is the root of the site — it has no breadcrumb trail, so BreadcrumbList is semantically inapplicable there. Recommending it is wrong, not merely low-value.
- **Required fix:** suppress BreadcrumbList on the homepage / top-level URLs (path `/` or depth 0). Better: only suggest it where a breadcrumb UI actually exists or the URL has ≥2 path segments.

---

## FP-3 — "Add an FAQ section + FAQPage schema" applied indiscriminately

- **What appeared:** `[info] Add an FAQ section + FAQPage schema for AI visibility` on **8/9** pages, confidence **85** — including homepage, about, and security.
- **Why it appeared:** fires on `!s.hasFaq` for every page regardless of intent.
- **Root cause:** "do X everywhere for AI visibility" generic advice. Adding FAQ blocks to a homepage or an about page is not something a senior SEO would recommend; FAQPage belongs on pages that genuinely answer recurring questions (support, product, pricing). Note the rule correctly *skipped* `/enterprise`, which already has FAQPage — so the detection is right; the **prescription is over-broad**.
- **Required fix:** gate FAQ suggestions to page types where FAQs are appropriate (product/pricing/support/docs), or downgrade to a single site-level suggestion rather than a per-page recommendation.

---

## Lower-value-but-not-wrong (flagged for calibration, not "never should have been made")

- **Title length 30–60** fired on `home` at **61 chars** ("aim for 30–60"). Off-by-one is noise; title length is a weak signal. Correct extraction, but the ±1 precision manufactures work. *Fix: widen the tolerance band (e.g., 15–70) and/or drop to `info`.*
- **Meta description length bands** (186 "should be ≤160") — correct, cosmetic. Keep as `info` (it already is).

---

## Root-cause summary

All three true false positives share one cause: **rules fire per page without knowing the page's type or the semantic applicability of the fix.** FP-1 is a pattern bug; FP-2/FP-3 are page-blindness. Fixing page-awareness (even a coarse homepage / money-page / content classifier) plus the `href` pattern removes every false positive found in this study.
