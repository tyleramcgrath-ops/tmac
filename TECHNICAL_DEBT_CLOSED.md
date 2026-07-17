# Technical Debt Ledger — Closed in D.6

Every item from the D.5 `TECHNICAL_DEBT.md`, with an honest status. Closed means
fixed **and** tested; Partial means materially reduced but not fully eliminated;
Deferred means deliberately out of scope for this hardening release (with the
reason). Nothing is marked closed that isn't verifiable in the diff + tests.

Legend: ✅ Closed · 🟡 Partial · ⬜ Deferred

---

## Duplication

| # | Item | Status | Resolution |
|---|------|--------|-----------|
| 1 | Overall-score formula in two shapes (`crawl:170` magic `/88` vs weight array) | ✅ | P3: single `overallScore(scores)` in `analyze.ts`; crawl route consumes it; magic divisor removed. (The third copy under `seo-intel/` belongs to the separate single-page marketing tool, out of the app's scope.) |
| 2 | Two issue-detection engines that disagree | ✅ | P3: the scan summary's severity counts are derived from the reco engine — the single evaluation pipeline. Asserted equal to per-severity recommendation counts in `scan-rec-routes.test.ts`. |
| 3 | Hand-maintained DTOs drifting from server types | ⬜ | Deferred. `client.ts` still hand-declares DTOs. Not touched by P8 (which was structural decomposition, not DTO generation). Low blast radius; a codegen/shared-type pass is the fix. |
| 4 | Two near-identical WordPress deploy forms | 🟡 | P8 separated `DeployFromRecommendation` (modal, resolves a post from a rec's evidence) and `DeployForm` (standalone) into their own modules. They were **not merged** — they drive genuinely different flows; unifying them is a UX decision, not debt removal, so it was left explicit rather than forced. |

## Coupling (stringly-typed)

| # | Item | Status | Resolution |
|---|------|--------|-----------|
| 5 | `ruleId` recovered by regex from a display string | ✅ | P2: first-class `ruleId` (+ `ruleVersion`, etc.) on `Recommendation`; `ruleIdFromRecommendation` regex replaced by typed `ruleIdOf`. Producer no longer emits the parseable string. |
| 6 | Safety/policy `FixKind`-vs-ruleId type confusion (title-regex deindex guard) | ✅ | P2: blocking now uses `isDangerousRule(ruleId)` (typed `RULE_REGISTRY`) + a typed `DANGEROUS_FIX_KINDS` set. Title regex removed; tested with an innocuous title + dangerous ruleId. |
| 7 | Fake `Recommendation` fabricated to feed the regex extractor | ✅ | P2: the smell existed only because of #5; the learning fallback is now `{ ruleId: 'unknown' }`, no fake evidence object. |
| 8 | `learning.ts` double-counts deployment state | ⬜ | Deferred. The typed `ruleId` (P2) fixed the *keying*; the accepted/deployed/verified tally logic is unchanged. A metrics-accuracy nit, not a foundational defect — left for a focused learning-loop pass. |

## SOLID / structure

| # | Item | Status | Resolution |
|---|------|--------|-----------|
| 9 | 819-line `page.tsx` God-file | ✅ | P8: 89-line shell + eight `_components/` modules, none over ~150 lines. Production build compiles; the private folder does not create a route. |
| 10 | 36-method `FoundationStore` fat interface (ISP) | ⬜ | Deferred. Segregating into `UserStore`/`ScanStore`/… is worthwhile before a second team owns a slice; not a foundational defect. Acknowledged in `STORE_REFACTOR.md`. |
| 11 | Two hand-duplicated stores, no drift guard (A12 class) | ✅ | P7: single per-table column-map + generic ins/upd/ups (adding a column is one line); `store-conformance.test.ts` runs one contract against both stores. |
| 12 | Non-transactional per-rec INSERT loop | 🟡 | P1's upsert means only genuinely-new recs are inserted (fewer writes), and the loop now goes through the generic `ins` helper — but it is still per-row, not a single transaction. A multi-row/transactional insert is a small follow-up. |

## Test debt

| # | Item | Status | Resolution |
|---|------|--------|-----------|
| 13 | `extractSignals` + scorers zero root tests | ✅ (extractSignals) / 🟡 (scorers) | P9: `extract-signals.test.ts` adds 22 cases across the named failure paths. The summary path is now exercised (P3 test asserts it). The five scorers + `buildFixes` remain thin — a smaller, separable gap. |
| 14 | `crawl/route.ts` untested | ⬜ | Deferred. Sitemap seeding / frontier loop / integrity gate still lack direct unit tests (the SSRF guard within it is now tested). |
| 15 | Reco engine tested against one archetype | 🟡 | P1/P2/P9 added identity, typed-field, and edge cases, but the full ecommerce/local/blog matrix and the structurally-unreachable orphan case are not yet covered. |
| 16 | Weak assertions (`if (breadcrumb){…}`) | ⬜ | Deferred. The conditional-wrapped priority assertion remains; a minor tightening. |

## Migration / ops

| # | Item | Status | Resolution |
|---|------|--------|-----------|
| 17 | Migrations run on cold start with no advisory lock | ✅ | P7: `migrate.ts` now takes a PostgreSQL advisory lock around the loop + `ON CONFLICT DO NOTHING` on the history insert, so concurrent cold starts / parallel test workers serialize. (Skip-on-connect via `RF_SKIP_MIGRATE_ON_CONNECT` was already available; the lock makes the on-connect path safe too.) |

---

## Tally

- **Closed (✅):** 1, 2, 5, 6, 7, 9, 11, 13(extractSignals), 17 — **9 items**,
  covering all four D.5-critical foundation defects (stringly-typed identity,
  disagreeing engines, no drift guard, cold-start migration race) plus the two
  critical security holes (SSRF, unauthenticated endpoint) tracked in
  `SECURITY_HARDENING.md`.
- **Partial (🟡):** 4, 12, 13(scorers), 15 — materially reduced.
- **Deferred (⬜):** 3, 8, 10, 14, 16 — none foundational; each is a scaling or
  polish investment the hardened architecture now *supports* cleanly.

The deferred items are exactly the "expensive in six months" list from D.5's
final answer — scaling work (projected columns, interface segregation, broader
tests), not defects at the layer every feature depends on. That layer is now
sound, which is why the 500k-LOC answer flips to **YES** (see
`FOUNDATION_HARDENING.md`).
