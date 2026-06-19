import type { AssetType, Candle, Quote } from './types'

// Market data.
//
// By default this generates DETERMINISTIC synthetic price series so the app,
// paper trading and backtester all run with no external data dependency or API
// key. Each symbol gets a stable seed, so the same symbol always produces the
// same history — making backtests reproducible.
//
// To wire a real feed, implement fetchRealQuotes()/fetchRealCandles() against an
// approved market-data provider and flip USE_REAL_DATA. The engine NEVER trades
// on uncertain data: if a real fetch throws, callers must treat the symbol as
// unpriced and skip it (see SignalEngine / RiskManager).

const USE_REAL_DATA = false

// Reasonable starting prices so synthetic series look plausible per symbol.
const BASE_PRICES: Record<string, number> = {
  'BTC-USD': 65000,
  'ETH-USD': 3500,
  'DOGE-USD': 0.15,
  'SOL-USD': 150,
  AAPL: 220,
  SPY: 560,
  MSFT: 430,
  NVDA: 130,
  TSLA: 250,
}

function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Mulberry32 PRNG — small, fast, deterministic.
function rng(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function basePrice(symbol: string): number {
  return BASE_PRICES[symbol] ?? 50 + (hashSeed(symbol) % 200)
}

/**
 * Generate a deterministic candle series ending "now" (or at `endMs`).
 * intervalMs defaults to 1 day. Uses a seeded geometric random walk with mild
 * drift and volatility scaled by asset type (crypto is more volatile).
 */
export function generateCandles(
  symbol: string,
  assetType: AssetType,
  count: number,
  intervalMs = 86_400_000,
  endMs = Date.now(),
): Candle[] {
  const seed = hashSeed(symbol + ':' + count + ':' + intervalMs)
  const rand = rng(seed)
  const vol = assetType === 'crypto' ? 0.03 : 0.012
  const drift = 0.0003
  let price = basePrice(symbol)
  const candles: Candle[] = []
  const startMs = endMs - count * intervalMs
  for (let i = 0; i < count; i++) {
    const shock = (rand() - 0.5) * 2 * vol + drift
    const open = price
    const close = Math.max(0.0001, open * (1 + shock))
    const high = Math.max(open, close) * (1 + rand() * vol * 0.5)
    const low = Math.min(open, close) * (1 - rand() * vol * 0.5)
    const volume = Math.floor(1_000_000 * (0.5 + rand()))
    candles.push({ timestamp: startMs + i * intervalMs, open, high, low, close, volume })
    price = close
  }
  return candles
}

async function fetchRealCandles(): Promise<Candle[]> {
  // TODO: implement against an approved market-data provider.
  throw new Error('Real market data is not configured')
}

async function fetchRealQuotes(): Promise<Quote[]> {
  // TODO: implement against an approved market-data provider.
  throw new Error('Real market data is not configured')
}

export async function getCandles(
  symbol: string,
  assetType: AssetType,
  count: number,
  intervalMs = 86_400_000,
): Promise<Candle[]> {
  if (USE_REAL_DATA) return fetchRealCandles()
  return generateCandles(symbol, assetType, count, intervalMs)
}

export async function getQuotes(
  items: { symbol: string; assetType: AssetType }[],
): Promise<Quote[]> {
  if (USE_REAL_DATA) return fetchRealQuotes()
  const now = Date.now()
  return items.map(({ symbol, assetType }) => {
    // Use the most recent synthetic candle as the live price, with a tiny
    // intraday jitter seeded by the current minute for gentle movement.
    const candles = generateCandles(symbol, assetType, 200)
    const last = candles[candles.length - 1].close
    const minuteSeed = hashSeed(symbol + Math.floor(now / 60_000))
    const jitter = (rng(minuteSeed)() - 0.5) * 2 * (assetType === 'crypto' ? 0.004 : 0.0015)
    const price = Math.max(0.0001, last * (1 + jitter))
    const spread = price * (assetType === 'crypto' ? 0.0005 : 0.0002)
    return {
      symbol,
      assetType,
      price,
      bid: price - spread,
      ask: price + spread,
      timestamp: now,
    }
  })
}
