'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

interface EvidenceItem {
  label: string
  detail?: unknown
  source: string
}
interface Recommendation {
  id: string
  pageUrl: string
  recommendationType: string
  source: string
  headline: string
  reasoning: {
    whyNow: string
    whyThisPage: string
    whyNotAnother: string
    whyThisBeforeOther: string
    graphEvidence: EvidenceItem[]
    businessObjective: string | null
    ignoreConsequence: string
    judgmentBoosts: Array<{ reason: string; delta: number }>
  }
  expectedBusinessReturn: string
  estimatedMinutes: number
  risk: 'low' | 'medium' | 'high'
  confidence: number
  status: string
  memoryId?: string
}
interface Shortlist {
  primaryMission: Recommendation | null
  nextBestActions: Recommendation[]
  watchList: Recommendation[]
  deferredOpportunities: Recommendation[]
  criticalAlerts: Recommendation[]
  suppressed: Array<{ item: Recommendation; reason: string }>
}
interface OperatorEvent {
  id: string
  kind: string
  summary: string
  createdAt: string
}

const FOCUS_WINDOWS = ['15m', '30m', '1h', '2h', 'half-day', 'full-day'] as const

const FEEDBACK_OPTIONS = [
  ['helpful', 'Helpful'],
  ['not_helpful', 'Not helpful'],
  ['wrong_priority', 'Wrong priority'],
  ['wrong_page', 'Wrong page'],
  ['wrong_estimate', 'Wrong estimate'],
  ['already_completed', 'Already done'],
  ['too_risky', 'Too risky'],
  ['not_relevant', 'Not relevant'],
  ['needs_more_evidence', 'Needs evidence'],
] as const

