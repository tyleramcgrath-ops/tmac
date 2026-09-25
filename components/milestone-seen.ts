// Which milestones this browser has already celebrated, per site, so each
// moment plays once. Browser-only and best-effort: private windows simply
// start fresh without replaying old moments (see Milestones.tsx).

const key = (siteId: string) => `saysites:milestones:${siteId}`

export function readSeen(siteId: string): string[] | null {
  try {
    const raw = window.localStorage.getItem(key(siteId))
    return raw ? (JSON.parse(raw) as string[]) : null
  } catch {
    return null
  }
}

export function writeSeen(siteId: string, ids: string[]) {
  try {
    window.localStorage.setItem(key(siteId), JSON.stringify([...new Set(ids)]))
  } catch {
    // Storage blocked: moments may repeat, nothing breaks.
  }
}

export function markSeen(siteId: string, id: string) {
  writeSeen(siteId, [...(readSeen(siteId) ?? []), id])
}
