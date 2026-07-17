// Recommendation builder (A8) — turns a persisted scan into stored,
// evidence-backed recommendations.
//
// Every recommendation answers: Why? Evidence? Confidence? Expected impact?
// Risk? Confidence is deterministic and its basis is stored alongside the
// number: rule certainty (how mechanical the check is) × prevalence (how
// many crawled pages exhibit it). No invented dollars, no magic constants
// presented as measurements.

import { randomUUID } from 'crypto'
import type { Recommendation, Scan } from './types'

interface ScanPage {
  url: string
  wordCount?: number
  duplicateOf?: string
  fixes?: { severity: 'critical' | 'warning' | 'info'; category: string; title: string }[]
}

// How mechanical/certain each fix category is. A missing <title> is a fact
// (1.0); "thin content" is a heuristic that depends on page purpose (0.6).
const RULE_CERTAINTY: Record<string, number> = {
  'Critical technical fixes': 0.95,
  'Content gaps': 0.7,
  'Schema opportunities': 0.85,
  'Internal link targets': 0.75,
  'Keyword targeting': 0.65,
}

const CATEGORY_IMPACT: Record<string, { category: string; note: string }> = {
  'Critical technical fixes': { category: 'technical', note: 'Removes crawl/indexation blockers.' },
  'Content gaps': { category: 'content', note: 'Improves relevance and snippet quality.' },
  'Schema opportunities': { category: 'schema', note: 'Improves machine readability and rich-result eligibility.' },
  'Internal link targets': { category: 'technical', note: 'Improves crawl paths and authority flow.' },
  'Keyword targeting': { category: 'content', note: 'Aligns the page with its target query.' },
}

const SEVERITY_SIZE: Record<string, 'high' | 'medium' | 'low'> = {
  critical: 'high',
  warning: 'medium',
  info: 'low',
}

// Content-change fixes carry more deployment risk than additive markup.
function riskFor(category: string, title: string): { level: 'low' | 'medium' | 'high'; note: string } {
  if (/rewrite|expand|content/i.test(title) || category === 'Content gaps') {
    return { level: 'medium', note: 'Changes visible copy — review wording before deploying.' }
  }
  return { level: 'low', note: 'Additive/markup change; does not alter visible copy.' }
}

export function buildRecommendationsFromScan(
  scan: Scan,
  maxRecommendations = 50
): Recommendation[] {
  const pages = scan.pages as ScanPage[]
  // Canonical-duplicate variants are excluded so one real issue is never
  // counted once per URL variant.
  const canonicalPages = pages.filter((p) => !p.duplicateOf)
  const total = canonicalPages.length
  if (total === 0) return []

  // Group identical fixes across pages: one recommendation per issue, with
  // every affected URL as evidence.
  const groups = new Map<string, { severity: 'critical' | 'warning' | 'info'; category: string; title: string; urls: string[] }>()
  for (const page of canonicalPages) {
    for (const fix of page.fixes ?? []) {
      const key = `${fix.category}|${fix.title.replace(/\d+/g, 'N')}`
      const g = groups.get(key)
      if (g) g.urls.push(page.url)
      else groups.set(key, { severity: fix.severity, category: fix.category, title: fix.title, urls: [page.url] })
    }
  }

  const now = new Date().toISOString()
  const rank = { critical: 0, warning: 1, info: 2 }

  return [...groups.values()]
    .sort((a, b) => rank[a.severity] - rank[b.severity] || b.urls.length - a.urls.length)
    .slice(0, maxRecommendations)
    .map((g) => {
      const prevalence = g.urls.length / total
      const certainty = RULE_CERTAINTY[g.category] ?? 0.6
      const confidence = Math.round(certainty * (0.5 + 0.5 * Math.min(1, prevalence * 2)) * 100)
      const impact = CATEGORY_IMPACT[g.category] ?? { category: 'technical', note: '' }
      return {
        id: randomUUID(),
        projectId: scan.projectId,
        scanId: scan.id,
        title: g.title,
        category: g.category,
        severity: g.severity,
        status: 'open' as const,
        reasoning:
          `${g.urls.length} of ${total} crawled pages exhibit this issue. ` +
          `${impact.note} Severity ${g.severity} per the crawl fix ruleset.`,
        evidence: {
          affectedUrls: g.urls.slice(0, 25),
          facts: [
            `Observed on ${g.urls.length}/${total} canonical pages in scan ${scan.id}`,
            `Detected by deterministic rule in category "${g.category}"`,
          ],
        },
        confidence,
        confidenceBasis: `rule certainty ${certainty} × prevalence factor (${g.urls.length}/${total} pages); deterministic, no model output`,
        expectedImpact: { category: impact.category, size: SEVERITY_SIZE[g.severity], note: impact.note },
        risk: riskFor(g.category, g.title),
        createdAt: now,
        history: [],
      }
    })
}