export default function OperatorPage() {
  const [projectId, setProjectId] = useState('')
  const [shortlist, setShortlist] = useState<Shortlist | null>(null)
  const [events, setEvents] = useState<OperatorEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedWindow, setSelectedWindow] = useState<(typeof FOCUS_WINDOWS)[number] | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem('rankforge:projectId')
    const fromUrl = new URLSearchParams(window.location.search).get('projectId')
    setProjectId(fromUrl || stored || '')
  }, [])

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      window.localStorage.setItem('rankforge:projectId', projectId)
      const [slRes, evRes] = await Promise.all([
        fetch(`/api/rankforge/operator/shortlist?projectId=${encodeURIComponent(projectId)}`),
        fetch(`/api/rankforge/operator/events?projectId=${encodeURIComponent(projectId)}&limit=30`),
      ])
      const sl = await slRes.json()
      const ev = await evRes.json()
      if (!slRes.ok || !sl.success) throw new Error(sl.error || 'Shortlist load failed')
      setShortlist(sl.shortlist as Shortlist)
      if (ev.success) setEvents(ev.events)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const decide = async (rec: Recommendation, status: string, deferDays?: number) => {
    const res = await fetch('/api/rankforge/operator/decision', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        projectId,
        pageUrl: rec.pageUrl,
        recommendationType: rec.recommendationType,
        status,
        deferDays,
      }),
    })
    if (res.ok) await load()
  }

  const sendFeedback = async (rec: Recommendation, feedback: string) => {
    await fetch('/api/rankforge/operator/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        projectId,
        recommendationType: rec.recommendationType,
        feedback,
      }),
    })
  }

  const runFocus = async (window: (typeof FOCUS_WINDOWS)[number]) => {
    setSelectedWindow(window)
    if (!projectId) return
    const res = await fetch(
      `/api/rankforge/operator/plan?projectId=${encodeURIComponent(projectId)}&window=${window}`,
    )
    const json = await res.json()
    if (res.ok && json.success) {
      alert(`Plan for ${window}:\n\n${json.plan.narrative}\n\n${json.plan.items.map((i: any) => `• ${i.headline}`).join('\n')}`)
    }
  }

  const anyBucketHasItems =
    !!shortlist &&
    (shortlist.primaryMission ||
      shortlist.criticalAlerts.length ||
      shortlist.nextBestActions.length ||
      shortlist.watchList.length ||
      shortlist.deferredOpportunities.length)

  return (
    <div style={{ background: '#0b1220', color: '#e5e7eb', minHeight: '100vh', padding: 24 }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Operator</h1>
        <input
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="projectId"
          style={{ ...inputStyle, width: 300 }}
        />
        <button style={buttonStyle} onClick={load} disabled={loading || !projectId}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        {FOCUS_WINDOWS.map((w) => (
          <button
            key={w}
            style={{ ...outlineButton, borderColor: selectedWindow === w ? '#fbbf24' : '#334155' }}
            onClick={() => runFocus(w)}
            disabled={!projectId}
          >
            {w}
          </button>
        ))}
      </header>

      {error && <p style={{ color: '#f87171' }}>{error}</p>}
      {!anyBucketHasItems && !loading && (
        <p style={{ opacity: 0.7 }}>Load a project to see the Operator's shortlist.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div>
          {shortlist?.criticalAlerts?.length ? (
            <Section title="🚨 Critical Alerts" items={shortlist.criticalAlerts} onDecide={decide} onFeedback={sendFeedback} accent="#ef4444" />
          ) : null}
          {shortlist?.primaryMission ? (
            <PrimaryMission mission={shortlist.primaryMission} onDecide={decide} onFeedback={sendFeedback} />
          ) : null}
          {shortlist?.nextBestActions?.length ? (
            <Section title="Next Best Actions" items={shortlist.nextBestActions} onDecide={decide} onFeedback={sendFeedback} />
          ) : null}
          {shortlist?.watchList?.length ? (
            <Section title="Watch List" items={shortlist.watchList} onDecide={decide} onFeedback={sendFeedback} accent="#38bdf8" />
          ) : null}
          {shortlist?.deferredOpportunities?.length ? (
            <Section title="Deferred Opportunities" items={shortlist.deferredOpportunities} onDecide={decide} onFeedback={sendFeedback} accent="#94a3b8" />
          ) : null}
          {shortlist?.suppressed?.length ? (
            <SuppressedSection suppressed={shortlist.suppressed} />
          ) : null}
        </div>

        <aside>
          <h2 style={{ fontSize: 15, marginBottom: 8 }}>Operator Feed</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {events.slice(0, 30).map((e) => (
              <div key={e.id} style={{ background: '#111827', padding: 8, borderRadius: 6, fontSize: 12 }}>
                <div style={{ opacity: 0.6 }}>{new Date(e.createdAt).toLocaleString()} — {e.kind}</div>
                <div>{e.summary}</div>
              </div>
            ))}
            {events.length === 0 && <p style={{ opacity: 0.6, fontSize: 12 }}>No events yet.</p>}
          </div>
        </aside>
      </div>
    </div>
  )
}

function PrimaryMission({
  mission,
  onDecide,
  onFeedback,
}: {
  mission: Recommendation
  onDecide: (r: Recommendation, s: string, d?: number) => Promise<void>
  onFeedback: (r: Recommendation, f: string) => Promise<void>
}) {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #fbbf24', borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>PRIMARY MISSION</div>
      <h2 style={{ margin: 0, fontSize: 20 }}>{mission.headline}</h2>
      <p style={{ marginTop: 12, opacity: 0.8 }}>{mission.reasoning.whyNow}</p>
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 13 }}>
        <div><span style={{ opacity: 0.6 }}>Expected return:</span> {mission.expectedBusinessReturn}</div>
        <div><span style={{ opacity: 0.6 }}>Estimated time:</span> {mission.estimatedMinutes}m</div>
        <div><span style={{ opacity: 0.6 }}>Risk:</span> {mission.risk}</div>
        <div><span style={{ opacity: 0.6 }}>Confidence:</span> {Math.round(mission.confidence * 100)}%</div>
        <div><span style={{ opacity: 0.6 }}>Status:</span> {mission.status}</div>
        <div><span style={{ opacity: 0.6 }}>Objective:</span> {mission.reasoning.businessObjective || '—'}</div>
      </div>
      <Reasoning rec={mission} />
      <ActionButtons rec={mission} onDecide={onDecide} onFeedback={onFeedback} primary />
    </div>
  )
}

