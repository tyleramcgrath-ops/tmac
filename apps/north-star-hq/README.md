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

## Prototype status

Like `apps/reloop`, this is a fully functional UI running on **seeded/sample
data**, not live integrations:

- Every account gets a sample project seeded on signup (see
  `lib/foundation/seed.ts`) — some open recommendations, some already
  "deployed."
- "Deploying" a fix (Operator approve/deploy, or the Command Bar's
  `deploy-mission`) is simulated — see `lib/foundation/wp-execution.ts`. No
  real WordPress site is ever written to.
- Google Search Console / Analytics ("Live Trends") are never connected in
  this app, so those panels always show their honest "not connected" state
  rather than fabricated numbers.
- Storage is a local JSON file store (`.data/foundation/`, gitignored) — see
  `lib/foundation/store.ts`. On a serverless platform (e.g. Vercel) this
  directory is not guaranteed to persist across instances/cold starts; each
  instance re-starts from an empty store, and a fresh signup reseeds it.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in APP_SECRET (openssl rand -base64 32)
npm run dev
```

Open [http://localhost:3100](http://localhost:3100) (port 3100, so it can run
alongside the root RankForge app on 3000). Sign up for an account — one
signs you into a freshly seeded demo project.

## Stack

Next.js (App Router, Turbopack) · React · TypeScript · Tailwind CSS v4 ·
Three.js (the compass)
