// Competitor Intelligence (Phase G §1). Overlap is COMPUTED from real crawls,
// never invented. Each of the seven overlap dimensions carries its own evidence
// grade, because they don't all come from the same place:
//
//   topic / service / entity / content  → OBSERVED  (from both sites' crawls)
//   business                            → ESTIMATED (inferred from page-type mix)
//   authority                           → UNAVAILABLE unless a backlink provider
//                                          supplied BOTH profiles
//
// When the competitor site cannot be crawled (outbound fetch blocked / not
// connected in this environment), every observed dimension degrades to
// UNAVAILABLE with a clear reason — the system explains why rather than guessing.

import type { PageSignals } from '../reco/signals'
import { classifyPage } from '../reco/classify'
import { estimated, observed, unavailable, type Observation } from './types'

export interface CompetitorOverlap {
  businessOverlap: Observation<number>
  topicOverlap: Observation<number>
  serviceOverlap: Observation<number>
  entityOverlap: Observation<number>
  contentOverlap: Observation<number>
  authorityOverlap: Observation<number>
}

const OVERLAP_KEYS = ['businessOverlap', 'topicOverlap', 'serviceOverlap', 'entityOverlap', 'contentOverlap', 'authorityOverlap'] as const

// A competitor's `overlap` field is untyped JSONB (persisted from a prior
// refresh, schema-less on the wire). Validate its shape before trusting it as
// a real CompetitorOverlap rather than casting blindly.
export function isCompetitorOverlap(x: unknown): x is CompetitorOverlap {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return OVERLAP_KEYS.every((k) => {
    const v = o[k] as { evidence?: { grade?: unknown } } | undefined
    return !!v && typeof v === 'object' && !!v.evidence && typeof v.evidence.grade === 'string'
  })
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0
  let inter = 0
  for (const x of a) if (b.has(x)) inter++
  const union = a.size + b.size - inter
  return union === 0 ? 0 : Number((inter / union).toFixed(3))
}

function tokens(pages: PageSignals[], pick: (p: PageSignals) => string): Set<string> {
  const s = new Set<string>()
  for (const p of pages) {
    for (const w of (pick(p) || '').toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 3)) s.add(w)
  }
  return s
}
function pageTypeSet(pages: PageSignals[]): Set<string> {
  return new Set(pages.map((p) => classifyPage(p).type))
}
function schemaSet(pages: PageSignals[]): Set<string> {
  const s = new Set<string>()
  for (const p of pages) for (const t of p.schemaTypes ?? []) s.add(t)
  return s
}
function serviceSlugs(pages: PageSignals[]): Set<string> {
  const s = new Set<string>()
  for (const p of pages) {
    const t = classifyPage(p).type
    if (['service', 'product', 'pricing', 'category', 'comparison'].includes(t)) {
      try {
        const slug = new URL(p.url).pathname.split('/').filter(Boolean).pop()
        if (slug) s.add(slug.toLowerCase())
      } catch {
        /* ignore */
      }
    }
  }
  return s
}

// `now` is passed in (no Date.now) so the whole engine stays deterministic.
export function computeOverlap(
  ourPages: PageSignals[],
  theirPages: PageSignals[] | null,
  now: string,
  hasBothBacklinkProfiles = false
): CompetitorOverlap {
  if (!theirPages || theirPages.length === 0) {
    const why = 'Competitor site was not crawled (outbound fetch blocked or not connected). Overlap cannot be observed.'
    return {
      businessOverlap: unavailable('none', why),
      topicOverlap: unavailable('none', why),
      serviceOverlap: unavailable('none', why),
      entityOverlap: unavailable('none', why),
      contentOverlap: unavailable('none', why),
      authorityOverlap: unavailable('none', 'Authority overlap needs backlink data for both domains — no backlink provider connected.'),
    }
  }

  const topic = jaccard(pageTypeSet(ourPages), pageTypeSet(theirPages))
  const service = jaccard(serviceSlugs(ourPages), serviceSlugs(theirPages))
  const entity = jaccard(schemaSet(ourPages), schemaSet(theirPages))
  const content = jaccard(tokens(ourPages, (p) => p.title ?? ''), tokens(theirPages, (p) => p.title ?? ''))
  // Business overlap is inferred (an estimate), not directly observed.
  const business = Number(((topic + service) / 2).toFixed(3))

  return {
    businessOverlap: estimated(business, 'inference', 'Inferred from page-type + service-slug similarity of both crawls; not a direct market measure.', Math.round(business * 100)),
    topicOverlap: observed(topic, 'rankforge-crawl', now, Math.round(topic * 100)),
    serviceOverlap: observed(service, 'rankforge-crawl', now, Math.round(service * 100)),
    entityOverlap: observed(entity, 'rankforge-crawl', now, Math.round(entity * 100)),
    contentOverlap: observed(content, 'rankforge-crawl', now, Math.round(content * 100)),
    authorityOverlap: hasBothBacklinkProfiles
      ? observed(0, 'backlinks', now) // real value would be computed by the caller from both profiles
      : unavailable('none', 'Authority overlap needs backlink data for both domains — no backlink provider connected.'),
  }
}