function Section({
  title,
  items,
  onDecide,
  onFeedback,
  accent = '#334155',
}: {
  title: string
  items: Recommendation[]
  onDecide: (r: Recommendation, s: string, d?: number) => Promise<void>
  onFeedback: (r: Recommendation, f: string) => Promise<void>
  accent?: string
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 14, opacity: 0.8, marginBottom: 8 }}>{title}</h3>
      {items.map((r) => (
        <div key={r.id} style={{ background: '#111827', border: `1px solid ${accent}`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>{r.headline}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{r.reasoning.whyNow}</div>
          <ActionButtons rec={r} onDecide={onDecide} onFeedback={onFeedback} />
        </div>
      ))}
    </div>
  )
}

function SuppressedSection({ suppressed }: { suppressed: Shortlist['suppressed'] }) {
  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: 14, opacity: 0.6, marginBottom: 8 }}>Intentionally excluded</h3>
      {suppressed.slice(0, 6).map((s) => (
        <div key={s.item.id} style={{ background: '#0f172a', border: '1px dashed #334155', borderRadius: 8, padding: 10, marginBottom: 6, fontSize: 12 }}>
          <div>{s.item.headline}</div>
          <div style={{ opacity: 0.6 }}>{s.reason}</div>
        </div>
      ))}
    </div>
  )
}

function Reasoning({ rec }: { rec: Recommendation }) {
  return (
    <details style={{ marginTop: 12 }}>
      <summary style={{ cursor: 'pointer', fontSize: 12, opacity: 0.8 }}>Reasoning</summary>
      <ul style={{ fontSize: 12, marginTop: 8, opacity: 0.85, paddingLeft: 18 }}>
        <li><b>Why this page:</b> {rec.reasoning.whyThisPage}</li>
        <li><b>Why not another:</b> {rec.reasoning.whyNotAnother}</li>
        <li><b>Why this before other:</b> {rec.reasoning.whyThisBeforeOther}</li>
        <li><b>If ignored:</b> {rec.reasoning.ignoreConsequence}</li>
        {rec.reasoning.judgmentBoosts.length > 0 && (
          <li>
            <b>Judgment adjustments:</b>
            <ul>
              {rec.reasoning.judgmentBoosts.map((b, i) => (
                <li key={i}>{b.reason} ({b.delta > 0 ? '+' : ''}{b.delta})</li>
              ))}
            </ul>
          </li>
        )}
        {rec.reasoning.graphEvidence.length > 0 && (
          <li>
            <b>Graph evidence:</b> {rec.reasoning.graphEvidence.slice(0, 5).map((e) => e.label).join('; ')}
          </li>
        )}
      </ul>
    </details>
  )
}

function ActionButtons({
  rec,
  onDecide,
  onFeedback,
  primary,
}: {
  rec: Recommendation
  onDecide: (r: Recommendation, s: string, d?: number) => Promise<void>
  onFeedback: (r: Recommendation, f: string) => Promise<void>
  primary?: boolean
}) {
  const btn = { ...outlineButton, padding: '4px 8px', fontSize: 11 } as React.CSSProperties
  return (
    <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button style={{ ...buttonStyle, padding: '4px 10px', fontSize: 12 }} onClick={() => onDecide(rec, 'accepted')}>Accept</button>
      <button style={btn} onClick={() => onDecide(rec, 'in_progress')}>Start</button>
      <button style={btn} onClick={() => onDecide(rec, 'approved')}>Approve</button>
      <button style={btn} onClick={() => onDecide(rec, 'deferred', 7)}>Defer 7d</button>
      <button style={btn} onClick={() => onDecide(rec, 'rejected')}>Reject</button>
      <button style={btn} onClick={() => onDecide(rec, 'ignored')}>Ignore</button>
      <button style={btn} onClick={() => onDecide(rec, 'completed')}>Mark completed</button>
      {primary && (
        <>
          <span style={{ opacity: 0.4, margin: '0 6px' }}>|</span>
          {FEEDBACK_OPTIONS.map(([value, label]) => (
            <button key={value} style={btn} onClick={() => onFeedback(rec, value)}>
              {label}
            </button>
          ))}
        </>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: 6, borderRadius: 6, background: '#111827', color: '#e5e7eb', border: '1px solid #334155', fontSize: 12,
}
const buttonStyle: React.CSSProperties = {
  background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
}
const outlineButton: React.CSSProperties = {
  background: 'transparent', color: '#e5e7eb', border: '1px solid #334155', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
}
