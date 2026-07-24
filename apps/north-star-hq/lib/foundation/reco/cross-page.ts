// Cross-page analysis (Phase C §6) — restores the false negatives Phase B
// found: duplicate titles/metas, orphan pages, and template/entity
// consistency. Operates on the whole scan, not one page at a time.

import type { Finding } from './rules'
import type { PageSignals } from './signals'

export interface CrossPageFinding extends Finding {
  affectedUrls: string[]
  // Stable identity scope for cross-scan upsert (Phase D.6 P1): the shared
  // value that defines this duplicate group, or 'site' for whole-site findings.
  issueScope: string
}

// A URL the crawler could not read. Only entries the crawler actually fetched
// appear here (from scan.blocked); its shape mirrors the crawl engine's
// BlockedResult. `status` is the real HTTP status (0 = connection failed).
export interface BlockedPage {
  url: string
  status: number
  reason?: string
}

function coerceBlocked(raw: unknown[]): BlockedPage[] {
  return raw
    .filter((b): b is Record<string, unknown> => !!b && typeof b === 'object')
    .map((b) => ({ url: String(b.url ?? ''), status: typeof b.status === 'number' ? b.status : 0, reason: typeof b.reason === 'string' ? b.reason : undefined }))
    .filter((b) => b.url)
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

export function runCrossPageRules(rawPages: PageSignals[], rawBlocked: unknown[] = []): CrossPageFinding[] {
  // Exclude canonical-duplicate variants from cross-page analysis so a variant
  // isn't reported as a "duplicate" of its own canonical.
  const pages = rawPages.filter((p) => !p.duplicateOf)
  const out: CrossPageFinding[] = []
  const strip = (u: string) => u.split('#')[0].replace(/\/$/, '')

  // ── Duplicate titles ──
  for (const [value, urls] of duplicates(pages, 'title')) {
    out.push({
      ruleId: 'dup-title',
      issueScope: value,
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
  for (const [value, urls] of duplicates(pages, 'metaDescription')) {
    out.push({
      ruleId: 'dup-meta',
      issueScope: value,
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
      issueScope: 'site',
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

  // ── Broken internal links (links to pages the crawler read as HTTP errors) ──
  // Uses the crawl's own blocked set: a target is "broken" only when the
  // crawler actually fetched it and the server returned a 4xx/5xx. Policy
  // exclusions (WAF/bot-challenge, proxy denial, non-HTML, connection failures
  // → status 0) are NOT counted — those aren't the site's broken links, and
  // flagging them would fabricate a defect from an environment artifact.
  const blocked = coerceBlocked(rawBlocked)
  const errorTargets = new Map<string, number>() // normalized url → HTTP status
  for (const b of blocked) {
    if (b.status >= 400) errorTargets.set(strip(b.url), b.status)
  }
  if (errorTargets.size > 0) {
    // target url → set of source pages that link to it
    const linkedFrom = new Map<string, Set<string>>()
    for (const p of pages) {
      for (const t of p.internalTargets ?? []) {
        const k = strip(t)
        if (errorTargets.has(k)) {
          const set = linkedFrom.get(k) ?? new Set<string>()
          set.add(p.url)
          linkedFrom.set(k, set)
        }
      }
    }
    if (linkedFrom.size > 0) {
      const sourcePages = [...new Set([...linkedFrom.values()].flatMap((s) => [...s]))].sort()
      const elements = [...linkedFrom.entries()]
        .sort((a, b) => b[1].size - a[1].size)
        .slice(0, 10)
        .map(([target, sources]) => `${target} (HTTP ${errorTargets.get(target)}) — linked from ${sources.size} page${sources.size === 1 ? '' : 's'}`)
      out.push({
        ruleId: 'broken-internal-links',
        issueScope: 'site',
        title: `${linkedFrom.size} internal link target(s) return errors`,
        category: 'links',
        ruleCertainty: 0.85,
        importance: 0.75,
        seoImpact: 'high',
        effort: 'low',
        risk: { level: 'low', note: 'Fixing or removing a dead link is safe and additive.' },
        googleGuidance: 'Links to error pages waste crawl budget, break the user journey, and pass no internal authority.',
        supportingElements: elements,
        affectedUrls: sourcePages,
        explanation: {
          why: 'Internal links pointing to error pages dead-end users and crawlers and leak the link equity the link was meant to pass.',
          whyNow: `The crawl found live links to ${linkedFrom.size} URL(s) that returned HTTP errors — a concrete, already-happening defect.`,
          whyThisPage: `These ${sourcePages.length} page(s) contain at least one link to a URL that returned a 4xx/5xx during this crawl.`,
          whatIfIgnored: 'Users hit dead ends, crawl budget is wasted on error pages, and internal authority is lost.',
          whatCouldMakeWrong: 'A 5xx may be a transient server blip at crawl time, or the target may have been temporarily down — re-crawl to confirm before mass-editing.',
        },
      })
    }
  }

  return out
}
