# TMAC Trader — Safe-by-Default Automated Trading Dashboard

A clean, professional automated trading platform that monitors markets and runs
modular strategies across **crypto (24/7)**, **equities** (market hours), and
**options** (options-session hours) — with **paper trading as the default** and
**live trading locked behind explicit, multi-step confirmation**.

> ⚠️ **Not financial advice.** This software is for education and research.
> Automated and live trading carry substantial risk and **you can lose money**.
> It defaults to paper trading; live trading is disabled until you enable it
> explicitly. Use only official, approved broker APIs. You are responsible for
> your own trades.

## One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftyleramcgrath-ops%2Ftmac%2Ftree%2Fmain%2Ftrader&project-name=tmac-trader&repository-name=tmac-trader)

Click the button, then make sure **Root Directory** is set to `trader` (Vercel
auto-detects it from the link). No environment variables are required — it
deploys straight into **paper mode**. Full walkthrough and alternatives in
**[DEPLOY.md](./DEPLOY.md)**.

> ℹ️ **Vercel is serverless**, so the always-on engine **Start** loop and the
> in-memory paper state don't persist between requests there — the dashboard and
> manual "tick" work, but the continuous background engine needs a **persistent**
> host. For the full experience, deploy with **Docker** or a long-running host
> (Render / Railway / Fly / a VM) — see [DEPLOY.md](./DEPLOY.md).

> The button deploys the `trader/` folder from the `main` branch, so it works
> once this PR is merged. To deploy from this feature branch first, use
> <https://vercel.com/new>, import `tmac`, pick the branch, and set Root
> Directory to `trader`.

---

## What's safe about it

- **Paper trading is the default.** No real orders are sent unless you flip the
  live master switch in Risk Controls *and* configure an approved broker.
- **Live trading is off until you enable it manually**, and a live strategy
  cannot be enabled until it has **passed a backtest**.
- **Per-order confirmation mode** (on by default) stages live orders for manual
  approval instead of firing them automatically.
- **Hard risk limits**: max account risk per trade, max daily loss circuit
  breaker, max open positions, max option premium per trade, **no naked
  options** (policy-enforced), **no margin** unless explicitly enabled.
- **Emergency “Stop Trading” kill switch** halts the engine and cancels pending
  orders from anywhere in the app.
- **Never trades on uncertain data** — unknown price, unknown balance, or an
  unconfigured broker is a hard stop.
- **Full audit trail**: every signal, decision, order, rejection and risk event
  is logged.
- **Only official/approved APIs.** Crypto uses Robinhood's official Crypto
  Trading API. Equities/options use an adapter scaffold ready for approved
  access (e.g. Robinhood Agentic Trading). **No password scraping, no browser
  automation, no unofficial private endpoints.**

## Quick start

```bash
cd trader
pnpm install
pnpm dev          # http://localhost:3000
```

That's it — it runs immediately in **paper mode** with a synthetic market-data
feed and an in-memory/JSON store (`./.data/state.json`). No database, no API
keys required.

Then:

1. Open **Strategies → New Strategy**, pick a plugin, symbols and risk limits.
   It's created disabled and in paper mode.
2. Enable it and press **Start** in the top bar. Watch the **Dashboard**,
   **Trade History** and **Logs** populate.
3. Run a **Backtest** before considering live.

### Run the tests

```bash
pnpm test         # vitest — risk rules, indicators, market hours, backtester
```

## Going live (optional, advanced)

1. **Crypto:** create an Ed25519 key pair, register the public key in the
   Robinhood API Credentials portal, and set `RH_CRYPTO_API_KEY` and
   `RH_CRYPTO_PRIVATE_KEY` (env vars, or via **API Settings** with `APP_SECRET`
   set). Use **API Settings → Test connection** to verify.
2. **Backtest** your strategy and set its mode to `live`.
3. In **Risk Controls**, enable the **Live Trading Master Switch** (requires a
   confirmation) and review every limit.
4. Keep **per-order confirmation mode** on until you trust the strategy.

Equities/options live trading requires approved API access — see
`lib/brokers/robinhood-equities-options.ts`. Until then they run in paper mode.

## Pages

