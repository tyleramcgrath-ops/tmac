# Scheduling & Workers

RankForge runs recurring SEO work (crawls, rank checks, GSC/GA4 syncs, data
fusion, opportunity generation, portfolio prioritization, daily missions,
deployment verification) as **database-backed jobs** processed by a real
background worker. There is a single job model — `ScheduledJob` holds the
current state of each recurring job, and `JobExecution` records an immutable
history row for every run.

## Architecture

```
ScheduledJob (one row per project × job type — current state)
   │  status: scheduled → queued → running → completed / completed_with_warnings
   │                                        → retrying → completed
   │                                        → blocked / failed
   │  lock: lockedAt / lockExpiresAt / lockOwner  (lease-based, recoverable)
   ▼
JobExecution (one row PER run — never overwritten)
      executionId, attempt, triggerType, timing, status, recordsProcessed,
      resultSummary, warnings, failureClass, failureReason (sanitized),
      diagnostics (sanitized), followUpJobs, workerVersion, lockOwner
```

- **`lib/scheduling/schedule.ts`** — pure scheduling logic: next-run calculation,
  failure classification, retry/backoff decisions, idempotency keys.
- **`lib/scheduling/worker.ts`** — pure worker core: worker identity, lock-lease
  math, the follow-up chain DAG + loop prevention, execution-report shaping,
  secret sanitization.
- **`lib/scheduling/handlers.ts`** — the handler registry (one handler per job
  type). Handlers call existing services; they never duplicate business logic.
- **`lib/scheduling/engine.ts`** — the DB-facing worker: atomic claim, run,
  history write, follow-up enqueue, retry application, lock release.

## The cron endpoint

`GET|POST /api/cron/jobs`

- **Auth**: requires `CRON_SECRET`. Send it as `Authorization: Bearer $CRON_SECRET`
  (Vercel Cron does this automatically). Missing/invalid secret → `401`. The
  endpoint **fails closed**: if `CRON_SECRET` is not set, every request is
  rejected.
- **Batch**: processes up to `JOB_BATCH_SIZE` jobs per tick (default `5`, max
  `25`). Conservative by design so one tick can't stampede the DB or exceed the
  function's wall-clock budget.
- **Returns**: a structured execution report:

```json
{
  "ok": true,
  "workerId": "w_iad1_...",
  "workerVersion": "1.0.0",
  "claimed": 5, "processed": 5,
  "succeeded": 1, "warned": 1, "blocked": 3, "failed": 0, "retried": 0,
  "items": [
    { "executionId": "...", "jobType": "fusion", "status": "completed",
      "durationMs": 42, "recordsProcessed": 12, "followUps": ["opportunities"] }
  ]
}
```

### Invoke it manually (dev)

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/jobs
```

## Atomic job claiming

Two workers must never execute the same job. A job is claimed with a
compare-and-set `updateMany`:

```
UPDATE "ScheduledJob"
   SET status='running', lockedAt=now, lockExpiresAt=now+lease, lockOwner=$worker
 WHERE id=$id AND status=$expected
   AND (lockedAt IS NULL OR lockExpiresAt <= now)
