// Recommendation Engine V2 (Phase C). Orchestrates:
//   classify → page rules → cross-page rules → Confidence 2.0 → Priority →
//   self-evaluation.
// Produces fewer, better, page-appropriate, fully-explained recommendations,
// and an honest self-evaluation that admits uncertainty.

import { randomUUID } from 'crypto'
import type { Recommendation, RecommendationStatus, Scan } from '../types'
import { classifyPage, type PageType } from './classify'
import { deriveBusinessContext, pageBusinessWeight, type ProjectContext } from './business'
import { runPageRules, ruleVersion, type Category, type Finding } from './rules'
import { runCrossPageRules, type CrossPageFinding } from './cross-page'
import { toPageSignals, type PageSignals } from './signals'
import { makeIssueId } from './identity'

/* ── Confidence 2.0 (Phase C §3) ──────────────────────────────────────────────
 * Confidence is NOT recommendation frequency. It expresses how sure we are the
 * recommendation is CORRECT, from:
 *   - ruleCertainty      : how mechanical/observed the detection is
 *   - classificationConf : how sure we are of the page context the rule needs
 *   - evidenceStrength   : how many concrete supporting elements back it
 * Result 0–100. A ubiquitous low-certainty fix scores LOWER than a rare
 * high-certainty one — the inverse of the Phase B formula.
 */
function confidence2(f: Finding, classificationConf: number): { value: number; basis: string } {
  const evidenceStrength = Math.min(1, (f.supportingElements.length || 1) / 2) * 0.15 + 0.85
  const contextFactor = 0.7 + 0.3 * classificationConf
  const value = Math.round(f.ruleCertainty * contextFactor * evidenceStrength * 100)
  return {
    value,
    basis: `ruleCertainty ${f.ruleCertainty} × context ${contextFactor.toFixed(2)} × evidence ${evidenceStrength.toFixed(2)}; NOT prevalence-based`,
  }
}

/* ── Priority engine (Phase C §7) ─────────────────────────────────────────────
 * priorityScore = businessWeight × importance × seoImpact × confidence ÷ effort,
 * damped by risk. Business impact and confidence — not a static severity table —
 * decide order, so a schema gap on the pricing page can outrank a title nit on
 * a policy page.
 */
const SEO_W = { high: 1.0, medium: 0.6, low: 0.3 }
const EFFORT_W = { low: 1.0, medium: 0.7, high: 0.45 }
const RISK_DAMP = { low: 1.0, medium: 0.9, high: 0.75 }

function priorityScore(f: Finding, businessWeight: number, confidence: number): number {
  return (
    businessWeight *
    f.importance *
    SEO_W[f.seoImpact] *
    (confidence / 100) *
    EFFORT_W[f.effort] *
    RISK_DAMP[f.risk.level] *
    100
  )
}

// Typed business-context bucket (Phase D.6 P2). Derived from the page's
// business weight so downstream consumers read a stable label, not a number.
function businessContextOf(businessWeight: number, pageType: string): string {
  if (pageType === 'site') return 'site'
  if (businessWeight >= 0.9) return 'money-page'
  if (businessWeight <= 0.4) return 'utility'
  return 'standard'
}

// Map the finding's importance/impact to the legacy severity enum for the UI.
function severityOf(f: Finding, businessWeight: number): 'critical' | 'warning' | 'info' {
  const score = f.importance * SEO_W[f.seoImpact] * businessWeight
  if (score >= 0.6 && f.seoImpact === 'high') return 'critical'
  if (score >= 0.35) return 'warning'
  return 'info'
}

export interface SelfEvaluation {
  totalPages: number
  totalRecommendations: number
  byCategory: Record<string, number>
  highConfidence: number // >=75
  lowConfidence: number // <50
  needsHumanReview: number
  potentialFalsePositives: { title: string; reason: string }[]
  potentialFalseNegatives: string[]
  notAnalyzed: string[]
}

export interface EngineResult {
  recommendations: Recommendation[]
  selfEvaluation: SelfEvaluation
}

