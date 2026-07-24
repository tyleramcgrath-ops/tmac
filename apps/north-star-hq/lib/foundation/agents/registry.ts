// The agent roster (Phase F) and the ownership map that assigns each finding a
// single primary domain owner. Ownership is by rule CATEGORY, so it rides on the
// typed rule identity from D.6 P2 — no string parsing, no second rule engine.

import type { AgentDef, AgentId } from './types'

export const AGENTS: Record<AgentId, AgentDef> = {
  scout: {
    id: 'scout',
    name: 'Scout',
    responsibility: 'Crawl, discover, gather evidence, extract technical facts.',
    neverDoes: 'Never prioritizes or recommends — only reports facts.',
  },
  strategist: {
    id: 'strategist',
    name: 'Strategist',
    responsibility: 'Business understanding, money pages, roadmap, opportunity ranking.',
    neverDoes: 'Never deploys changes.',
  },
  technical: {
    id: 'technical',
    name: 'Technical SEO',
    responsibility: 'Crawlability, indexing, canonicals, robots, sitemaps, schema, redirects, performance.',
    neverDoes: 'Never rewrites content or invents backlinks.',
  },
  content: {
    id: 'content',
    name: 'Content Strategist',
    responsibility: 'Content gaps, refreshes, cannibalization, internal links, pillars, clusters, EEAT.',
    neverDoes: 'Never touches indexation/robots/canonical directives.',
  },
  local: {
    id: 'local',
    name: 'Local SEO',
    responsibility: 'Locations, GBP, NAP, service areas, local schema, citations.',
    neverDoes: 'Never activates for non-local businesses.',
  },
  authority: {
    id: 'authority',
    name: 'Authority Builder',
    responsibility: 'Backlink opportunities, digital PR, brand mentions, linkable assets, authority gaps.',
    neverDoes: 'Never fabricates outreach or invents authority metrics.',
  },
  cro: {
    id: 'cro',
    name: 'CRO Advisor',
    responsibility: 'Calls to action, forms, trust signals, conversion friction, landing pages.',
    neverDoes: 'Never sacrifices indexability for conversion without flagging it.',
  },
  operator: {
    id: 'operator',
    name: 'Operator',
    responsibility: 'Safe deployment, verification, rollback, audit trail.',
    neverDoes: 'Never invents fixes — only deploys approved work.',
  },
  qa: {
    id: 'qa',
    name: 'QA Reviewer',
    responsibility: 'Challenge every other agent: what could be wrong, what evidence is missing, what assumptions are weak.',
    neverDoes: 'Never rubber-stamps — must be skeptical.',
  },
}

export const AGENT_LIST: AgentDef[] = Object.values(AGENTS)

// Rule category → primary domain owner. Covers every category the D.6 rule
// registry can emit. Schema/indexability/technical/accessibility are Technical
// SEO's; content and links are the Content Strategist's.
const CATEGORY_OWNER: Record<string, AgentId> = {
  indexability: 'technical',
  technical: 'technical',
  schema: 'technical',
  accessibility: 'technical',
  content: 'content',
  links: 'content',
}

export function ownerForCategory(category: string): AgentId {
  return CATEGORY_OWNER[category] ?? 'technical'
}

// Money-page types where the CRO Advisor gets a say (conversion-relevant).
export const MONEY_PAGE_TYPES = new Set(['pricing', 'product', 'landing', 'service', 'category', 'comparison', 'contact'])

// Page types the Local SEO agent covers (only when the business is local).
export const LOCAL_PAGE_TYPES = new Set(['location', 'contact', 'homepage'])
