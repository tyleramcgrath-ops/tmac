// Pure change-detection for the daily refresh. No I/O and no provider imports,
// so it can be exercised directly (see scripts/check-refresh.mts) — the
// arithmetic here decides whether someone gets told their traffic collapsed,
// which is worth testing in isolation from the network.

// A metric has to move by more than this to be worth telling someone about.
// Search traffic wobbles a few percent day to day; reporting that as news
// would train people to ignore the feed, which is worse than staying quiet.
export const MATERIAL_CHANGE_PCT = 15

export interface GscTotals {
  clicks: number | null
  impressions: number | null
}

export function pctChange(current: number, prior: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(prior) || prior <= 0) return null
  return Math.round(((current - prior) / prior) * 100)
}

/**
 * Pull click/impression totals off either a live Atlas observation (which wraps
 * the payload in `.value`) or a stored prior snapshot (which holds it directly).
 * Anything missing stays null rather than defaulting to 0 — "we did not observe
 * this" and "this was zero" must never collapse into the same value, or an
 * outage reads as a traffic collapse.
 */
export function gscTotals(gsc: unknown): GscTotals {
  const wrapped = (gsc as { value?: { totals?: Partial<GscTotals> } } | null)?.value
  const totals = wrapped?.totals ?? (gsc as { totals?: Partial<GscTotals> } | null)?.totals
  return {
    clicks: typeof totals?.clicks === 'number' ? totals.clicks : null,
    impressions: typeof totals?.impressions === 'number' ? totals.impressions : null,
  }
}

/**
 * Describe what materially moved between two snapshots. Only compares values
 * BOTH snapshots actually observed — a provider that was down on either side
 * yields no finding at all, never a fabricated swing.
 */
export function describeChanges(current: GscTotals, prior: GscTotals): string[] {
  const changes: string[] = []
  for (const [label, cur, pri] of [
    ['Search Console clicks', current.clicks, prior.clicks],
    ['Search Console impressions', current.impressions, prior.impressions],
  ] as const) {
    if (cur == null || pri == null) continue
    const pct = pctChange(cur, pri)
    if (pct == null || Math.abs(pct) < MATERIAL_CHANGE_PCT) continue
    changes.push(`${label} ${pct > 0 ? 'up' : 'down'} ${Math.abs(pct)}% (${pri} → ${cur})`)
  }
  return changes
}
