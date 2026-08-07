// GEO (generative-engine optimization) audit.
//
// Answers one question the rest of North Star cannot: is this site actually
// reachable and usable by the models that answer questions about it?
//
// Two halves, both from real observations:
//   1. robots.txt — fetched live, parsed with the real matching rules. A site
//      that blocks GPTBot cannot be cited by ChatGPT's browsing, no matter how
//      good its content is. This is the only part of AI visibility a site
//      controls outright, and the only one nobody else here checks.
//   2. Entity grounding — whether the crawl found site-level structured data
//      (Organization / WebSite) that tells a model *what this site is*.
//
// Deliberately NOT here: per-page schema prescriptions. The V2 recommendation
// engine already does that, page-type-aware, with provenance
// (lib/foundation/reco/rules.ts). Reimplementing it would produce a second,
// worse opinion on the same pages.
//
// Every number below traces to an observation. Where an input is missing the
// component is `null` — not zero, and not a default — so a site with no scan
// yet reads as "unknown", never as "bad".

import { crawlerVerdicts, type CrawlerVerdict } from './robots'
import { toPageSignals } from '../reco/signals'

// Structured data that identifies the site itself, as opposed to one page's
// contents. A model asked "who is X" grounds on these; their absence is why a
// site with excellent per-page markup can still be described vaguely or wrongly.
const ENTITY_TYPES = ['Organization', 'WebSite', 'LocalBusiness', 'Person'] as const

export type RobotsStatus = 'found' | 'absent' | 'unreachable'

export interface RobotsResult {
  status: RobotsStatus
  url: string
  // Present on 'unreachable' — the HTTP status or transport error, verbatim,
  // so the failure is diagnosable instead of collapsing into "no robots.txt"
  // (which the standard reads as "everything allowed" — the opposite verdict).
  detail?: string
}

export interface SchemaCensus {
  pagesAnalyzed: number
  pagesWithAnySchema: number
  // Every type observed, with how many pages carry it, most common first.
  types: { type: string; pages: number }[]
  // Which of ENTITY_TYPES appear nowhere on the crawled site.
  missingEntityTypes: string[]
}

export interface GeoFinding {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  detail: string
  // The observation this rests on, quoted. A finding that cannot point at its
  // evidence does not belong in the list.
  evidence: string
}

export interface GeoAudit {
  domain: string
  checkedAt: string
  robots: RobotsResult
  crawlers: CrawlerVerdict[]
  schema: SchemaCensus | null
  findings: GeoFinding[]
  scores: {
    // 0-100 each, or null when the underlying observation is missing.
    access: number | null
    grounding: number | null
    overall: number | null
    // Stated in the payload so the UI shows the arithmetic rather than a
    // number the user has to trust.
    formula: string
  }
}

// Fetching an arbitrary project's domain from the server is an outbound request
// with a user-controlled host, so it is constrained: https/http only, no
// credentials, no redirects to other hosts by default (fetch follows same-host
// and cross-host alike, so the final URL is checked after), and names that
// resolve to loopback/link-local literals are refused outright. This is not a
// full SSRF defense — a hostile DNS record still resolves privately — but the
// domains here come from projects the operator created, not from request bodies.
const PRIVATE_HOST = /^(localhost|127\.|0\.0\.0\.0$|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$)/i

export function robotsUrlFor(domain: string): string {
  const bare = domain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
  return `https://${bare}/robots.txt`
}

export async function fetchRobots(
  domain: string,
  fetchImpl: typeof fetch = fetch
): Promise<{ robots: RobotsResult; text: string | null }> {
  const url = robotsUrlFor(domain)
  const host = new URL(url).hostname
  if (PRIVATE_HOST.test(host)) {
    return { robots: { status: 'unreachable', url, detail: 'Refused: private or loopback address.' }, text: null }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetchImpl(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'NorthStar-GEO-Audit/1.0', Accept: 'text/plain' },
    })
    // 404/410 is the standard's "no robots.txt" — a real answer meaning
    // nothing is restricted, not a failure.
    if (res.status === 404 || res.status === 410) return { robots: { status: 'absent', url }, text: null }
    if (!res.ok) {
      return { robots: { status: 'unreachable', url, detail: `HTTP ${res.status}` }, text: null }
    }
    const text = await res.text()
    return { robots: { status: 'found', url }, text }
  } catch (err) {
    const detail = err instanceof Error ? (err.name === 'AbortError' ? 'Timed out after 10s' : err.message) : 'Unknown error'
    return { robots: { status: 'unreachable', url, detail }, text: null }
  } finally {
    clearTimeout(timer)
  }
}

export function censusSchema(pages: Record<string, unknown>[]): SchemaCensus | null {
  const signals = pages.map(toPageSignals).filter((s) => Array.isArray(s.schemaTypes))
  if (signals.length === 0) return null

  const counts = new Map<string, number>()
  let withAny = 0
  for (const s of signals) {
    const types = s.schemaTypes ?? []
    if (types.length > 0) withAny += 1
    for (const t of new Set(types)) counts.set(t, (counts.get(t) ?? 0) + 1)
  }

  return {
    pagesAnalyzed: signals.length,
    pagesWithAnySchema: withAny,
    types: [...counts.entries()]
      .map(([type, pages]) => ({ type, pages }))
      .sort((a, b) => b.pages - a.pages || a.type.localeCompare(b.type)),
    missingEntityTypes: ENTITY_TYPES.filter((t) => !counts.has(t)),
  }
}