```

Only the worker whose `updateMany` affects exactly one row owns the job. A
simple read-then-update is **not** used — the WHERE clause is the atomic gate.
Lock leases (`lockExpiresAt`, 10 min) mean a crashed worker's jobs are recovered
automatically on the next tick (`recoverExpiredLocks`). Paused/disabled jobs and
jobs on non-active projects (paused/archived/deleted) are never claimed. Only
the lock owner can release its lock (`lockOwner` guard on release).

## Follow-up chaining

On success, a job enqueues downstream jobs via a **DAG that converges on
measurement**, so it always terminates:

```
crawl ─┐
priority_rankings ─┤
full_rankings ─┼─► fusion ─► opportunities ─► portfolio_priority ─► daily_mission
gsc_sync ─┤                                                          (terminal)
ga4_sync ─┘
deployment_verification ─► fusion
```

Loop prevention is enforced two ways: the graph has no cycles, and follow-ups
carry a chain depth capped at `MAX_CHAIN_DEPTH`. Each follow-up carries an
idempotency key (`project:jobType:window`); a follow-up already queued/running
with the same key is skipped, so re-processing the same source window never
spawns duplicate downstream work.

## Retries

Failures are classified (`classifyFailure`):

| Class | Meaning | Action |
| --- | --- | --- |
| `retryable` | timeout, network, quota, worker restart | retry w/ capped exponential backoff (1m, 2m, 4m … max 30m), up to `maxRetries`, then `failed` |
| `waiting_for_configuration` | integration not set up | `blocked`/`not_configured`, no retry |
| `waiting_for_user_action` | reconnect / choose property | `blocked`, no retry |
| `permanent` | permission revoked, project deleted | `failed`, no retry |

## Run Now

`POST /api/schedules/[id]/run` queues the job and executes it immediately
through the same engine, returning `{ jobId, executionId, status }`. The UI polls
`GET /api/executions/[executionId]` until a terminal state
(`completed`/`completed_with_warnings`/`blocked`/`failed`), showing the real
duration, records processed, and result summary — no fake progress. Viewer roles
cannot run jobs; cross-tenant requests `404`.

Related endpoints:

- `GET  /api/schedules/[id]/executions` — execution history for a job
- `GET  /api/executions/[executionId]` — one run's full detail + live job state
- `POST /api/executions/[executionId]/retry` — re-queue + run the parent job
- `POST /api/executions/[executionId]/cancel` — safe-cancel a running execution
  (marks the execution `cancelled`, preserves history, releases the lock)

## Handlers & honest states

Handlers call the existing services (crawl analysis, fusion engine, opportunity
builder, portfolio priority, daily mission). Jobs that depend on an external
provider report **honest blocked states** instead of fabricating data:

- `priority_rankings` / `full_rankings` → `blocked` (`waiting_for_configuration`)
  when no live SERP provider is configured (`SERP_PROVIDER` + key).
- `gsc_sync` / `ga4_sync` → `blocked` when there's no Google OAuth credential, no
  selected property, or authorization is required. Live sync runs once real
  Google credentials exist (`GOOGLE_CLIENT_ID/SECRET` + token encryption key).
- `crawl` performs a genuine bounded crawl (no external key needed) and persists
  a real audit; it reports `blocked` if the site blocks automated requests.

## Measurement windows

`deployment_verification` opens a `MeasurementWindow` per recent completed
deployment with a change-type-specific review delay (e.g. `conversion_tracking`
7d, `new_page` 42d). The outcome engine (`lib/measurement/windows.ts`,
`evaluateOutcome`) compares baseline vs current rank / GSC / GA4 evidence,
accounting for reporting delay, source freshness, sample size, conflicting
evidence, and seasonality — and never asserts success (or causation) without
fresh evidence that clears the noise floor.

## Vercel Cron

`vercel.json` schedules the worker:

```json
{ "crons": [ { "path": "/api/cron/jobs", "schedule": "0 6 * * *" } ] }
```

> **Plan note:** Vercel **Hobby** accounts allow only **daily** crons, so the
> schedule is once per day (06:00 UTC). On a **Pro** plan you can increase the
> frequency (e.g. `*/10 * * * *`) for near-real-time processing. Regardless of
> cron frequency, **Run Now** executes jobs immediately and the endpoint can be
> invoked manually, so execution is never gated on the cron cadence.

## Environment variables

| Var | Purpose |
| --- | --- |
| `CRON_SECRET` | Required. Authorizes `/api/cron/jobs`. Fails closed if unset. |
| `JOB_BATCH_SIZE` | Optional. Jobs per tick (default 5, max 25). |
| `DATABASE_URL` | Postgres connection. |
| `SERP_PROVIDER` + provider key | Enables live rank checks. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / token encryption key | Enables GSC/GA4 sync. |
