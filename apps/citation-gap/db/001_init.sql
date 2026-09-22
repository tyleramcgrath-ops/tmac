-- Citation Gap — Practice and Agency schema, migration 001.
--
-- Additive by design. The free tier keeps working with no account and browser-local history
-- exactly as it does today; nothing below is on its path.
--
-- Two things in here are load-bearing and are tested rather than assumed (see test/schema.js):
--
--   scan_jobs   the resumable scan. A scan is seven phases and roughly 25 calls, several of
--               them headless Chromium loads, so it cannot fit one 60-second function. The
--               job carries a step and a cursor; /api/tick claims one due job with
--               FOR UPDATE SKIP LOCKED, does exactly one step, banks the payload and releases.
--               SKIP LOCKED is what makes two ticks firing at once take two different jobs
--               instead of both taking the same one.
--
--   search_keys the customer's own provider key, held so a schedule can run while their
--               browser is closed. The public FAQ makes promises about this that the schema
--               has to keep: the ciphertext and the secret never live together, only last4 is
--               ever readable back, and deleting the key stops the schedules.

BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------- identity

CREATE TABLE users (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              citext UNIQUE NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  -- plan and plan_status are a cache of Stripe. The webhook writes them; nothing else does,
  -- because the success redirect is not proof of payment and a forged one is not payment at all.
  stripe_customer_id text UNIQUE,
  plan               text NOT NULL DEFAULT 'free'
                       CHECK (plan IN ('free','practice','agency')),
  plan_status        text NOT NULL DEFAULT 'none'
                       CHECK (plan_status IN ('none','active','past_due','canceled')),
  plan_renews_at     timestamptz
);

CREATE TABLE sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),   -- the cookie value, opaque
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  last_seen_at timestamptz
);
CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_expiry_idx ON sessions (expires_at);

CREATE TABLE login_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- sha256 of the token that was emailed. The token itself is never stored, so a dump of this
  -- table cannot be replayed into logins.
  token_hash bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at    timestamptz
);
CREATE UNIQUE INDEX login_tokens_hash_idx ON login_tokens (token_hash);

-- ------------------------------------------------------- the customer's key

CREATE TABLE search_keys (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider   text NOT NULL CHECK (provider IN ('serpapi','serper')),
  -- AES-256-GCM. The key that decrypts this comes from SEARCH_KEY_SECRET in the environment
  -- and is deliberately NOT in this database: a dump on its own decrypts nothing.
  ciphertext bytea NOT NULL,
  iv         bytea NOT NULL CHECK (octet_length(iv) = 12),   -- per row, never reused
  tag        bytea NOT NULL CHECK (octet_length(tag) = 16),
  -- The only part of the key that is ever read back out. The UI shows this column; it never
  -- receives the plaintext, not even masked, because there is no reason for it to travel.
  last4      text NOT NULL CHECK (char_length(last4) = 4),
  added_at   timestamptz NOT NULL DEFAULT now(),
  last_ok_at timestamptz,
  last_err   text
);
CREATE UNIQUE INDEX search_keys_one_per_user ON search_keys (user_id);

-- -------------------------------------------------------------- the work

CREATE TABLE projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  url         text NOT NULL,
  keyword     text NOT NULL,
  gl          text NOT NULL DEFAULT 'us',
  hl          text NOT NULL DEFAULT 'en',
  created_at  timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX projects_user_idx ON projects (user_id) WHERE archived_at IS NULL;

CREATE TABLE scans (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  started_at     timestamptz NOT NULL DEFAULT now(),
  finished_at    timestamptz,
  trigger        text NOT NULL CHECK (trigger IN ('manual','schedule')),
  rank_score     int CHECK (rank_score BETWEEN 0 AND 100),
  answer_score   int CHECK (answer_score BETWEEN 0 AND 100),
  fingerprint    text,                                  -- sha256 of the page, for the reuse path
  reused_scan_id uuid REFERENCES scans(id) ON DELETE SET NULL,
  findings       jsonb,                                 -- the full report, as the browser builds it
  error          text
);
CREATE INDEX scans_project_idx ON scans (project_id, started_at DESC);

-- ------------------------------------------------------- the resumable job

CREATE TABLE scan_jobs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id    uuid NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  state      text NOT NULL DEFAULT 'queued'
               CHECK (state IN ('queued','running','done','failed')),
  -- Which phase, and how far into that phase's fan-out. A job that dies at competitor_pages
  -- cursor 5 resumes at competitor_pages cursor 5 with four phases already banked in payload.
  step       text NOT NULL DEFAULT 'target_page'
               CHECK (step IN ('target_page','serp_head','serp_questions','competitor_pages',
                               'competitor_renders','rescue_renders','target_render','score')),
  cursor     int NOT NULL DEFAULT 0 CHECK (cursor >= 0),
  payload    jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempts   int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 20,
  run_after  timestamptz NOT NULL DEFAULT now(),
  locked_by  uuid,                                      -- the invocation holding it
  locked_at  timestamptz,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX scan_jobs_one_per_scan ON scan_jobs (scan_id);
-- The claim query orders by run_after over the runnable states; this is the index it rides.
CREATE INDEX scan_jobs_due_idx ON scan_jobs (run_after)
  WHERE state IN ('queued','running');

-- ------------------------------------------------------------- schedules

CREATE TABLE schedules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  cadence     text NOT NULL CHECK (cadence IN ('daily','weekly')),
  day_of_week int CHECK (day_of_week BETWEEN 0 AND 6),
  hour_utc    int NOT NULL CHECK (hour_utc BETWEEN 0 AND 23),
  enabled     boolean NOT NULL DEFAULT true,
  next_run_at timestamptz NOT NULL,
  -- A weekly schedule without a day is not a schedule.
  CONSTRAINT weekly_needs_a_day CHECK (cadence <> 'weekly' OR day_of_week IS NOT NULL)
);
CREATE INDEX schedules_due_idx ON schedules (next_run_at) WHERE enabled;

CREATE TABLE alerts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  metric        text NOT NULL CHECK (metric IN ('rank','answer')),
  direction     text NOT NULL CHECK (direction IN ('drops_below','moves_by')),
  threshold     int NOT NULL,
  last_fired_at timestamptz
);
CREATE INDEX alerts_project_idx ON alerts (project_id);

-- ------------------------------------------- keeping the promise in the FAQ

-- The public FAQ says, of the stored provider key: "Delete it and the schedules stop."
-- That is a promise to a customer about their own credentials, so it is enforced here rather
-- than left to whichever code path happens to delete the row remembering to do it too. A
-- schedule with no key cannot run — it would either fail every tick or, far worse, keep running
-- on a key the customer believes they revoked.
CREATE FUNCTION stop_schedules_without_a_key() RETURNS trigger AS $$
BEGIN
  UPDATE schedules s
     SET enabled = false
    FROM projects p
   WHERE s.project_id = p.id
     AND p.user_id = OLD.user_id
     AND s.enabled;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER search_key_deleted_stops_schedules
  AFTER DELETE ON search_keys
  FOR EACH ROW EXECUTE FUNCTION stop_schedules_without_a_key();

COMMIT;
