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

## Prototype status

Like `apps/reloop`, this is a fully functional UI running on **seeded/sample
data**, not live integrations:

- Every activation seeds a sample project (see `lib/foundation/seed.ts`) —
  some open recommendations, some already "deployed."
- "Deploying" a fix (Operator approve/deploy, or the Command Bar's
  `deploy-mission`) is simulated — see `lib/foundation/wp-execution.ts`. No
  real WordPress site is ever written to.
- Google Search Console / Analytics ("Live Trends") are never connected in
  this app, so those panels always show their honest "not connected" state
  rather than fabricated numbers.
- The onboarding wizard's "Connect your data" step is UI-only — every
  integration always shows "Available," and nothing it does actually
  connects anything.
- Storage is a local JSON file store — see `lib/foundation/store.ts`.
  Defaults to a directory under the OS temp dir (serverless platforms like
  Vercel Functions ship a read-only filesystem outside of `/tmp`, so a
  repo-relative path would fail there). This is not guaranteed to persist
  across instances/cold starts; each instance re-starts from an empty store,
  and the next activation reseeds it. Override with `FOUNDATION_DATA_DIR` to
  pin a specific location (e.g. a repo-relative path for easier local
  inspection).

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in APP_SECRET (openssl rand -base64 32)
npm run dev
```

Open [http://localhost:3100](http://localhost:3100) (port 3100, so it can run
alongside the root RankForge app on 3000) and walk through the onboarding
wizard — it drops you into a freshly seeded demo project.

## Stack

Next.js (App Router, Turbopack) · React · TypeScript · Tailwind CSS v4 ·
Three.js (the compass)
