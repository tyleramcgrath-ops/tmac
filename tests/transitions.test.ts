// The recommendation state machine is the single source of truth for which
// status writes a *user* may make — both the PATCH route and the Command
// Engine gate on it. The execution-flow states (deployed / verified /
// rolled_back) are claims about what happened on a real WordPress site, so a
// human must not be able to write them by hand.

import { describe, expect, it } from 'vitest'
import { RECOMMENDATION_TRANSITIONS, canTransition } from '../lib/foundation/reco/transitions'
import type { RecommendationStatus } from '../lib/foundation/types'

const ALL = Object.keys(RECOMMENDATION_TRANSITIONS) as RecommendationStatus[]

describe('the ordinary triage loop stays open', () => {
  it('lets an open recommendation be accepted, modified, rejected, or dismissed', () => {
    expect(RECOMMENDATION_TRANSITIONS.open).toEqual(['accepted', 'modified', 'rejected', 'dismissed'])
  })

  it('lets a rejected or dismissed recommendation be reopened', () => {
    expect(canTransition('rejected', 'open')).toBe(true)
    expect(canTransition('dismissed', 'open')).toBe(true)
  })

  it('lets an accepted recommendation be walked back', () => {
    expect(canTransition('accepted', 'open')).toBe(true)
    expect(canTransition('accepted', 'rejected')).toBe(true)
  })

  it('lets a regressed recommendation re-enter triage', () => {
    expect(canTransition('regressed', 'accepted')).toBe(true)
    expect(canTransition('regressed', 'dismissed')).toBe(true)
  })

  it('lets a rolled-back recommendation be reopened for another attempt', () => {
    expect(canTransition('rolled_back', 'open')).toBe(true)
  })
})

describe('execution-flow states are not user-writable', () => {
  // "deployed", "verified" and "rolled_back" each assert something happened on
  // a live site. Every legitimate writer (deploy-one, the wordpress route)
  // sets them directly and never consults this table, so nothing is lost by
  // making them unreachable through it.
  it('never lets any status be hand-written to deployed', () => {
    for (const from of ALL) expect(canTransition(from, 'deployed')).toBe(false)
  })

  it('never lets any status be hand-written to verified', () => {
    // Otherwise a user could PATCH a deployed recommendation to "verified" and
    // the UI would report a read-back that never happened.
    for (const from of ALL) expect(canTransition(from, 'verified')).toBe(false)
  })

  it('never lets any status be hand-written to rolled_back', () => {
    for (const from of ALL) expect(canTransition(from, 'rolled_back')).toBe(false)
  })

  it('never lets any status be hand-written to regressed', () => {
    // Regression is detected against real rank/traffic data, not declared.
    for (const from of ALL) expect(canTransition(from, 'regressed')).toBe(false)
  })

  it('offers no onward move at all from deployed or verified', () => {
    expect(RECOMMENDATION_TRANSITIONS.deployed).toEqual([])
    expect(RECOMMENDATION_TRANSITIONS.verified).toEqual([])
  })
})

describe('the table itself is well-formed', () => {
  it('lists every status as a key', () => {
    const targets = new Set(Object.values(RECOMMENDATION_TRANSITIONS).flat())
    for (const t of targets) expect(ALL).toContain(t)
  })

  it('never lets a status transition to itself', () => {
    for (const from of ALL) expect(canTransition(from, from)).toBe(false)
  })

  it('lists no duplicate targets', () => {
    for (const from of ALL) {
      const targets = RECOMMENDATION_TRANSITIONS[from]
      expect(new Set(targets).size).toBe(targets.length)
    }
  })

  it('rejects an unknown status rather than throwing', () => {
    expect(canTransition('nonsense' as RecommendationStatus, 'open')).toBe(false)
  })
})
