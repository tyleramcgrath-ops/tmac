// Mobile-vs-desktop ranking gap: Google indexes and ranks mobile-first, so a
// site whose mobile average position is meaningfully worse than its desktop
// position (for the same real query mix, over the same window) usually has a
// real mobile-specific problem — slow mobile load, a broken responsive
// layout, blocked mobile resources, or an interstitial. Built entirely from
// the already-fetched GSC device breakdown; nothing here is estimated.

export interface GscDeviceRow {
  key: string // GSC device dimension value, e.g. "MOBILE" / "DESKTOP" / "TABLET"
  impressions: number
  position: number
}

export interface MobileGap {
  mobilePosition: number
  desktopPosition: number
  gap: number // positive = mobile is worse
}

const MIN_IMPRESSIONS = 20 // enough volume on both devices for position to mean anything
const MIN_GAP = 3 // positions worse before it's a real signal, not noise

function findDevice(rows: GscDeviceRow[], name: string): GscDeviceRow | null {
  return rows.find((r) => r.key.toLowerCase() === name) ?? null
}

export function detectMobileGap(rows: GscDeviceRow[], minGap = MIN_GAP): MobileGap | null {
  const mobile = findDevice(rows, 'mobile')
  const desktop = findDevice(rows, 'desktop')
  if (!mobile || !desktop) return null
  if (mobile.impressions < MIN_IMPRESSIONS || desktop.impressions < MIN_IMPRESSIONS) return null

  const gap = mobile.position - desktop.position
  if (gap < minGap) return null

  return { mobilePosition: mobile.position, desktopPosition: desktop.position, gap }
}
