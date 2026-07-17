-- 001_init — foundation schema with foreign keys, unique + tenant constraints.
-- Forward-only. Applied once; recorded in rf_schema_migrations.

CREATE TABLE IF NOT EXISTS rf_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rf_orgs (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rf_members (
  org_id TEXT NOT NULL REFERENCES rf_orgs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES rf_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','member')),
  data JSONB NOT NULL,
  PRIMARY KEY (org_id, user_id)
);
CREATE INDEX IF NOT EXISTS rf_members_user_idx ON rf_members (user_id);

CREATE TABLE IF NOT EXISTS rf_projects (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES rf_orgs(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT false,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rf_projects_org_idx ON rf_projects (org_id);
-- One active project per domain within an org (tenant-structural uniqueness).
CREATE UNIQUE INDEX IF NOT EXISTS rf_projects_org_domain_uq
  ON rf_projects (org_id, domain) WHERE archived = false;

CREATE TABLE IF NOT EXISTS rf_scans (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES rf_projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('queued','running','completed','partial','failed','cancelled')),
  created_at TEXT NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS rf_scans_project_idx ON rf_scans (project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS rf_recommendations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES rf_projects(id) ON DELETE CASCADE,
  scan_id TEXT NOT NULL REFERENCES rf_scans(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','accepted','modified','rejected','deployed','verified','rolled_back','dismissed')),
  created_at TEXT NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS rf_recs_project_idx ON rf_recommendations (project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS rf_wp_connections (
  project_id TEXT PRIMARY KEY REFERENCES rf_projects(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rf_wp_deployments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES rf_projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL
    CHECK (status IN ('applied','verified','verify_failed','failed','rolled_back')),
  created_at TEXT NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS rf_wp_deps_project_idx ON rf_wp_deployments (project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS rf_audit (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES rf_orgs(id) ON DELETE CASCADE,
  at TEXT NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS rf_audit_org_idx ON rf_audit (org_id, at DESC);
