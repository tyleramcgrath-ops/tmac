// Fused opportunities — built from Data Fusion page + keyword intelligence
// rather than isolated crawl/ranking findings. Combines evidence (crawl,
// observed rank, GSC, GA4, deployments), deduplicates multiple signals about
// the same underlying problem into one record, prioritizes by measured value
// with a stale-data/low-confidence penalty, and attaches transparent estimates
// and a workflow capability state. Never fabricates volume, revenue, or CTR.

import type { PageIntelligence, KeywordIntelligence } from '@/lib/fusion/engine'
import { freshnessPenalty, type FreshnessStatus } from '@/lib/freshness/policy'

export type FusedType =
  | 'ctr' | 'conversion' | 'tracking_quality' | 'ranking' | 'traffic_recovery'
  | 'strong_conversion_weak_ranking' | 'deployment_regression' | 'technical' | 'schema' | 'content_gap'

export type Capability =
  | 'ready_to_generate' | 'ready_to_preview' | 'ready_for_approval' | 'ready_to_deploy'
  | 'waiting_for_wordpress' | 'waiting_for_data' | 'waiting_for_permissions' | 'blocked'
  | 'completed' | 'measuring_outcome'

export interface Estimate {
  metric: string
  value: number | null // null → insufficient data
  explanation: string
  inputs: Record<string, number | string | null>
  confidence: number
  missing: string[]
}

export interface FusedOpportunity {
  id: string
  projectId: string
  type: FusedType
  page: string | null
  keyword: string | null
  title: string
  primaryReason: string
  supportingSignals: string[]
  conflictingSignals: string[]
  dataSources: string[]
  businessValue: number // 0..100
  expectedReturn: number // 0..100
  effort: 'low' | 'medium' | 'high'
  risk: 'low' | 'medium' | 'high'
  confidence: number // 0..1, after freshness penalty
  priorityScore: number // for sorting
  estimate: Estimate | null
  capability: Capability
  recommendedFix: string
  missingEvidence: string[]
}

export interface FusedInput {
  projectId: string
  pages: PageIntelligence[]
  keywords: KeywordIntelligence[]
  wordpressConnected: boolean
  worstFreshness: FreshnessStatus
  // Optional: recent deployment per page for regression detection.
  recentDeploys?: { page: string; at: string }[]
}

// CTR baseline is position-dependent — never one fixed benchmark (spec §4).
function expectedCtrForPosition(pos: number): number {
  if (pos <= 1) return 0.28
  if (pos <= 3) return 0.15
  if (pos <= 5) return 0.09
  if (pos <= 10) return 0.045
  if (pos <= 20) return 0.015
  return 0.005
}

function capabilityFor(o: { type: FusedType; wordpressConnected: boolean; missingEvidence: string[] }): Capability {
  if (o.missingEvidence.includes('conversion_tracking')) return 'waiting_for_data'
  if (o.type === 'tracking_quality') return 'waiting_for_data'
  // Auto-fixable on-page changes need WordPress to deploy.
  const autoFixable = o.type === 'ctr' || o.type === 'schema' || o.type === 'technical' || o.type === 'ranking'
  if (autoFixable) return o.wordpressConnected ? 'ready_to_generate' : 'waiting_for_wordpress'
  return 'ready_to_generate'
}

