// "While you were away" brief — built only from real, dated deltas of a run.
// If nothing moved past the noise floor, it says so honestly.

import type { BriefItem, Delta, MonitorRun, WhileYouWereAwayBrief } from './types'

function fmtDelta(d: Delta): BriefItem {
  const path = safePath(d.url)
  let headline: string
  let detail: string
  if (d.kind === 'position') {
    const moved = Math.abs(d.change)
    headline = `${path} ${d.good ? 'climbed' : 'slipped'} ${moved} ${moved === 1 ? 'spot' : 'spots'} in search`
    detail = `Position ${d.before} → ${d.after} for “${d.metric === 'serpPosition' ? 'the tracked keyword' : d.metric}”.`
  } else if (d.kind === 'critical') {
    const moved = Math.abs(d.change)
    headline = d.good
      ? `${moved} critical ${moved === 1 ? 'issue' : 'issues'} cleared on ${path}`
      : `${moved} new critical ${moved === 1 ? 'issue' : 'issues'} on ${path}`
    detail = `Outstanding critical issues ${d.before} → ${d.after}.`
  } else {
    const sign = d.change > 0 ? '+' : ''
    headline = `${d.label} ${d.good ? 'rose' : 'fell'} ${sign}${d.change} pts on ${path}`
    detail = `${d.before} → ${d.after} out of 100.`
  }
  return { headline, detail, url: d.url, direction: d.direction, good: d.good, metric: d.metric }
}

function safePath(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname === '/' ? u.hostname : u.pathname
  } catch {
    return url
  }
}

/**
 * Summarise a run for the executive brief. `topN` caps the surfaced movements
 * ("3 things moved while you were away"); the rest remain in the run record.
 */
export function buildBrief(run: MonitorRun, previousRanAt: string | null, topN = 3): WhileYouWereAwayBrief {
  const ranked = [...run.deltas].sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  const items = ranked.slice(0, topN).map(fmtDelta)
  const moved = run.deltas.length
  const siteScoreChange =
    run.siteScoreBefore != null && run.siteScoreAfter != null ? run.siteScoreAfter - run.siteScoreBefore : null

  let headline: string
  if (moved === 0) {
    headline = 'Nothing material moved since the last check.'
  } else {
    const goodCount = run.deltas.filter((d) => d.good).length
    const badCount = moved - goodCount
    if (badCount === 0) headline = `${moved} ${moved === 1 ? 'thing' : 'things'} moved — all in your favor.`
    else if (goodCount === 0) headline = `${moved} ${moved === 1 ? 'thing needs' : 'things need'} your attention.`
    else headline = `${moved} things moved: ${goodCount} up, ${badCount} to watch.`
  }

  return {
    siteId: run.siteId,
    generatedAt: new Date().toISOString(),
    since: previousRanAt,
    movedCount: moved,
    nothingChanged: moved === 0,
    headline,
    siteScore: run.siteScoreAfter,
    siteScoreChange,
    items,
  }
}
