-- SaySites core: sites, pages (element trees as JSONB), page revisions,
-- redirects and media. A site belongs to an org, so SaySites reuses the
-- foundation's users, orgs, members and billing. The JSONB payloads are
-- validated by lib/saysites/schema.ts before they are written.

CREATE TABLE IF NOT EXISTS ss_sites (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES rf_orgs(id) ON DELETE CASCADE,
  subdomain TEXT NOT NULL UNIQUE,
  custom_domain TEXT UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ss_sites_org_idx ON ss_sites (org_id);

CREATE TABLE IF NOT EXISTS ss_pages (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES ss_sites(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','published')),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, slug)
);

-- Every save is a revision, so any change — by the owner, Sofie or the SEO
-- Operator — can be viewed and rolled back. `author` records which.
CREATE TABLE IF NOT EXISTS ss_page_revisions (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES ss_pages(id) ON DELETE CASCADE,
  author TEXT NOT NULL CHECK (author IN ('owner','sofie','operator','import')),
  author_user_id TEXT REFERENCES rf_users(id) ON DELETE SET NULL,
  note TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ss_page_revisions_page_idx ON ss_page_revisions (page_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ss_redirects (
  site_id TEXT NOT NULL REFERENCES ss_sites(id) ON DELETE CASCADE,
  from_path TEXT NOT NULL,
  to_path TEXT NOT NULL,
  status SMALLINT NOT NULL CHECK (status IN (301,302)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (site_id, from_path)
);

CREATE TABLE IF NOT EXISTS ss_media (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES ss_sites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  bytes INTEGER NOT NULL,
  mime TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ss_media_site_idx ON ss_media (site_id, created_at DESC);
