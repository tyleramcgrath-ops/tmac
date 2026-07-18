# RankForge — Refactor Backlog (Phase D.5)

Only items that genuinely improve the architecture. Cosmetic refactors excluded. Ordered within each tier by ROI. IDs cross-reference ARCHITECTURE_REVIEW / TECHNICAL_DEBT / SECURITY_REVIEW.

## CRITICAL (do before any Phase E feature)

| # | Item | Why | Effort |
|---|---|---|---|
| C1 | **Fix SSRF on `/api/crawl`** (S-1): route all outbound fetches through a private-IP/redirect-hop guard (reuse seo-intel's `isPrivateHostname`); validate resolved IPs. | Unauthenticated cloud-metadata/internal access. | S |
| C2 | **Authenticate + de-fang legacy `/api/wordpress`** (S-2): require project role, remove env-cred fallback. | Anonymous writes to the server's WP account. | S |
| C3 | **First-class `Recommendation.ruleId` + stable cross-scan `issueId`; upsert instead of INSERT-only** (D-1, D-2, debt #5/#7/#8). | Re-scans silently lose human triage; operator + learning depend on regex-parsing a display string. Fixes correctness *and* unblocks indexing. | M |
| C4 | **Unify the two issue engines** (D-3): audit "Critical issues" + technical score must come from the same findings as recommendations. | Users see two contradictory truths for one crawl. | M |

## HIGH

| # | Item | Why | Effort |
|---|---|---|---|
| H1 | **Session revocation** (S-3): per-user `tokenVersion` checked per request. | Stolen/logged-out tokens live 7 days. | S |
| H2 | **Rate limiting** on auth + crawl/deploy (S-4); audit login events (S-6). | Brute force is unthrottled and invisible. | S |
| H3 | **Typed `dangerous` flag on rules; block on it, not on `fix.kind`/title regex** (debt #6). | Deindex protection currently depends on title wording; by-kind guard is inert. | S |
| H4 | **Unit-test `extractSignals` + `buildFixes` + the 5 scorers + `normalizeCanonical`** (debt #13/#14). | The trust foundation has zero root tests. | M |
| H5 | **Project scan `summary` into columns / stop selecting `pages[]` on list paths; add LIMIT to `listRecommendations`** (scalability 1–2). | Latent perf bug at any scale; unbounded growth. | S |
| H6 | **Schema-drift guard** (debt #11): CI check reflecting `information_schema.columns` vs INSERT column lists, run against real Postgres. | A12 NOT-NULL bug class is still live. | S |

## MEDIUM

| # | Item | Why | Effort |
|---|---|---|---|
| M1 | **Decompose `page.tsx`** (819 lines) into a components directory; merge the two duplicate WP deploy forms (debt #4/#9). | Onboarding + merge-conflict cost. | M |
| M2 | **Segregate `FoundationStore`** into UserStore/ScanStore/RecommendationStore/WpStore/AuditStore (ISP). | 36-method fat interface. | M |
| M3 | **Make the rule set open for extension** (OCP): attach `groupingScope`/`fixGenerator`/`dangerous` to each rule so engine/fixgen/safety read them off the rule. | A new rule edits 4–6 files today. | M |
| M4 | **Single `overallScore()` helper**; delete the magic `/88` (debt #1). | Divergent scores between crawl and scan paths. | S |
| M5 | **Reco engine test variety**: ecommerce/local/blog fixtures, `indexable:false`, `mixedContent:true`, non-empty `internalTargets` so orphan detection is reachable; test `deriveBusinessContext` profile branches (debt #15). | One-archetype coverage. | M |
| M6 | **Transactional `createRecommendations`**; **file-store FK cascade parity** (debt #12, LSP). | Partial writes; dev/prod divergence. | S |
| M7 | **Skip migrate-on-cold-start by default; migrate in deploy** (debt #17). | DDL race across serverless fleet. | S |
| M8 | **Shared DTOs** between client and server (debt #3). | Silent DTO drift. | S |

## LOW

| # | Item | Why | Effort |
|---|---|---|---|
| L1 | Bump scrypt N (S-8); require APP_SECRET ≥32 + split signing/encryption keys (S-5). | Below current guidance. | S |
| L2 | Origin allowlist on mutations (S-9, defense-in-depth). | SameSite-only today. | S |
| L3 | Tamper-evident audit (hash chain) + audit read API (S-6). | Forensics. | M |
| L4 | Middleware-level tenant guard (S-7). | Future-route regression safety. | S |

## Sequencing

**Sprint 1 (safety + correctness foundation):** C1, C2, C3, C4, H1, H2, H3 — closes the two critical holes and the recommendation-identity/engine-unification defects that every future feature depends on.
**Sprint 2 (scale + test net):** H4, H5, H6, M4, M6, M7.
**Sprint 3 (maintainability):** M1, M2, M3, M5, M8, then the Low tier.

Nothing here is a rewrite. The core seams (store DIP, rule abstraction, operator pipeline, migrations) are sound; this backlog hardens the layer everything else sits on before Phases E–H add weight to it.
