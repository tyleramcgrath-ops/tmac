// Normalized page signals the V2 recommendation engine consumes. Every field
// is derived from the real crawl; optional fields are absent (not guessed) when
// the crawl did not capture them, and rules that need a missing signal simply
// do not fire — the engine never recommends what it cannot see.

export interface PageSignals {
  url: string
  // On-page facts (from extractSignals via the crawl payload).
  title?: string
  titleLength?: number
  metaDescription?: string
  metaDescriptionLength?: number
  h1Count?: number
  h2Count?: number
  wordCount?: number
  canonical?: string
  schemaTypes?: string[]
  localBusinessMissingFields?: string[]
  https?: boolean
  mixedContent?: boolean
  indexable?: boolean
  imagesMissingAlt?: number
  hasFaq?: boolean
  hasOpenGraph?: boolean
  internalTargets?: string[]
  externalLinks?: number
  duplicateOf?: string
}

// Coerce a raw scan page (unknown shape) into PageSignals, keeping only fields
// that are actually present so absent signals stay undefined.
export function toPageSignals(raw: Record<string, unknown>): PageSignals {
  const s: PageSignals = { url: String(raw.url ?? '') }
  const num = (v: unknown) => (typeof v === 'number' ? v : undefined)
  const str = (v: unknown) => (typeof v === 'string' ? v : undefined)
  const bool = (v: unknown) => (typeof v === 'boolean' ? v : undefined)
  s.title = str(raw.title)
  s.titleLength = num(raw.titleLength) ?? (str(raw.title) ? String(raw.title).length : undefined)
  s.metaDescription = str(raw.metaDescription)
  s.metaDescriptionLength =
    num(raw.metaDescriptionLength) ??
    (str(raw.metaDescription) !== undefined ? String(raw.metaDescription).length : undefined)
  s.h1Count = num(raw.h1Count)
  s.h2Count = num(raw.h2Count)
  s.wordCount = num(raw.wordCount)
  s.canonical = str(raw.canonical)
  s.schemaTypes = Array.isArray(raw.schemaTypes) ? (raw.schemaTypes as string[]) : undefined
  s.localBusinessMissingFields = Array.isArray(raw.localBusinessMissingFields)
    ? (raw.localBusinessMissingFields as string[])
    : undefined
  s.https = bool(raw.https)
  s.mixedContent = bool(raw.mixedContent)
  s.indexable = bool(raw.indexable)
  s.imagesMissingAlt = num(raw.imagesMissingAlt)
  s.hasFaq = bool(raw.hasFaq)
  s.hasOpenGraph = bool(raw.hasOpenGraph)
  s.internalTargets = Array.isArray(raw.internalTargets) ? (raw.internalTargets as string[]) : undefined
  s.externalLinks = num(raw.externalLinks)
  s.duplicateOf = str(raw.duplicateOf)
  return s
}
