// Morning Briefing (Phase G §9). One concise briefing built ONLY from available
// graded observations. It never fabricates: when no external source is
// connected, it says so plainly and points at what to connect, while the
// internal audit stays fully available. Every item carries its evidence grade
// and confidence, so the reader always knows whether they're looking at an
// observation, an import, an estimate, or a gap.

import type { EvidenceGrade, Evidence, ProviderStatus } from './types'
import type { Change } from './change-detection'
import type { AiVisibility } from './providers/ai-search'

export interface BriefingItem {
  title: string
  detail: string
  evidence: Evidence
  confidence: number | 'unknown'
}

export interface MorningBriefing {
  date: string
  headline: string
  yesterday: BriefingItem[]
  overnight: BriefingItem[]
  newOpportunities: BriefingItem[]
  newThreats: BriefingItem[]
  recommendedMission: string
  evidenceSummary: Record<EvidenceGrade, number>
  confidence: number | 'unknown'
}

export interface BriefingInput {
  date: string
  providers: ProviderStatus[]
  changes: Change[]
  aiVisibility: AiVisibility[] | null // null when unavailable
  competitorCount: number
}

export function generateBriefing(input: BriefingInput): MorningBriefing {
  const connected = input.providers.filter((p) => p.state === 'connected')
  const evidenceSummary: Record<EvidenceGrade, number> = { observed: 0, imported: 0, estimated: 0, unavailable: 0 }
  const tally = (e: Evidence) => { evidenceSummary[e.grade]++ }

  const yesterday: BriefingItem[] = []
  const overnight: BriefingItem[] = []
  const newOpportunities: BriefingItem[] = []
  const newThreats: BriefingItem[] = []

  // Ranking + backlink + AI-citation changes → yesterday/overnight movement.
  for (const c of input.changes) {
    const item: BriefingItem = { title: c.subject, detail: c.note, evidence: c.evidence, confidence: 'unknown' }
    tally(c.evidence)
    if (c.category === 'ranking') {
      // In GSC, a higher position number is worse. Positive delta = dropped.
      ;(c.delta > 0 ? newThreats : newOpportunities).push(item)
    } else if (c.category === 'ai-citation') {
      ;(c.after === 'cited' ? newOpportunities : newThreats).push(item)
    } else {
      overnight.push(item)
    }
  }

  // Competitor citations in AI answers we don't appear in → a threat.
  if (input.aiVisibility) {
    for (const v of input.aiVisibility) {
      if (!v.cited && v.competitorCitations.length > 0) {
        const e: Evidence = { grade: 'observed', source: `ai:${v.engine}`, fetchedAt: null }
        tally(e)
        newThreats.push({
          title: `${v.engine}: competitor cited, we are not`,
          detail: `"${v.query}" cites ${v.competitorCitations.join(', ')} — a missing-citation gap to close.`,
          evidence: e, confidence: 'unknown',
        })
      }
      if (!v.brandMentioned) {
        const e: Evidence = { grade: 'observed', source: `ai:${v.engine}`, fetchedAt: null }
        tally(e)
        newOpportunities.push({ title: `${v.engine}: brand not mentioned for "${v.query}"`, detail: 'An AI-visibility opportunity.', evidence: e, confidence: 'unknown' })
      }
    }
  }

  // Honest degradation: nothing connected → say so, don't invent a briefing.
  const nothingConnected = connected.length === 0
  const headline = nothingConnected
    ? 'No external data sources connected — external intelligence is unavailable. Internal audit remains fully available.'
    : `${connected.length} external source(s) connected; ${input.changes.length} significant change(s), ${newThreats.length} threat(s), ${newOpportunities.length} opportunity(ies).`

  const recommendedMission = nothingConnected
    ? 'Connect Search Console, Analytics (GA4), a backlink provider, and at least one AI-search engine to unlock competitor, backlink, and AI-visibility intelligence. Until then, work the internal recommendations, which need no external data.'
    : newThreats.length > 0
      ? `Address the top threat: ${newThreats[0].title}.`
      : newOpportunities.length > 0
        ? `Pursue the top opportunity: ${newOpportunities[0].title}.`
        : 'No significant external change overnight — continue the internal roadmap.'

  // Confidence in the briefing itself: proportional to how much is genuinely
  // observed vs unavailable. Unknown when there is nothing to be confident about.
  const observedish = evidenceSummary.observed + evidenceSummary.imported
  const totalGraded = observedish + evidenceSummary.estimated + evidenceSummary.unavailable
  const confidence: number | 'unknown' = nothingConnected || totalGraded === 0 ? 'unknown' : Math.round((observedish / totalGraded) * 100)

  if (nothingConnected) evidenceSummary.unavailable += input.providers.length

  return { date: input.date, headline, yesterday, overnight, newOpportunities, newThreats, recommendedMission, evidenceSummary, confidence }
}
