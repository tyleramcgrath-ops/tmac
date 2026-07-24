// Channel concentration risk: pure, real-GA4-data-only detection of a
// single traffic channel dominating sessions. No fabricated risk score.

import { describe, expect, it } from 'vitest'
import { detectChannelConcentration, type Ga4ChannelSessionsRow } from '../lib/foundation/reco/channel-concentration'

function rows(sessionsByChannel: [string, number][]): Ga4ChannelSessionsRow[] {
  return sessionsByChannel.map(([channel, sessions]) => ({ channel, sessions }))
}

describe('detectChannelConcentration: real dominance only', () => {
  it('flags a channel with >= 70% of real sessions', () => {
    const out = detectChannelConcentration(rows([['Organic Search', 800], ['Direct', 100], ['Referral', 100]]))
    expect(out).toEqual({ channel: 'Organic Search', sessions: 800, totalSessions: 1000, share: 0.8 })
  })

  it('does not flag a healthy, diversified channel mix', () => {
    const out = detectChannelConcentration(rows([['Organic Search', 400], ['Direct', 300], ['Referral', 300]]))
    expect(out).toBeNull()
  })

  it('never flags with too little total traffic to mean anything', () => {
    const out = detectChannelConcentration(rows([['Organic Search', 40], ['Direct', 5]]))
    expect(out).toBeNull()
  })

  it('returns nothing for an empty report rather than inventing a risk', () => {
    expect(detectChannelConcentration([])).toBeNull()
  })

  it('respects a custom threshold', () => {
    const data = rows([['Organic Search', 600], ['Direct', 400]])
    expect(detectChannelConcentration(data, 0.7)).toBeNull()
    expect(detectChannelConcentration(data, 0.5)).toEqual({ channel: 'Organic Search', sessions: 600, totalSessions: 1000, share: 0.6 })
  })
})
