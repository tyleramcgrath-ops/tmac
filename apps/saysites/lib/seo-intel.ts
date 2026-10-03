// SEO intelligence for every SaySites site, run by RankForge's engines
// (vendored in lib/rankforge; refresh with scripts/sync-rankforge.sh):
//
// - Site audit: every published page is rendered here, in-process, and run
//   through RankForge's page analyzer (technical, content, schema and AI
//   readiness scores) and its recommendation engine (page-type-aware rules,
//   cross-page checks, priority and confidence). No crawling ourselves.
// - Competitor audit: RankForge's crawler reads a competitor's public site
//   (a handful of pages, SSRF-guarded) and scores it the same way.
// - Rankings (SERPAPI_KEY), AI answers (PERPLEXITY_API_KEY) and backlinks
//   (MAJESTIC_API_KEY): each a paid lookup, so each is off until its key is
//   set, capped per site per day, and only ever reports what the provider
//   returned.

import { randomUUID } from 'crypto'
import {
  buildFixes,
  extractSignals,
  extractInternalLinks,
  overallScore,
  scoreAiReadiness,
  scoreContent,
  scoreSchema,
  scoreTechnical,
} from './rankforge/seo-scan/analyze'
import { isCrawlBatchError, runCrawlBatch, type CrawlPageResult } from './rankforge/engine/crawl-batch'
import { generateRecommendationsV2 } from './rankforge/reco/engine'
import { fetchKeywordPosition, serpApiKey } from './rankforge/serp'
import { checkCitation, perplexityApiKey } from './rankforge/ai-citations'
import { checkBacklinks, majesticApiKey } from './rankforge/backlinks'
import type { Scan } from './rankforge/types'
import { tradeLabel } from './league'
import { pagePath, type Page, type Site } from './schema'
import { serveSitePath } from './serve'
import type { SiteBundle } from './sites'
import type { Store } from './store'
import { liveUrl } from './urls'
import { isTemplate, pageText, sentences, vibeCheck } from './vibe'

export interface Scores {
  technical: number
  content: number
  schema: number
  ai: number
}

// What the owner can do about an issue, from the SEO tab: SaySites fixes it
// in one click, the fix lives in Settings, or Sofie does it with them.
export type SeoAction = { kind: 'auto'; label: string } | { kind: 'settings'; label: string } | { kind: 'sofie'; ask: string }

export interface SeoIssue {
  id: string
  ruleId: string
  action: SeoAction
  title: string
  severity: 'critical' | 'warning' | 'info'
  category: string
  why: string
  ifIgnored: string
  pages: string[]
  confidence: number
  rank: number
}

export interface SeoAudit {
  at: string
  url: string
  siteScore: number
  scores: Scores
  pages: { url: string; title: string; overall: number; scores: Scores }[]
  issues: SeoIssue[]
}

export interface CompetitorAudit {
  url: string
  at: string
  siteScore: number
  scores: Scores
  pages: number
  error?: string
}

export interface KeywordCheck {
  at: string
  position: number | null
  url: string | null
  topResult: string | null
}

export interface AiCheck {
  at: string
  cited: boolean
  position: number | null
  // Who the answer engine cited instead (hosts, in order).
  sources: string[]
}

export interface SeoState {
  audit?: SeoAudit
  competitors: CompetitorAudit[]
  keywords: { keyword: string; checks: KeywordCheck[] }[]
  aiQueries: { query: string; checks: AiCheck[] }[]
  backlinks?: { at: string; totalBacklinks: number | null; referringDomains: number | null; trustFlow: number | null; citationFlow: number | null }
}

export const LIMITS = { keywords: 10, aiQueries: 5, competitors: 3, competitorPages: 12, checksPerDay: 1 }

export function emptySeoState(): SeoState {
  return { competitors: [], keywords: [], aiQueries: [] }
}

export async function loadSeoState(store: Store, siteId: string): Promise<SeoState> {
  const raw = (await store.seoState(siteId)) as Partial<SeoState> | null
  return { ...emptySeoState(), ...(raw ?? {}) }
}

export const intelReady = {
  rankings: () => !!serpApiKey(),
  ai: () => !!perplexityApiKey(),
  backlinks: () => !!majesticApiKey(),
}

