# RankForge — Phase B Improvement Backlog

Ranked by (customer value × competitive advantage × expected ROI) ÷ (engineering effort × risk). Every item traces to verified Phase B evidence. Cosmetic items excluded. **These are recommendations — do not implement until the validation is reviewed** (per the phase brief).

---

## P0 — Trust-blocking defects (small effort, high ROI)

### B-1. Fix the mixed-content rule (stop flagging hyperlinks)
- **Evidence:** FP-1 — the only "critical" across 9 clean pages, caused by `href` in the pattern (`analyze.ts:105`).
- **Change:** match only sub-resource attributes (`src`, `link[rel=stylesheet] href`); exclude anchor `href`. Add tests: `<a href="http://…">` must NOT flag, `<img src="http://…">` must flag.
- **Effort:** ~1–2 h. **Risk:** low. **ROI:** very high — removes a false *critical* that mis-ranks the whole list.

### B-2. Recalibrate confidence to importance, not prevalence
- **Evidence:** VALIDATION §6 — BreadcrumbList (low value) conf 85 outranks "add meta description" (important) conf 43.
- **Change:** confidence = rule certainty × **fix importance weight** (per category), with prevalence shown separately as "N pages affected." Importance weights: missing title/meta/H1 > missing JSON-LD > breadcrumb/FAQ.
- **Effort:** ~0.5 day. **Risk:** low. **ROI:** very high — makes "sort by confidence" trustworthy, the core UX contract.

### B-3. Make schema advice page-aware (kills FP-2 & FP-3, enables FN-2)
- **Evidence:** FP-2 (breadcrumb on homepage), FP-3 (FAQ everywhere), FN-2 (no Product schema on /pricing).
- **Change:** a coarse page classifier (homepage / money page / article / product / support / other) from URL depth + on-page signals; gate BreadcrumbList off the homepage, gate FAQ to appropriate types, and recommend type-specific schema (Organization for home, Product/Offer for pricing).
- **Effort:** ~2–3 days. **Risk:** medium (classifier accuracy). **ROI:** high — removes all three false positives *and* closes the biggest business-understanding gap; also the top competitive weakness.

---

## P1 — Coverage gaps with data already in hand

### B-4. Restore cross-page duplicate title/meta detection in the recommendation builder
- **Evidence:** FN-1 — 5 pages share meta length 142; the builder does no cross-page pass (the legacy `/app` analyzer did).
- **Change:** site-level clustering of identical/near-identical titles & metas → one recommendation with affected URLs.
- **Effort:** ~0.5–1 day. **Risk:** low. **ROI:** high — real, common client issue; data already crawled; pure builder addition.

### B-5. Surface orphan pages & heading hierarchy as recommendations
- **Evidence:** FN-4 — inbound-link graph and heading counts are extracted but not turned into recommendations.
- **Change:** emit orphan-page (0 inbound internal links) and heading-order (h1→h2 nesting) recommendations from existing crawl data.
- **Effort:** ~1–2 days. **Risk:** low. **ROI:** medium-high.

---

## P2 — Breadth (needs external access/keys; environment-gated)

### B-6. Exercise PSI (Core Web Vitals) and, where a key exists, backlinks/rank data end-to-end
- **Evidence:** FN-3/FN-5 — integrations exist and degrade honestly but were unreachable here.
- **Change:** no core code change; validate against reachable PSI/SERP/DataForSEO endpoints in an environment with egress; ensure the honest-degradation messaging stays correct.
- **Effort:** ~1 day validation. **Risk:** low. **ROI:** medium — needed for parity of *audit surface*, not differentiation.

### B-7. Widen over-precise thresholds
- **Evidence:** FP "lower-value" — title 61-vs-60 flagged.
- **Change:** widen title band (e.g., 15–70) and keep length nits at `info`.
- **Effort:** ~1 h. **Risk:** low. **ROI:** low-medium (reduces noise).

---

## Highest-ROI sequence

**B-1 → B-2 → B-4 → B-3.** B-1 and B-2 are hours-to-a-day each and directly remove the two reasons a pro can't trust the priority order (a false critical, and inverted confidence). B-4 adds a high-value finding from data already collected. B-3 is the larger investment that closes the business-understanding gap and the top competitive weakness. Completing B-1/B-2/B-4 alone would move the final Phase B answer materially closer to "trust the priorities," because the remaining issues would be breadth (honestly disclosed) rather than *wrong* or *mis-ranked* recommendations.

## What NOT to build yet

- New "intelligence"/Operator/portfolio features — Phase B shows the **existing** recommendation layer isn't yet trustworthy; adding surface area on top of page-blind rules compounds the problem. Fix judgment quality first.
