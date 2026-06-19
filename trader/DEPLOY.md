# Deploying TMAC Trader

Three ways to get a clickable URL, from fastest to most capable.

> ⚠️ **Not financial advice. Paper mode by default.** A fresh deployment never
> sends real orders — live trading stays disabled until you enable it in Risk
> Controls *and* configure an approved broker.

---

## Option A — One-click on Vercel (demo / UI)

**Best for:** instantly clicking around the dashboard.
**Caveat:** Vercel is **serverless**. The always-on engine **Start** loop and the
in-memory paper state are **not** persistent there — the UI renders, quotes
update, and the manual **tick** works, but the continuous background engine and
saved state need a persistent host (Options B/C). Good for a look; not for
leaving a bot running.

### Steps (about 2 minutes, free tier)

1. Click the **Deploy with Vercel** button in the [README](./README.md), or go
   to <https://vercel.com/new>. Sign in with GitHub.
2. Select the **`tmac`** repository. If you're deploying this feature branch
   before it's merged, choose the branch in the import screen.
3. Set **Root Directory** to **`trader`** (click *Edit* next to Root Directory).
   Framework auto-detects as **Next.js**. The one-click link presets this for you.
4. **Environment Variables:** none required for paper mode. Optional:
   | Name | When you need it |
   |---|---|
   | `APP_SECRET` | only to save broker API keys from the in-app Settings page (`openssl rand -hex 32`) |
   | `RH_CRYPTO_API_KEY` / `RH_CRYPTO_PRIVATE_KEY` | only for **live** crypto trading |
5. Click **Deploy**. You'll get a permanent `https://…vercel.app` link.

---

## Option B — One-click-ish on Render (persistent — engine runs)

**Best for:** a hosted URL where the continuous engine loop actually runs and
paper state persists on disk.

1. Go to <https://dashboard.render.com> → **New** → **Web Service** and connect
   the `tmac` repo (and branch).
2. Configure:
   | Field | Value |
   |---|---|
   | **Root Directory** | `trader` |
   | **Runtime** | Node |
   | **Build Command** | `pnpm install && pnpm build` |
   | **Start Command** | `pnpm start` |
   | **Instance Type** | any (a paid instance avoids the free tier sleeping) |
3. (Optional) add `APP_SECRET` / broker keys as above.
4. **Create Web Service.** Render gives you a persistent `https://…onrender.com`
   URL. Because it's a long-running Node process, **Start** keeps the engine
   ticking and `./.data/state.json` persists across requests (attach a disk if
   you want it to survive redeploys).

The same recipe works on **Railway** or **Fly.io** — root directory `trader`,
build `pnpm install && pnpm build`, start `pnpm start`.

---

## Option C — Docker (anywhere, fully self-contained)

**Best for:** your own machine, a VM, or any container host — the engine runs
continuously and state persists in a volume.

```bash
cd trader
docker compose up --build
# → http://localhost:3000
```

`docker-compose.yml` mounts a `trader-data` volume for `./.data` so your paper
account survives restarts, and includes an optional Postgres service for the
production data model (`prisma/schema.prisma`).

To run the image directly:

```bash
cd trader
docker build -t tmac-trader .
docker run -p 3000:3000 -v tmac-data:/app/.data tmac-trader
```

---

## After deploying

1. Open the URL → you're in **Paper Mode** (badge in the top bar).
2. **Strategies → New Strategy** — pick a plugin (e.g. Mean Reversion), symbols
   (`BTC-USD, ETH-USD`), and risk limits. It's created disabled.
3. Enable it, then press **Start** in the top bar. Watch the **Dashboard**,
   **Trade History**, and **Logs** populate.
4. Use **Backtesting** before considering live — live strategies require a
   passing backtest.

Going live is opt-in and gated: configure an approved broker in **API Settings**,
set the strategy to `live`, then arm the **Live Trading Master Switch** in
**Risk Controls** (with per-order confirmation on until you trust it).
