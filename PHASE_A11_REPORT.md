# Phase A11 — Foundation Integration Report (evidence)

**Branch:** `claude/rankforge-phase-11-pilot-hop710`
**Commits (this phase):** `1dae1c1`, `4af5ebe`, `c531f9a` (+ deploy-form follow-up)
**Tests:** 48 passing (`APP_SECRET=x pnpm test`). **Build:** `pnpm build` succeeds with all routes registered. **Typecheck:** clean.

This report is evidence, not status. Where a Definition-of-Done item is not fully met, it says so.

---

## 1. Exact commits

| Commit | Contents |
|---|---|
| `1dae1c1` | Versioned migrations + runner; env validation; scan/recommendation state machines |
| `4af5ebe` | Auth UI, API client, project UI + project-bound routes, scan persistence wiring, WordPress tab, retire localStorage app |
| `c531f9a` | Integration tests + WordPress test double |
| (follow-up) | WordPress compose-and-deploy form in the UI |

## 2. Files added / modified

**Added — backend:** `lib/foundation/migrations/001_init.sql`, `lib/foundation/migrate.ts`, `lib/foundation/env.ts`, `scripts/migrate.mjs`.
**Added — UI:** `app/login/page.tsx`, `app/signup/page.tsx`, `app/app/projects/layout.tsx`, `app/app/projects/page.tsx`, `app/app/projects/[projectId]/page.tsx`, `app/app/lib/{client.ts,auth-context.tsx,ui.tsx,crawl-runner.ts}`.
**Added — tests:** `tests/migrations.test.ts`, `tests/wordpress-execution.test.ts`, `tests/scan-rec-routes.test.ts`.
**Modified:** `lib/foundation/{types,store,postgres,filestore}.ts` (scan status + updateScan; migrations replace auto-DDL), `app/api/projects/[projectId]/{route,scans,recommendations}.ts` (lifecycle + expanded statuses), `app/app/page.tsx` (now a redirect to `/app/projects`), `package.json` (db:migrate, test scripts).
**Moved (retired):** `app/app/page.tsx` → `app/app/quick-scan/page.tsx` (+ `command.tsx`, `forge.tsx`).

## 3. Migration files

`lib/foundation/migrations/001_init.sql` — creates all 9 tables. Applied by `lib/foundation/migrate.ts` (`runMigrations`): creates `rf_schema_migrations` history table, applies each unapplied file in filename order inside its own transaction, idempotent (skips recorded versions), forward-only. Commands: `pnpm db:migrate` (local) / `pnpm db:migrate:prod` (uses `DATABASE_URL`). Postgres store also runs it on cold start unless `RF_SKIP_MIGRATE_ON_CONNECT=1`.

## 4. Pages and routes

**Pages:** `/login`, `/signup`, `/app` (redirect → `/app/projects`), `/app/projects`, `/app/projects/[projectId]` (Audit / Recommendations / WordPress / History tabs), `/app/quick-scan` (retired legacy dashboard, labeled unsaved).
**API routes:** `/api/auth/{signup,login,logout,me}`, `/api/projects`, `/api/projects/[projectId]`, `/api/projects/[projectId]/{scans,recommendations,wordpress}`. All project routes verify authenticated user → org membership → role → project ownership (tenant miss returns 404).

## 5. Removed localStorage references

`grep localStorage app/app/projects app/app/lib app/login app/signup` → **0**. Business data (projects, scans, recommendations, WordPress connections/deployments, audit) is server-side only. localStorage now survives **only** in `app/app/quick-scan/*` — the retired single-page scanner, which carries a visible banner: "Unsaved quick scan — results … are not saved." (The one hit in `app/app/page.tsx` is the word "localStorage" inside an explanatory comment in the redirect file.)

## 6. Database tables and constraints (`001_init.sql`)

`rf_users` (unique email), `rf_orgs`, `rf_members` (PK org_id+user_id; FKs → orgs, users ON DELETE CASCADE; role CHECK owner/admin/member), `rf_projects` (FK → orgs; partial UNIQUE (org_id, domain) WHERE not archived), `rf_scans` (FK → projects; status CHECK queued/running/completed/partial/failed/cancelled), `rf_recommendations` (FK → projects, scans; status CHECK 8-state), `rf_wp_connections` (PK project_id; FK → projects), `rf_wp_deployments` (FK → projects; status CHECK applied/verified/verify_failed/failed/rolled_back), `rf_audit` (FK → orgs). Indexes on all `(parent, created_at DESC)` access paths. `rf_schema_migrations` tracks applied versions.

## 7. Tests added

