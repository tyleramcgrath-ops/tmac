# Phase A12 — Production Proof & Final Foundation Validation

**Lead result: each remaining proof requirement, pass/fail.**

| Priority | Requirement | Result |
|---|---|---|
| P1 | Real PostgreSQL migrated & exercised | ✅ PASS — real PG 16, 3 bugs found & fixed |
| P2 | Rendered browser E2E | ✅ PASS — 4 Playwright specs, full journey |
| P3 | Live disposable WordPress | ⚠️ NOT ACHIEVABLE here → proven over real HTTP vs a WP-REST emulator; live WP not claimed |
| P4 | Remove/isolate Quick Scan | ✅ PASS — removed |
| P5 | Recommendation → deployment linkage | ✅ PASS — implemented + tested |

**Tests:** 62 passing against live Postgres (55 + 7 gated skips on the file store). `tsc` clean. `pnpm build` succeeds.

**Commits:** `91a7f8c` (P1), `1c6b16a` (P4+P5), `99913c5` (P2), `0ff4d19` (P3).

---

## 1. Exact commits & files

- `91a7f8c` — `lib/foundation/postgres.ts` (3 INSERT fixes), `tests/postgres-store.test.ts` (new)
- `1c6b16a` — removed `app/app/quick-scan/**`; `lib/foundation/wp-execution.ts` (`resolveWpTarget`), `app/api/projects/[projectId]/wordpress/route.ts` (resolve action + rec-status flip), `app/app/projects/[projectId]/page.tsx` (Deploy-from-recommendation modal), `app/app/lib/client.ts`, `app/app/layout.tsx`, `tests/wordpress-execution.test.ts`, `tests/wordpress-route.test.ts` (new)
- `99913c5` — `playwright.config.ts`, `e2e/foundation.spec.ts`, `scripts/e2e.sh`, `package.json` (test:e2e), `.gitignore`
- `0ff4d19` — `e2e/wp-emulator.php`, `tests/wp-http-emulator.test.ts`

## 2. PostgreSQL environment & migration evidence

- **Provider:** PostgreSQL **16.13** (Ubuntu), a real local cluster (`initdb` + `pg_ctl`, port 5433). Not the file store.
- **Migration command:** `pnpm db:migrate` (`DATABASE_URL` → `lib/foundation/migrate.ts`).
- **Run 1 output:** `Migrations complete. Applied: 001_init. Skipped (already applied): 0.`
- **Run 2 (idempotency):** `Migrations complete. Applied: none. Skipped (already applied): 1.`
- **Schema created:** 10 public tables (`rf_users, rf_orgs, rf_members, rf_projects, rf_scans, rf_recommendations, rf_wp_connections, rf_wp_deployments, rf_audit` + `rf_schema_migrations`), **9 foreign keys**, **4 CHECK constraints** (role, scan status, recommendation status, deployment status), unique email + partial-unique `(org_id, domain)`.
- **Tests against real PG (`tests/postgres-store.test.ts`, 7):** entity-graph persistence & read-back; unique-email violation; partial-unique `(org,domain)` violation; **status CHECK rejection**; **FK cascade** (delete project → scans gone); tenant isolation (B's org cannot see A's project, no membership); **reconnect** — fresh pool, data intact. Route integration tests also pass against Postgres (62/62 total with PG).
- **Bugs found *because* it was real Postgres** (invisible to the file store), all fixed in `91a7f8c`: `rf_members.role`, `rf_projects.domain`, and `rf_wp_deployments.status` NOT-NULL columns were never populated by their INSERTs.
- **No production file-store fallback:** `lib/foundation/env.ts` throws in production without `DATABASE_URL`/`APP_SECRET`; `getStore()` uses it. Postgres is required for prod/preview.

## 3. Browser E2E — files & results

- **Runner:** Playwright (`@playwright/test`) driving the **pre-installed Chromium** against the **production build** backed by **live Postgres** (`scripts/e2e.sh` migrates a fresh DB, boots `pnpm start`, runs the suite).
- **`e2e/foundation.spec.ts` — 4 specs, all green (`4 passed`):**
  1. protected route `/app/projects` → redirects to `/login` when unauthenticated
  2. invalid login → generic "Invalid email or password" error, stays on `/login`
  3. signup validation → short password rejected
  4. **full journey (20 steps):** signup → authenticated redirect → empty state → create project → **refresh persists** → logout → login → **project persists** → open project → **run a REAL crawl** → scan appears (Latest scan) → open recommendations → accept one / reject another (asserted via disabled-state) → **refresh persists the statuses** → cross-tenant visit → **access denied** → **no unexpected console errors** (intentional 401/404 network logs filtered; real JS errors still fail).
- **Command:** `pnpm test:e2e` (with `DATABASE_URL`, `APP_SECRET`).

## 4. Live WordPress — environment & evidence (honest)

