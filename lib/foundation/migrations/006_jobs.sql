-- Scheduler: durable job queue + per-project recurring schedules.
-- Entities are stored as JSONB `data` with a few projected/indexed columns,
-- matching the rest of the store. The job queue is drained by a cron-triggered
-- runner using a FOR UPDATE SKIP LOCKED claim (see SCHEDULER_DESIGN.md).

CREATE TABLE IF NOT EXISTS rf_jobs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES rf_projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL
    CHECK (status IN ('queued','running','succeeded','failed','canceled')),
  run_at TIMESTAMPTZ NOT NULL,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data JSONB NOT NULL
);
-- Hot path: find due, unclaimed work cheaply.
CREATE INDEX IF NOT EXISTS rf_jobs_due_idx ON rf_jobs (run_at)
  WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS rf_jobs_project_idx ON rf_jobs (project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS rf_schedules (
  project_id TEXT NOT NULL REFERENCES rf_projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  next_run_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data JSONB NOT NULL,
  PRIMARY KEY (project_id, kind)
);
CREATE INDEX IF NOT EXISTS rf_schedules_due_idx ON rf_schedules (next_run_at)
  WHERE enabled = true;
