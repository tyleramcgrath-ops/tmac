import type { MarketStatusSnapshot } from './types'

// Market-hours detector.
//
// - Crypto trades 24/7.
// - US equities: 9:30am–4:00pm ET, Mon–Fri (excluding holidays).
// - Options: same regular-session window as equities (9:30am–4:00pm ET).
//
// Times are computed in America/New_York regardless of server timezone using
// Intl. This is intentionally conservative: when in doubt we report CLOSED so
// the engine will not trade. A small static holiday list is included; extend it
// or replace with a broker getMarketHours() call for authoritative data.

const US_MARKET_HOLIDAYS_2024_2026 = new Set<string>([
  // YYYY-MM-DD (US market full closures)
  '2024-01-01', '2024-01-15', '2024-02-19', '2024-03-29', '2024-05-27',
  '2024-06-19', '2024-07-04', '2024-09-02', '2024-11-28', '2024-12-25',
  '2025-01-01', '2025-01-20', '2025-02-17', '2025-04-18', '2025-05-26',
  '2025-06-19', '2025-07-04', '2025-09-01', '2025-11-27', '2025-12-25',
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25',
  '2026-06-19', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25',
])

interface EtParts {
  year: number
  month: number
  day: number
  weekday: number // 0=Sun..6=Sat
  hour: number
  minute: number
}

function etParts(date: Date): EtParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  })
  const parts = fmt.formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }
  let hour = parseInt(get('hour'), 10)
  if (hour === 24) hour = 0 // some environments emit 24 for midnight
  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
    weekday: weekdayMap[get('weekday')] ?? 0,
    hour,
    minute: parseInt(get('minute'), 10),
  }
}

function dateKey(p: EtParts): string {
  const mm = String(p.month).padStart(2, '0')
  const dd = String(p.day).padStart(2, '0')
  return `${p.year}-${mm}-${dd}`
}

export function isEquityMarketOpen(now = new Date()): boolean {
  const p = etParts(now)
  if (p.weekday === 0 || p.weekday === 6) return false
  if (US_MARKET_HOLIDAYS_2024_2026.has(dateKey(p))) return false
  const minutes = p.hour * 60 + p.minute
  const open = 9 * 60 + 30 // 9:30
  const close = 16 * 60 // 16:00
  return minutes >= open && minutes < close
}

// Options regular session matches the equity regular session.
export function isOptionsMarketOpen(now = new Date()): boolean {
  return isEquityMarketOpen(now)
}

export function getMarketStatus(now = new Date()): MarketStatusSnapshot {
  return {
    crypto: true, // 24/7
    equities: isEquityMarketOpen(now),
    options: isOptionsMarketOpen(now),
    asOf: now.getTime(),
  }
}

/**
 * Whether a given asset type is currently tradable by the engine. Crypto is
 * prioritised when equity/options markets are closed; equities/options only
 * trade inside their valid sessions.
 */
export function isAssetTradable(assetType: 'crypto' | 'equity' | 'option', now = new Date()): boolean {
  switch (assetType) {
    case 'crypto':
      return true
    case 'equity':
      return isEquityMarketOpen(now)
    case 'option':
      return isOptionsMarketOpen(now)
  }
}
