// Demo/fixture quality guard.
//
// Placeholder content ("Example Page", example.com, generic titles like
// "Build example Authority") reads as broken to anyone evaluating RankForge
// with demo data, and it's happened before in this codebase. This module
// gives demo-data producers a way to reject that class of mistake before it
// ships, rather than relying on someone noticing it in a screenshot.

export interface FixtureIssue {
  field: string
  reason: string
  value: string
}

const PLACEHOLDER_WORDS = ['example', 'lorem', 'ipsum', 'placeholder', 'foo', 'bar', 'baz', 'test123', 'sample text', 'tbd', 'todo', 'xxx']
const PLACEHOLDER_DOMAINS = ['example.com', 'example.org', 'example.net', 'test.com', 'localhost']

function containsPlaceholderWord(value: string): string | null {
  const lower = value.toLowerCase()
  return PLACEHOLDER_WORDS.find((w) => new RegExp(`\\b${w}\\b`).test(lower)) ?? null
}

/** Flags a page title/name for placeholder words, empty content, or broken capitalization. */
export function validateFixtureName(field: string, value: string): FixtureIssue[] {
  const issues: FixtureIssue[] = []
  const trimmed = (value ?? '').trim()

  if (!trimmed) {
    issues.push({ field, reason: 'Empty name', value })
    return issues
  }

  const placeholder = containsPlaceholderWord(trimmed)
  if (placeholder) {
    issues.push({ field, reason: `Contains placeholder word "${placeholder}"`, value })
  }

  // Broken capitalization: all-lowercase or all-uppercase multi-word strings
  // read as generated/unedited rather than professionally written.
  const words = trimmed.split(/\s+/)
  if (words.length > 2) {
    if (trimmed === trimmed.toLowerCase()) {
      issues.push({ field, reason: 'All-lowercase title reads as unedited placeholder text', value })
    } else if (trimmed === trimmed.toUpperCase()) {
      issues.push({ field, reason: 'All-uppercase title reads as unedited placeholder text', value })
    }
  }

  return issues
}

/** Flags a URL/domain for known placeholder domains. */
export function validateFixtureUrl(field: string, url: string): FixtureIssue[] {
  const issues: FixtureIssue[] = []
  try {
    const parsed = new URL(url)
    if (PLACEHOLDER_DOMAINS.some((d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`))) {
      issues.push({ field, reason: `Uses a well-known placeholder domain (${parsed.hostname})`, value: url })
    }
  } catch {
    issues.push({ field, reason: 'Not a valid URL', value: url })
  }
  return issues
}

/** Flags a percentage-style number that's outside any realistic range. */
export function validateFixturePercent(field: string, value: number, max = 500): FixtureIssue[] {
  const issues: FixtureIssue[] = []
  if (!Number.isFinite(value)) {
    issues.push({ field, reason: 'Not a finite number', value: String(value) })
  } else if (Math.abs(value) > max) {
    issues.push({ field, reason: `Impossible percentage (${value}%, max realistic is ±${max}%)`, value: String(value) })
  }
  return issues
}

/** Flags an evidence/rationale field that's missing or too thin to be credible. */
export function validateFixtureEvidence(field: string, evidence: string | string[] | undefined | null): FixtureIssue[] {
  const issues: FixtureIssue[] = []
  const items = Array.isArray(evidence) ? evidence : evidence ? [evidence] : []
  const nonEmpty = items.filter((e) => e && e.trim().length > 0)
  if (nonEmpty.length === 0) {
    issues.push({ field, reason: 'Missing evidence', value: '' })
  }
  return issues
}

/** Flags duplicate titles/names within a list of recommendations or initiatives. */
export function validateNoDuplicates(field: string, names: string[]): FixtureIssue[] {
  const issues: FixtureIssue[] = []
  const seen = new Map<string, number>()
  for (const name of names) {
    const key = name.trim().toLowerCase()
    seen.set(key, (seen.get(key) ?? 0) + 1)
  }
  for (const [key, count] of seen) {
    if (count > 1 && key) {
      issues.push({ field, reason: `Duplicate recommendation appears ${count} times`, value: key })
    }
  }
  return issues
}

export interface FixturePageLike {
  url: string
  title: string
  metaDescription?: string
}

/** Runs the standard checks (name, url) across a set of demo pages. Throws with a clear message if any fail — demo data should never ship broken. */
export function assertFixtureQuality(pages: FixturePageLike[]): void {
  const allIssues: FixtureIssue[] = []
  for (const page of pages) {
    allIssues.push(...validateFixtureName(`page:${page.url}:title`, page.title))
    allIssues.push(...validateFixtureUrl(`page:${page.url}:url`, page.url))
  }
  const titles = pages.map((p) => p.title)
  allIssues.push(...validateNoDuplicates('page:title', titles))

  if (allIssues.length > 0) {
    const summary = allIssues.map((i) => `  - [${i.field}] ${i.reason}: "${i.value}"`).join('\n')
    throw new Error(`Fixture quality check failed:\n${summary}`)
  }
}
