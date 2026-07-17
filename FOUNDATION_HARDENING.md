# RankForge — Foundation Hardening (Phase D.6)

A hardening release. No new user-facing features, no UI redesign, no expanded
functionality — the objective was to eliminate the architectural debt the D.5
review identified before building anything on top of it. Every change is
behavior-preserving except where the old behavior was itself the defect (a
disagreeing audit count, an unauthenticated endpoint, a session that couldn't
be revoked).

**Result: all 9 priorities closed, verified, and tested. Default suite 190 pass
(8 gated skips); production build compiles; migrations + store contract proven
against real PostgreSQL 16.**

---

## The 9 priorities

| # | Priority | Status | Where |
|---|----------|--------|-------|
| P1 | Stable recommendation identity | ✅ | `reco/identity.ts`, `recommendations.ts`, migration `002` |
| P2 | First-class typed rule IDs | ✅ | `types.ts`, `reco/rules.ts`, `reco/engine.ts`, `operator/*` |
| P3 | Single issue-evaluation source | ✅ | `scans/route.ts`, `analyze.ts` (`overallScore`) |
| P4 | SSRF elimination | ✅ | `app/api/seo-scan/url-guard.ts` (+ crawl, wp-execution) |
| P5 | Remove legacy WordPress entry point | ✅ | deleted `app/api/wordpress/route.ts` |
| P6 | Session security | ✅ | `auth.ts`, `crypto.ts`, `rate-limit.ts`, `env.ts` |
| P7 | Store consistency | ✅ | `postgres.ts` (column map), `store-conformance.test.ts` |
| P8 | Page component refactor | ✅ | `app/app/projects/[projectId]/_components/*` |
| P9 | `extractSignals` test gap | ✅ | `tests/extract-signals.test.ts` (22 cases) |

Detailed write-ups: `RECOMMENDATION_IDENTITY.md` (P1/P2), `SECURITY_HARDENING.md`
(P4/P5/P6), `STORE_REFACTOR.md` (P7), and `TECHNICAL_DEBT_CLOSED.md` (the D.5
debt ledger, item by item).

---

## P1 — Stable recommendation identity
Recommendations no longer get a fresh random UUID every scan. Each carries a
deterministic `issueId` (`${ruleId}::${scope}`) derived from its business
meaning. Re-scans **upsert** onto that identity, so the human's triage
(accepted/rejected/verified/rolled_back), status, history, and evidence survive
re-crawls; status is never silently reset. Migration `002` backfills legacy
rows, folds duplicate history into the survivor (no data loss), and adds a
unique `(project_id, issueId)` index. Proven end-to-end on real Postgres.

## P2 — First-class typed rule IDs
Every recommendation now carries typed `ruleId, ruleVersion, ruleCategory,
ruleSeverity, businessContext` (plus `pageType`). The operator, learning loop,
and safety engine read these fields — never a parsed display string. The
`ruleIdFromRecommendation` regex and the safety **title-regex decoy** are gone;
danger is now decided from a typed `RULE_REGISTRY` + fix-kind set.

## P3 — Single source of truth
The audit summary's `critical/warning/info` counts are now derived from the
same recommendation-engine output that populates the Recommendations list. A
page can no longer show "3 critical" in the audit and zero critical
recommendations. The duplicated overall-score formula is a single
`overallScore()` helper.

## P4 — SSRF elimination
All outbound fetches of user-influenced URLs pass through one guard
(`url-guard.ts`): protocol/port allow-lists, private/loopback/link-local/ULA
IPv4+IPv6, cloud metadata, decimal/hex hosts, DNS-rebinding (resolved-address
check), and per-hop redirect re-validation. 68 tests.

## P5 — Remove legacy WordPress entry point
Deleted the unauthenticated `/api/wordpress` endpoint and its
env-credential fallback. The authenticated, tenant-scoped, audited per-project
API is now the only deployment path.

## P6 — Session security
`tokenVersion`-based revocation + logout-everywhere, rate limiting on
login/signup, CSRF origin check, `APP_SECRET` raised to ≥32 in production,
Secure cookie in prod. Full detail in `SECURITY_HARDENING.md`.

## P7 — Store consistency
The Postgres store's projected columns are declared once per table via a single
key-extractor; generic insert/update/upsert build the SQL from it, killing the
A12 "forgot a NOT-NULL column" class. A single behavioral **contract** runs
against both store implementations (file + Postgres) as a drift guard.

