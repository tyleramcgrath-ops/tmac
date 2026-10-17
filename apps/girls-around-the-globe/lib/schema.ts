// Idempotent schema, applied on first query. Plain SQL so it runs unchanged on
// Postgres and PGlite.
export const SCHEMA = [
  `create table if not exists users (
    id text primary key,
    email text unique,
    password_hash text,
    name text not null,
    birthdate date not null,
    gender text not null,
    show_me text not null default 'everyone',
    city text not null,
    country text not null default '',
    flag text not null default '',
    bio text not null default '',
    vibe text not null default 'casual-ongoing',
    languages text not null default '',
    interests text not null default '',
    occupation text not null default '',
    traveling text,
    prompts jsonb not null default '[]',
    palette text not null default '#e8436a,#1b1838',
    verified boolean not null default false,
    is_seed boolean not null default false,
    seed_likes_back boolean not null default false,
    passport text,
    premium_until timestamptz,
    stripe_customer_id text unique,
    last_active timestamptz not null default now(),
    created_at timestamptz not null default now()
  )`,
  `create table if not exists photos (
    id text primary key,
    user_id text not null references users(id) on delete cascade,
    mime text not null,
    data bytea not null,
    position int not null default 0,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists photos_user_idx on photos (user_id, position)`,
  `create table if not exists swipes (
    swiper_id text not null references users(id) on delete cascade,
    target_id text not null references users(id) on delete cascade,
    liked boolean not null,
    super boolean not null default false,
    created_at timestamptz not null default now(),
    primary key (swiper_id, target_id)
  )`,
  `create index if not exists swipes_target_idx on swipes (target_id, liked)`,
  `create table if not exists messages (
    id bigserial primary key,
    sender_id text not null references users(id) on delete cascade,
    recipient_id text not null references users(id) on delete cascade,
    body text not null,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists messages_pair_idx on messages (sender_id, recipient_id, id)`,
  `create table if not exists reports (
    id bigserial primary key,
    reporter_id text not null references users(id) on delete cascade,
    reported_id text not null references users(id) on delete cascade,
    reason text not null,
    created_at timestamptz not null default now()
  )`,
  // Video calls between matches, and their WebRTC signalling messages.
  `create table if not exists calls (
    id text primary key,
    caller_id text not null references users(id) on delete cascade,
    callee_id text not null references users(id) on delete cascade,
    status text not null default 'ringing',
    created_at timestamptz not null default now(),
    answered_at timestamptz,
    ended_at timestamptz
  )`,
  `create index if not exists calls_callee_idx on calls (callee_id, status)`,
  `create table if not exists call_signals (
    id bigserial primary key,
    call_id text not null references calls(id) on delete cascade,
    from_id text not null,
    kind text not null,
    payload jsonb not null,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists call_signals_idx on call_signals (call_id, id)`,
  // Free now, Into tags and Discreet mode.
  `alter table users add column if not exists available_until timestamptz`,
  `alter table users add column if not exists into_tags text not null default ''`,
  `alter table users add column if not exists discreet boolean not null default false`,
  // "Share my plan": a private link a member sends a friend before meeting up.
  `create table if not exists plans (
    token text primary key,
    owner_id text not null references users(id) on delete cascade,
    match_id text not null references users(id) on delete cascade,
    place text not null,
    starts_at timestamptz not null,
    note text not null default '',
    created_at timestamptz not null default now(),
    expires_at timestamptz not null
  )`,
];
