// Citation Gap, inside the SEO tab: for one page and one search, it reads
// Google's top results and the AI Overview, scores the page against the pages
// that rank (a Ranking score and an AI-answer score, 0–100 each) and lists the
// changes that close the gap, most valuable first.
//
// The engines are Citation Gap's own (apps/citation-gap), vendored into
// lib/citation-gap by scripts/sync-citation-gap.sh; never edit the copies.
// SaySites supplies the three things the scanner asks for:
// - page: our own pages rendered in-process, exactly as served; anyone
//   else's through an SSRF-guarded fetch (public addresses only, re-checked
//   on every redirect), then Citation Gap's parser.
// - serp: Citation Gap's Google reader, with our SERPAPI_KEY.
// - render: no headless browser on our hosting, so the scan runs on the
//   served HTML only, which the scanner supports.
//
// Each scan is about four Google searches, so it costs money (pricing rule):
// premium plans only, once per page and search per day, LIMITS.gapScans per site.

import * as score from './citation-gap/score'
import type { Fix, ScoreRow } from './citation-gap/score'
import { runToCompletion, type ScanIo } from './citation-gap/scan-job'
import pageImpl from './citation-gap/page.impl'
import serpHandler from './citation-gap/serp'
import { serpApiKey } from './rankforge/serp'
import { isSafeFetchTarget } from './rankforge/seo-scan/url-guard'
import { pagePath, type Page } from './schema'
import { serveSitePath } from './serve'
import type { SiteBundle } from './sites'

export const GAP_LIMITS = { scans: 5, competitors: 8, questions: 3 }

export interface GapScan {
  pageId: string
  keyword: string
  at: string
  error?: string
  rank?: number
  answer?: number
  rankRows?: Pick<ScoreRow, 'key' | 'label' | 'mine' | 'target' | 'pct'>[]
  answerRows?: Pick<ScoreRow, 'key' | 'label' | 'mine' | 'target' | 'pct'>[]
  fixes?: Pick<Fix, 'key' | 'title' | 'body' | 'severity' | 'effort' | 'engine'>[]
  // The AI Overview for the search itself: shown or not, and who it cites.
  aiOverview?: { shown: boolean; citesYou: boolean; sources: string[] }
  competitors?: { domain: string; position: number; words: number }[]
  coverage?: { mine: number; peers: number; of: number }
}

const UA = 'Mozilla/5.0 (compatible; SaySitesBot/1.0; +https://saysites.com)'
const MAX_BYTES = 2_000_000

// One public page, as its server sends it. Every hop is checked, so a public
// address can't redirect us into a private network.
export async function fetchPublicHtml(raw: string, timeoutMs = 8000): Promise<{ html: string; status: number; url: string } | { error: string }> {
  let url = raw
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    for (let hop = 0; hop < 5; hop++) {
      const safe = await isSafeFetchTarget(url)
      if (!safe.ok) return { error: 'That address can’t be read.' }
      const r = await fetch(url, { redirect: 'manual', signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9' } })
      if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
        url = new URL(r.headers.get('location')!, url).toString()
        continue
      }
      if (r.status >= 400) return { error: `HTTP ${r.status}` }
      if (!(r.headers.get('content-type') ?? 'text/html').includes('html')) return { error: 'Not a web page' }
      const html = (await r.text()).slice(0, MAX_BYTES)
      if (html.length < 200) return { error: 'Blocked or empty' }
      return { html, status: r.status, url }
    }
    return { error: 'Too many redirects' }
  } catch (e) {
    return { error: (e as Error).name === 'AbortError' ? 'Timed out' : 'Could not be reached' }
  } finally {
    clearTimeout(timer)
  }
}

// Citation Gap's Google reader, called in-process.
async function serp(q: string, num: number, key: string): Promise<Record<string, unknown>> {
  let out: Record<string, unknown> = { error: 'No answer from Google' }
  await serpHandler({ query: { q, key, num: String(num) } }, { setHeader: () => {}, status: () => ({ json: (o) => void (out = o) }) })
  return out
}

const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

export async function scanGap(bundle: SiteBundle, baseUrl: string, page: Page, keyword: string, opts: { key?: string | null; io?: Partial<ScanIo> } = {}): Promise<GapScan> {
  const at = new Date().toISOString()
  const fail = (error: string): GapScan => ({ pageId: page.id, keyword, at, error })
  const key = opts.key === undefined ? serpApiKey() : opts.key
  if (!key && !opts.io?.serp) return fail('Google lookups aren’t switched on yet.')
  const base = baseUrl.replace(/\/+$/, '')
  const ownUrl = `${base}${pagePath(page)}`
  const ownHost = hostOf(ownUrl)

  const io: ScanIo = {
    async page({ url, keyword: kw, full }) {
      const parse = (html: string, finalUrl: string) => pageImpl.parse(html, url, kw, { full: full === '1', fetchedUrl: url, finalUrl })
      if (hostOf(url) === ownHost) {
        const path = new URL(url).pathname
        const res = serveSitePath(bundle, path.split('/').filter(Boolean), { preview: false })
        if (res.status !== 200) return { error: `HTTP ${res.status}` }
        return parse(await res.text(), url)
      }
      const got = await fetchPublicHtml(url)
      return 'error' in got ? got : parse(got.html, got.url)
    },
    serp: ({ q, num }) => serp(q, num, key ?? ''),
    async render() {
      return null
    },
    ...opts.io,
  }

  let run
  try {
    run = await runToCompletion({ step: 'target_page', cursor: 0, payload: { config: { url: ownUrl, keyword, depth: GAP_LIMITS.competitors, nq: GAP_LIMITS.questions, brand: bundle.site.business.name } } }, io)
  } catch (e) {
    const msg = String((e as Error).message || e)
    // Provider errors (a bad key, a quota) are ours to fix, not the owner's.
    return fail(/serpapi|serper|google/i.test(msg) && !/your page/i.test(msg) ? 'Google couldn’t be checked just now. Try again later.' : msg.slice(0, 200))
  }
  const p = run.job.payload
  if (!p.comps?.length) return fail('None of the pages ranking for this search could be read. Try a more specific search.')

  // The work order, from the same functions the scan's own score step uses.
  const f = run.result.findings
  const fixes = score.buildFixes(p.mine, f.medians, f.rankRows, f.answerRows, keyword, f.cats, f.missing, bundle.site.business.name, { band: f.band, rendered: null })
  const slim = (r: ScoreRow) => ({ key: r.key, label: r.label, mine: r.mine, target: r.target, pct: r.pct })
  const aio = p.head?.aiOverview as { sources?: { domain: string }[] } | null
  const sources = (aio?.sources ?? []).map((s) => s.domain)
  return {
    pageId: page.id,
    keyword,
    at,
    rank: Math.round(run.result.rank),
    answer: Math.round(run.result.answer),
    rankRows: f.rankRows.map(slim),
    answerRows: f.answerRows.map(slim),
    fixes: fixes.slice(0, 12).map((x) => ({ key: x.key, title: x.title, body: x.body, severity: x.severity, effort: x.effort, engine: x.engine })),
    aiOverview: { shown: !!aio, citesYou: sources.includes(ownHost), sources: sources.slice(0, 6) },
    competitors: (p.comps as { domain: string; position: number; wordCount: number }[]).map((c) => ({ domain: c.domain, position: c.position, words: c.wordCount })),
    coverage: p.cov ? { mine: p.cov.mine, peers: p.cov.peerMedian, of: p.cov.queries } : undefined,
  }
}
