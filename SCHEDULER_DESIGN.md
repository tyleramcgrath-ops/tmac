# RankForge — Scheduler & Background Jobs (Design)

**Status:** v1 built and live — durable job queue, cron runner, schedule API,
Automation UI, and the server-side re-crawl driver (§6) are all shipped.
`scheduled_scan` now drives a real crawl end-to-end, not just a re-evaluation
of the latest scan. v2 (`outcome_capture`, `monitor` — §11) is still design-only.

This document is build-ready: it names the exact files, the data model, the
state machine, and the one genuinely hard part (driving the crawl server-side).

---

## 1. Goals / non-goals

**Goals (v1):**
- A durable job queue in the existing store (Postgres in prod, file store in dev).
- A **cron-triggered runner** that claims due jobs and executes them, safely,
  under Vercel's serverless model — no always-on worker required.
- One real job type end-to-end: **`scheduled_scan`** (recurring full-site crawl →
  recommendations refresh) with a per-project enable/frequency toggle.
- Idempotency, single-flight locking, bounded retries, and honest failure records
  — the same discipline as the WordPress execution engine.

**Goals (v2, designed here, built after v1):**
- **`outcome_capture`** — after a WordPress deployment, snapshot GSC/GA4 for the
  affected URL before/after and store the delta. This is the moat.
- **`monitor`** — detect regressions (score/rank/CWV drop, deindexation) and
  alert (Slack/email).

**Non-goals (now):**
- A distributed queue (Redis/SQS/Temporal). The Postgres-backed queue below is
  sufficient to low-thousands of jobs/day and keeps the stack at one dependency.
- Sub-minute scheduling. Cron granularity (hourly/daily) is the product need.
- A general workflow engine. Job types are a small closed enum.

---

## 2. Constraints & findings (why this design, not the obvious one)

1. **The crawl is browser-driven today.** `app/lib/crawl-runner.ts` loops the
   stateless `/api/crawl` batch endpoint from the client, then calls
   `startScan` → `completeScan`. A cron has no browser. **The worker must drive
   the batched crawl server-side** by calling the crawl logic directly (not over
   HTTP-to-self). This is the one non-trivial piece — see §6.
2. **The store is pluggable + conformance-tested.** New entities must be added to
   `types.ts`, both `PostgresStore` and `FileFoundationStore`, and
   `tests/store-conformance.test.ts`, plus a numbered migration. Jobs follow the
   existing JSONB-`data` table pattern (like `rf_wp_connections`).
3. **Serverless execution has a wall-clock cap** (`maxDuration`). A full crawl of
   300 pages will not finish in one function invocation. The runner therefore
   does **bounded work per invocation** and re-enqueues continuation, or runs the
   crawl in capped batches across several cron ticks (§6). No job may assume a
   long-lived process.
4. **Prod is single-region, in-process rate-limited.** The runner must assume it
   can be invoked concurrently (overlapping cron ticks, retries) and must
   **claim jobs atomically** so a job never runs twice at once (§5).
5. **Honesty-by-construction.** A job that cannot complete records `failed` with
   a real reason; it never writes a partial/fabricated scan as "complete." Mirrors
   the crawl `status>=400` gate and WP read-back verification.

---

## 3. Data model

New entity in `lib/foundation/types.ts`:

```ts
export type JobKind = 'scheduled_scan' | 'outcome_capture' | 'monitor'
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'

export interface Job {
  id: string
  orgId: string
  projectId: string
  kind: JobKind
  status: JobStatus
  runAt: string            // ISO — earliest time this job may run
  payload: Record<string, unknown>  // kind-specific (e.g. { scanId, cursor })
  attempts: number
  maxAttempts: number      // default 3
  lockedAt: string | null  // claim timestamp; null when not held
  lockedBy: string | null  // runner invocation id
  lastError: string | null
  result: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

// Per-project recurring schedule (separate from the transient Job rows).
export interface Schedule {
  id: string
  orgId: string
  projectId: string
  kind: JobKind
  cron: string             // e.g. '0 6 * * *' (daily 06:00 UTC)
  enabled: boolean
  nextRunAt: string        // materialized so the runner can query cheaply
  lastRunAt: string | null
  createdAt: string
  updatedAt: string
}
```

**Migration `006_jobs.sql`** (mirrors the existing JSONB pattern):

```sql
CREATE TABLE IF NOT EXISTS rf_jobs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES rf_projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('queued','running','succeeded','failed','canceled')),
  run_at TIMESTAMPTZ NOT NULL,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS rf_jobs_due_idx ON rf_jobs (status, run_at)
  WHERE status = 'queued';

CREATE TABLE IF NOT EXISTS rf_schedules (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES rf_projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  next_run_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data JSONB NOT NULL,
  UNIQUE (project_id, kind)
);
CREATE INDEX IF NOT EXISTS rf_schedules_due_idx ON rf_schedules (enabled, next_run_at);
```

Store methods (both impls + conformance): `enqueueJob`, `claimDueJobs(limit, now, runnerId)`,
`completeJob`, `failJob`, `listJobs(projectId)`, `upsertSchedule`, `listDueSchedules(now)`,
`getSchedule(projectId, kind)`.

---

## 4. Lifecycle / state machine

```
        materialize (cron tick, schedule due)
schedule ─────────────────────────────────────▶ job:queued
                                                   │ claim (atomic)
                                                   ▼
                                                job:running ──success──▶ succeeded
                                                   │  │
                                          error &  │  │ error & attempts>=max
                                       attempts<max│  ▼
                                                   │  failed  (honest lastError)
                                                   ▼
                                          re-queue (runAt = now + backoff)
```

