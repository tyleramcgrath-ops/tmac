// Mobile-vs-desktop ranking gap: pure, real-GSC-device-data-only detection.
// No fabricated device rows or estimated positions.

import { describe, expect, it } from 'vitest'
import { detectMobileGap, type GscDeviceRow } from '../lib/foundation/reco/mobile-gap'

function row(key: string, position: number, impressions = 500): GscDeviceRow {
  return { key, position, impressions }
}

describe('detectMobileGap: real, meaningful device disparities only', () => {
  it('flags mobile ranking meaningfully worse than desktop', () => {
    const out = detectMobileGap([row('MOBILE', 12), row('DESKTOP', 6)])
    expect(out).toEqual({ mobilePosition: 12, desktopPosition: 6, gap: 6 })
  })

  it('does not flag ordinary noise under the threshold', () => {
    const out = detectMobileGap([row('MOBILE', 7), row('DESKTOP', 6)])
    expect(out).toBeNull()
  })

  it('does not flag when mobile actually ranks better', () => {
    const out = detectMobileGap([row('MOBILE', 5), row('DESKTOP', 10)])
    expect(out).toBeNull()
  })

  it('never flags without both device rows present', () => {
    expect(detectMobileGap([row('MOBILE', 12)])).toBeNull()
    expect(detectMobileGap([row('DESKTOP', 6)])).toBeNull()
  })

  it('never flags with too little impression volume on either device', () => {
    const out = detectMobileGap([row('MOBILE', 12, 5), row('DESKTOP', 6, 500)])
    expect(out).toBeNull()
  })

  it('matches device keys case-insensitively', () => {
    const out = detectMobileGap([row('Mobile', 12), row('Desktop', 6)])
    expect(out).toEqual({ mobilePosition: 12, desktopPosition: 6, gap: 6 })
  })

  it('returns nothing for an empty report rather than inventing a gap', () => {
    expect(detectMobileGap([])).toBeNull()
  })
})
