# Deploying to Vercel (click-the-link guide)

This gets you a permanent `https://your-app.vercel.app` link that runs the full
tool. **Three steps, about 3 minutes, free tier.** No database required.

Before you start, get a **SerpAPI key** — sign up free at <https://serpapi.com>,
copy the key from *Dashboard → Your Account → API Key* (free plan includes 100
searches/month). This is the only thing the app can't run without.

---

## Step 1 — Import the project

1. Open the **Deploy** button in the README, or go to <https://vercel.com/new>
   and select this repository (`tmac`). Log in with GitHub when prompted (this
   is the one-time authorization — Vercel needs it to build your code).
   If the repo isn't listed, click **Adjust GitHub App Permissions**, grant
   access, and refresh.
2. Set **Root Directory** to **`seo-intel`** (click *Edit* next to Root
   Directory and choose the `seo-intel` folder). This is required — the app
   lives in that subfolder. Framework auto-detects as **Next.js**.

## Step 2 — Add your SerpAPI key

In the **Environment Variables** section, add:

| Name | Value |
|---|---|
| `SERP_API_KEY` | your SerpAPI key |

That's the only required variable. (Optional extras below.)

## Step 3 — Deploy

Click **Deploy**. When it finishes, click the generated URL — that's your live
link. Enter a page URL and keyword and run a comparison; progress streams live
in the browser and the report opens when it's done.

---

## Optional environment variables

Add any of these under **Settings → Environment Variables** (then redeploy):

| Name | Value | Effect |
|---|---|---|
| `ANTHROPIC_API_KEY` | your Claude key | AI-written recommendations (otherwise rule-based) |
| `PAGESPEED_API_KEY` | Google PageSpeed key | Raises PageSpeed rate limits |
| `DATAFORSEO_API_KEY` | `login:password` | Backlink / domain-authority comparison |
| `APP_SECRET` | `openssl rand -hex 32` | Lets you save keys from the in-app Settings page |
| `PSI_COMPETITOR_LIMIT` | e.g. `1` | Fewer PageSpeed checks = faster runs (helps on the free plan) |

Everything is optional and degrades gracefully — the report shows a clear note
wherever a data source isn't connected. Nothing is ever faked.

---

## Optional: keep a saved report history

Without a database, analyses run on demand and open immediately, but they aren't
saved to a browsable history (the History page explains this). To enable saved
history, add a free Postgres database:

1. In your Vercel project, go to **Storage → Create Database → Postgres**
   (Neon-backed, free tier) and **Connect** it.
2. Vercel injects the connection string automatically (`DATABASE_URL` /
   `POSTGRES_URL` — the app reads either). Redeploy.

Tables are created automatically. Prefer your own database? Add a `DATABASE_URL`
env var with any Postgres connection string (Supabase, Neon, RDS, …) — SSL is
enabled automatically for non-local hosts.

---

## Plan note (important for reliability)

A full analysis crawls ~11 pages and calls external APIs, typically finishing in
30–60 seconds.

- **Vercel Pro** (300s function limit): runs reliably every time.
- **Vercel Hobby** (free, ~60s function limit): works for most runs, but a slow
  PageSpeed or AI response on a heavy keyword can occasionally hit the limit and
  end the run early — just click **Re-run**. To make runs faster, set
  `PSI_COMPETITOR_LIMIT=1` (fewer PageSpeed checks) and leave `ANTHROPIC_API_KEY`
  unset (the rule-based recommendations are instant).

For a guaranteed-always-works free option without time limits, deploy to a
long-running host instead (Railway/Render): `pnpm build && pnpm start`. The app
auto-detects it's not on Vercel and runs the pipeline as a normal background job,
with the built-in file store (no database needed) on a persistent disk.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| "No SERP API key configured" | Add `SERP_API_KEY` in Settings → Environment Variables and redeploy. |
| Run ends early / "Connection lost" | Likely hit the Hobby time limit on a heavy run — click **Re-run**, or upgrade to Pro / set `PSI_COMPETITOR_LIMIT=1`. |
| 404 on deploy | Root Directory wasn't set to `seo-intel` — fix it in Settings → General and redeploy. |
| History page says history is off | Expected without a database — analyses still run. Add Postgres (above) to save history. |
