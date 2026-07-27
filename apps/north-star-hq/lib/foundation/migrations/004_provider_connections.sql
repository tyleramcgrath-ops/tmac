-- Phase H §1 — persist connected external providers (Google Search Console /
-- Analytics) with an ENCRYPTED OAuth token bundle.
--
-- Same JSONB-with-projected-key-columns shape as every other entity, so the
-- P7 column-map + store conformance contract cover it automatically. The
-- secret (access/refresh tokens) lives inside `data.credentialEnc`, AES-256-GCM
-- encrypted with APP_SECRET — the database never stores a plaintext token, and
-- routes never return it. Compound PK (project_id, kind): Search Console and
-- Analytics are independent connections for the same project. Forward-only +
-- idempotent. CASCADE so deleting a project removes its provider credentials.

CREATE TABLE IF NOT EXISTS rf_provider_connections (
  project_id TEXT NOT NULL REFERENCES rf_projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  created_at TEXT NOT NULL,
  data JSONB NOT NULL,
  PRIMARY KEY (project_id, kind)
);
CREATE INDEX IF NOT EXISTS rf_provider_connections_project_idx ON rf_provider_connections (project_id);