`migrations.test.ts` (4) — migration set covers every table, FKs/unique/CHECKs present, runner importable. `wordpress-execution.test.ts` (5) — WP double: deploy+verify, **verify_failed when value not persisted despite HTTP 200**, failed write, rollback+verify, failed rollback. `scan-rec-routes.test.ts` (6) — scan start→complete/partial/fail with persisted history; recommendation accept→reject→reopen with history; illegal transition rejected; cross-tenant 404. (Plus existing foundation/auth/page-validity = 48 total.)

## 8. Test results

```
Test Files  6 passed (6)
Tests       48 passed (48)
```

## 9. Manual verification steps

1. `APP_SECRET=secret123 pnpm dev` → open `/signup`, create an account (password ≥10 chars). You land on `/app/projects`.
2. Create a project (domain `github.com`). Open it → Audit tab → **Run scan**. A real crawl runs; results persist.
3. Refresh, or log out and back in (`/login`) → the project and its scan history are still there.
4. Recommendations tab: accept/reject/reopen — status persists across reload.
5. WordPress tab: connect (validated against the live site), then compose a title/meta change → Review & deploy → Confirm. History shows before/after + verification; Roll back restores prior values.
6. API-level (no browser) verification already run live this session: signup → project → real github.com crawl (7 pages) → persisted `completed` scan → 9 evidence-backed recommendations → survived re-login → tenant isolation returned HTTP 404.

## 10. Known limitations (honest)

- **No real-browser (Playwright) E2E.** Integration tests exercise the real route handlers and the WP execution service; the React pages are typechecked, build-verified, and smoke-tested via their APIs, but no automated test clicks through the rendered `/login` → project → deploy UI. Browser E2E remains.
- **Postgres path not exercised against a live database in this environment.** No Postgres is available in the sandbox, so tests run on the file store (same `FoundationStore` contract). The `pg` store + `001_init.sql` + runner are typechecked and structurally tested, but a live `pnpm db:migrate` apply was not run here. Must be validated against a real Postgres before production.
- **WordPress verified only against a controlled test double**, not a live WordPress instance (none available). Per the standing rule, no live-WordPress validation is claimed. The read-back verification logic is proven against the double, including the false-"verified" guard.
- **Recommendation → deploy is not one-click linked in the UI.** The WordPress deploy form is manual (post ID + fields). Passing a recommendation's suggested title/meta straight into a deployment (and flipping its status to `deployed`/`verified`) is wired in the data model but not yet in the UI.
- **Quick-scan legacy dashboard retained** (labeled unsaved). It still contains modeled revenue estimates (labeled as estimates) and its own client-side WordPress writer that does not create durable records. It is no longer the app home, but it is still reachable at `/app/quick-scan`; fully removing or porting it is outstanding.
- **Org/member management UI is minimal.** Roles are enforced server-side and displayed, but there is no invite-member or role-change UI yet (single-user personal org per signup).

## 11. Updated Phase A completion

**Definition-of-Done checklist:**

| Item | Status |
|---|---|
| Sign up in the UI | ✅ `/signup` |
| Log in through the UI | ✅ `/login` |
| Create a persistent project | ✅ verified live |
| Project survives refresh & login cycles | ✅ verified live |
| App no longer uses localStorage for business data | ✅ (retired to quick-scan) |
| Crawl run and persisted to the project | ✅ verified live |
| Recommendations persist + workflow states | ✅ 8-state, tested |
| WordPress deployments have durable records | ✅ tested (double) |
| Verification uses read-back comparison | ✅ tested |
| Rollbacks survive browser/session changes | ✅ durable records, tested |
| Production uses PostgreSQL | ⚠️ enforced by env (throws without DB); **not yet run against a live prod DB** |
| Versioned migrations exist | ✅ `001_init.sql` + runner |
| Tenant isolation tested | ✅ |
| Core journeys have integration tests | ✅ (route-level; not browser E2E) |
| No fabricated product state in the UI | ⚠️ projects UI clean; legacy quick-scan still has labeled modeled estimates |

**Completion estimate: ~85% of Phase A11.** The backend foundation and the authenticated, project-bound, persistent UI are integrated and working end-to-end on the file store, with route-level and execution-level tests. The remaining ~15% is: a live Postgres migration/run, real-browser E2E, live-WordPress validation, recommendation→deploy UI linkage, and fully removing the legacy quick-scan surface.

**Phase A is NOT complete** — two DoD items (live Postgres, and "no fabricated state" fully) are ⚠️, and browser E2E + live-WordPress proof remain. It is now a genuinely integrated single product (backend + frontend), not two disconnected halves.
