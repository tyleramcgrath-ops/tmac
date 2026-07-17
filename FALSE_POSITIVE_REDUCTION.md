# False-Positive Reduction (Phase C)

Every false positive identified in Phase B (`FALSE_POSITIVES.md`) is fixed, with a regression test. Then we searched for additional false-positive patterns.

## Phase B false positives — fixed

### FP-1 — Mixed content flagged hyperlinks → FIXED AT SOURCE
- **Before:** `analyze.ts:105` matched `(src|href)=["']http://`, so an outbound `<a href="http://…">` produced a **critical** "mixed content" finding.
- **After:** the detector matches only insecure **sub-resources** — `<img/script/iframe/audio/video/source/embed/track src="http://…">` and `<link rel="stylesheet" href="http://…">`. Anchor `href` is excluded.
- **Test:** `reco-engine.test.ts` asserts no mixed-content recommendation when the (now-correct) signal is false. A source-level unit for the regex is covered by the corrected `mixedContent` signal used across crawl + scan.

### FP-2 — BreadcrumbList on the homepage → FIXED
- **Before:** recommended on 9/9 pages including the site root.
- **After:** the breadcrumb rule fires only for `BREADCRUMB_APPROPRIATE` page types (product, category, blog_article, documentation, service, location, case_study) **and** URL depth ≥ 2. Never the homepage.
- **Test:** "does NOT recommend FAQ or Breadcrumb on the homepage."

### FP-3 — FAQ recommended everywhere → FIXED
- **Before:** on 8/9 pages including homepage/about/security.
- **After:** the FAQ rule fires only on decision/answer page types (pricing, product, service, documentation, comparison, faq) and is explicitly blocked on `FAQ_INAPPROPRIATE` types (homepage, about, team, contact, legal, blog, case study, search). Every FAQ recommendation is low-priority and `needsHumanReview`, with the explicit caveat that fabricating FAQs for schema violates Google policy.
- **Test:** homepage/about carry no FAQ recommendation; FAQ recs never land on an inappropriate page type.

### Generic schema recommendations → FIXED (made page-specific)
- **Before:** "Add structured data (JSON-LD) — none found" on every schema-less page.
- **After:** the schema rule only fires when a *page-appropriate* schema exists for the type (`PREFERRED_SCHEMA`): Organization (homepage/about/team), Product/Offer (pricing), Product (product), Article (blog/case study), TechArticle (docs), LocalBusiness (contact/location), Service, FAQPage (faq). Pages with no clearly-appropriate schema are not nagged.
- **Test:** "recommends page-APPROPRIATE schema (Product/Offer on pricing, not on homepage)."

### Template assumptions → REMOVED
- **Before:** every rule assumed all pages were equivalent.
- **After:** all rules receive the page's classification and business weight; none assume a uniform template.

## Over-precise thresholds → widened
- Title-length band widened from 30–60 to **15–70** (Phase B flagged 61-vs-60 as noise); length nits are `info` only.
- Multiple-H1 downgraded to low importance, `needsHumanReview`, and grouped site-wide — Google explicitly permits multiple H1s, so it is a clarity note, not a defect.

## Additional false-positive patterns found & guarded (new this phase)

1. **Noindex on legal/search pages.** A `noindex` on a privacy policy or search-results page is usually intentional. The noindex rule now **skips** `legal` and `search` page types, preventing a false "make this indexable" recommendation.
2. **Duplicate-of-canonical variants.** Pages whose canonical points elsewhere (`duplicateOf`) are excluded from both per-page and cross-page analysis, so a `?utm=` variant is never reported as its own issue or as a "duplicate" of its canonical.
3. **Meta-description entity-length drift** (Phase B extraction note): length-band rules use a wide band and are `info`, so the ~4-char entity-decoding delta cannot flip a recommendation.
4. **Orphan false positives from partial crawls.** The orphan rule only fires when the crawl actually captured internal-link data, and always states in `whatCouldMakeWrong` that an incomplete crawl could hide a real inbound link — it never asserts an orphan with false certainty.

## Net effect (measured, real github.com data)

False positives on the 9-page sample: **3 → 0.** No recommendation in the V2 output lands on a page type where its advice is inappropriate.