- **Not achievable in this environment.** `wordpress.org` and `downloads.wordpress.org` return 403 (egress allow-list), apt archives 404, Docker registry unreachable, no MySQL/MariaDB. A real disposable WordPress could not be provisioned. **Live-WordPress validation is therefore NOT claimed.**
- **What was proven instead — real HTTP, not an in-process stub:** a WP-REST-compatible **PHP emulator** (`e2e/wp-emulator.php`) implements the exact endpoints the code calls, backed by a JSON state file, and the execution path runs against it over real network calls with real Basic-auth. `tests/wp-http-emulator.test.ts` (3, auto-skips without `php`):
  - resolve slug → post; deploy; **verify by independent read-back**; rollback; then an **independent HTTP read confirming the emulator's stored state actually reverted** to the original title
  - **verify_failed** when the server returns HTTP 200 but drops the value (the false-"verified" guard, over real HTTP)
  - **abort without applying** on invalid credentials (real 401 on before-capture)
- Plus the in-process double (`tests/wordpress-execution.test.ts`, 7) and the route-level rec-linkage test (`tests/wordpress-route.test.ts`, 2). **Verification never trusts the write response** — it always re-reads and compares.
- **Outstanding:** run the same flow against a genuine disposable WordPress + AIOSEO instance. The code is transport- and logic-verified; only the real-WP-plugin behavior is unproven.

## 5. Recommendation → deployment implementation

- **Data model:** a `WpDeployment` stores `projectId`, `recommendationId`, (source) via the recommendation's `scanId`, `approvedBy`, `before`, `after`, `verification`, `result`, rollback fields.
- **Flow:** from a recommendation, the UI (`DeployFromRecommendation` modal) calls the `resolve` action → `resolveWpTarget` maps the recommendation's **evidence URL → WP post by slug**, pre-filling post id/type. The user reviews evidence, enters/edits the proposed value (crawl recommendations are diagnostic, so the value is user-supplied — never fabricated), and confirms. Deploy stores the linkage and **flips the recommendation to `verified`** (or `deployed` if read-back mismatched); rollback flips it to `rolled_back`. History records every transition.
- **Honest fallback:** when the URL can't be matched to a post, the modal says so and requires manual post-id entry (no guessing).
- **Tests:** `resolveWpTarget` slug match + null fallback (unit + real-HTTP); route-level deploy-from-recommendation flips status to `verified` with history (`tests/wordpress-route.test.ts`).

## 6. Quick Scan decision

**Option A — removed.** `app/app/quick-scan/**` (the legacy localStorage dashboard, which still carried modeled estimates) is deleted. `/app` redirects to `/app/projects`. No ambiguous legacy path remains; the only remaining localStorage use is UI-preference-level, never authoritative business data.

## 7. Known limitations

- **Live WordPress** unproven (environment-blocked); emulator + double + real-HTTP cover transport and logic, not a real WP+AIOSEO install.
- **E2E scope:** one comprehensive journey + 3 targeted specs. Not yet wired into a CI workflow file (runs via `pnpm test:e2e`); the failed-crawl UI state and the WordPress deploy UI are not yet in an automated browser spec (WordPress deploy is covered at route + real-HTTP level).
- **Postgres in this session is a local cluster**, not a managed cloud instance; behavior against a specific managed provider's SSL/pooling is unverified beyond the generic `ssl` config.
- **Org/team management UI** remains minimal (roles enforced + displayed; no invite/role-change UI).

## 8. Updated beta-readiness score

| Dimension | A11 | A12 | Basis |
|---|---|---|---|
| Product completeness | 6 | 7 | rec→deploy linkage closed; quick-scan removed |
| Reliability | 5 | 7 | real-PG bugs fixed; 62 tests incl. PG + real-HTTP WP |
| Data integrity | 5 | 8 | live-PG constraints (FK/unique/CHECK) enforced & tested |
| Execution capability | 5 | 7 | deploy/verify/rollback proven over real HTTP + rec linkage |
| UX | 6 | 7 | authenticated project flow verified in a real browser |
| Security | 7 | 8 | tenant isolation proven on Postgres + in-browser |
| Scalability | 2 | 5 | real DB + migrations; still single-node, no jobs |

**Overall: 6.4 → ~7.2 / 10.**

## 9. Final Phase A status

**NOT COMPLETE** — by one criterion only.

Of the Definition-of-Done list, every item passes **except** *"Live disposable WordPress deploy/verify/rollback succeeds"*, which is **environment-blocked** (wordpress.org/apt/Docker unreachable, no MySQL) and therefore not claimed. Everything else is proven with real evidence: real PostgreSQL migrated + exercised (with 3 bugs fixed), no production file-store fallback, rendered browser E2E passing, projects/scans/recommendations persisted through the UI across refresh + re-login, tenant isolation on Postgres, recommendation→deployment linkage, Quick Scan removed, no fabricated product state, and all tests + build green.

To reach **COMPLETE**: run the existing WordPress flow (already transport- and logic-verified) against a genuine disposable WordPress + AIOSEO instance in an environment with outbound access to it. No further code is required for that proof — only reachable infrastructure.