export function generateRecommendationsV2(
  scan: Scan,
  project?: ProjectContext
): EngineResult {
  const rawPages = (scan.pages as Record<string, unknown>[]).map(toPageSignals)
  const canonical = rawPages.filter((p) => !p.duplicateOf)

  // 1. Classify every page (page intelligence).
  const classified = canonical.map((s) => ({ s, cls: classifyPage(s) }))
  const pageTypes = classified.map((c) => c.cls.type)

  // 2. Business context (money pages, locality) from project + crawl.
  const biz = deriveBusinessContext(project, pageTypes)

  // 3. Per-page, page-type-aware rules.
  interface Raw {
    finding: Finding
    url: string
    pageType: PageType
    classificationConf: number
    businessWeight: number
  }
  const perPage: Raw[] = []
  for (const { s, cls } of classified) {
    const businessWeight = pageBusinessWeight(cls.type, biz)
    for (const finding of runPageRules({ s, cls, biz })) {
      perPage.push({ finding, url: s.url, pageType: cls.type, classificationConf: cls.confidence, businessWeight })
    }
  }

  // 4. Cross-page rules (duplicate/orphan) — the restored false negatives.
  const cross: CrossPageFinding[] = runCrossPageRules(canonical)

  // 5. Group findings into as few recommendations as possible (Phase C: fewer,
  //    better). SCHEMA advice is page-type-specific (Organization vs Product),
  //    so it groups by its exact title — merging e.g. homepage+about+team that
  //    all want Organization. Page-AGNOSTIC rules (multiple-H1, title-length,
  //    missing-meta, alt-text) group SITE-WIDE by ruleId, so "7 pages have
  //    multiple H1s" is one recommendation, not seven.
  const SCHEMA_SPECIFIC = new Set(['schema-missing', 'breadcrumb', 'faq'])
  const grouped = new Map<
    string,
    { f: Finding; urls: string[]; classificationConf: number; businessWeight: number; types: Set<PageType> }
  >()
  for (const r of perPage) {
    const key = SCHEMA_SPECIFIC.has(r.finding.ruleId)
      ? `${r.finding.ruleId}|${r.finding.title}`
      : r.finding.ruleId // site-wide for page-agnostic rules
    const g = grouped.get(key)
    if (g) {
      g.urls.push(r.url)
      g.types.add(r.pageType)
      g.classificationConf = Math.max(g.classificationConf, r.classificationConf)
      g.businessWeight = Math.max(g.businessWeight, r.businessWeight)
    } else {
      grouped.set(key, {
        f: r.finding,
        urls: [r.url],
        classificationConf: r.classificationConf,
        businessWeight: r.businessWeight,
        types: new Set([r.pageType]),
      })
    }
  }

  const now = new Date().toISOString()
  const recs: Recommendation[] = []

  const push = (
    f: Finding,
    urls: string[],
    pageType: string,
    classificationConf: number,
    businessWeight: number,
    issueScope: string
  ) => {
    const conf = confidence2(f, classificationConf)
    const pscore = priorityScore(f, businessWeight, conf.value)
    const severity = severityOf(f, businessWeight)
    recs.push({
      id: randomUUID(),
      projectId: scan.projectId,
      scanId: scan.id,
      // Stable cross-scan identity (P1) — deterministic, not the random id above.
      issueId: makeIssueId(f.ruleId, issueScope),
      // Typed rule identity (P2) — the authoritative fields every downstream
      // consumer reads. No display string is ever parsed to recover these.
      ruleId: f.ruleId,
      ruleVersion: ruleVersion(f.ruleId),
      ruleCategory: f.category,
      ruleSeverity: severity,
      businessContext: businessContextOf(businessWeight, pageType),
      title: f.title,
      category: f.category,
      severity,
      status: 'open' as RecommendationStatus,
      pageType,
      priorityScore: Math.round(pscore * 10) / 10,
      googleGuidance: f.googleGuidance,
      explanation: f.explanation,
      needsHumanReview: conf.value < 50 || f.ruleCertainty < 0.65,
      reasoning:
        `${f.explanation.why} ${f.explanation.whyThisPage} Affects ${urls.length} ${pageType} page(s).`,
      // Presentation-only facts. Rule identity lives in the typed fields above,
      // never in this text (Phase D.6 P2 — no parseable "Rule ..." string here).
      evidence: {
        affectedUrls: urls.slice(0, 25),
        facts: [
          `Detected on ${urls.length} page(s) classified "${pageType}"`,
          ...f.supportingElements,
        ],
        supportingElements: f.supportingElements,
      },
      confidence: conf.value,
      confidenceBasis: conf.basis,
      expectedImpact: { category: f.category, size: f.seoImpact, note: f.explanation.whatIfIgnored },
      risk: f.risk,
      createdAt: now,
      history: [],
    })
  }

  for (const g of grouped.values()) {
    const pageType = g.types.size === 1 ? [...g.types][0] : 'multiple'
    // Identity scope mirrors the grouping: schema rules are page-type-specific
    // (keyed by title), page-agnostic rules are site-wide.
    const scope = SCHEMA_SPECIFIC.has(g.f.ruleId) ? g.f.title : 'site'
    push(g.f, g.urls, pageType, g.classificationConf, g.businessWeight, scope)
  }
  for (const c of cross) push(c, c.affectedUrls, 'site', 1, 0.9, c.issueScope)

  // 6. Assign deterministic priority rank (business/confidence-driven).
  recs.sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))
  recs.forEach((r, i) => (r.priorityRank = i + 1))

  // 7. Self-evaluation (Phase C §10) — openly admit uncertainty.
  const byCategory: Record<string, number> = {}
  for (const r of recs) byCategory[r.category] = (byCategory[r.category] ?? 0) + 1
  const notAnalyzed: string[] = []
  const anySignal = (k: keyof PageSignals) => canonical.some((p) => p[k] !== undefined)
  if (!anySignal('imagesMissingAlt')) notAnalyzed.push('image alt-text (signal not in crawl payload)')
  if (!anySignal('hasFaq')) notAnalyzed.push('FAQ presence (signal not in crawl payload)')
  notAnalyzed.push('Core Web Vitals / performance (requires PageSpeed Insights)')
  notAnalyzed.push('backlinks & keyword/content gap (require external providers)')

  const selfEvaluation: SelfEvaluation = {
    totalPages: canonical.length,
    totalRecommendations: recs.length,
    byCategory,
    highConfidence: recs.filter((r) => r.confidence >= 75).length,
    lowConfidence: recs.filter((r) => r.confidence < 50).length,
    needsHumanReview: recs.filter((r) => r.needsHumanReview).length,
    potentialFalsePositives: recs
      .filter((r) => r.needsHumanReview)
      .map((r) => ({ title: r.title, reason: r.explanation?.whatCouldMakeWrong ?? 'lower-certainty rule' })),
    potentialFalseNegatives: notAnalyzed.filter((n) => n.includes('signal not in crawl')),
    notAnalyzed,
  }

  return { recommendations: recs, selfEvaluation }
}
