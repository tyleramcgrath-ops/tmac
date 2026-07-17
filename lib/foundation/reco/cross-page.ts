// Cross-page analysis (Phase C §6) — restores the false negatives Phase B
// found: duplicate titles/metas, orphan pages, and template/entity
// consistency. Operates on the whole scan, not one page at a time.

import type { Finding } from './rules'
import type { PageSignals } from './signals'

export interface CrossPageFinding extends Finding {
  affectedUrls: string[]
}

function norm(s: string | undefined): string {
  return (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

// Group pages by identical (normalized) title / meta description.
function duplicates(pages: PageSignals[], field: 'title' | 'metaDescription'): Map<string, string[]> {
  const groups = new Map<string, string[]>()
  for (const p of pages) {
    const v = norm(p[field])
    if (!v) continue
    const arr = groups.get(v) ?? []
    arr.push(p.url)
    groups.set(v, arr)
  }
  // keep only genuine duplicates (2+ pages sharing the exact value)
  return new Map([...groups].filter(([, urls]) => urls.length >= 2))
}

export function runCrossPageRules(rawPages: PageSignals[]): CrossPageFinding[] {
  // Exclude canonical-duplicate variants from cross-page analysis so a variant
  // isn't reported as a "duplicate" of its own canonical.
  const pages = rawPages.filter((p) => !p.duplicateOf)
  const out: CrossPageFinding[] = []

  // ── Duplicate titles ──
  for (const [, urls] of duplicates(pages, 'title')) {
    out.push({
      ruleId: 'dup-title',
      title: `${urls.length} pages share the same <title>`,
      category: 'content',
      ruleCertainty: 0.95,
      importance: 0.7,
      seoImpact: 'medium',
      effort: 'medium',
      risk: { level: 'low', note: 'Differentiating titles is safe.' },
      googleGuidance: 'Duplicate titles make pages compete and weaken relevance signals.',
      supportingElements: urls.slice(0, 10),
      affectedUrls: urls,
      explanation: {
        why: 'Identical titles make pages indistinguishable to search and dilute relevance.',
        whyNow: 'Duplicate titles across a site are a systemic, compounding issue.',
        whyThisPage: 'These specific URLs all emit the same title text.',
        whatIfIgnored: 'Pages cannibalize each other; the wrong one may rank.',
        whatCouldMakeWrong: 'Some near-duplicate pages legitimately share a brand suffix; only exact matches are flagged.',
      },
    })
  }

  // ── Duplicate meta descriptions (the specific Phase B FN-1) ──
  for (const [, urls] of duplicates(pages, 'metaDescription')) {
    out.push({
      ruleId: 'dup-meta',
      title: `${urls.length} pages share the same meta description`,
      category: 'content',
      ruleCertainty: 0.95,
      importance: 0.6,
      seoImpact: 'medium',
      effort: 'medium',
      risk: { level: 'low', note: 'Writing unique descriptions is safe.' },
      googleGuidance: 'Unique, descriptive meta descriptions improve snippet relevance per page.',
      supportingElements: urls.slice(0, 10),
      affectedUrls: urls,
      explanation: {
        why: 'Shared meta descriptions produce generic snippets that fit no page well.',
        whyNow: 'A repeated, template-level miss worth fixing once across pages.',
        whyThisPage: 'These URLs all emit the same meta description text.',
        whatIfIgnored: 'Weaker, less relevant SERP snippets and lower CTR.',
        whatCouldMakeWrong: 'A small site may intentionally reuse a description; still usually worth differentiating.',
      },
    })
  }

  // ── Orphan pages (no internal inbound links from the crawled set) ──
  const inbound = new Map<string, number>()
  const strip = (u: string) => u.split('#')[0].replace(/\/$/, '')
  for (const p of pages) inbound.set(strip(p.url), 0)
  for (const p of pages) {
    for (const t of p.internalTargets ?? []) {
      const k = strip(t)
      if (inbound.has(k)) inbound.set(k, (inbound.get(k) ?? 0) + 1)
    }
  }
  const orphans = pages
    .map((p) => p.url)
    .filter((u) => (inbound.get(strip(u)) ?? 0) === 0)
    // The homepage/root is legitimately reached without internal inbound links.
    .filter((u) => {
      try {
        return new URL(u).pathname.replace(/\/$/, '') !== ''
      } catch {
        return true
      }
    })
  if (orphans.length > 0 && pages.some((p) => (p.internalTargets?.length ?? 0) > 0)) {
    out.push({
      ruleId: 'orphan-pages',
      title: `${orphans.length} page(s) have no internal inbound links`,
      category: 'links',
      ruleCertainty: 0.7,
      importance: 0.6,
      seoImpact: 'medium',
      effort: 'medium',
      risk: { level: 'low', note: 'Adding contextual internal links is safe.' },
      googleGuidance: 'Orphan pages get little crawl priority and pass no internal authority.',
      supportingElements: orphans.slice(0, 10),
      affectedUrls: orphans,
      explanation: {
        why: 'Pages with no internal inbound links are hard for crawlers and users to find.',
        whyNow: 'Orphans waste content investment already made.',
        whyThisPage: 'No crawled page links to these URLs.',
        whatIfIgnored: 'Weak crawl frequency and no internal authority flow.',
        whatCouldMakeWrong: 'The crawl may be incomplete, so a real inbound link could exist outside the sampled set.',
      },
    })
  }

  return out
}
