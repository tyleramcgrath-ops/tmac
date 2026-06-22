import { describe, expect, it } from 'vitest'
import { getMarketStatus, isAssetTradable, isEquityMarketOpen } from '../lib/market-hours'

// Build a Date that represents a specific America/New_York wall-clock time.
// We pick instants known to be in EST or EDT and assert behaviour.

describe('equity market hours', () => {
  it('is closed on weekends', () => {
    // Saturday 2025-06-21 15:00 UTC
    expect(isEquityMarketOpen(new Date('2025-06-21T15:00:00Z'))).toBe(false)
  })

  it('is closed on a known holiday (Independence Day 2025-07-04)', () => {
    // 2025-07-04 is a Friday holiday; 14:00 UTC would be 10:00 ET (within hours)
    expect(isEquityMarketOpen(new Date('2025-07-04T14:00:00Z'))).toBe(false)
  })

  it('is open midday on a normal weekday', () => {
    // Wednesday 2025-06-18 15:00 UTC = 11:00 EDT
    expect(isEquityMarketOpen(new Date('2025-06-18T15:00:00Z'))).toBe(true)
  })

  it('is closed overnight', () => {
    // Wednesday 2025-06-18 03:00 UTC = 23:00 prev day ET
    expect(isEquityMarketOpen(new Date('2025-06-18T03:00:00Z'))).toBe(false)
  })
})

describe('asset tradability', () => {
  it('crypto is always tradable', () => {
    expect(isAssetTradable('crypto', new Date('2025-06-21T15:00:00Z'))).toBe(true)
    expect(isAssetTradable('crypto', new Date('2025-06-18T03:00:00Z'))).toBe(true)
  })

  it('equities follow market hours', () => {
    expect(isAssetTradable('equity', new Date('2025-06-18T15:00:00Z'))).toBe(true)
    expect(isAssetTradable('equity', new Date('2025-06-21T15:00:00Z'))).toBe(false)
  })

  it('snapshot reports crypto open 24/7', () => {
    const snap = getMarketStatus(new Date('2025-06-21T15:00:00Z'))
    expect(snap.crypto).toBe(true)
    expect(snap.equities).toBe(false)
  })
})
