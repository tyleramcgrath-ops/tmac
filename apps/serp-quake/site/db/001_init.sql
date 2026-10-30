-- SERP Quake accounts, migration 001. Same shape as Citation Gap's identity tables
-- (apps/citation-gap/db/001_init.sql) so the auth and Stripe code ports unchanged.

BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

CREATE TABLE users (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              citext UNIQUE NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),   -- the free trial runs from here
  -- A cache of Stripe: only the signed webhook writes plan and plan_status.
  stripe_customer_id text UNIQUE,
  plan               text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro')),
  plan_status        text NOT NULL DEFAULT 'none' CHECK (plan_status IN ('none','active','past_due','canceled')),
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
  token_hash bytea NOT NULL,   -- sha256 of the emailed token; the token itself is never stored
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at    timestamptz
);
CREATE UNIQUE INDEX login_tokens_hash_idx ON login_tokens (token_hash);

COMMIT;