function buildFindings(robots: RobotsResult, crawlers: CrawlerVerdict[], schema: SchemaCensus | null): GeoFinding[] {
  const findings: GeoFinding[] = []

  if (robots.status === 'unreachable') {
    findings.push({
      id: 'robots-unreachable',
      severity: 'warning',
      title: 'robots.txt could not be read',
      detail:
        'Crawler access is unknown, not confirmed. A server error on robots.txt makes some crawlers back off entirely, ' +
        'which is worse than a missing file.',
      evidence: `${robots.url} — ${robots.detail ?? 'no detail'}`,
    })
  }

  const blocked = crawlers.filter((c) => c.access === 'blocked')
  for (const c of blocked) {
    const byName = c.matchedGroup !== '*'
    findings.push({
      id: `crawler-blocked-${c.bot}`,
      severity: 'critical',
      title: `${c.bot} is blocked`,
      detail: byName
        ? `${c.bot} is named explicitly in robots.txt and denied. Content on this site cannot be retrieved by it.`
        : `${c.bot} falls under the wildcard group, which denies it. This is usually collateral from a rule aimed at ` +
          'something else — check whether blocking AI crawlers was intended.',
      evidence: `User-agent: ${c.matchedGroup}\n${c.matchedRule ?? '(no rule)'}`,
    })
  }

  if (schema) {
    const noSchema = schema.pagesAnalyzed - schema.pagesWithAnySchema
    if (noSchema > 0) {
      findings.push({
        id: 'pages-without-schema',
        severity: noSchema === schema.pagesAnalyzed ? 'warning' : 'info',
        title: `${noSchema} of ${schema.pagesAnalyzed} crawled pages carry no structured data`,
        detail:
          'Models extract entities and relationships more reliably from marked-up pages. Per-page recommendations for ' +
          'which type belongs where are in the recommendations view — this is the site-wide count.',
        evidence: `${schema.pagesWithAnySchema}/${schema.pagesAnalyzed} pages had at least one schema type`,
      })
    }
    if (schema.missingEntityTypes.includes('Organization') && schema.missingEntityTypes.includes('LocalBusiness')) {
      findings.push({
        id: 'no-entity-grounding',
        severity: 'warning',
        title: 'No Organization or LocalBusiness schema anywhere on the site',
        detail:
          'Nothing on the crawled pages states what this business is in machine-readable form, so a model answering ' +
          '"who is <brand>" has only prose to work from — which is where wrong answers come from.',
        evidence: `Types observed: ${schema.types.map((t) => t.type).join(', ') || '(none)'}`,
      })
    }
  } else {
    findings.push({
      id: 'no-scan',
      severity: 'info',
      title: 'No completed crawl to analyze structured data from',
      detail: 'Run a scan to get the grounding half of this audit. The robots.txt half above is complete without it.',
      evidence: 'No completed or partial scan with page-level schema signals.',
    })
  }

  return findings
}

export interface AuditInput {
  domain: string
  pages: Record<string, unknown>[]
  now?: number
  fetchImpl?: typeof fetch
}

export async function auditGeo({ domain, pages, now = Date.now(), fetchImpl }: AuditInput): Promise<GeoAudit> {
  const { robots, text } = await fetchRobots(domain, fetchImpl)

  // 'absent' means the standard's default applies: nothing is restricted. Only
  // 'unreachable' is genuinely unknown, and it is scored as unknown, not as
  // allowed — an audit that reports "all clear" on a failed fetch is lying.
  const crawlers = robots.status === 'unreachable' ? [] : crawlerVerdicts(robots.status === 'absent' ? null : text)
  const schema = censusSchema(pages)
  const findings = buildFindings(robots, crawlers, schema)

  const access =
    crawlers.length === 0 ? null : Math.round((crawlers.filter((c) => c.access !== 'blocked').length / crawlers.length) * 100)
  const grounding = schema === null ? null : Math.round((schema.pagesWithAnySchema / schema.pagesAnalyzed) * 100)

  const known = [access, grounding].filter((n): n is number => n !== null)
  const overall = known.length === 0 ? null : Math.round(known.reduce((a, b) => a + b, 0) / known.length)

  return {
    domain,
    checkedAt: new Date(now).toISOString(),
    robots,
    crawlers,
    schema,
    findings: findings.sort(
      (a, b) => ({ critical: 0, warning: 1, info: 2 })[a.severity] - ({ critical: 0, warning: 1, info: 2 })[b.severity]
    ),
    scores: {
      access,
      grounding,
      overall,
      formula:
        'access = AI crawlers not blocked / AI crawlers checked. ' +
        'grounding = crawled pages with any structured data / crawled pages. ' +
        'overall = mean of whichever of those two is known. null = not observed, not zero.',
    },
  }
}
