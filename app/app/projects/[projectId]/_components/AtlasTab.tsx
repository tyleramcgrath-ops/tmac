'use client'

// Mission Atlas tab (Phase G): external SEO intelligence surfaced inside the
// existing project workspace. Its whole point is the evidence-grading
// discipline — every datum is badged Observed / Imported / Estimated /
// Unavailable, so the user never mistakes a gap for a fact. In this environment
// no external provider is reachable, so the tab honestly shows everything as
// unavailable with the reason, plus the morning briefing's "connect sources"
// guidance.

import { useCallback, useEffect, useState } from 'react'
import { api, ApiError, type AtlasSnapshotDTO, type CompetitorDTO, type EvidenceGradeDTO, type ObservationDTO, type OverlapDTO } from '../../../lib/client'
import { EmptyState, Field, inputClass, Spinner } from '../../../lib/ui'

const GRADE_TONE: Record<EvidenceGradeDTO, string> = {
  observed: 'text-[var(--rf-green)] border-[var(--rf-green)]/40',
  imported: 'text-[var(--rf-blue-bright)] border-[var(--rf-blue-bright)]/40',
  estimated: 'text-yellow-300 border-yellow-400/40',
  unavailable: 'text-[var(--rf-faint)] border-[var(--rf-card-line)]',
}

function GradeBadge({ grade }: { grade: EvidenceGradeDTO }) {
  return <span className={`rf-mono rounded border px-1.5 py-0.5 text-[9px] uppercase ${GRADE_TONE[grade]}`}>{grade}</span>
}

function OverlapCell({ label, o }: { label: string; o: ObservationDTO<number> }) {
  return (
    <div className="flex items-center justify-between rounded border border-[var(--rf-card-line)] px-2 py-1">
      <span className="text-[11px] text-[var(--rf-muted)]">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className="text-[11px] text-white">{o.value === null ? '—' : `${Math.round(o.value * 100)}%`}</span>
        <GradeBadge grade={o.evidence.grade} />
      </span>
    </div>
  )
}

export function AtlasTab({ projectId }: { projectId: string }) {
  const [snapshot, setSnapshot] = useState<AtlasSnapshotDTO | null>(null)
  const [competitors, setCompetitors] = useState<CompetitorDTO[]>([])
  const [domain, setDomain] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const [{ snapshot }, { competitors }] = await Promise.all([api.getAtlas(projectId), api.listCompetitors(projectId)])
      setSnapshot(snapshot)
      setCompetitors(competitors)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load Mission Atlas.')
      setSnapshot(null)
    }
  }, [projectId])
  useEffect(() => {
    void load()
  }, [load])

  async function addCompetitor(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.addCompetitor(projectId, domain)
      setDomain('')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add competitor.')
    } finally {
      setBusy(false)
    }
  }
  async function remove(id: string) {
    try {
      await api.deleteCompetitor(projectId, id)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove competitor.')
    }
  }

  if (!snapshot) return <Spinner label="Assembling Mission Atlas…" />
  const b = snapshot.briefing
  const overlapByCompetitor = new Map(snapshot.competitors.map((c) => [c.competitor.id, c.overlap]))

  return (
    <div className="space-y-5">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {/* Morning briefing */}
      <div className="rf-card space-y-2 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Morning briefing · {b.date}</p>
          <span className="text-[11px] text-[var(--rf-muted)]">Confidence: {b.confidence === 'unknown' ? 'unknown' : `${b.confidence}%`}</span>
        </div>
        <p className="text-xs text-[var(--rf-muted)]">{b.headline}</p>
        <p className="rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] px-3 py-2 text-xs text-white">
          <span className="text-[var(--rf-blue-bright)]">Recommended mission:</span> {b.recommendedMission}
        </p>
        {(b.newThreats.length > 0 || b.newOpportunities.length > 0) && (
          <div className="grid gap-2 sm:grid-cols-2">
            <BriefingList title="Threats" items={b.newThreats} tone="text-red-300" />
            <BriefingList title="Opportunities" items={b.newOpportunities} tone="text-[var(--rf-green)]" />
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {(['observed', 'imported', 'estimated', 'unavailable'] as EvidenceGradeDTO[]).map((g) => (
            <span key={g} className="flex items-center gap-1"><GradeBadge grade={g} /><span className="text-[10px] text-[var(--rf-faint)]">{b.evidenceSummary[g]}</span></span>
          ))}
        </div>
      </div>

      {/* Provider connections */}
      <div className="rf-card p-4">
        <p className="mb-2 text-sm font-semibold text-white">External data sources</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {snapshot.providers.length === 0 && <p className="text-xs text-[var(--rf-muted)]">No providers configured.</p>}
          {snapshot.providers.map((p) => (
            <div key={p.id} className="rounded border border-[var(--rf-card-line)] px-2 py-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-white">{p.kind}</span>
                <span className={`rf-mono text-[9px] uppercase ${p.state === 'connected' ? 'text-[var(--rf-green)]' : 'text-[var(--rf-faint)]'}`}>{p.state}</span>
              </div>
              <p className="text-[10px] leading-tight text-[var(--rf-muted)]">{p.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-[var(--rf-faint)]">Providers plug in behind stable interfaces. When disconnected, external intelligence is reported as Unavailable — never fabricated.</p>
      </div>

      {/* Competitors */}
      <div className="rf-card space-y-3 p-4">
        <p className="text-sm font-semibold text-white">Competitors</p>
        <form onSubmit={addCompetitor} className="flex items-end gap-2">
          <div className="flex-1">
            <Field label="Competitor domain">
              <input className={inputClass} placeholder="rival.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
            </Field>
          </div>
          <button type="submit" disabled={busy} className="rf-btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">Track</button>
        </form>
        {competitors.length === 0 ? (
          <EmptyState title="No competitors tracked" detail="Add a competitor domain to compute topic, service, entity, and content overlap from real crawls. Overlap shows as Unavailable until the competitor site can be crawled." />
        ) : (
          <div className="space-y-2">
            {competitors.map((c) => {
              const overlap = overlapByCompetitor.get(c.id) as OverlapDTO | undefined
              return (
                <div key={c.id} className="rounded-lg border border-[var(--rf-card-line)] p-3">
                  <div className="flex items-center justify-between">
                    <p className="rf-mono text-xs text-[var(--rf-blue-bright)]">{c.domain}</p>
                    <button onClick={() => remove(c.id)} className="rf-btn-ghost rounded-md px-2 py-1 text-[11px] text-red-300">Remove</button>
                  </div>
                  {overlap && (
                    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      <OverlapCell label="Business" o={overlap.businessOverlap} />
                      <OverlapCell label="Topic" o={overlap.topicOverlap} />
                      <OverlapCell label="Service" o={overlap.serviceOverlap} />
                      <OverlapCell label="Entity" o={overlap.entityOverlap} />
                      <OverlapCell label="Content" o={overlap.contentOverlap} />
                      <OverlapCell label="Authority" o={overlap.authorityOverlap} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function BriefingList({ title, items, tone }: { title: string; items: AtlasSnapshotDTO['briefing']['newThreats']; tone: string }) {
  return (
    <div className="rounded-lg border border-[var(--rf-card-line)] p-2">
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${tone}`}>{title} ({items.length})</p>
      {items.length === 0 ? (
        <p className="text-[11px] text-[var(--rf-faint)]">None detected.</p>
      ) : (
        items.slice(0, 4).map((it, i) => (
          <p key={i} className="mt-0.5 text-[11px] text-[var(--rf-muted)]">
            <GradeBadge grade={it.evidence.grade} /> {it.title}
          </p>
        ))
      )}
    </div>
  )
}
