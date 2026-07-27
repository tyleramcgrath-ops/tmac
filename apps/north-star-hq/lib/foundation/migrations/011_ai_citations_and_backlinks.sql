-- AI citation tracking + backlink profile snapshots. Same JSONB-with-
-- projected-key-columns shape as every other entity. Rows only exist because
-- a real check ran against a real provider (Perplexity / Majestic) — nothing
-- here is ever fabricated or backfilled. Forward-only + idempotent.

CREATE TABLE IF NOT EXISTS rf_tracked_ai_queries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES rf_projects(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  created_at TEXT NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS rf_tracked_ai_queries_project_idx ON rf_tracked_ai_queries (project_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS rf_tracked_ai_queries_unique_idx ON rf_tracked_ai_queries (project_id, query);

CREATE TABLE IF NOT EXISTS rf_ai_citation_snapshots (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES rf_projects(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS rf_ai_citation_snapshots_lookup_idx ON rf_ai_citation_snapshots (project_id, query, checked_at);

CREATE TABLE IF NOT EXISTS rf_backlink_snapshots (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES rf_projects(id) ON DELETE CASCADE,
  checked_at TEXT NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS rf_backlink_snapshots_project_idx ON rf_backlink_snapshots (project_id, checked_at DESC);
