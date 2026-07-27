-- Activity Stream: one append-only event per real domain lifecycle action
-- (mission created, approval granted, deployment finished, agent went
-- active/idle, ...). Every other consumer (Compass, Mission Queue, Agent
-- Roster, Morning Brief, notification center, audit) reads from this table
-- instead of independently re-deriving history from raw entity state.

CREATE TABLE IF NOT EXISTS rf_activity (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES rf_orgs(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES rf_projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  at TEXT NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS rf_activity_project_idx ON rf_activity (project_id, at DESC);
CREATE INDEX IF NOT EXISTS rf_activity_project_type_idx ON rf_activity (project_id, type, at DESC);
