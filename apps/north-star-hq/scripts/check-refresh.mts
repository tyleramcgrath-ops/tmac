// Checks for the daily refresh's change detection (lib/foundation/refresh/changes.ts).
//
// The failure that matters here is a FALSE alarm. This arithmetic decides
// whether someone is told their traffic collapsed, so the cases below lean
// hard on the "provider was simply unavailable" paths — reporting an outage as
// a collapse would teach people to ignore the feed, which is worse than the
// feed not existing.
//
//   npm run check:refresh

import { describeChanges, MATERIAL_CHANGE_PCT, pctChange, gscTotals } from '../lib/foundation/refresh/changes.ts'

let pass = 0
let fail = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (ok) pass++
  else fail++
}

const g = (clicks: number | null, impressions: number | null) => ({ clicks, impressions })

// ── Real movement is reported ───────────────────────────────────────────────
check(
  'a halving is reported as a drop',
  describeChanges(g(50, 1000), g(100, 1000)).some((c) => /clicks down 50% \(100 → 50\)/.test(c)),
  JSON.stringify(describeChanges(g(50, 1000), g(100, 1000)))
)
check('a doubling is reported as a rise', describeChanges(g(200, 1000), g(100, 1000)).some((c) => /clicks up 100%/.test(c)))
check('both metrics report independently', describeChanges(g(200, 2000), g(100, 1000)).length === 2)

// ── Noise stays quiet ───────────────────────────────────────────────────────
check('5% day-to-day wobble is not reported', describeChanges(g(105, 1000), g(100, 1000)).length === 0)
check(`${MATERIAL_CHANGE_PCT - 1}% stays under the threshold`, describeChanges(g(114, 1000), g(100, 1000)).length === 0)
check(`${MATERIAL_CHANGE_PCT}% crosses it`, describeChanges(g(115, 1000), g(100, 1000)).length === 1)
check('identical snapshots report nothing', describeChanges(g(100, 1000), g(100, 1000)).length === 0)

// ── Missing data must never masquerade as change ────────────────────────────
check('provider down today is not a collapse', describeChanges(g(null, null), g(100, 1000)).length === 0)
check('provider down yesterday is not a spike', describeChanges(g(100, 1000), g(null, null)).length === 0)
check('one metric missing does not suppress the other', describeChanges(g(null, 2000), g(100, 1000)).length === 1)
check('zero prior does not divide by zero', describeChanges(g(100, 1000), g(0, 0)).length === 0)
check('pctChange refuses a zero baseline', pctChange(100, 0) === null)
check('a real zero today IS a collapse, not missing data', describeChanges(g(0, 1000), g(100, 1000)).length === 1)

// ── Totals are read from both shapes, and absence stays absent ──────────────
check('reads a live Atlas observation (.value.totals)', gscTotals({ value: { totals: { clicks: 7, impressions: 9 } } }).clicks === 7)
check('reads a stored prior snapshot (.totals)', gscTotals({ totals: { clicks: 7, impressions: 9 } }).impressions === 9)
check('null snapshot yields nulls, not zeros', gscTotals(null).clicks === null)
check('absent totals yield nulls, not zeros', gscTotals({ value: {} }).clicks === null)

console.log(`\n  ${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