- **Materialization:** the cron runner first advances any due `Schedule` into a
  concrete `queued` Job and rolls `nextRunAt` forward (cron-parsed). Keeps the
  hot path (claiming jobs) independent of cron math.
- **Terminal states** are `succeeded` / `failed` / `canceled`. Retries re-queue
  with exponential backoff (`runAt = now + 2^attempts min`, capped).

---

## 5. Concurrency & the claim (single-flight)

Atomic claim so overlapping invocations never double-run a job — Postgres:

```sql
UPDATE rf_jobs
SET status='running', locked_at=now(),
    data = jsonb_set(jsonb_set(data,'{lockedBy}',$1::jsonb), '{attempts}', ((data->>'attempts')::int+1)::text::jsonb)
WHERE id IN (
  SELECT id FROM rf_jobs
  WHERE status='queued' AND run_at<=now()
  ORDER BY run_at
  LIMIT $2
  FOR UPDATE SKIP LOCKED         -- the key: concurrent runners never collide
)
RETURNING data;
```

`FOR UPDATE SKIP LOCKED` is the standard Postgres work-queue primitive. The file
store (dev only) approximates with a mutex over the file — acceptable because dev
is single-process.

**Stale-lock reaper:** a job `running` with `locked_at` older than a lease
(e.g. 10 min) is returned to `queued` (the invocation that held it died). Run this
sweep at the top of each cron tick.

---

## 6. The hard part — driving the crawl server-side

`scheduled_scan` cannot reuse the browser crawl-runner. Plan:

1. **Extract the batch loop** from `app/lib/crawl-runner.ts` into a shared,
   environment-agnostic function `runCrawl({ origin, seedUrl, budget, onBatch })`
   that calls the crawl *logic* directly (import the handler/core, not `fetch`
   to a relative URL — there is no browser origin server-side).
2. The worker runs `runCrawl` with a **per-invocation page budget** (e.g. 40
   pages / ~45s), persisting a cursor in `job.payload`. If the crawl isn't done
   when the budget is hit, it **re-queues itself** (`runAt = now`) with the
   cursor — so a 300-page crawl completes across ~8 cron ticks without exceeding
   `maxDuration`. Honest `partial` handling is unchanged (blocked pages stay
   blocked/unknown, never scored).
3. On completion, call the existing `generateRecommendationsFromScan` +
   `persistScanRecommendations` + `coordinateProject` path — identical to the
   interactive flow, so scheduled and manual scans produce identical, evidence-
   backed output.

**Risk:** the crawl core may currently assume request context. Mitigation: the
refactor in step 1 must make it a pure function of `(origin, seed, budget)` with
injected fetch — also improves testability. Covered by a new
`tests/crawl-runner.test.ts` against a fetch double.

---

## 7. Cron trigger & auth

- **Trigger:** the product runs on Vercel's Hobby plan, which doesn't support
  platform crons, so `.github/workflows/scheduler-cron.yml` polls
  `POST /api/internal/cron` every 15 min via `curl` instead — a free,
  Hobby-compatible substitute. If the project ever moves to Vercel Pro, a
  `vercel.json` `crons` entry hitting the same route is a drop-in replacement;
  the route doesn't care who calls it.
- The route is **not** user-auth'd; it's protected by a shared secret:
  `Authorization: Bearer $CRON_SECRET`, which must be set identically in two
  places — the Vercel project's env vars, and the GitHub repo's Actions
  secret of the same name.
- The route does bounded work: reap stale locks → materialize due schedules →
  claim ≤N jobs → run each → record outcome. Always returns 200 with a summary;
  per-job failures never fail the whole tick.
- **Idempotent & safe to over-fire:** claiming is atomic, so a double cron tick is
  harmless.

---

## 8. API / UI surface (v1)

- `PUT /api/projects/[id]/schedule` `{ kind, cron, enabled }` — admin only,
  same-origin + rate-limited (reuse `enforceRateLimit`).
- `GET /api/projects/[id]/schedule` — current schedules + last/next run.
- `GET /api/projects/[id]/jobs` — recent job history (status, attempts, error).
- **UI:** a "Automation" card on the project dashboard — a toggle ("Re-audit this
  site automatically"), a frequency select (Daily / Weekly), next-run time, and
  the last few runs with honest status. No new top-level nav; fits the existing
  tabbed project view.

---

## 9. Testing plan

- `crawl-runner.test.ts` — server-side batched crawl to completion + cursor
  resume, against a fetch double (proves §6).
- `jobs-store` additions in `store-conformance.test.ts` — enqueue/claim/complete/
  fail/retry + the SKIP LOCKED single-flight property (two concurrent claims never
  return the same job).
- `cron-route.test.ts` — secret enforcement (401 without it), materialization,
  bounded claim, honest per-job failure isolation.
- Migration test extends `migrations.test.ts` (006 applies cleanly, idempotent).

---

## 10. Rollout

1. Migration 006 + store methods + conformance (no behavior change).
2. `runCrawl` refactor + test (no behavior change to the interactive path).
3. Cron route + `scheduled_scan` worker + `CRON_SECRET` env.
4. Schedule API + Automation UI card.
5. Enable for one pilot project; watch job history; then default-available.

Ships as its own PR, behind a `NEXT_PUBLIC_RF_ENABLE_SCHEDULES` flag until proven
live (matching the Atlas flag pattern).

---

## 11. Then: the flywheel (v2, `outcome_capture`)

Once §1–4 exist, `outcome_capture` is small: on each `wordpress.deploy`, enqueue a
job at `now + 14d` that pulls GSC clicks/impressions/position for the affected URL
for the 14 days before vs after, and stores the delta on the deployment record.
That converts the execution loop into an **outcome-labeled dataset of which fixes
actually moved metrics** — the thing no audit-only competitor can build, and the
input that makes RankForge's confidence scores provably better over time.
