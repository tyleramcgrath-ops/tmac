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

export type FixKind =
  | 'title'
  | 'metaDescription'
  | 'schema'
  | 'altText'
  | 'canonical'
  | 'heading'
  | 'none'

export interface GeneratedFix {
  actionable: boolean
  kind: FixKind
  // The WordPress-deployable field + value (title/metaDescription), when the
  // fix maps to a supported write. schema/alt/heading are advisory payloads.
  deploy?: { title?: string; metaDescription?: string }
  // The concrete artifact to apply (e.g. the JSON-LD block, or the new title).
  proposedValue: string
  currentValue: string
  note: string
}

function brandFromTitle(title: string | undefined): string {
  // Titles often end with "· Brand" or "| Brand"; reuse the brand suffix.
  if (!title) return ''
  const m = title.split(/[·|—–-]/).map((s) => s.trim()).filter(Boolean)
  return m.length > 1 ? m[m.length - 1] : ''
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

// Build a page-appropriate JSON-LD block from real signals.
function generateSchema(s: PageSignals): string {
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
  return `<script type="application/ld+json">\n${JSON.stringify(base, null, 2)}\n</script>`
}

// Generate a concrete fix for a recommendation identified by its rule.
// `ruleId` is embedded in the recommendation's evidence facts; callers pass it.
export function generateFix(ruleId: string, s: PageSignals): GeneratedFix {
  switch (ruleId) {
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
      const value = generateSchema(s)
      return { actionable: true, kind: 'schema', proposedValue: value, currentValue: '(no JSON-LD)', note: 'Page-appropriate JSON-LD; insert in <head>. Advisory — not auto-written to WP.' }
    }
    case 'alt-text': {
      return { actionable: false, kind: 'altText', proposedValue: '', currentValue: `${s.imagesMissingAlt ?? 0} images without alt`, note: 'Alt text must describe each specific image; generate per-image with human input.' }
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