Dashboard · Strategies · Portfolio · Watchlists · Trade History · Risk Controls ·
Backtesting · Paper Trading · API Settings · Logs — with dark/light mode, mobile
responsive layout, a clear Paper/Live status badge, live market status
(crypto/equities/options), and the emergency Stop Trading button always visible.

## Architecture

```
app/                Next.js App Router — pages + API routes (server-side only)
  api/state         sanitized snapshot for the dashboard (no secrets)
  api/engine        start | stop | kill | disengage | tick
  api/strategies    create | update | toggle | delete
  api/risk          update global risk settings / arm live
  api/orders        confirm | cancel staged live orders
  api/backtest      run a backtest
  api/watchlists    quotes + list management
  api/settings      key config flags, save/delete (encrypted), test connection
components/         dashboard UI (shell, charts, primitives)
lib/
  brokers/          BrokerAdapter interface + adapters
    adapter.ts                     getAccount/getPositions/getQuotes/placeOrder/
                                   cancelOrder/getOrders/getMarketHours
    paper.ts                       PaperTradingAdapter (fully functional)
    robinhood-crypto.ts            official Crypto API (Ed25519 request signing)
    robinhood-equities-options.ts  scaffold for approved access (clear TODOs)
  engine/           market-hours-aware trading engine
    signal-engine, order-manager, position-manager, risk-manager,
    audit-logger, scheduler (index.ts: runTick/startEngine/killSwitch)
  strategies/       modular plugins + indicators
  backtest/         historical simulation + metrics
  db/               Store (in-memory/JSON default; Prisma/Postgres = production)
  market-data.ts    deterministic synthetic feed (swap in a real provider)
  config.ts         env-first credential resolution + encrypted fallback
  crypto.ts         AES-256-GCM for stored secrets
prisma/schema.prisma  production Postgres data model (all tables)
tests/              vitest suites (risk rules are the priority)
```

### Trading engine

A market-hours detector gates each asset type: crypto trades 24/7 (and is the
focus outside equity hours); equities/options only act inside their valid
sessions. Each scheduler tick refreshes quotes, marks positions to market,
applies protective stop-loss/take-profit exits, then evaluates every enabled,
market-eligible strategy. Every candidate trade is sized and vetted by the risk
manager before the order manager routes it to the right broker adapter.

### Strategies

Moving Average Crossover · RSI Overbought/Oversold · Breakout · Momentum · Mean
Reversion · Custom Rule Builder. Each strategy supports symbol selection, max
position size, stop loss, take profit, daily max loss, max trades/day, post-loss
cooldown, a paper/live toggle, and backtest-before-activation.

### Broker adapters

All brokers implement one `BrokerAdapter` interface, so the engine is
broker-agnostic. `PaperTradingAdapter` is the fully-working default;
`RobinhoodCryptoAdapter` implements the official Crypto Trading API with Ed25519
request signing; `RobinhoodEquitiesOptionsAdapter` is a clearly-marked scaffold.

## Security

- API keys are **server-side only** and never sent to the browser (the state
  API exposes booleans, never secret values).
- **Order execution is server-side only.**
- Stored secrets are **AES-256-GCM encrypted** (`APP_SECRET`); env vars are
  preferred and always take precedence.
- Every action is written to the **audit log**; risk events are recorded
  separately.
- Inputs are validated with **zod**; the engine fails safe on any uncertainty.

## Production database

The default in-memory/JSON store is ideal for a single-user local or always-on
deployment. For multi-instance/serverless, provision Postgres, run
`prisma migrate dev` against `prisma/schema.prisma`, and implement a
`PostgresStore` matching the `lib/db` shape (swapping it in requires no engine
changes).

## Configuration

See [`.env.example`](./.env.example). Everything is optional — with no config
the app runs in paper mode. Relevant vars: `APP_SECRET`, `RH_CRYPTO_API_KEY`,
`RH_CRYPTO_PRIVATE_KEY`, `DATABASE_URL`.

## Docker

```bash
docker compose up --build      # app on :3000 (+ optional Postgres on :5432)
```

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS · zod · vitest · Prisma schema
(Postgres) · Docker. Lightweight dependency-free SVG charts keep the bundle
small.

---

**Reminder:** this is not a get-rich bot. It's a safety-first platform with
strong controls, full visibility, and paper trading first. Trade responsibly.
