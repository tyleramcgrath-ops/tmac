# Deploying on Coolify (self-hosted)

This app is built for Vercel, but nothing in it *requires* Vercel except the
features listed under [What does not work off Vercel](#what-does-not-work-off-vercel).
This document covers running it as a container on [Coolify](https://coolify.io).

## What was added for this

| File | Purpose |
| --- | --- |
| `Dockerfile` | Three-stage build (deps → builder → runner) producing a non-root runtime image. |
| `.dockerignore` | Keeps secrets, tests and build output out of the build context. |
| `next.config.ts` | `output: 'standalone'` so the runtime image carries only traced production deps. |
| `lib/bot-protection.ts` | Platform-aware BotID wrapper — see [What does not work off Vercel](#what-does-not-work-off-vercel). |
| `lib/foundation/env.ts` | Production detection no longer keys off Vercel-only env vars. |

### Why the `env.ts` change matters

`resolveStoreEnv()` previously treated a deployment as production only when
`VERCEL_ENV` was set, or when `NODE_ENV=production` **and** `VERCEL` was
defined. A container sets neither Vercel variable, so a real production deploy
fell through to the non-production branch and silently used the on-disk file
store at `.data/foundation` instead of Postgres. Every redeploy replaces the
container filesystem, so that would have discarded all accounts, projects,
scans and recommendations on each release — with no error. Production is now
determined by `NODE_ENV=production` alone (matching `requireAppSecret()`,
which already worked that way), so a container without `DATABASE_URL` fails
loudly at startup instead. Vercel behaviour is unchanged.

## Prerequisites

A server running Coolify. Coolify is a persistent PaaS — it wants a machine
that stays up, not a laptop or an ephemeral CI box.

- **Minimum**: 2 vCPU, 2 GB RAM, 20 GB+ disk, Ubuntu LTS (20.04 / 22.04 /
  24.04 — the install script officially supports Ubuntu LTS only).
- **Recommended for this app plus its Postgres**: 4 vCPU / 8 GB RAM. Next.js
  builds are memory-hungry; a 2 GB box can OOM during `pnpm build`. If you
  stay on a small box, build the image elsewhere and deploy it by tag.
- **Open ports**: 22 (SSH), 80, 443, plus 8000 (dashboard) and 6001/6002
  (realtime) — restrict 8000/6001/6002 to your own IP if you can.

Install Coolify on that server (official one-liner, run as root):

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Then open `http://<server-ip>:8000` and create the admin account.

## 1. Create the database

In Coolify: **Project → New Resource → Database → PostgreSQL**. Once it is
running, copy its **internal** connection URL (the one on the Docker network,
not the public one). It looks like:

```
postgresql://postgres:<password>@<service-name>:5432/postgres
```

Use the internal URL so database traffic never leaves the host. Do not expose
the database publicly.

## 2. Create the application

**New Resource → Application → Private/Public Repository**, point it at this
repo and branch, then set:

- **Build Pack**: `Dockerfile`
- **Dockerfile location**: `/Dockerfile`
- **Port**: `3000`
- **Health check path**: `/api/health`

## 3. Environment variables

Set these in the application's **Environment Variables** tab. They are
injected at runtime; nothing secret is baked into the image.

### Required

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | The internal Postgres URL from step 1. Without it the app refuses to start in production. |
| `APP_SECRET` | Sessions + credential encryption. **Minimum 32 characters**, enforced. Generate with `openssl rand -base64 32`. |

Rotating `APP_SECRET` invalidates every session and makes stored
per-project credentials (WordPress application passwords, Google OAuth
tokens) undecryptable. Set it once, back it up.

### Strongly recommended

| Variable | Notes |
| --- | --- |
| `APP_BASE_URL` | e.g. `https://app.example.com`. Used for links built outside a request context (the weekly digest). Off Vercel there is no `VERCEL_URL` fallback, so **without this those emails omit their links entirely**. |
| `CRON_SECRET` | Enables the scheduler endpoint. Unset ⇒ `/api/internal/cron` returns 503 and nothing scheduled ever runs. Generate like `APP_SECRET`. |
| `NEXT_PUBLIC_RF_ENABLE_ATLAS` | Set to show the Mission Atlas tab. Leave unset to hide it. |

`NODE_ENV=production` is already set in the Dockerfile — do not override it.

### Optional integrations

Every one of these is genuinely optional; unset means the corresponding
feature honestly reports itself as not configured rather than failing. See
`.env.example` for the full annotated list — `AI_GATEWAY_API_KEY`,
`PAGESPEED_API_KEY`, `SERPAPI_KEY`, `PERPLEXITY_API_KEY`, `MAJESTIC_API_KEY`,
`SCRAPE_API_TEMPLATE`, `LEADS_WEBHOOK_URL`, `SLACK_WEBHOOK_URL`,
`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_OAUTH_REDIRECT_BASE`,
`RF_SIGNUP_ALLOWLIST`, `RF_STAFF_EMAILS`, `RESEND_API_KEY` /
`RESEND_FROM_EMAIL`, `MAIL_WEBHOOK_URL`, and the `STRIPE_*` group.

Two need their redirect/callback URLs repointed at your Coolify domain:

- **Google OAuth** — register `https://<your-domain>/api/oauth/google/callback`
  in the Google Cloud console.
- **Stripe** — point the webhook endpoint at
  `https://<your-domain>/api/billing/webhook`.

## 4. Domain and TLS

Point a DNS A record at the server, set the domain on the application in
Coolify, and enable HTTPS. Coolify's bundled Traefik handles Let's Encrypt
issuance and renewal.

## 5. Database migrations

No migration step is needed. Migrations are forward-only, idempotent, and run
automatically on the first database connection, serialised across instances by
a Postgres advisory lock. Set `RF_SKIP_MIGRATE_ON_CONNECT=1` only if you
intend to run `pnpm db:migrate` yourself as a pre-deploy command.

The migration runner reads `lib/foundation/migrations/*.sql` from the working
directory at runtime, so those files are copied into the runtime image
explicitly by the Dockerfile as well as by Next's tracing.

## 6. The scheduler

Scans, rank tracking, digests and alerts are driven by
`POST /api/internal/cron`, which does one bounded pass per call and is safe to
over-fire. It needs an external trigger.

The existing `.github/workflows/scheduler-cron.yml` already does this every 15
minutes and needs no code change — repoint it by setting the repository
variable `CRON_APP_URL` to `https://<your-domain>` and the repository secret
`CRON_SECRET` to the same value you set on the application.

To keep it self-contained instead, add a Coolify **Scheduled Task** on the
application with a `*/15 * * * *` schedule running:

```bash
curl -fsS -X POST "$APP_BASE_URL/api/internal/cron" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## What does not work off Vercel

Be aware of these before switching production over.

**Vercel BotID** — `checkBotId()` is backed by a Vercel-only service. In
production off-platform it throws, which would have made `/api/chat` and
`/api/errors` return unhandled 500s. `lib/bot-protection.ts` now wraps it: on
Vercel the real verdict passes through unchanged; off Vercel it **degrades
open** — requests are treated as human and a warning is logged once at
startup. There is no self-hosted equivalent, so **bot screening on those two
routes is effectively disabled on Coolify**. If they are publicly reachable,
put rate limiting in front of them at Traefik, or wire in
`lib/foundation/rate-limit.ts`.

**Vercel Sandbox** — `@vercel/sandbox` powers the AI coding-agent tools and
every `/api/sandboxes/*` route. It provisions sandboxes through Vercel's API
and needs Vercel credentials; those routes will fail on a self-hosted box.
This affects the "vibe coding agent" surface, not the RankForge SEO product.

**AI Gateway** — `@ai-sdk/gateway` still works off-Vercel, but you must supply
`AI_GATEWAY_API_KEY` explicitly; on Vercel it is injected via OIDC.

## Verification status

Verified directly in a Linux sandbox before this was committed:

- `pnpm build` completes with `output: 'standalone'`.
- The standalone server boots, binds `0.0.0.0:3000`, and `/api/health` returns
  200 with `nodeEnv: "production"`.
- All 12 migration `.sql` files land in the standalone output.
- `resolveStoreEnv()` throws (rather than falling back to the file store) for
  a production container with no `DATABASE_URL`, and Vercel/dev behaviour is
  unchanged.
- Full suite: 621 tests passing; `tsc --noEmit` clean.

**Not verified**, because the sandbox's egress policy blocks container
registry blobs (`docker pull` of any base image returns 403) and
`cdn.coollabs.io`: the `docker build` itself, and a live run against a real
Postgres or a real Coolify instance. Build the image once locally
(`docker build -t tmac .`) before pointing production at it.
