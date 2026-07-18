# RankForge — Technical Debt (Phase D.5)

Concrete, file-referenced debt found reviewing Phases A–D. Ordered by cost-to-carry. Cosmetic items excluded.

## Duplication

1. **Overall-score formula in two shapes.** `app/api/crawl/route.ts:170` hardcodes `(technical*30 + content*30 + schema*12 + ai*16)/88` (magic `/88`); `app/api/seo-scan/route.ts:134-163` re-derives it from a weight array. Change one weight → the two site scores diverge silently. A *third* full copy of the methodology lives in `seo-intel/lib/{scoring,extract}.ts`. **Fix:** one `overallScore(scores)` helper in `analyze.ts`; delete the magic divisor.
2. **Two issue-detection engines that disagree.** `buildFixes` (`analyze.ts:182`) → `page.fixes` still powers the Audit "Critical issues" count + technical score (`scans/route.ts:50`), while recommendations come from `reco/**` reading signals. Different rule sets → the UI shows two truths for one crawl. **Fix:** recompute the audit summary from reco findings (or vice-versa); retire the duplicate.
3. **Hand-maintained DTOs drifting from server types.** `client.ts` re-declares `RecommendationDTO`/`DeploymentDTO`/`OperatorMetricsDTO`/`DiffSeg`; `OperatorMetricsDTO` already **omits `openRecommendations`** that the server `OperatorMetrics` has. **Fix:** import shared types or generate DTOs.
4. **Two near-identical WordPress deploy forms** in the UI: `DeployFromRecommendation` and `DeployForm` (`page.tsx:237,456`). **Fix:** one component.

## Coupling (stringly-typed — the worst debt)

5. **`ruleId` recovered by regex from a display string.** Producer `engine.ts:178` → parser `fixgen.ts:118` → consumers `pipeline.ts:40`, `learning.ts:29`. Reword the evidence sentence and fix generation, operator preview/deploy, and all learning stats silently degrade to `'unknown'` with no compile error and no test. **Fix:** first-class `ruleId` field on `Recommendation`.
6. **Safety/policy `FixKind`-vs-ruleId type confusion.** `safety.ts:50` `DANGEROUS_RULES.has(fix.kind)` and `policy.ts:50` `alwaysRequireApproval.includes(fix.kind)` — `fix.kind` is a `FixKind`, so only `'canonical'` can ever match; robots/noindex/redirect/sitemap entries are inert. Deindex protection currently works **only** via `/robots|noindex|.../i.test(rec.title)` — i.e. it depends on recommendation *title wording*. Latent: the day a robots/redirect rule ships, by-kind blocking fails. **Fix:** put a typed `dangerous: boolean` on the rule/finding; block on that.
7. **Fake `Recommendation` fabricated to feed the regex extractor** (`learning.ts:59` `{title:'',evidence:{facts:[]}} as unknown as Recommendation`) — a smell that exists only because #5 exists.
8. **`learning.ts` double-counts** deployment state: a `deployed` rec increments `accepted` (`:48`) and `deployed` (`:52`); a `verified` deployment also increments `deployed` (`:63`). Rates are computed on inconsistent tallies. **Fix after #5.**

## SOLID / structure

9. **819-line `page.tsx` God-file** — 5 tabs, 3 forms, a modal, a bulk operator console, 6 helpers. **Fix:** split into a components directory per tab.
10. **36-method `FoundationStore` fat interface** (`store.ts:21`) — ISP violation; every mock implements all of it. **Fix:** segregate by concern.
11. **Two hand-duplicated stores, no drift guard** — the A12 NOT-NULL-column bug class is still live (`postgres.ts:122,147` hand-list columns; nothing asserts they match the migration). File store enforces no FK/CHECK, so its tests can't catch prod-only failures. **Fix:** generic column-map store OR a CI check reflecting `information_schema.columns`.
12. **Non-transactional per-rec INSERT loop** (`postgres.ts:146-151`) — partial writes on failure. **Fix:** single multi-row INSERT or a transaction.

## Test debt (quality, not count)

13. **`extractSignals` + `buildFixes` + all 5 scorers have zero root unit tests** — the trust foundation is uncovered; the one integration test bypasses the summary path by omitting `fixes` (`scan-rec-routes.test.ts:41`). **Highest test-gap priority.**
14. **`crawl/route.ts` untested** — sitemap seeding, frontier/batch loop, `normalizeCanonical` dedup, integrity gate.
15. **Reco engine tested against one archetype** (github). No ecommerce/local/blog, no `indexable:false`, no `mixedContent:true`; `internalTargets:[]` in the fixture makes the orphan cross-page rule **structurally unreachable** on real data. `deriveBusinessContext` profile branches untested.
16. **Weak assertions:** a headline priority test is wrapped in `if (breadcrumb){…}` (asserts nothing if the rec is absent, `reco-engine.test.ts:94`); several checks are truthiness/`length>0` only.

## Migration/ops

17. **Migrations run on cold start** (`postgres.ts:35`) with no advisory lock — concurrent first-deploy cold starts can race on DDL. **Fix:** default to skip-on-connect; migrate only in the deploy step.
