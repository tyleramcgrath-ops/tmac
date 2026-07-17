import { describe, it, expect } from 'vitest'
import { scheduleHealth, dataFreshness, jobsRequiringAttention, decisionBlockers, measuringOutcomes, recentWins, readyToDeploy, FRESHNESS_SOURCES, type JobLite, type MeasurementLite } from '../sections'

const now = new Date('2026-07-16T12:00:00Z')
function job(over: Partial<JobLite>): JobLite {
  return { id: 'j', projectId: 'p1', jobType: 'crawl', status: 'scheduled', enabled: true, lastSuccessAt: null, lastFailureAt: null, nextRunAt: null, failureReason: null, failureClass: null, retryCount: 0, maxRetries: 3, ...over }
}

describe('scheduleHealth', () => {
  it('scores healthy vs problem jobs', () => {
    const h = scheduleHealth([job({ status: 'completed' }), job({ status: 'failed' }), job({ status: 'blocked' }), job({ status: 'scheduled' })])
    expect(h.total).toBe(4)
    expect(h.failed).toBe(1)
    expect(h.blocked).toBe(1)
    expect(h.score).toBe(50) // 2 of 4 healthy
  })
})

describe('dataFreshness', () => {
  it('returns all 8 sources', () => {
    const f = dataFreshness([], now)
    expect(f).toHaveLength(8)
    expect(f.map((x) => x.source).sort()).toEqual([...FRESHNESS_SOURCES].sort())
  })
  it('marks a recently-succeeded crawl fresh', () => {
    const f = dataFreshness([job({ jobType: 'crawl', status: 'completed', lastSuccessAt: new Date(now.getTime() - 3600 * 1000) })], now)
    const crawl = f.find((x) => x.source === 'crawl')!
    expect(crawl.status).toBe('fresh')
  })
})

describe('jobsRequiringAttention', () => {
  it('surfaces failed/blocked and classifies remedy', () => {
    const out = jobsRequiringAttention([
      job({ status: 'completed' }),
      job({ jobType: 'gsc_sync', status: 'blocked', failureClass: 'waiting_for_configuration' }),
      job({ jobType: 'crawl', status: 'failed', failureClass: 'retryable' }),
    ])
    expect(out).toHaveLength(2)
    expect(out.find((o) => o.jobType === 'gsc_sync')!.needsConfig).toBe(true)
    expect(out.find((o) => o.jobType === 'crawl')!.retryable).toBe(true)
  })
})

describe('decisionBlockers', () => {
  it('dedupes a blocked job and its stale source into one incident', () => {
    const jobs = [job({ jobType: 'gsc_sync', status: 'blocked', failureClass: 'waiting_for_configuration', failureReason: 'Not connected.' })]
    const fresh = dataFreshness(jobs, now) // gsc will be missing/not_configured
    const blockers = decisionBlockers('p1', jobs, fresh)
    const gscIncidents = blockers.filter((b) => b.scope === 'gsc')
    expect(gscIncidents.length).toBe(1) // collapsed, not double-counted
  })
})

describe('measuring + wins', () => {
  const mw = (over: Partial<MeasurementLite>): MeasurementLite => ({ id: 'm', projectId: 'p1', page: '/x', keyword: null, changeType: 'title_meta', status: 'improving', confidence: 0.6, reviewAt: null, updatedAt: now, notes: null, ...over })
  it('measuringOutcomes excludes finished states', () => {
    const out = measuringOutcomes([mw({ status: 'improving' }), mw({ status: 'successful' }), mw({ status: 'awaiting_data' })])
    expect(out.map((o) => o.status).sort()).toEqual(['awaiting_data', 'improving'])
  })
  it('recentWins only counts successful within the window', () => {
    const wins = recentWins([
      mw({ status: 'successful', updatedAt: now }),
      mw({ status: 'successful', updatedAt: new Date(now.getTime() - 30 * 24 * 3600 * 1000) }),
      mw({ status: 'improving', updatedAt: now }),
    ], 7, now)
    expect(wins).toHaveLength(1)
  })
})

describe('readyToDeploy', () => {
  it('keeps only deploy-ready capabilities, sorted by value', () => {
    const out = readyToDeploy([
      { id: '1', capability: 'ready_to_deploy', title: 'A', page: '/a', businessValue: 40, recommendedFix: 'x' },
      { id: '2', capability: 'waiting_for_data', title: 'B', page: '/b', businessValue: 90, recommendedFix: 'y' },
      { id: '3', capability: 'ready_for_approval', title: 'C', page: '/c', businessValue: 80, recommendedFix: 'z' },
    ])
    expect(out.map((o) => o.id)).toEqual(['3', '1'])
  })
})
