import type { Candidate, JudgmentBoost } from './types'

/**
 * Contextual judgment layer. The Operator doesn't just score — it *thinks*.
 * These rules encode senior-strategist heuristics that override raw scoring:
 * a money page losing CTR is critical, a homepage typo is not; missing FAQ
 * schema on a converting page is high priority, a blog with no traffic is
 * usually ignorable.
 */
export function applyJudgment(
  candidate: Candidate,
  context: {
    isMoneyPage: boolean
    hasTrafficDrop: boolean
    hasCtrDrop: boolean
    hasZeroTraffic: boolean
    isConvertingPage: boolean
    supportingCount: number
    daysSinceLastEdit: number | null
    seasonalPriority: boolean
  },
): { adjustedScore: number; boosts: JudgmentBoost[] } {
  const boosts: JudgmentBoost[] = []
  let score = candidate.rawScore

  // Money page + CTR loss → immediately critical
  if (context.isMoneyPage && context.hasCtrDrop) {
    boosts.push({ reason: 'Money page is losing CTR — immediately critical', delta: +30 })
    score += 30
  }
  // Money page + traffic drop → critical
  if (context.isMoneyPage && context.hasTrafficDrop) {
    boosts.push({ reason: 'Money page is losing organic traffic', delta: +25 })
    score += 25
  }
  // Money page with no supporting content → hidden authority leak
  if (context.isMoneyPage && context.supportingCount === 0) {
    boosts.push({ reason: 'Money page has no supporting pages in the graph', delta: +20 })
    score += 20
  }
  // Missing FAQ schema on a converting page → high priority
  if (candidate.recommendationType.includes('faq_schema') && context.isConvertingPage) {
    boosts.push({ reason: 'Missing FAQ schema on a converting page', delta: +18 })
    score += 18
  }
  // Blog with no traffic — usually ignorable unless strategically important
  if (!context.isMoneyPage && context.hasZeroTraffic && !context.seasonalPriority) {
    boosts.push({ reason: 'Blog page with no traffic — deprioritized', delta: -25 })
    score -= 25
  }
  // Homepage cosmetic issue — deprioritize (unless money page)
  if (candidate.recommendationType.includes('typo') && !context.isMoneyPage) {
    boosts.push({ reason: 'Cosmetic issue on non-money page', delta: -15 })
    score -= 15
  }
  // Content freshness: page unedited for 12+ months is a refresh opportunity
  if (
    context.daysSinceLastEdit !== null &&
    context.daysSinceLastEdit > 365 &&
    candidate.recommendationType.includes('refresh')
  ) {
    boosts.push({ reason: 'Page not edited in 12+ months', delta: +8 })
    score += 8
  }
  // Seasonal amplifier
  if (context.seasonalPriority) {
    boosts.push({ reason: 'Aligns with an active seasonal priority', delta: +10 })
    score += 10
  }

  return {
    adjustedScore: Math.max(0, Math.min(120, score)),
    boosts,
  }
}
