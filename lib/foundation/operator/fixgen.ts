// Fix Generation (Phase D §2). Turns a recommendation into an ACTUAL proposed
// change — never "you should…", always "here is exactly what should change."
//
// Generation is deterministic and derived from real page signals, so a fix can
// be produced with no external dependency. An AI rewrite (via the existing
// /api/forge/rewrite) is an optional quality enhancer, never required. Fixes
// that cannot be produced safely from signals return actionable = false with a
// reason, rather than fabricating a change.

import type { PageSignals } from '../reco/signals'
import { classifyPage, PREFERRED_SCHEMA } from '../reco/classify'
import { rankLinkCandidates } from '../reco/link-ranking'
import type { ContentTransform } from './content-fix'

export type FixKind =
  | 'title'
  | 'metaDescription'
  | 'schema'
  | 'altText'
  | 'canonical'
  | 'heading'
  | 'mixedContent'
  | 'internalLinks'
  | 'none'

export interface GeneratedFix {
  actionable: boolean
  kind: FixKind
  // The WordPress-deployable field + value (title/metaDescription), when the
  // fix maps to a supported write. schema/alt are advisory payloads.
  deploy?: { title?: string; metaDescription?: string }
  // A body-content transform (Phase H): https-upgrade, prepend-h1, internal
  // links. Applied to the LIVE post content at deploy time. Present ⇒ this fix
  // is a WordPress content write (not title/meta).
  contentTransform?: ContentTransform
  // The concrete artifact to apply (e.g. the JSON-LD block, or the new title).
  proposedValue: string
  currentValue: string
  note: string
}

// Extra context a fix generator may use (e.g. other real site pages to link to).
export interface FixGenContext {
  sitePages?: { url: string; title: string }[]
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

function deriveHeading(s: PageSignals): string {
  const fromTitle = (s.title ?? '').split(/[·|—–]/)[0].trim()
  if (fromTitle) return fromTitle
  try {
    const slug = decodeURIComponent(new URL(s.url).pathname.split('/').filter(Boolean).pop() ?? '')
    const words = slug.replace(/[-_]+/g, ' ').trim()
    if (words) return words.replace(/\b\w/g, (c) => c.toUpperCase())
  } catch {
    /* fall through */
  }
  return 'Overview'
}

function brandFromTitle(title: string | undefined): string {
  // Titles often end with "· Brand" or "| Brand"; reuse the brand suffix.
  if (!title) return ''
  const m = title.split(/[·|—–-]/).map((s) => s.trim()).filter(Boolean)
  return m.length > 1 ? m[m.length - 1] : ''
}

// Derive a real, page-specific title fragment from the URL: the last path
// segment, humanized, or "Home" for the root — never invented copy.
function slugTitle(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean)
    if (parts.length === 0) return 'Home'
    return decodeURIComponent(parts[parts.length - 1]).replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  } catch {
    return ''
  }
}

function truncateTitle(title: string, max = 60): string {
  if (title.length <= max) return title
  // Trim on a word boundary, keep a trailing brand if present.
  const brand = brandFromTitle(title)
  const core = brand ? title.slice(0, title.lastIndexOf(brand)).replace(/[·|—–-]\s*$/, '').trim() : title
  const room = brand ? max - brand.length - 3 : max
  const trimmed = core.slice(0, Math.max(10, room)).replace(/\s+\S*$/, '').trim()
  return brand ? `${trimmed} · ${brand}` : trimmed
}

// Build a page-appropriate JSON-LD object (raw, unwrapped) from real signals.
function generateSchemaJson(s: PageSignals): string {
  const type = classifyPage(s).type
  const preferred = PREFERRED_SCHEMA[type] ?? 'WebPage'
  const name = (s.title ?? '').split(/[·|—–]/)[0].trim() || s.url
  const base: Record<string, unknown> = { '@context': 'https://schema.org', '@type': preferred.split('/')[0], name, url: s.url }
  if (preferred.startsWith('Product')) {
    base.offers = { '@type': 'Offer', url: s.url, availability: 'https://schema.org/InStock' }
  }
  if (preferred === 'Organization') {
    base.name = brandFromTitle(s.title) || name
  }
  if (s.metaDescription) base.description = s.metaDescription
  return JSON.stringify(base, null, 2)
}

// Build a BreadcrumbList JSON-LD object (raw, unwrapped) from the page's own
// URL path segments. Each ancestor's label is the REAL crawled page's title
// when we have it (matched against ctx.sitePages), otherwise a humanized
// path segment — never invented copy, and every `item` URL is a real,
// derivable ancestor URL on this site, never a guessed ancestor page.
function generateBreadcrumbJson(s: PageSignals, sitePages: { url: string; title: string }[]): string | null {
  let origin: string
  let segments: string[]
  try {
    const u = new URL(s.url)
    origin = u.origin
    segments = u.pathname.split('/').filter(Boolean)
  } catch {
    return null
  }
  if (segments.length === 0) return null // homepage has no trail
  const byPath = new Map(sitePages.map((p) => [p.url.replace(/\/$/, ''), p.title]))
  const humanize = (seg: string) => decodeURIComponent(seg).replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const items: { '@type': 'ListItem'; position: number; name: string; item: string }[] = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
  ]
  segments.forEach((seg, i) => {
    const path = `${origin}/${segments.slice(0, i + 1).join('/')}`
    const isLast = i === segments.length - 1
    const label = (isLast ? (s.title ?? '').split(/[·|—–]/)[0].trim() : '') || byPath.get(path) || humanize(seg)
    items.push({ '@type': 'ListItem', position: i + 2, name: label, item: `${path}/` })
  })
  return JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items }, null, 2)
}