## P8 — Page component refactor
The 819-line `page.tsx` is an 89-line shell; eight focused modules under
`_components/`, none over ~150 lines, separate presentation/state/fetching per
tab.

## P9 — Test gap
`extractSignals` — the trust foundation every score derives from — went from
zero root tests to 22 covering failure paths, malformed/partial HTML, missing/
unexpected schema, redirects, and malformed metadata.

---

## Verification summary

- **Unit/route suite:** 190 passing, 8 gated skips (Vitest).
- **Type check:** `tsc --noEmit` clean.
- **Production build:** `next build` compiles; `_components/` stays private.
- **Real Postgres 16:** migrations `001`+`002` apply cleanly; legacy-duplicate
  collapse preserves history; the unique issue index rejects a second insert;
  the store contract passes on both the file and Postgres implementations.
- **SSRF:** 68 dedicated tests including a mocked DNS-rebinding case.
- **Sessions:** revocation, logout-everywhere, rate-limit 429, and cross-origin
  403 all covered by route tests.

---

## Exit criteria

The D.6 spec's exit criteria are met:

1. **Recommendations keep identity + history across rescans.** ✅ (P1)
2. **No string parsing for rule identity anywhere.** ✅ (P2 — regex removed;
   grep for `Rule "` in engine/operator returns only the removed-in-tests
   assertion that no such string is emitted).
3. **Audit and recommendations never disagree.** ✅ (P3 — asserted in tests)
4. **No SSRF-reachable outbound fetch.** ✅ (P4)
5. **Exactly one authenticated deployment API.** ✅ (P5)
6. **Sessions can be revoked; auth is rate-limited; APP_SECRET is strong.** ✅ (P6)
7. **A schema fix requires editing one store path, guarded by a contract test.** ✅ (P7)
8. **No component over ~250 lines without justification.** ✅ (P8 — max 147)
9. **`extractSignals` failure paths are tested.** ✅ (P9)

---

## Final question

> *If we froze the architecture today, would I still be comfortable maintaining
> this codebase after it grows to 500,000 lines?*

# YES — with the same three caveats the D.5 review named, now that the
# foundation defects are closed.

**Why yes.** The four things D.5 said had to land before scale are done: the
recommendation identity/`ruleId` redesign (P1/P2), the unified issue engine
(P3), and the two critical perimeter security holes (P4/P5). On top of those,
the seams that matter at 500k LOC are now correct:

- **Identity is data, not prose.** A rule can be reworded, re-versioned, or
  re-scoped without breaking the operator, the learning loop, or a human's
  triage. That is the single property that lets an SEO ruleset grow to
  thousands of rules without the substrate rotting.
- **One evaluation pipeline.** Audit, dashboard, recommendations, operator, and
  reports read one findings source. New surfaces consume it; they don't fork it.
- **One store-write path with a drift guard.** Schema changes are a one-line
  edit plus a contract that fails if the two stores diverge. This removes the
  per-change velocity tax that kills large codebases.
- **The trust foundation is tested.** `extractSignals` now has a regression net,
  so a regex tweak can't silently corrupt every downstream number.
- **The UI is decomposable.** The God-file is gone; tabs are independent
  modules, so team size stops being bounded by one file's merge surface.

**The honest caveats — real work, not blockers.** These are the same items D.5
flagged as "expensive in six months," and D.6 deliberately did not expand scope
to cover them (this was a hardening release, not a feature release):

1. **Projected columns + query LIMITs at scale.** `listRecommendations` still
   ships full JSONB with no LIMIT, and the fields the product filters/sorts on
   (`severity`, `priorityScore`) remain blob-only. P7's column-map now makes
   adding extracted columns a one-line change, so this is unblocked — but it is
   not yet done. Acute at 10k+ recommendations per project.
2. **Rate limiting is per-process.** Correct on one instance; needs a shared
   store (Redis/Postgres) to be global across horizontally-scaled serverless.
   Documented in `rate-limit.ts`, not hidden.
3. **`FoundationStore` is still a 36-method fat interface.** ISP is not yet
   satisfied; segregating it (`UserStore`/`ScanStore`/…) is worthwhile before a
   second team owns a slice of it.

None of these three is a foundational defect — they are scaling investments the
architecture now *supports* cleanly, which is exactly the state you want before
committing to 500k LOC. The answer flips from D.5's **NO** to **YES** precisely
because the defects that made "NO" the honest answer — stringly-typed identity,
two disagreeing engines, unrevocable sessions, SSRF, an unauthenticated write
endpoint, and silent store drift — are closed and tested.
