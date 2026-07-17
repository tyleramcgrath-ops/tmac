# RankForge — Architecture Review (Phase D.5)

Reviewed as the incoming Principal Engineer who will own this for five years, assuming it grows past 250k LOC. Brutally honest, including about decisions made in Phases A–D. Current size: ~13k product LOC (`app/` + `lib/`), 12 test files, 96 tests.

**One-line verdict:** the foundations are unusually disciplined for this class of app (honest integrity gates, real persistence with FKs, read-back verification, DIP on a store interface, no fabricated data), but there are **three structural defects that must be fixed before another major feature** — no stable cross-scan recommendation identity, two disagreeing issue engines, and a stringly-typed rule identity that the operator + learning loop depend on — plus **two critical perimeter security holes** (see `SECURITY_REVIEW.md`).

---

## 1. Module review

| Module | Purpose | Coupling / complexity | Verdict |
|---|---|---|---|
| **Crawler** (`app/api/crawl`, `seo-scan/analyze.ts`) | Fetch + extract + score real pages; integrity gate | Self-contained; shared `analyze.ts`. **`extractSignals` (the trust foundation) has zero root unit tests.** Overall-score weight formula duplicated in two shapes (`crawl:170` magic `/88` vs `seo-scan:134-163` dynamic). | Solid behavior, under-tested + duplicated scoring |
| **Recommendation Engine V2** (`lib/foundation/reco/**`) | Page-type & business-aware recommendations | Clean `Rule` abstraction; but **not open for extension** — a new rule touches rules.ts + engine `SCHEMA_SPECIFIC` set + fixgen switch + fixgen title-fallback (OCP violation). Tested against **one** real fixture (github). | Good design, closed downstream, thin test variety |
| **Operator** (`lib/foundation/operator/**`) | Fix → preview → safety → policy → deploy → verify → learn | Best-covered code in repo. But depends on `ruleId` recovered by regex from a display string (§3). Safety `DANGEROUS_RULES` set is mostly inert against `FixKind`; blocking currently rests on a **title regex**. | Strong pipeline, brittle rule identity + type confusion |
| **Persistence** (`store/filestore/postgres/migrate`) | Pluggable store, Postgres + file | DIP done right. But **two hand-duplicated impls, no drift guard** — the A12 "INSERT forgot a NOT-NULL column" bug class is still live. JSONB-blob model with few key columns. | Right seam, fragile duplication |
| **Projects/Orgs/Auth** (`types/auth/crypto`) | Tenancy, roles, sessions | 404-not-403 isolation, server-derived membership — genuinely good. But no session revocation, no rate limiting, per-route (not middleware) enforcement. | Good model, weak perimeter |
| **WordPress** (`wp-execution`, `api/.../wordpress`) | Deploy/verify/rollback | Read-back verification is excellent. **Legacy `app/api/wordpress/route.ts` is unauthenticated with env-cred fallback** (critical). | New path strong, legacy path dangerous |
| **"Decision/Business Context"** (`reco/business.ts`) | Money-page weighting | Thin (65 lines); coarse constants, not learned. Adequate, honestly scoped. | Fine for now |
| **API** (`app/api/**`) | Route handlers | Consistent `handled()` wrapper + `requireProjectRole`. Good. Some routes carry business logic that belongs in services. | Good, thickening |
| **UI** (`app/app/projects/[projectId]/page.tsx`) | Project workspace | **819-line God-file**: 5 tabs, 3 forms, 1 modal, a bulk operator console, 6 helpers — all in one client module. Two near-duplicate WP deploy forms. | Needs decomposition |
| **Database** | Postgres 16, JSONB + key columns | FKs/unique/CHECK present and tested on real PG. No projected columns for the fields the product filters/sorts on (`severity`, `priorityScore` are blob-only). | Correct, under-normalized |

## 2. SOLID review

- **SRP —** violated in the UI (819-line `page.tsx`) and the API client (`client.ts`, one flat 25-endpoint object + all DTOs). Backend modules are well-separated.
- **OCP —** the recommendation rule set is **not** open: adding a rule edits 4–6 files (rules registration + engine grouping set + fixgen switch + fixgen fallback + possibly safety/policy sets). A rule should *declare* `groupingScope`, `fixGenerator`, and `dangerous` so the engine/fixgen/safety read them off the rule.
- **LSP —** the two `FoundationStore` implementations are **not** substitutable: the file store enforces no FK cascade (`filestore.ts` `deleteProject` orphans children), no CHECK constraints, and diverges on email casing — so tests passing on the file store give false confidence for Postgres behavior.
- **ISP —** `FoundationStore` is a **36-method fat interface** spanning 7 concerns; every consumer and mock depends on all of it. Should be segregated (`UserStore`/`ScanStore`/`RecommendationStore`/`WpStore`/`AuditStore`).
- **DIP —** the one clearly-correct pillar: all business logic depends on the `FoundationStore` interface via `getStore()` + a test seam; no module imports a concrete store.

