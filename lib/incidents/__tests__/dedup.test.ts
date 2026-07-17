import { describe, it, expect } from 'vitest'
import { dedupeIncidents, canonicalIncidentId, type RawAlert } from '../dedup'

describe('canonicalIncidentId', () => {
  it('is stable and collapses aliased kinds/scopes', () => {
    // A blocked gsc_sync job and a stale gsc source are the same incident.
    expect(canonicalIncidentId('p1', 'job_blocked', 'gsc_sync')).toBe(canonicalIncidentId('p1', 'stale_source', 'gsc'))
  })
  it('separates different projects', () => {
    expect(canonicalIncidentId('p1', 'stale_source', 'gsc')).not.toBe(canonicalIncidentId('p2', 'stale_source', 'gsc'))
  })
})

describe('dedupeIncidents', () => {
  it('collapses the same problem raised five times into one incident', () => {
    const alerts: RawAlert[] = [
      { kind: 'stale_source', scope: 'gsc', projectId: 'p1', severity: 'warning', title: 'GSC stale', source: 'freshness' },
      { kind: 'job_blocked', scope: 'gsc_sync', projectId: 'p1', severity: 'warning', title: 'gsc_sync blocked', source: 'schedules' },
      { kind: 'missing_source', scope: 'gsc', projectId: 'p1', severity: 'info', title: 'GSC missing', source: 'fusion' },
      { kind: 'job_failed', scope: 'gsc_sync', projectId: 'p1', severity: 'critical', title: 'gsc_sync failed', source: 'worker' },
      { kind: 'stale_source', scope: 'gsc', projectId: 'p1', severity: 'warning', title: 'GSC stale again', source: 'today' },
    ]
    const incidents = dedupeIncidents(alerts)
    expect(incidents).toHaveLength(1)
    expect(incidents[0].occurrences).toBe(5)
    expect(incidents[0].severity).toBe('critical') // highest wins
    expect(incidents[0].title).toBe('gsc_sync failed')
    expect(incidents[0].sources.sort()).toEqual(['freshness', 'schedules', 'fusion', 'worker', 'today'].sort())
  })

  it('keeps genuinely different problems separate and sorts by severity', () => {
    const alerts: RawAlert[] = [
      { kind: 'stale_source', scope: 'ga4', projectId: 'p1', severity: 'warning', title: 'GA4 stale' },
      { kind: 'deploy_regression', scope: '/pricing', projectId: 'p1', severity: 'critical', title: 'Pricing regressed' },
      { kind: 'stale_source', scope: 'crawl', projectId: 'p1', severity: 'info', title: 'Crawl aging' },
    ]
    const incidents = dedupeIncidents(alerts)
    expect(incidents).toHaveLength(3)
    expect(incidents[0].severity).toBe('critical') // sorted most severe first
  })
})
