# Deploying to Vercel (click-the-link guide)

This gets you a permanent `https://your-app.vercel.app` link that runs the full
tool. Total time: about 5 minutes. Everything below uses **free tiers**.

You need two things before you start:

1. A **SerpAPI key** — sign up free at <https://serpapi.com>, copy the key from
   *Dashboard → Your Account → API Key*. (Free plan includes 100 searches/month.)
2. A **GitHub account** connected to Vercel (Vercel will prompt you).

---

## Step 1 — Import the project into Vercel

1. Go to <https://vercel.com/new>.
2. Select this repository (`tmac`). If it isn't listed, click **Adjust GitHub
   App Permissions** and grant access, then refresh.
3. On the configure screen, set **Root Directory** to **`seo-intel`**
   (click *Edit* next to Root Directory and choose the `seo-intel` folder).
   This is required — the app lives in that subfolder.
4. Framework Preset should auto-detect **Next.js**. Leave build settings default.

**Don't click Deploy yet** — add the database and key first (Steps 2–3).

---

## Step 2 — Add a free Postgres database

The tool stores reports and streams progress between requests, so it needs a
database on Vercel (the local file store only works on a single always-on
server, not on serverless).

1. In the same import screen (or after first deploy, under **Storage**), click
   **Storage → Create Database → Postgres** (Neon-backed, free tier).
2. Accept the defaults and **Connect** it to this project.
3. Vercel automatically injects the connection string as `DATABASE_URL` /
   `POSTGRES_URL` — the app reads either, so there's nothing to copy. Tables are
   created automatically on first use.

> Prefer your own database? Add an environment variable named `DATABASE_URL`
> with any Postgres connection string (Supabase, Neon, RDS, …). SSL is enabled
> automatically for non-local hosts.

---

## Step 3 — Add environment variables

Under **Settings → Environment Variables** (or the import screen's
*Environment Variables* section), add:

| Name | Value | Required |
|---|---|---|
| `SERP_API_KEY` | your SerpAPI key | **Yes** |
| `ANTHROPIC_API_KEY` | your Claude key (recommended for AI suggestions) | No |
| `PAGESPEED_API_KEY` | Google PageSpeed key (raises rate limits) | No |
| `DATAFORSEO_API_KEY` | `login:password` for backlink data | No |
| `APP_SECRET` | run `openssl rand -hex 32` — only needed to save keys from the in-app Settings page | No |

Only `SERP_API_KEY` is required. Everything else degrades gracefully and the
report shows a clear note when a data source isn't connected.

---

## Step 4 — Deploy

Click **Deploy**. When it finishes, click the generated URL — that's your live
link. Open it, enter a page URL and keyword, and run a comparison.

---

## Plan note (important for reliability)

A full analysis crawls ~11 pages and calls external APIs, typically finishing in
30–60 seconds.

- **Vercel Pro** (300s function limit): runs reliably every time.
- **Vercel Hobby** (free, ~60s function limit): works for most runs, but a slow
  PageSpeed or AI response on a heavy keyword can occasionally hit the limit and
  leave a report stuck in *running* — just click **Re-run**. To make Hobby runs
  faster, set `PSI_COMPETITOR_LIMIT=1` (fewer PageSpeed checks) and leave
  `ANTHROPIC_API_KEY` unset (the rule-based recommendations are instant).

For a guaranteed-always-works free option without time limits, deploy to a
long-running host instead (Railway/Render): `pnpm build && pnpm start` with a
`DATABASE_URL` set. The app auto-detects it's not on Vercel and runs the
pipeline as a normal background job.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| "This deployment needs a database" | You skipped Step 2 — add Vercel Postgres or a `DATABASE_URL`, then redeploy. |
| "No SERP API key configured" | Add `SERP_API_KEY` in Settings → Environment Variables and redeploy. |
| Report stuck on *running* | Likely hit the Hobby time limit on a heavy run — click **Re-run**, or upgrade to Pro / lower `PSI_COMPETITOR_LIMIT`. |
| 404 on deploy | Root Directory wasn't set to `seo-intel` — fix it in Settings → General and redeploy. |
