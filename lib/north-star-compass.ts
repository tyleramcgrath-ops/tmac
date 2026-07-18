/**
 * Ask Compass — answer logic, extracted so the Command Center's context-aware
 * Compass panel and any other surface can share one honest, evidence-grounded
 * source of truth. No fabricated benchmarks, no invented certainty.
 */
import type { PreviewScenario } from './north-star-preview-data'

export type CompassContext = 'command-center' | 'digital-dna' | 'opportunity' | 'approval' | null

export const SUGGESTED_QUESTIONS = [
  'What should I care about today?',
  'Why is this the top priority?',
  'What changed since the last check?',
  'What are you doing right now?',
  'What are you waiting on from me?',
  'What do you still not understand?',
  'What should I ignore?',
  'What happens if I approve this?',
]

export function answerFor(question: string, scenario: PreviewScenario, context: CompassContext = null): string {
  const q = question.toLowerCase()
  const opp = scenario.opportunity
  const approval = scenario.pendingApproval

  if (q.includes('happens if i approve') || q.includes('what happens if i approve')) {
    if (!approval) return "Nothing is waiting on your approval right now — I'll ask when something is."
    return `${approval.whatChanges} ${approval.rollbackPlan}`
  }

  if (q.includes('waiting on') || q.includes('waiting from') || q.includes('need from me')) {
    if (approval) return `I need your decision on: ${approval.title}. ${approval.detail}`
    if (opp && !scenario.opportunityStale) return `Nothing urgent — the opportunity I found (${opp.headline}) is ready whenever you want to look at it. No deadline.`
    return "Nothing right now. I'll let you know the moment something needs your input."
  }

  if (q.includes('do not understand') || q.includes("don't understand") || q.includes('not understand')) {
    const gaps = scenario.digitalDna.filter((a) => a.understanding === 'needs-verification' || a.understanding === 'not-connected')
    if (gaps.length === 0) return "At this point I have at least partial evidence on every area I track. I'll flag it clearly whenever that changes."
    return `${gaps.length} area${gaps.length === 1 ? '' : 's'} I can't verify yet: ${gaps.map((g) => g.label).join(', ')}. ${gaps[0].note}`
  }

  if (q.includes('doing right now') || q.includes('doing now') || (q.includes('what are you') && q.includes('now'))) {
    const active = scenario.activity.find((a) => a.status !== 'finished' && a.status !== 'waiting')
    if (active) return `Right now: ${active.label.toLowerCase()}. ${active.finding ?? ''}`.trim()
    const waiting = scenario.activity.find((a) => a.status === 'waiting')
    return waiting ? `Nothing active this second — ${waiting.label.toLowerCase()}.` : "I've finished this cycle. I'll check again on schedule."
  }

  if (q.includes('top priority') || q.includes('why is this')) {
    if (opp) return `${opp.headline} It's rated ${opp.priority} priority because it touches how customers reach you directly — that's usually the highest-leverage thing to fix. Everything else can wait.`
    return "Nothing is flagged as a priority right now — that's a good sign, not an oversight."
  }

  if (q.includes('care about today') || q.includes('focus') || (q.includes('care about') && !q.includes('ignore'))) {
    if (approval) return `Review this: ${approval.title}. It's the one thing waiting on you.`
    if (opp) return `${opp.headline} That's the one thing worth your attention today — everything else can wait.`
    return "Nothing urgent today. Your business looks steady — I'd use the time elsewhere."
  }

  if (q.includes('changed since') || q.includes('what changed')) {
    if (scenario.id === 'no-changes') return 'Nothing important. Your site looks the same as your last check — no new issues, nothing to react to.'
    if (scenario.id === 'check-failed') return "I couldn't check today — your site didn't respond. I'm using your last successful check and I'll try again automatically."
    if (scenario.id === 'waiting-approval') return 'I found a mismatch between your website’s holiday hours and your Google Business Profile, and prepared a fix. It’s waiting for your approval.'
    return `Since your last check: ${opp ? opp.evidenceSummary : 'nothing material.'}`
  }

  if (q.includes('ignore')) {
    return 'Ignore anything about rankings, keywords, or technical scores for now — none of that matters until your contact info is easy to find. Fix the fundamentals first.'
  }

  if (context === 'digital-dna') {
    return "I'm building this picture from your website check, and I'll fill in more as you connect other sources. Anything marked \"needs verification\" just means I don't have enough evidence yet — not that something is wrong."
  }

  if (context === 'opportunity' && opp) {
    return `Here's what I'm sure of: ${opp.evidenceSummary} Here's what I'm not sure of yet: ${opp.cannotMeasure[0] ?? 'the exact business impact.'}`
  }

  if (context === 'approval' && approval) {
    return `${approval.whyRecommended} No spend required: ${approval.requiredSpend}`
  }

  return "I don't have enough evidence yet to answer that specifically. Here's what I'd focus on instead: " + (opp ? opp.headline : 'keeping an eye on your next check — nothing urgent today.')
}
