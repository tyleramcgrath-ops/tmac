# Going Live — Robinhood Crypto (local app)

This connects the **server app** (`trader/`) to your real Robinhood account for
**crypto** trading. The double-click `standalone.html` stays paper-only — a
static file can't safely hold API keys or sign Robinhood requests.

> ⚠️ **Real money. Read this.**
> - Official Robinhood self-serve API = **crypto only**. Stocks & options need
>   approved/Agentic access and stay in **paper** until you have it.
> - Your **private key never leaves your machine** and is never committed. Only
>   the **public** key goes to Robinhood.
> - Live trading stays **off** until you explicitly arm it, and
>   **confirmation mode** (manual approve each order) stays on by default.
> - **Important – signal data:** the engine's *strategy signals* currently run
>   on a simulated price series. Order *execution* and account/balances are
>   real, but until real market data is wired into the signal engine (next
>   step), run live only with **confirmation mode ON** so you approve every
>   order — do not let it auto-fire live yet. See "Phase 2" below.

---

## Step 1 — Create your Robinhood Crypto API key (only you can do this)

1. In the Robinhood app/website, enroll in the **Crypto Trading API** and open
   the **API Credentials** portal.
2. Generate an Ed25519 keypair **on your machine**:
   ```bash
   pip install pynacl
   python3 -c "import nacl.signing,base64;k=nacl.signing.SigningKey.generate();print('PRIVATE (keep secret):',base64.b64encode(k.encode()).decode());print('PUBLIC  (give to Robinhood):',base64.b64encode(k.verify_key.encode()).decode())"
   ```
3. Paste the **PUBLIC** value into the Robinhood portal. It returns an
   **API key** string. Keep the **PRIVATE** base64 value somewhere safe.

## Step 2 — Configure the app

```bash
cd trader
cp .env.example .env.local
```
Edit `.env.local`:
```
APP_SECRET=            # optional; only needed to save keys via the UI
RH_CRYPTO_API_KEY=your-api-key-string
RH_CRYPTO_PRIVATE_KEY=your-base64-private-seed
```
`.env.local` is gitignored — it never gets committed.

## Step 3 — Run it locally

**Docker (recommended):**
```bash
cd trader
docker compose up --build
# app at http://localhost:3000
```
(Or without Docker: `pnpm install && pnpm build && pnpm start`.)

## Step 4 — Connect & verify (read-only first)

1. Open <http://localhost:3000> → **API Settings** → next to *Robinhood Crypto*
   click **Test connection**. You should see "connection OK".
2. Go to **Portfolio** — confirm it shows your **real** Robinhood crypto
   buying power / holdings. If balances look right, the connection is good.

## Step 5 — Arm live, carefully

1. **Strategies** → set a crypto strategy's mode to **live**, scope **crypto**,
   and run a **Backtest** (required before a live strategy can be enabled).
2. **Risk Controls**:
   - Keep **Confirmation mode ON** (you approve every live order).
   - Set **risk/trade** low to start (e.g. 1%).
   - Then enable the **Live Trading master switch** (it asks you to confirm).
3. Press **Start**. Live crypto orders will be **staged for your approval** in
   Portfolio → confirm one small order end-to-end before trusting it.
4. The **Stop Trading** kill switch halts everything and cancels staged orders.

---

## Phase 2 — real market data for signals (do before unattended live)

Today the signal engine evaluates on a simulated candle series. Before letting
the bot place live orders **without** per-order confirmation, wire a real feed:

- `lib/market-data.ts` → implement `fetchRealQuotes()` / `fetchRealCandles()`
  against an approved source (e.g. Robinhood crypto `best_bid_ask` for quotes,
  plus a candles provider) and set `USE_REAL_DATA = true`.
- The engine already refuses to trade on uncertain/missing data, so a failed
  fetch will skip the symbol rather than trade blind.

Ask and I'll implement this step with you.
