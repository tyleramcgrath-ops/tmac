import { describe, it, expect } from '@jest/globals'
import { computeDedupeKey } from '../consolidate'
import { memoryKey } from '../memory'

/**
 * Negative tenant-isolation tests. These verify the *keying* guarantees the
 * Operator relies on to keep two projects' work separate. Full DB-backed
 * cross-tenant integration lives in the integration suite.
 */

describe('project scoping', () => {
  it('candidate dedupeKey namespaces by projectId', () => {
    const a = computeDedupeKey('projA', 'money_page', 'money_page_reinforcement', 'https://x.com/p')
    const b = computeDedupeKey('projB', 'money_page', 'money_page_reinforcement', 'https://x.com/p')
    expect(a).not.toBe(b)
    expect(a).toContain('projA')
    expect(b).toContain('projB')
  })
})

describe('memory scoping', () => {
  it('memoryKey is stable but does not embed projectId (that separation lives at the DB query layer)', () => {
    const a = memoryKey('https://x.com/p', 't')
    const b = memoryKey('https://x.com/p', 't')
    expect(a).toBe(b)
    // The DB unique key is (projectId, pageUrl, recommendationType) — so two
    // projects sharing memoryKey values MUST still be separated by projectId
    // in the where clause. That is contractually required in memory.ts.
  })
})
