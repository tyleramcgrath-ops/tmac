'use client'

// Multi-agent presentation (Phase F) rendered INSIDE the Recommendations tab —
// no new dashboard. Shows the agent team, and per recommendation: the consensus
// verdict, the provenance chain (who discovered → analyzed → challenged →
// prioritized → approved → deployed → verified), surfaced disagreements, and the
// individual agent stances.

import { useState } from 'react'
import type { AgentReportDTO, ConsensusMetricsDTO, CoordinationDTO } from '../../../lib/client'

const CONSENSUS_TONE: Record<string, string> = {
  agree: 'text-[var(--rf-green)] border-[var(--rf-green)]/40',
  disagree: 'text-red-300 border-red-400/40',
  'needs-review': 'text-yellow-300 border-yellow-400/40',
  'human-required': 'text-orange-300 border-orange-400/40',
}
const POSITION_TONE: Record<string, string> = {
  support: 'text-[var(--rf-green)]',
  concern: 'text-red-300',
  neutral: 'text-[var(--rf-muted)]',
}

export function AgentTeamStrip({ agents, metrics }: { agents: AgentReportDTO[]; metrics: ConsensusMetricsDTO }) {
  return (
    <div className="rf-card space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Your SEO agent team</p>
        <p className="text-[11px] text-[var(--rf-muted)]">
          Consensus — agree {metrics.consensus.agree} · disagree {metrics.consensus.disagree} · review{' '}
          {metrics.consensus['needs-review']} · human {metrics.consensus['human-required']}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {agents.map((a) => (
          <div key={a.agentId} className={`rounded-lg border px-3 py-2 ${a.active ? 'border-[var(--rf-card-line)]' : 'border-[var(--rf-card-line)] opacity-50'}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-white">{a.name}</p>
              <span className="rf-mono text-[10px] uppercase text-[var(--rf-faint)]">{a.active ? (a.ownedFindings > 0 ? `${a.ownedFindings} owned` : 'active') : 'standby'}</span>
            </div>
            <p className="mt-0.5 text-[10px] leading-tight text-[var(--rf-muted)]">{a.summary}</p>
            {a.observations.filter((o) => o.kind === 'limitation').map((o, i) => (
              <p key={i} className="mt-1 text-[10px] text-yellow-200/80">⚠ {o.detail}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

const AGENT_LABEL: Record<string, string> = {
  scout: 'Scout', strategist: 'Strategist', technical: 'Technical SEO', content: 'Content Strategist',
  local: 'Local SEO', authority: 'Authority Builder', cro: 'CRO Advisor', operator: 'Operator', qa: 'QA Reviewer',
}

export function ConsensusBlock({ coordination }: { coordination: CoordinationDTO }) {
  const [open, setOpen] = useState(false)
  const pv = coordination.provenance
  const chain: [string, string | null][] = [
    ['Discovered', pv.discoveredBy],
    ['Analyzed', pv.analyzedBy],
    ['Challenged', pv.challengedBy],
    ['Prioritized', pv.prioritizedBy],
    ['Approved', pv.approvedBy ? 'human' : null],
    ['Deployed', pv.deployedBy],
    ['Verified', pv.verifiedBy],
  ]
  return (
    <div className="mt-3 rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className={`rf-mono rounded border px-2 py-0.5 text-[10px] uppercase ${CONSENSUS_TONE[coordination.consensus] ?? ''}`}>
          {coordination.consensus.replace('-', ' ')}
        </span>
        <button onClick={() => setOpen((v) => !v)} className="text-[11px] text-[var(--rf-blue-bright)] hover:text-white">
          {open ? 'Hide agents' : `${coordination.stances.length} agents`}
        </button>
      </div>
      <p className="mt-1 text-[11px] text-[var(--rf-muted)]">{coordination.consensusReason}</p>

      {/* Provenance chain — traceable ownership. */}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {chain.map(([label, who], i) => (
          <span key={label} className="flex items-center gap-1">
            <span className={`rf-mono text-[9px] uppercase ${who ? 'text-[var(--rf-text)]' : 'text-[var(--rf-faint)] line-through'}`}>
              {label}: {who ? (AGENT_LABEL[who] ?? who) : '—'}
            </span>
            {i < chain.length - 1 && <span className="text-[9px] text-[var(--rf-faint)]">→</span>}
          </span>
        ))}
      </div>

      {/* Surfaced disagreement — never hidden. */}
      {coordination.disagreements.length > 0 && (
        <div className="mt-2 rounded border border-red-400/30 bg-red-500/5 p-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-red-300">Disagreement surfaced</p>
          {coordination.disagreements.map((d, i) => (
            <p key={i} className="text-[11px] text-red-200/90">{d}</p>
          ))}
        </div>
      )}

      {open && (
        <div className="mt-2 space-y-1.5">
          {coordination.stances.map((s, i) => (
            <div key={i} className="rounded border border-[var(--rf-card-line)] p-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-white">{AGENT_LABEL[s.agentId] ?? s.agentId}</p>
                <span className={`rf-mono text-[10px] uppercase ${POSITION_TONE[s.position]}`}>{s.position} · {s.confidence}</span>
              </div>
              <p className="text-[11px] text-[var(--rf-muted)]">{s.note}</p>
              {s.assumptions.length > 0 && (
                <p className="mt-0.5 text-[10px] text-[var(--rf-faint)]">Assumes: {s.assumptions.join('; ')}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
