# North Star Headquarters

A live, 3D mission-control dashboard — Compass, Agent Roster, Mission Queue,
Command Bar, and Executive Brief — for watching a coordinated team of AI SEO
agents work a project.

This is a standalone app, deliberately separate from the RankForge codebase
at the repo root. It was forked out of `app/desk` after `/desk` turned out to
be sharing RankForge's real login and real project data — which meant a
North Star Headquarters URL would silently show RankForge's own sign-in
screen and a real customer's data. This app has its own accounts, its own
session cookies, and its own seeded, fictional project data
("Aurora Outdoor Co."). It has no connection to RankForge's database,
customers, or deployments.

## Onboarding

There is no login/signup form anywhere in this app. A first-time visitor
lands on the still-sleeping room (`app/page.tsx`'s `DeskGate`/`DeskRoom`) and
is walked through a first-launch activation wizard
(`app/onboarding-wizard.tsx`) layered on top of it: name your Headquarters,
tell it what site to manage, pick a business type, skip past the
(non-functional, demo-only) integrations list, then "Enter Headquarters."
That last step calls `POST /api/onboarding/activate`, which silently
provisions a synthetic account + org + seeded project from the answers (see
`lib/foundation/seed.ts` — the project's name/domain/industry reflect what
was typed; the recommendations/activity themselves are illustrative demo
content) and sets the same session cookie a login would. The wizard then
hands off to the existing wake cinematic. A returning visitor (session
cookie still valid) skips straight to the quick-wake — the wizard only ever
runs once, gated purely on whether a session exists.

## Real Google Search Console / Analytics

Unlike the rest of this app's data, this one is genuinely real, not
simulated — the room has a full Google OAuth 2.0 flow (`lib/foundation/oauth/
google.ts`, ported from the root RankForge app along with its
`lib/foundation/external/providers/google.ts` query layer, neither of which
were reachable in this app until now). Open the **Integrations** rail
destination and click **Connect Google**: it's a real consent-screen
round-trip (`/api/oauth/google/callback`), tokens are stored AES-256-GCM
encrypted, and once granted, the Morning Briefing's trend sparkline and the
`/analytics/trend` + `/analytics/breakdown` endpoints start reading your
actual Search Console/Analytics data instead of their honest "not
connected" fallback. Needs `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` set
(see `.env.example`) — unset, the panel says so plainly instead of a dead
"Connect" button.

Everything else external (AI Search Citations, Competitor Intelligence,
industry Trends) has real *engine* code already sitting in
`lib/foundation/external/` from the same fork, but no real provider behind
it anywhere in this codebase — only `Null`/`Mock` implementations. Building
those for real needs either third-party API keys (ChatGPT/Perplexity/Gemini
for citations) or a working crawler (competitors) — a substantially bigger
project than the Google integration, intentionally left for later rather
than shipping panels that could only ever show "not connected."

## Ambient monitoring + voice

- **Live monitor** (top-left status line): a real, non-decorative "watching
  your site" indicator — it polls the actual Activity Stream
  (`app/live-monitor.tsx`) and shows genuine elapsed time since the last
  real event. No activity yet ⇒ it says so.
- **Voice** (top-right toggle): opt-in text-to-speech via the browser's
  native `speechSynthesis` — no external API/key. The Compass reads the
  wake greeting, the Morning Briefing's summary, and Command Bar responses
  aloud. One-way only; there is no microphone/voice input. Shared across
  every panel via `VoiceProvider` (`app/_lib/use-voice.tsx`) so the toggle
  in the header actually reaches every consumer — a plain per-component hook
  here would silently desync the moment more than one component read it.

## What the Compass can answer

The console has two answer paths, and the split is a safety boundary, not a
performance one.

**Registered actions** (`lib/foundation/commands/classify.ts`) are matched
deterministically against a fixed vocabulary and executed by
`commands/engine.ts` through the real recommendation/operator pipelines.
Everything that mutates lives here — approve, deploy, retry, cancel, pause,
resume, prioritise, roll back — and it is the *only* path that can act. No
model is involved at any point.

**Unrecognised input** used to hit a dead end ("I don't recognize that one
yet"). It now reaches `commands/converse.ts`, which answers in the Compass's
own words from a snapshot of the project's real state — missions, stages,
blocking reasons, agent activity, deployments. That path is read-only by
construction: the model is given no tools, and its reply is only ever
displayed and spoken. It is told to decline anything the snapshot doesn't
cover rather than guess, and to redirect action requests to the command word
that triggers the deterministic path.

Set `AI_GATEWAY_API_KEY` to enable it (same Vercel AI Gateway the root app
uses). Without it — or if the gateway errors or is slow — `converse()`
returns null and the console falls back to the previous canned message, so
the room never depends on the model being up. `NSHQ_COMPASS_MODEL` overrides
the model; the default is `anthropic/claude-sonnet-4.6`, chosen over the root
suite's Opus default because this answer is spoken aloud to someone waiting.

`npm run check:compass` covers both halves: that every mutating verb still
classifies to the deterministic path, and — when a key is present — that the
model answers from state, declines what the state doesn't cover, never claims
to have acted, and ignores instructions embedded in project data.

## Prototype status

Like `apps/reloop`, most of this app's data is **seeded/sample data**, not
live integrations (Google Search Console/Analytics being the one exception
above):

- Every activation seeds a sample project (see `lib/foundation/seed.ts`) —
  some open recommendations, some already "deployed."
- "Deploying" a fix (Operator approve/deploy, or the Command Bar's
  `deploy-mission`) is simulated — see `lib/foundation/wp-execution.ts`. No
  real WordPress site is ever written to.
- The onboarding wizard's "Connect your data" step is still UI-only for
  WordPress / SE Ranking / Semrush — every row shows "Available," and
  nothing it does actually connects anything (no real backing integration
  exists anywhere in the codebase for those three). Google Search Console
  and Analytics genuinely connect for real once activated — see the
  Integrations panel above.
- Storage is **PostgreSQL in production** and a local JSON file store for dev
  and tests — see `lib/foundation/store.ts` and `resolveStoreEnv` in
  `env.ts`. Set `DATABASE_URL` (Vercel's Postgres/Neon integration does this
  automatically; `POSTGRES_URL`/`POSTGRES_PRISMA_URL` also work). Schema
  migrations in `lib/foundation/migrations/` run themselves on first connect,
  serialized by a Postgres advisory lock so concurrent cold-starting
  instances can't race. Unset `DATABASE_URL` locally to use the file store,
  which defaults under the OS temp dir and honours `FOUNDATION_DATA_DIR`.

  **Production refuses to start without `DATABASE_URL`** rather than fall
  back to files, and that strictness is deliberate: the file store is
  per-instance and does not survive a serverless cold start. Relying on it in
  production meant a session cookie (a stateless signed JWT) stayed valid
  while the user row it pointed at disappeared, so the deployed app threw
  sporadic "Sign in required." 401s across every route, silently dropped
  stored Google OAuth credentials, and forced repeated re-onboarding.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in APP_SECRET (openssl rand -base64 32)
npm run dev
```

Open [http://localhost:3100](http://localhost:3100) (port 3100, so it can run
alongside the root RankForge app on 3000) and walk through the onboarding
wizard — it drops you into a freshly seeded demo project.

Locally this runs on the file store. To develop against Postgres instead
(recommended before touching anything storage-related, since that's what
production uses), point `DATABASE_URL` at any local instance — migrations
apply themselves on first connect:

```bash
DATABASE_URL=postgres://postgres@127.0.0.1:5432/northstar npm run dev
```

## Stack

Next.js (App Router, Turbopack) · React · TypeScript · Tailwind CSS v4 ·
Three.js (the compass) · PostgreSQL (`pg`)
