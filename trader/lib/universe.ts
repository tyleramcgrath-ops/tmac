import type { AssetType } from './types'

// The tradable universe shown in the Strategies builder: major cryptos +
// ~100 momentum / large-cap US stocks. Used to let the user check symbols off
// instead of typing them.

export const CRYPTO_SYMBOLS = [
  'BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD', 'XRP-USD', 'ADA-USD', 'AVAX-USD',
  'LINK-USD', 'DOT-USD', 'MATIC-USD', 'LTC-USD', 'BCH-USD', 'ATOM-USD', 'UNI-USD',
  'ETC-USD', 'XLM-USD', 'NEAR-USD', 'APT-USD', 'ARB-USD', 'OP-USD', 'FIL-USD',
  'ICP-USD', 'HBAR-USD', 'VET-USD', 'INJ-USD', 'SUI-USD', 'SEI-USD', 'AAVE-USD',
]

export const STOCK_SYMBOLS = [
  'AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'TSLA', 'AVGO', 'AMD', 'NFLX',
  'ADBE', 'CRM', 'COST', 'PEP', 'CSCO', 'QCOM', 'TXN', 'INTC', 'AMAT', 'MU',
  'LRCX', 'KLAC', 'ASML', 'TSM', 'ARM', 'ON', 'ANET', 'DELL', 'SMCI', 'PLTR',
  'SNOW', 'DDOG', 'NET', 'CRWD', 'PANW', 'ZS', 'MDB', 'SHOP', 'UBER', 'ABNB',
  'DASH', 'RBLX', 'SOFI', 'HOOD', 'AFRM', 'UPST', 'PYPL', 'COIN', 'MARA', 'RIOT',
  'CLSK', 'MSTR', 'ENPH', 'FSLR', 'RUN', 'LLY', 'NVO', 'UNH', 'JPM', 'V',
  'MA', 'AXP', 'GS', 'MS', 'BAC', 'WFC', 'XOM', 'CVX', 'OXY', 'SLB',
  'COP', 'WMT', 'HD', 'LOW', 'NKE', 'SBUX', 'MCD', 'DIS', 'CMCSA', 'BA',
  'CAT', 'DE', 'GE', 'HON', 'RTX', 'LMT', 'F', 'GM', 'RIVN', 'LCID',
  'T', 'VZ', 'ORCL', 'IBM', 'NOW', 'INTU', 'WDAY', 'TEAM', 'PINS', 'SNAP', 'ROKU', 'TTD',
]

export const ALL_SYMBOLS = [...CRYPTO_SYMBOLS, ...STOCK_SYMBOLS]

const CRYPTO_SET = new Set(CRYPTO_SYMBOLS)
export function assetTypeOf(symbol: string): AssetType {
  return CRYPTO_SET.has(symbol) ? 'crypto' : 'equity'
}