## 3. The three structural defects (detail)

### D-1. No stable recommendation identity across scans (correctness, not just scale)
Every scan mints `id: randomUUID()`, hard-binds `scanId`, and `createRecommendations` is INSERT-only — no upsert, no dedupe. **Re-scanning silently orphans the human's prior triage** (accepted/rejected/dismissed) and resets `history[]` to `[]`. The engine *has* a stable grouping key (`ruleId`/`ruleId|title`) but throws it away instead of persisting it as a cross-scan `issueId`. This is the single highest-leverage fix.

### D-2. `ruleId` is stringly-typed — recovered by regex from a display string
`Recommendation` has no `ruleId` field. The engine writes `` `Rule "${f.ruleId}", …` `` into `evidence.facts[]` (a presentational string) and `ruleIdFromRecommendation` parses it back with a regex, falling back to guessing from the title. **Fix generation, the operator preview/deploy pipeline, and the entire learning substrate all depend on that sentence never being reworded.** Promote `ruleId` to a first-class (and extracted-column) field.

### D-3. Two disagreeing issue engines
`buildFixes` (legacy, `analyze.ts`) still powers the Audit tab's "Critical issues" count and the technical sub-score (`scans/route.ts:50`), while the Recommendations list comes from the reco engine — with **different rules** (buildFixes flags missing canonical/OG/viewport/lang/thin-content that the reco engine has no rules for; it counts homepage multiple-H1 that the reco engine suppresses). A page can show "3 critical" in the audit and zero critical recommendations. The audit summary must be recomputed from the same findings.

Plus a **safety type-confusion** (verified): `DANGEROUS_RULES.has(fix.kind)` only ever matches `'canonical'`; robots/noindex/redirect/sitemap are gated **only** by a regex on the recommendation title. Blocking works today (and no rule emits those kinds yet), but the typed guard is a decoy — the moment a robots/redirect rule ships, by-kind blocking silently fails.

## 4. Domain model

Correct enough to build on **after D-1/D-2**: Project→Scan→Recommendation→Deployment with Org tenancy and FKs is the right spine. Gaps: no cross-scan issue identity (D-1), no first-class `ruleId` (D-2), Fixes/Previews are recomputed not persisted (minor audit gap between previewed-vs-deployed), Evidence is embedded (fine), and there is **no Knowledge Graph / Entity model** at all (named in the roadmap, absent in code — do not pretend otherwise).

## 5. Final questions

**1. If you inherited this today, what would you redesign before another major feature?**
Three things, in order: (a) **give Recommendation a persisted `ruleId` + a stable cross-scan `issueId`/dedupeKey and switch to upsert** — this fixes D-1 and D-2 together and unblocks extracted-column indexing; (b) **unify the two issue engines** so the audit summary and recommendations come from one findings source (retire `buildFixes` for the summary, or make the reco engine feed it); (c) **close the two critical security holes** (SSRF on `/api/crawl`, unauthenticated legacy `/api/wordpress`) — security must precede scale. I would also segregate `FoundationStore` and add a schema-drift guard before writing migration #2.

**2. Which Phase A–D decisions become expensive in six months?**
- JSONB-blob scans with **un-projected list queries** (`listScans`/`getScan` ship full `pages[]`; `listRecommendations` has no LIMIT) — bad today, acute at 10k+.
- **Hand-duplicated two-store with no drift guard** — every new field risks the A12 NOT-NULL bug; velocity tax on every schema change.
- **Stringly-typed `ruleId`** and **title-regex safety blocking** — silent failures the day a rule is reworded or a robots rule is added.
- **819-line `page.tsx`** — merge-conflict magnet and onboarding wall as the team grows.
- **`extractSignals` untested** — the trust foundation has no regression net; a regex tweak can corrupt every downstream number invisibly.

**3. Is the current architecture ready to support everything planned for Phases E–H?**

# NO

The **core seams are right** (store DIP, rule abstraction, operator pipeline, migrations), so this is *not* a rewrite — but four things must land first, or E–H will be built on sand: (1) the recommendation identity/`ruleId` redesign (D-1/D-2), (2) unifying the issue engines (D-3), (3) the two critical security fixes, and (4) projected columns + LIMITs before scale work. These are well-scoped (see `REFACTOR_BACKLOG.md`), roughly 2–4 focused weeks, not a ground-up rebuild. Adding a major feature *before* them compounds the debt at the exact layer every future feature depends on.
