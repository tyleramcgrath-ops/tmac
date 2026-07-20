-- Mission Atlas change-detection baseline (Phase G). One row per project —
-- the last OBSERVED gsc/backlinks/aiVisibility, so assembleAtlas can report
-- real "what changed since last time" instead of always comparing to nothing.
-- Same JSONB shape as every other entity; written only by assembleAtlas's own
-- output, never user input.

CREATE TABLE IF NOT EXISTS rf_atlas_history (
  project_id TEXT PRIMARY KEY REFERENCES rf_projects(id) ON DELETE CASCADE,
  captured_at TEXT NOT NULL,
  data JSONB NOT NULL
);
