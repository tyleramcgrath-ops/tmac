// Works out a site's Visibility Score from its pages, photos and traffic,
// and keeps today's score for the weekly leagues.

import { renderPage } from './render'
import { checkPage } from './seo'
import { checkSpeed } from './speed'
import type { Page, Site } from './schema'
import type { Media, Store, Visit } from './store'
import { vibeForSite } from './vibe'
import { visibility } from './visibility'
import { summarizeVisits } from './visits'

export interface ScoredSite {
  pages: Page[]
  media: Media[]
  visits: Visit[]
  errors: number
  tips: number
  fast: boolean
  traffic: ReturnType<typeof summarizeVisits>
  vis: ReturnType<typeof visibility>
}

// `visits` must reach back 60 days.
export async function scoreSite(store: Store, site: Site, today: string, pages: Page[], media: Media[], visits: Visit[]): Promise<ScoredSite> {
  const checks = pages.map((p) => ({ issues: checkPage(p, pages), speed: checkSpeed(renderPage(site, p, pages)) }))
  const errors = checks.reduce((n, c) => n + c.issues.filter((i) => i.severity === 'error').length, 0)
  const tips = checks.reduce((n, c) => n + c.issues.filter((i) => i.severity === 'warning').length, 0)
  const fast = checks.every((c) => c.speed.pass)
  const traffic = summarizeVisits(visits, today)
  const vis = visibility({
    site,
    pages,
    seoErrors: errors,
    seoTips: tips,
    fast,
    photos: media.filter((m) => m.mime !== 'image/svg+xml').length,
    visits30: traffic.total,
    visitsPrev30: traffic.previous,
    today,
    heldPages: [...vibeForSite(site, pages).entries()].filter(([pid, v]) => !v.indexable && pages.find((p) => p.id === pid)?.status === 'published' && !pages.find((p) => p.id === pid)?.seo.noindex).length,
  })
  // A lost snapshot only costs a league a day of precision; never block the page.
  await store.recordScore(site.id, today, vis.score).catch(() => {})
  return { pages, media, visits, errors, tips, fast, traffic, vis }
}
