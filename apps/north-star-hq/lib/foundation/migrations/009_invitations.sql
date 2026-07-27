-- Team invitations — email a person into an existing org with a chosen role.
--
-- Same JSONB-with-projected-key-columns shape as every other entity. `token`
-- is the single-use secret in the emailed accept link (never the id, which is
-- safe to show in a member-list UI); indexed for O(1) accept-by-token lookup.
-- Forward-only + idempotent.

CREATE TABLE IF NOT EXISTS rf_invitations (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES rf_orgs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS rf_invitations_org_idx ON rf_invitations (org_id, created_at DESC);