// Generate a concrete fix for a recommendation identified by its rule.
// `ruleId` is embedded in the recommendation's evidence facts; callers pass it.
export function generateFix(ruleId: string, s: PageSignals, ctx: FixGenContext = {}): GeneratedFix {
  switch (ruleId) {
    case 'mixed-content': {
      // Upgrade insecure same-host http:// sub-resources to https. Deterministic
      // scheme swap on the page's own host (+ www) — never touches third-party
      // links that may lack an https endpoint.
      const host = hostOf(s.url)
      if (!host) return { actionable: false, kind: 'none', proposedValue: '', currentValue: '', note: 'Could not determine the page host.' }
      const hosts = host.startsWith('www.') ? [host, host.slice(4)] : [host, `www.${host}`]
      return {
        actionable: true,
        kind: 'mixedContent',
        contentTransform: { type: 'https-upgrade', hosts },
        proposedValue: `Rewrite http://${host}… → https://${host}… in the post body`,
        currentValue: 'Insecure http:// sub-resource(s) on an https page',
        note: 'Upgrades same-host insecure references to https. Applied to the live post body; verified by read-back.',
      }
    }
    case 'missing-h1': {
      const text = deriveHeading(s)
      return {
        actionable: true,
        kind: 'heading',
        contentTransform: { type: 'prepend-h1', text },
        proposedValue: `<h1>${text}</h1>`,
        currentValue: '(no H1 on the page)',
        note: 'Inserts a single H1 derived from the page title/slug. Edit the heading text before deploy if needed.',
      }
    }
    case 'internal-linking': {
      // Link to a few OTHER real pages from this scan the page doesn't already
      // link to — ranked by topical relevance (title/URL overlap with this
      // page), not an arbitrary slice, since a related page is both more
      // useful to readers and a stronger SEO signal than a random one.
      // Sourced from the crawl — never invented URLs.
      const already = new Set((s.internalTargets ?? []).map((u) => u.replace(/\/$/, '')))
      const pool = (ctx.sitePages ?? [])
        .filter((p) => p.url && p.url.replace(/\/$/, '') !== s.url.replace(/\/$/, '') && !already.has(p.url.replace(/\/$/, '')))
      const candidates = rankLinkCandidates({ url: s.url, title: s.title ?? '' }, pool, 3)
      if (candidates.length === 0) {
        return { actionable: false, kind: 'internalLinks', proposedValue: '', currentValue: `${(s.internalTargets ?? []).length} internal links`, note: 'No other crawled pages available to link to — re-run a fuller crawl.' }
      }
      return {
        actionable: true,
        kind: 'internalLinks',
        contentTransform: { type: 'append-internal-links', links: candidates },
        proposedValue: candidates.map((c) => `→ ${c.anchor} (${c.url})`).join('\n'),
        currentValue: `${(s.internalTargets ?? []).length} internal links`,
        note: 'Appends a "Related pages" block linking to real crawled pages. Review the selection before deploy.',
      }
    }
    case 'missing-title': {
      // Compose from H1 intent + brand when available; else from the URL slug.
      const brand = brandFromTitle(s.title)
      const slug = (() => {
        try {
          return decodeURIComponent(new URL(s.url).pathname.split('/').filter(Boolean).pop() ?? '')
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
        } catch {
          return 'Page'
        }
      })()
      const value = brand ? `${slug} · ${brand}` : slug
      return { actionable: true, kind: 'title', deploy: { title: value }, proposedValue: value, currentValue: '', note: 'Composed from the URL slug (+brand). Review wording before deploy.' }
    }
    case 'dup-title': {
      // Multiple pages share the exact same <title>. Differentiate THIS page
      // (s.title is the duplicate value itself, so it can't be reused as-is)
      // from its own URL slug, keeping any existing brand suffix.
      const brand = brandFromTitle(s.title)
      const slug = slugTitle(s.url)
      if (!slug) {
        return { actionable: false, kind: 'none', proposedValue: '', currentValue: s.title ?? '', note: 'Could not derive a distinct title from this page’s URL — edit manually.' }
      }
      const value = truncateTitle(brand ? `${slug} · ${brand}` : slug, 60)
      return {
        actionable: true,
        kind: 'title',
        deploy: { title: value },
        proposedValue: value,
        currentValue: s.title ?? '',
        note: 'Composed from this page’s URL slug (+brand) so it no longer duplicates the title shared with other pages. Review wording before deploy.',
      }
    }
    case 'title-length': {
      if (!s.title) return { actionable: false, kind: 'none', proposedValue: '', currentValue: '', note: 'No current title to shorten.' }
      if (s.title.length <= 70) return { actionable: false, kind: 'none', proposedValue: '', currentValue: s.title, note: 'Title within range; no change.' }
      const value = truncateTitle(s.title, 60)
      return { actionable: true, kind: 'title', deploy: { title: value }, proposedValue: value, currentValue: s.title, note: 'Shortened on a word boundary, brand preserved.' }
    }
    case 'missing-meta': {
      // Derive a description from the title + page type; keep within 155 chars.
      const type = classifyPage(s).type
      const subject = (s.title ?? '').split(/[·|—–]/)[0].trim() || 'this page'
      const templates: Record<string, string> = {
        pricing: `Compare ${subject} plans and pricing. Find the right option for your needs and get started today.`,
        product: `${subject}: features, benefits, and how it works. Learn more and get started.`,
        service: `${subject} — what we offer and how we can help. Learn more and get in touch.`,
        documentation: `${subject} documentation: setup, usage, and reference. Everything you need to get started.`,
      }
      const value = (templates[type] ?? `${subject} — learn more about what this page offers.`).slice(0, 155)
      return { actionable: true, kind: 'metaDescription', deploy: { metaDescription: value }, proposedValue: value, currentValue: s.metaDescription ?? '', note: 'Template-derived; edit to match the page voice before deploy.' }
    }
    case 'schema-missing': {
      const json = generateSchemaJson(s)
      return {
        actionable: true,
        kind: 'schema',
        contentTransform: { type: 'set-jsonld', jsonLd: json },
        proposedValue: `<script type="application/ld+json">\n${json}\n</script>`,
        currentValue: '(no JSON-LD)',
        note: 'Page-appropriate JSON-LD, written into the post body as a managed block and verified by read-back.',
      }
    }
    case 'breadcrumb': {
      const json = generateBreadcrumbJson(s, ctx.sitePages ?? [])
      if (!json) {
        return { actionable: false, kind: 'schema', proposedValue: '', currentValue: '(no BreadcrumbList)', note: 'Could not derive a breadcrumb trail from this URL.' }
      }
      return {
        actionable: true,
        kind: 'schema',
        contentTransform: { type: 'set-jsonld', jsonLd: json, key: 'breadcrumb' },
        proposedValue: `<script type="application/ld+json">\n${json}\n</script>`,
        currentValue: '(no BreadcrumbList)',
        note: 'BreadcrumbList built from this URL\'s real path segments, labeled from crawled page titles where available. Written as its own managed block, independent of any page schema.',
      }
    }
    case 'multiple-h1': {
      return {
        actionable: true,
        kind: 'heading',
        contentTransform: { type: 'demote-extra-h1' },
        proposedValue: `Demote extra H1${(s.h1Count ?? 2) > 2 ? 's' : ''} to H2, keep the first`,
        currentValue: `${s.h1Count ?? 'multiple'} H1 headings`,
        note: 'Demotes every H1 after the first to H2 in the live post body. Which heading counts as "first" is document order — review the diff before deploy.',
      }
    }
    case 'local-business-incomplete': {
      const missing = s.localBusinessMissingFields ?? []
      return {
        actionable: false,
        kind: 'schema',
        proposedValue: '',
        currentValue: `LocalBusiness schema missing: ${missing.join(', ') || 'unknown fields'}`,
        note: 'Real business name/address/phone must come from the business, not be invented — add the missing fields to the existing JSON-LD manually.',
      }
    }
    case 'alt-text': {
      return { actionable: false, kind: 'altText', proposedValue: '', currentValue: `${s.imagesMissingAlt ?? 0} images without alt`, note: 'Alt text must describe each specific image; generate per-image with human input.' }
    }
    case 'broken-internal-links': {
      // Advisory: each broken link is either repaired (fix the target/URL) or
      // removed, which is a judgment call we won't automate. The specific
      // broken targets are listed in the recommendation's evidence.
      return { actionable: false, kind: 'internalLinks', proposedValue: '', currentValue: 'links to error (4xx/5xx) pages', note: 'Repair or remove each dead link — deciding which needs human judgment. See the listed targets; re-crawl to confirm none were transient.' }
    }
    default:
      return { actionable: false, kind: 'none', proposedValue: '', currentValue: '', note: `No automated fix generator for rule "${ruleId}".` }
  }
}

// Read a recommendation's ruleId from its first-class typed field (Phase D.6
// P2). No string parsing: identity is data, not prose. Legacy rows missing the
// field are backfilled by migration 002; an empty value degrades to 'unknown'
// (for which no fix generator exists), never a regex guess.
export function ruleIdOf(rec: { ruleId?: string }): string {
  return rec.ruleId && rec.ruleId.length > 0 ? rec.ruleId : 'unknown'
}