// RankForge's per-page analysis, applied to HTML we already have. On our own
// pages the first image is the header logo, not the hero, so RankForge's
// "first image may load eagerly" allowance goes to the first eager image (the
// hero, which should load first) instead.
export function analyzePage(url: string, html: string, status = 200, own = false): CrawlPageResult {
  const signals = extractSignals(html, url, status)
  if (own) {
    const eager = (html.match(/<img\b[^>]*>/gi) ?? []).filter((t) => !/\bloading\s*=\s*["']lazy["']/i.test(t)).length
    signals.imagesMissingLazyLoad = Math.max(0, eager - 1)
  }
  const fixes = buildFixes(signals, null)
  const scores = { technical: scoreTechnical(fixes), content: scoreContent(signals), schema: scoreSchema(signals), ai: scoreAiReadiness(signals) }
  return {
    url,
    status,
    overall: overallScore(scores),
    scores,
    wordCount: signals.wordCount,
    title: signals.title,
    titleLength: signals.titleLength,
    metaDescription: signals.metaDescription,
    canonical: signals.canonical,
    mixedContent: signals.mixedContent,
    h1Count: signals.h1Count,
    schemaTypes: signals.schemaTypes,
    ...(signals.localBusinessMissingFields ? { localBusinessMissingFields: signals.localBusinessMissingFields } : {}),
    internalTargets: [...new Set(extractInternalLinks(html, url, 120))].slice(0, 40),
    https: signals.https,
    indexable: signals.indexable,
    h2Count: signals.h2Count,
    metaDescriptionLength: signals.metaDescriptionLength,
    imagesMissingAlt: signals.imagesMissingAlt,
    imagesMissingLazyLoad: signals.imagesMissingLazyLoad,
    hasFaq: signals.hasFaq,
    hasOpenGraph: signals.hasOpenGraph,
    externalLinks: signals.externalLinks,
    fixes,
  }
}

function average(pages: CrawlPageResult[]): { siteScore: number; scores: Scores } {
  const n = Math.max(1, pages.length)
  const avg = (f: (p: CrawlPageResult) => number) => Math.round(pages.reduce((t, p) => t + f(p), 0) / n)
  return { siteScore: avg((p) => p.overall), scores: { technical: avg((p) => p.scores.technical), content: avg((p) => p.scores.content), schema: avg((p) => p.scores.schema), ai: avg((p) => p.scores.ai) } }
}

// The whole site, as visitors and Google see it: every published page
// rendered exactly as served, then RankForge's recommendation engine.
export async function auditSite(bundle: SiteBundle, baseUrl: string, industry?: string): Promise<SeoAudit> {
  const base = baseUrl.replace(/\/+$/, '')
  const pages: CrawlPageResult[] = []
  for (const p of bundle.pages) {
    if (p.status !== 'published') continue
    const path = pagePath(p)
    const res = serveSitePath(bundle, path.split('/').filter(Boolean), { preview: false })
    if (res.status !== 200 || !(res.headers.get('content-type') ?? '').includes('text/html')) continue
    pages.push(analyzePage(`${base}${path}`, await res.text(), 200, true))
  }
  const audit = finishAudit(bundle.site.id, base, pages, industry)
  audit.issues = audit.issues.map((i) => explain(i, bundle))
  return audit
}

const byPath = (pages: readonly Page[]) => new Map(pages.filter((p) => p.status === 'published').map((p) => [pagePath(p), p]))

// Turns a RankForge finding into SaySites terms: the real reason a page is
// held back from Google (our originality check), and what to do about it.
function explain(issue: SeoIssue, { site, pages }: SiteBundle): SeoIssue {
  const named = issue.pages.map((u) => byPath(pages).get(u)?.name ?? u).join(', ')
  const ask = (text: string): SeoAction => ({ kind: 'sofie', ask: text })
  switch (issue.ruleId) {
    case 'dup-title':
    case 'title-length':
      return { ...issue, action: { kind: 'auto', label: 'Write new titles' } }
    case 'dup-meta':
      return { ...issue, action: { kind: 'auto', label: 'Write new descriptions' } }
    case 'local-business-incomplete':
      return { ...issue, why: 'Google reads your business details (address, phone, hours) from your site. Some are missing.', action: { kind: 'settings', label: 'Add your details' } }
    case 'noindex': {
      const held = issue.pages.map((u) => byPath(pages).get(u)).filter((p): p is Page => !!p).map((p) => ({ p, why: vibeCheck(site, p, pages).held })).filter((x) => x.why)
      if (!held.length) return { ...issue, action: ask(`Why is ${named || 'this page'} hidden from Google?`) }
      const names = held.map((x) => x.p.name)
      const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
      return {
        ...issue,
        title: held.length === 1 ? `${list} is hidden from Google for now` : `${held.length} pages are hidden from Google for now`,
        why: held.length === 1 ? held[0].why! : held.map((x) => `${x.p.name}: ${x.why}`).join(' '),
        action: ask(`Help me rewrite the ${list} ${held.length === 1 ? 'page' : 'pages'} in my own words so Google can show ${held.length === 1 ? 'it' : 'them'}.`),
      }
    }
    case 'faq':
      return { ...issue, title: `Answer common questions on ${named || 'your pages'}`, why: 'A few real questions and answers help visitors decide, and Google and AI tools can show them in results.', action: ask(`Add a few common questions and answers to ${named || 'my main pages'}. Use only what you know is true about my business, and ask me for anything you don’t.`) }
    default:
      return { ...issue, action: ask(`Fix this on my site: ${issue.title}${named ? ` (${named})` : ''}`) }
  }
}

function finishAudit(siteId: string, base: string, pages: CrawlPageResult[], industry?: string): SeoAudit {
  const now = new Date().toISOString()
  const { siteScore, scores } = average(pages)
  const scan: Scan = {
    id: randomUUID(),
    projectId: siteId,
    createdBy: 'saysites',
    createdAt: now,
    status: 'completed',
    startedAt: now,
    completedAt: now,
    error: null,
    summary: { pagesCrawled: pages.length, urlsDiscovered: pages.length, blockedCount: 0, siteScore, critical: 0, warning: 0, info: 0 },
    pages,
    blocked: [],
  }
  const { recommendations } = generateRecommendationsV2(scan, { industry })
  return {
    at: now,
    url: base,
    siteScore,
    scores,
    pages: pages.map((p) => ({ url: p.url, title: p.title, overall: p.overall, scores: p.scores })),
    issues: recommendations.slice(0, 40).map((r) => ({
      id: r.issueId,
      ruleId: r.ruleId,
      action: { kind: 'sofie', ask: `Fix this on my site: ${r.title}` },
      title: r.title,
      severity: r.severity,
      category: r.category,
      why: r.explanation?.why ?? r.reasoning,
      ifIgnored: r.explanation?.whatIfIgnored ?? '',
      pages: r.evidence.affectedUrls.slice(0, 8).map((u) => u.replace(base, '') || '/'),
      confidence: r.confidence,
      rank: r.priorityRank ?? 0,
    })),
  }
}

// The audit re-runs by itself whenever the site has changed since, or once a
// week, when the owner opens the dashboard. Free: it's all in-process.
export const AUDIT_MAX_AGE_MS = 7 * 86_400_000

export function auditStale(audit: SeoAudit | undefined, site: Site, pages: readonly Page[], now = Date.now()): boolean {
  if (!audit || !audit.issues.every((i) => i.action)) return true
  const at = Date.parse(audit.at)
  if (now - at > AUDIT_MAX_AGE_MS) return true
  return [site.updatedAt, ...pages.map((p) => p.updatedAt)].some((u) => Date.parse(u) > at)
}

export async function freshSeoState(store: Store, site: Site, pages?: Page[]): Promise<SeoState> {
  const state = await loadSeoState(store, site.id)
  const all = pages ?? (await store.pagesForSite(site.id))
  if (!auditStale(state.audit, site, all)) return state
  const redirects = await store.redirectsForSite(site.id)
  const audit = await auditSite({ site, pages: all, redirects }, liveUrl(site), tradeLabel(site.business.schemaType))
  const next = { ...state, audit }
  await store.saveSeoState(site.id, next)
  return next
}

// One-click fixes. Every word comes from the site itself (page names, the
// business name and town, the page's own sentences); nothing is invented.
const clipTo = (s: string, max: number) => (s.length <= max ? s : s.slice(0, max + 1).replace(/\s+\S*$/, '').replace(/[\s,;:|&-]+$/, ''))

export function titleFor(page: Page, site: Site): string {
  const b = site.business
  const town = b.address?.city
  const where = [town, b.address?.region].filter(Boolean).join(', ')
  if (!page.slug) return clipTo(`${b.name}${where ? ` | ${where}` : ''}`, 60)
  return clipTo(`${page.post?.title ?? page.name} | ${b.name}${town ? `, ${town}` : ''}`, 60)
}

// Whole sentences of the page's own writing (headings and starter text are
// skipped), up to 155 characters, never the same as another page's.
export function descriptionFor(page: Page, avoid: ReadonlySet<string> = new Set()): string | null {
  const own = [...new Set(sentences(pageText(page)).map((x) => x.trim()))].filter((x) => /[.!?]$/.test(x) && !isTemplate(x) && x.length > 20 && x.length <= 155)
  for (let start = 0; start < own.length; start++) {
    let out = ''
    for (const x of own.slice(start)) {
      const next = out ? `${out} ${x}` : x
      if (next.length > 155) break
      out = next
    }
    if (out.length >= 50 && !avoid.has(out)) return out
  }
  return null
}

// Applies an "auto" fix to the pages the issue names. Returns the changed
// pages (unchanged ones are left out).
export function applySeoFix(issue: SeoIssue, site: Site, pages: readonly Page[]): Page[] {
  const map = byPath(pages)
  const targets = issue.pages.map((u) => map.get(u)).filter((p): p is Page => !!p)
  const changed: Page[] = []
  const taken = new Set(pages.filter((p) => !targets.includes(p)).map((p) => p.seo.description))
  for (const p of targets) {
    if (issue.ruleId === 'dup-title' || issue.ruleId === 'title-length') {
      const title = titleFor(p, site)
      if (title !== p.seo.title) changed.push({ ...p, seo: { ...p.seo, title } })
    } else if (issue.ruleId === 'dup-meta') {
      const description = descriptionFor(p, taken)
      if (!description) continue
      taken.add(description)
      if (description !== p.seo.description) changed.push({ ...p, seo: { ...p.seo, description } })
    }
  }
  return changed
}

// A competitor's public site, crawled and scored by RankForge (a few pages).
export async function auditCompetitor(url: string): Promise<CompetitorAudit> {
  const at = new Date().toISOString()
  let visited: string[] = []
  let frontier: string[] | undefined
  const pages: CrawlPageResult[] = []
  for (let round = 0; round < 2; round++) {
    const r = await runCrawlBatch({ url, maxPages: LIMITS.competitorPages, visited, ...(frontier ? { frontier } : {}), seedSitemap: true })
    if (isCrawlBatchError(r)) return { url, at, siteScore: 0, scores: { technical: 0, content: 0, schema: 0, ai: 0 }, pages: 0, error: r.error }
    pages.push(...r.pages)
    visited = r.visited
    frontier = r.frontier
    if (r.done) break
  }
  const { siteScore, scores } = average(pages)
  return { url, at, siteScore, scores, pages: pages.length }
}

const today = () => new Date().toISOString().slice(0, 10)
export const checkedToday = (checks: { at: string }[]) => checks.some((c) => c.at.slice(0, 10) === today())

export async function checkKeyword(host: string, keyword: string): Promise<KeywordCheck | null> {
  const key = serpApiKey()
  if (!key) return null
  const r = await fetchKeywordPosition(keyword, host.replace(/^www\./, ''), key)
  return { at: new Date().toISOString(), position: r.position, url: r.url, topResult: r.topResult }
}

export async function checkAiQuery(host: string, query: string): Promise<AiCheck | null> {
  const key = perplexityApiKey()
  if (!key) return null
  const r = await checkCitation(query, host.replace(/^www\./, ''), key)
  if (!r.available) return null
  return { at: new Date().toISOString(), cited: r.cited, position: r.position, sources: r.sources.slice(0, 6).map((s) => s.host) }
}

export async function checkLinks(host: string): Promise<SeoState['backlinks'] | null> {
  const key = majesticApiKey()
  if (!key) return null
  const r = await checkBacklinks(host.replace(/^www\./, ''), key)
  if (!r.available) return null
  return { at: new Date().toISOString(), totalBacklinks: r.totalBacklinks, referringDomains: r.referringDomains, trustFlow: r.trustFlow, citationFlow: r.citationFlow }
}

