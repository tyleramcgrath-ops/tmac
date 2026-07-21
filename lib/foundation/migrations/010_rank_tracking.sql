-- Keyword rank tracking over time. Same JSONB-with-projected-key-columns
-- shape as every other entity. Snapshots are append-only real history —
-- nothing is ever fabricated or backfilled; a row only exists because a real
-- SERP check ran (see lib/foundation/scheduler/handlers.ts rank_tracking).
-- Forward-only + idempotent.

CREATE TABLE IF NOT EXISTS rf_tracked_keywords (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES rf_projects(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  created_at TEXT NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS rf_tracked_keywords_project_idx ON rf_tracked_keywords (project_id, created_at);
-- One tracked-keyword row per (project, keyword).
CREATE UNIQUE INDEX IF NOT EXISTS rf_tracked_keywords_unique_idx ON rf_tracked_keywords (project_id, keyword);

CREATE TABLE IF NOT EXISTS rf_rank_snapshots (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES rf_projects(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS rf_rank_snapshots_lookup_idx ON rf_rank_snapshots (project_id, keyword, checked_at);
