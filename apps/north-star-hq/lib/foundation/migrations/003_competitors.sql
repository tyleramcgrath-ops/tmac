-- Phase G §1 — persist tracked competitors.
--
-- Same JSONB-with-projected-key-columns shape as every other entity, so the
-- P7 column-map + store conformance contract cover it automatically. Overlap
-- metrics live inside `data` (graded Observations); they are computed from real
-- crawls and never fabricated. Forward-only + idempotent.

CREATE TABLE IF NOT EXISTS rf_competitors (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES rf_projects(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  created_at TEXT NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS rf_competitors_project_idx ON rf_competitors (project_id, created_at DESC);
-- One competitor domain per project.
CREATE UNIQUE INDEX IF NOT EXISTS rf_competitors_unique_idx ON rf_competitors (project_id, domain);
