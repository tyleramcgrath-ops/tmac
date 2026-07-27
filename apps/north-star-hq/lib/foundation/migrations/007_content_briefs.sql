-- Content Studio — persist AI-drafted, competitor/keyword-informed blog briefs.
--
-- Same JSONB-with-projected-key-columns shape as every other entity. SERP
-- research and the generated draft live inside `data`; a brief only becomes a
-- real WordPress post when a user explicitly deploys it (wp_post_id/link are
-- set on `data` at that point, not projected here). Forward-only + idempotent.

CREATE TABLE IF NOT EXISTS rf_content_briefs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES rf_projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS rf_content_briefs_project_idx ON rf_content_briefs (project_id, created_at DESC);
