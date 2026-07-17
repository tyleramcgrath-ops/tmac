# RankForge — Architecture Reality (Phase A3)

**Date:** 2026-07-17
**Purpose:** Establish a clear product boundary so work stops flowing across unclear seams. Documents the current architecture, the duplicate systems, a consolidation path, migration risks, and dependencies.

---

## Current architecture

The repository is a single Next.js 16 app (`vibe-coding-agent`) plus a second self-contained Next.js app in `seo-intel/`. Inside the root app, three unrelated products share one codebase, and a fourth (RankForge's real foundation) was added in Phase A.

```
/home/user/tmac
├── app/
│   ├── page.tsx, rankforge/**        RankForge marketing site        (static, now truthful — A1)
│   ├── app/**                        RankForge "Command Center" tool (real crawl → analytics → WP)
│   ├── widget/**                     Embeddable lead-capture audit widget (real)
│   ├── studio/**                     ⚠ Vercel vibe-coding template (orphaned, unrelated)
│   ├── shorts/**                     ⚠ Standalone Shorts generator (orphaned, unrelated)
│   └── api/
│       ├── crawl, seo-scan           RankForge crawler + analyzer (real; A2 integrity gate)
│       │   └── page-validity.ts      shared blocked/error-page gate (A2)
│       ├── wordpress                 legacy stateless WP proxy (superseded by foundation route)
│       ├── rankings, pagespeed, leads, forge, forge/rewrite   real, key-gated
│       ├── auth/**                   NEW (A4) — signup/login/logout/me, session cookies
│       ├── projects/**               NEW (A4/A6/A8) — projects, scans, recommendations, wordpress
│       ├── chat, models, errors, sandboxes   ⚠ template code (orphaned)
│       └── shorts/generate           ⚠ Shorts (orphaned)
├── lib/
│   ├── foundation/**                 NEW (A4/A6/A8) — types, store (pg + file), auth, crypto,
│   │                                 recommendations, wp-execution — the persistent core
│   └── (utils, hooks)                shared UI helpers
├── ai/**                             AI Gateway provider + Studio tools (gateway reused by Forge)
├── tests/**                          NEW (A2/A5) — 33 tests (page-validity, foundation, routes)
└── seo-intel/**                      Separate mature SEO app (own package.json, 55 tests, Postgres)
```

**Data flow today (RankForge, post-Phase-A):**
`/app` client runs the batched `/api/crawl` loop → posts the result to `/api/projects/{id}/scans` → server persists a `Scan` and derives stored `Recommendation`s → WordPress changes go through `/api/projects/{id}/wordpress` which writes a durable `WpDeployment` with verification and rollback. Auth/session gates every project route; the store is Postgres when `DATABASE_URL` is set, else a durable JSON file store.

**Legacy path still present:** `/app/page.tsx` also talks to the old stateless `/api/wordpress` and keeps audit state in `localStorage` (`rf_app_*`). Phase A added the persistent path alongside it; wiring the `/app` UI onto the foundation (replacing localStorage as the source of truth in the UI layer) is the next integration step (Phase B), intentionally not done here to keep Phase A reviewable and non-breaking.

---

## Duplicate / overlapping systems

| Capability | Implementation A | Implementation B | Verdict |
|---|---|---|---|
| Page crawl + extraction | root `app/api/seo-scan/analyze.ts` (regex) | `seo-intel/lib/crawler.ts` + `extract.ts` (Cheerio) | Two real crawlers. Keep root's for the live tool; seo-intel's is stronger (Cheerio, redirect chain) — converge later. |
| Scoring | root `analyze.ts` score* | `seo-intel/lib/scoring.ts` | Same methodology, two copies. Consolidate to one shared module. |
| Recommendations | `lib/foundation/recommendations.ts` (A8, persisted, evidence-backed) | `seo-intel/lib/recommendations.ts` (in-run) | Foundation version is the product direction (stored, provenance). |
| WordPress write | `lib/foundation/wp-execution.ts` (A6, durable, verify, rollback) | root `app/api/wordpress` + `seo-intel/lib/wordpress.ts` | Foundation version supersedes both. Legacy proxy kept only until `/app` UI migrates. |
| Persistence | `lib/foundation/store.ts` (pg + file) | `seo-intel/lib/db/**` (pg + file) | Same pattern, two schemas. Different concerns (projects vs single reports) — keep separate for now, share the pg pool later. |
| Export (PDF/CSV) | root: client JSON + print | `seo-intel/lib/export/**` (pdfkit, real) | seo-intel's is the real implementation to reuse. |

---

## The three product surfaces and their recommended disposition

### RankForge Core — the product
`app/page.tsx`, `app/rankforge/**`, `app/app/**`, `app/widget/**`, `app/api/{crawl,seo-scan,wordpress,rankings,pagespeed,leads,forge}`, all of `lib/foundation/**`, and the new `app/api/{auth,projects}/**`. This is what ships. Everything else in the root app is not RankForge.

### seo-intel — merge as a service/library, do not run as a second app
seo-intel is the most mature SEO engine in the repo (real 8-step pipeline, 55 tests, Cheerio extraction, real PDF export, DataForSEO/PSI/SERP integrations). It should **not** remain a separately-deployed app. Recommended path: extract its `lib/` (crawler, extract, keywords, compare, scoring, recommendations, export) into a shared package consumed by RankForge Core, and retire its standalone `app/` and duplicate DB layer. This gives RankForge the better crawler/extractor and real exports without maintaining two deployments. Risk: its scoring constants differ slightly from root's — reconcile deliberately, with tests, so scores don't silently shift.

### Dead / template code — archive out of the product
`app/studio/**`, `app/api/{chat,models,errors,sandboxes}/**`, `ai/tools/**`, `ai/messages/**`, `app/{chat,file-explorer,preview,logs,header,state,actions}.tsx`, most of `components/**`, and the standalone `app/shorts/**` + `app/api/shorts/**`. None is reachable from RankForge (nothing links to `/studio`). Keep only `ai/gateway.ts` + `ai/constants.ts` (used by Forge). These pull heavy deps (`@vercel/sandbox`, botid) and unrelated env config. **Recommendation:** remove from the RankForge deployment (archive to a branch/tag if the Studio demo has independent value). The README still describes this template product and should be rewritten to describe RankForge.

---

## Recommended consolidation path (ordered, low-risk first)

1. **Rewrite README** to describe RankForge (currently describes the Vibe Coding template). Zero code risk; removes the biggest identity confusion.
2. **Migrate the `/app` UI onto the foundation** (Phase B): sign-in, project selector, scans persisted server-side, recommendations from the store, WordPress via the auditable route. Retire `rf_app_*` localStorage-as-truth (localStorage may stay as a cache only).
3. **Delete/archive dead template code** once (2) confirms nothing shared remains beyond `ai/gateway.ts`.
4. **Extract seo-intel `lib/` into a shared package**; point RankForge's crawl/score/export at it; reconcile scoring constants under test; retire seo-intel's standalone app.
5. **Unify the two Postgres layers** to share one pool/connection while keeping distinct tables.

---

## Migration risks

- **Scoring drift:** root and seo-intel scoring differ. Any consolidation must pin expected scores in tests before switching, or historical scans become non-comparable.
- **localStorage → server cutover:** existing `/app` users have audits only in their browser. The cutover should offer a one-time "import current audit" rather than silently dropping it.
- **WordPress legacy route removal:** `/app`'s Optimizer still calls `/api/wordpress`. Do not delete that route until the UI is migrated to `/api/projects/{id}/wordpress`, or live deploys break.
- **Dead-code deletion:** `@vercel/sandbox` and botid are only used by template code; confirm no RankForge route imports them before removing (grep clean today, but re-verify at deletion time).
- **APP_SECRET now load-bearing:** sessions and WP credential encryption require `APP_SECRET`. Production must set it; without it the foundation routes fail closed (by design) — deployment docs must call this out.

---

## Dependencies (foundation additions)

- `pg` (Postgres driver) — foundation store, production path.
- `jose` (already present) — session JWT signing.
- Node `crypto` (scrypt, AES-256-GCM) — password hashing, secret encryption.
- `vitest` (dev) — root test suite.
No new runtime services are required for a single-node deployment (file store); Postgres is opt-in via `DATABASE_URL`.
