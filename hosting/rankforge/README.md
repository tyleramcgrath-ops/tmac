# RankForge on SiteGround

This branch (`rankforge-host`) is built automatically from the root of
`tyleramcgrath-ops/tmac` by `hosting/rankforge-host.sh`. Don't edit it here:
changes go to `main` and the `RankForge host branch` workflow pushes them.

SiteGround's Node.js hosting builds from the top of a branch, the same way
SaySites (`saysites-host`) and LawMatchNow (`lawmatchnow-host`) run.

## Site Tools settings

- Repository: `tyleramcgrath-ops/tmac`, branch `rankforge-host`
- Node 22 · install `npm install` · build `npm run build` · start `npm start`

## Environment variables

These are the same ones the old Vercel project (`tmac`) had:

| Variable | What for |
|---|---|
| `DATABASE_URL` | Neon Postgres (pooled). Without it RankForge falls back to a file store on disk. |
| `APP_SECRET` | Signs sessions and encrypts stored WordPress and Google credentials. Reuse the old value, or existing connections stop decrypting. |
| `CRON_SECRET` | `/api/internal/cron`. The `RankForge scheduler tick` workflow calls it every 15 min, so set the repo variable `CRON_APP_URL` to this site's URL. |
| `SERPAPI_KEY`, `PERPLEXITY_API_KEY`, `PAGESPEED_API_KEY` | Live SERP comparisons, AI-citation tracking and faster PageSpeed. All optional. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Connect Google (Search Console and Analytics). Add `https://<this site>/api/oauth/google/callback` to the OAuth client. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_CENTS` | Billing. Point the Stripe webhook at `https://<this site>/api/billing/webhook`. |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Verification and invitation emails. |

`.env.example` documents every option.

## What doesn't run off Vercel

The AI app-builder pages (`/api/chat`, `/api/sandboxes/*`) need Vercel Sandbox
and BotID. RankForge's SEO audits, recommendations, WordPress deploys, rank
tracking and scheduler don't use either.
