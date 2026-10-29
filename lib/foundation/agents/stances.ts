// Per-agent stance builders (Phase F). Each function expresses ONE agent's
// perspective on a single finding, from the finding's own typed fields (D.6 P2)
// — no re-running of rules, no fabrication. Together with qaChallenge() these
// are the inputs to the consensus engine.

import type { Recommendation } from '../types'
import { LOCAL_PAGE_TYPES, MONEY_PAGE_TYPES, ownerForCategory } from './registry'
import type { AgentStance } from './types'

export interface AgentContext {
  // Whether the project reads as a local business (Local SEO activation).
  local: boolean
}

// Scout: the discoverer. Reports facts, never recommends → always neutral.
export function scoutStance(rec: Recommendation): AgentStance {
  return {
    agentId: 'scout',
    position: 'neutral',
    confidence: 95,
    evidence: rec.evidence.facts.slice(0, 4),
    assumptions: [],
    note: `Discovered on ${rec.evidence.affectedUrls.length} page(s) via crawl; facts only, no judgement.`,
  }
}

// The primary domain owner: analyzed the finding and stands behind it.
export function ownerStance(rec: Recommendation): AgentStance {
  return {
    agentId: ownerForCategory(rec.ruleCategory),
    position: 'support',
    confidence: rec.confidence,
    evidence: rec.evidence.supportingElements ?? rec.evidence.facts.slice(0, 3),
    assumptions: rec.explanation?.whatCouldMakeWrong ? [rec.explanation.whatCouldMakeWrong] : [],
    note: rec.reasoning,
  }
}

// Strategist: weighs business priority. Supports when it is a money page /
// high-priority; neutral otherwise. Never blocks — it ranks.
export function strategistStance(rec: Recommendation): AgentStance {
  const money = rec.businessContext === 'money-page'
  const priority = rec.priorityScore ?? 0
  return {
    agentId: 'strategist',
    position: money || priority >= 40 ? 'support' : 'neutral',
    confidence: money ? 80 : 60,
    evidence: [`businessContext=${rec.businessContext}`, `priorityScore=${priority}`, `severity=${rec.ruleSeverity}`],
    assumptions: [],
    note: money
      ? 'Revenue-relevant page — prioritize.'
      : rec.businessContext === 'utility'
        ? 'Low-conversion utility page — deprioritize behind money pages.'
        : 'Standard priority.',
  }
}

// CRO Advisor: only weighs in on conversion-relevant (money) pages.
export function croStance(rec: Recommendation): AgentStance | null {
  const pageType = rec.pageType ?? ''
  if (rec.businessContext !== 'money-page' && !MONEY_PAGE_TYPES.has(pageType)) return null
  // Content/title/meta improvements on a money page help conversion; schema/
  // indexability fixes protect the conversion path. CRO supports either way.
  const conversionCopy = rec.ruleCategory === 'content'
  return {
    agentId: 'cro',
    position: 'support',
    confidence: conversionCopy ? 75 : 65,
    evidence: [`money/${pageType || 'money'} page`, `category=${rec.ruleCategory}`],
    assumptions: ['Assumes this page is a genuine conversion surface (not purely informational).'],
    note: conversionCopy
      ? 'SERP-facing copy on a conversion page — improving it should lift CTR and on-page conversion.'
      : 'Protects the conversion path on a money page.',
  }
}

// Local SEO: only activates for local businesses on local page types.
export function localStance(rec: Recommendation, ctx: AgentContext): AgentStance | null {
  if (!ctx.local) return null
  const pageType = rec.pageType ?? ''
  if (!LOCAL_PAGE_TYPES.has(pageType)) return null
  return {
    agentId: 'local',
    position: 'support',
    confidence: 70,
    evidence: [`local business`, `${pageType} page`],
    assumptions: ['Assumes this location/contact page targets a physical service area.'],
    note: 'Local-intent page — correctness here directly affects map-pack and local-pack visibility.',
  }
}