export function buildFusedOpportunities(input: FusedInput): FusedOpportunity[] {
  const byKey = new Map<string, FusedOpportunity>()
  const fp = freshnessPenalty(input.worstFreshness)
  const deployByPage = new Map((input.recentDeploys ?? []).map((d) => [d.page, d.at]))

  const push = (o: FusedOpportunity) => {
    const existing = byKey.get(o.id)
    if (existing) {
      // Dedup: same page + underlying problem → merge signals, keep higher value.
      existing.supportingSignals = Array.from(new Set([...existing.supportingSignals, o.primaryReason, ...o.supportingSignals]))
      existing.dataSources = Array.from(new Set([...existing.dataSources, ...o.dataSources]))
      existing.businessValue = Math.max(existing.businessValue, o.businessValue)
      existing.expectedReturn = Math.max(existing.expectedReturn, o.expectedReturn)
      return
    }
    byKey.set(o.id, o)
  }

  // ── Keyword-derived (ranking / recovery / CTR-by-query) ──
  for (const k of input.keywords) {
    const page = k.targetPage
    const sources: string[] = ['keywords']
    if (k.gscAveragePosition !== null) sources.push('gsc')

    // CTR opportunity — needs GSC impressions + CTR + a realistic position.
    if (k.gscImpressions !== null && k.gscCtr !== null && k.gscAveragePosition !== null && k.gscImpressions >= 100) {
      const expected = expectedCtrForPosition(k.gscAveragePosition)
      if (k.gscCtr < expected * 0.6) {
        const incrementalClicks = Math.round(k.gscImpressions * (expected - k.gscCtr))
        push({
          id: `${input.projectId}:ctr:${(page ?? k.keyword).toLowerCase()}`,
          projectId: input.projectId, type: 'ctr', page, keyword: k.keyword,
          title: `Improve CTR for "${k.keyword}"`,
          primaryReason: `${k.gscImpressions.toLocaleString()} impressions at position ${k.gscAveragePosition.toFixed(1)} but only ${(k.gscCtr * 100).toFixed(1)}% CTR (expected ~${(expected * 100).toFixed(0)}%).`,
          supportingSignals: [], conflictingSignals: [], dataSources: sources,
          businessValue: Math.round(50 + Math.min(30, incrementalClicks / 5)),
          expectedReturn: Math.round(45 + Math.min(30, incrementalClicks / 5)),
          effort: 'low', risk: 'low', confidence: clamp(0.75 - fp),
          priorityScore: 0,
          estimate: {
            metric: 'incremental_clicks_per_period', value: incrementalClicks,
            explanation: 'impressions × (expected CTR for position − current CTR)',
            inputs: { impressions: k.gscImpressions, currentCtr: k.gscCtr, expectedCtr: expected, position: k.gscAveragePosition },
            confidence: clamp(0.7 - fp), missing: [],
          },
          capability: capabilityFor({ type: 'ctr', wordpressConnected: input.wordpressConnected, missingEvidence: [] }),
          recommendedFix: 'Rewrite the title and meta description to better match intent and stand out in the SERP.',
          missingEvidence: [],
        })
      }
    }

    // Ranking loss + traffic loss → one consolidated recovery opportunity.
    if (k.observedRanking !== null && k.previousObservedRanking !== null && k.observedRanking > k.previousObservedRanking) {
      const drop = k.observedRanking - k.previousObservedRanking
      const supporting: string[] = []
      if (k.gscClicks !== null) supporting.push(`GSC clicks: ${k.gscClicks}`)
      const deployAt = page ? deployByPage.get(page) : undefined
      if (deployAt) supporting.push(`Recent deployment on ${new Date(deployAt).toLocaleDateString()} (correlation, not proven cause)`)
      push({
        id: `${input.projectId}:traffic_recovery:${(page ?? k.keyword).toLowerCase()}`,
        projectId: input.projectId, type: deployAt ? 'deployment_regression' : 'traffic_recovery', page, keyword: k.keyword,
        title: `Recover ranking for "${k.keyword}"`,
        primaryReason: `Dropped ${drop} position${drop !== 1 ? 's' : ''} (from #${k.previousObservedRanking} to #${k.observedRanking}).`,
        supportingSignals: supporting, conflictingSignals: [], dataSources: sources,
        businessValue: Math.round(55 + Math.min(30, drop * 3)),
        expectedReturn: Math.round(45 + Math.min(25, drop * 3)),
        effort: 'medium', risk: 'medium', confidence: clamp(0.6 - fp),
        priorityScore: 0, estimate: null,
        capability: capabilityFor({ type: deployAt ? 'deployment_regression' : 'ranking', wordpressConnected: input.wordpressConnected, missingEvidence: [] }),
        recommendedFix: deployAt ? 'Review the recent deployment (title/meta/content/canonical/indexing) and compare before/after; consider a rollback.' : 'Refresh the page and re-verify; check what competitors changed.',
        missingEvidence: [],
      })
      continue
    }

    // Page-2 ranking opportunity (fused with business value + conversions).
    if (k.observedRanking !== null && k.observedRanking >= 11 && k.observedRanking <= 20) {
      push({
        id: `${input.projectId}:ranking:${(page ?? k.keyword).toLowerCase()}`,
        projectId: input.projectId, type: 'ranking', page, keyword: k.keyword,
        title: `Push "${k.keyword}" from page 2 to page 1`,
        primaryReason: `Ranks #${k.observedRanking} — within reach of page 1.`,
        supportingSignals: k.moneyPageRelationship ? ['Targets a money page'] : [],
        conflictingSignals: [], dataSources: sources,
        businessValue: Math.round(k.businessValue),
        expectedReturn: Math.round(45 + (21 - k.observedRanking) * 3),
        effort: 'medium', risk: 'low', confidence: clamp(0.55 - fp),
        priorityScore: 0, estimate: null,
        capability: capabilityFor({ type: 'ranking', wordpressConnected: input.wordpressConnected, missingEvidence: [] }),
        recommendedFix: 'Strengthen the target page: sharpen the title, expand thin sections, add supporting internal links.',
        missingEvidence: [],
      })
    }
  }

  // ── Page-derived (conversion / tracking-quality / strong-conv-weak-rank / schema) ──
  for (const p of input.pages) {
    const sources: string[] = ['crawl']
    if (p.gscAveragePosition !== null) sources.push('gsc')
    if (p.ga4OrganicSessions !== null) sources.push('ga4')

    const hasGa4 = p.ga4OrganicSessions !== null
    const commercial = p.moneyPage || p.pageType === 'service_page' || p.pageType === 'product_page'

    if (commercial && hasGa4 && (p.ga4OrganicSessions ?? 0) >= 50) {
      if (p.ga4Conversions === null) {
        // Traffic exists but no conversion tracking → a tracking-quality opportunity, NOT "low converting".
        push({
          id: `${input.projectId}:tracking_quality:${p.url}`,
          projectId: input.projectId, type: 'tracking_quality', page: p.url, keyword: null,
          title: 'Set up conversion tracking on a high-traffic money page',
          primaryReason: `${p.ga4OrganicSessions} organic sessions but no conversion events are tracked — we can't tell if it converts.`,
          supportingSignals: [], conflictingSignals: [], dataSources: sources,
          businessValue: 60, expectedReturn: 40, effort: 'medium', risk: 'low', confidence: clamp(0.7 - fp),
          priorityScore: 0,
          estimate: { metric: 'conversion_upside', value: null, explanation: 'Insufficient data to estimate — no conversion tracking configured.', inputs: { sessions: p.ga4OrganicSessions }, confidence: 0, missing: ['conversion_tracking'] },
          capability: 'waiting_for_data',
          recommendedFix: 'Configure GA4 key events for this page (form submit, call, purchase) so conversion performance can be measured.',
          missingEvidence: ['conversion_tracking'],
        })
      } else if (p.ga4Conversions === 0) {
        // Real tracking, real traffic, zero conversions → CRO/intent opportunity.
        push({
          id: `${input.projectId}:conversion:${p.url}`,
          projectId: input.projectId, type: 'conversion', page: p.url, keyword: null,
          title: 'Improve conversions on a high-traffic money page',
          primaryReason: `${p.ga4OrganicSessions} organic sessions with tracked events but 0 conversions.`,
          supportingSignals: [], conflictingSignals: [], dataSources: sources,
          businessValue: 72, expectedReturn: 55, effort: 'medium', risk: 'medium', confidence: clamp(0.65 - fp),
          priorityScore: 0,
          estimate: { metric: 'conversion_upside', value: null, explanation: 'Insufficient data to estimate a rate without a baseline conversion history.', inputs: { sessions: p.ga4OrganicSessions, conversions: 0 }, confidence: 0.3, missing: ['baseline_conversion_rate'] },
          capability: 'ready_to_generate',
          recommendedFix: 'Review the conversion path and CTAs; check for intent mismatch and form/trust issues.',
          missingEvidence: [],
        })
      } else if ((p.ga4Conversions ?? 0) > 0 && p.observedRankings.length > 0 && p.observedRankings.every((r) => r.position > 10)) {
        // Converts well but ranks outside page 1 → high-priority SEO opportunity.
        push({
          id: `${input.projectId}:strong_conversion_weak_ranking:${p.url}`,
          projectId: input.projectId, type: 'strong_conversion_weak_ranking', page: p.url, keyword: null,
          title: 'Boost rankings on a page that already converts',
          primaryReason: `Converts (${p.ga4Conversions} conversions) but its tracked keywords all rank outside page 1 — strong upside.`,
          supportingSignals: ['Proven conversion value'], conflictingSignals: [], dataSources: sources,
          businessValue: 85, expectedReturn: 65, effort: 'high', risk: 'low', confidence: clamp(0.7 - fp),
          priorityScore: 0, estimate: null,
          capability: capabilityFor({ type: 'ranking', wordpressConnected: input.wordpressConnected, missingEvidence: [] }),
          recommendedFix: 'Prioritize internal links, content expansion, supporting cluster pages, and schema for this proven-converting page.',
          missingEvidence: [],
        })
      }
    }

    // Schema gap on an indexable page.
    if (p.schemaCoverage === 0 && p.indexable) {
      push({
        id: `${input.projectId}:schema:${p.url}`,
        projectId: input.projectId, type: 'schema', page: p.url, keyword: null,
        title: 'Add structured data',
        primaryReason: 'No schema on an indexable page — missing rich-result eligibility.',
        supportingSignals: [], conflictingSignals: [], dataSources: sources,
        businessValue: p.moneyPage ? 60 : 40, expectedReturn: 35, effort: 'low', risk: 'low', confidence: clamp(0.7 - fp),
        priorityScore: 0, estimate: null,
        capability: capabilityFor({ type: 'schema', wordpressConnected: input.wordpressConnected, missingEvidence: [] }),
        recommendedFix: 'Add appropriate JSON-LD schema for this page type.',
        missingEvidence: [],
      })
    }
  }

  // ── Prioritization: measured value first, penalize stale/low-confidence ──
  const list = [...byKey.values()]
  for (const o of list) {
    // Measured conversion evidence and money-page relationship boost; stale data penalizes.
    const measuredBoost = (o.dataSources.includes('ga4') ? 8 : 0) + (o.dataSources.includes('gsc') ? 5 : 0)
    const capabilityPenalty = o.capability === 'waiting_for_data' ? 8 : o.capability === 'waiting_for_wordpress' ? 5 : o.capability === 'blocked' ? 15 : 0
    o.priorityScore = Math.round(
      o.businessValue * 0.5 + o.expectedReturn * 0.3 + o.confidence * 20 + measuredBoost - capabilityPenalty - fp * 20
    )
  }
  // A low-confidence estimate shouldn't outrank a measured high-value opportunity:
  // confidence already contributes, and measured (ga4/gsc) sources add a boost.
  return list.sort((a, b) => b.priorityScore - a.priorityScore)
}

function clamp(n: number): number { return Math.max(0, Math.min(1, Math.round(n * 100) / 100)) }
