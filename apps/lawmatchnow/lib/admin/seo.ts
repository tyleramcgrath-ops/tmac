// Free SEO tools that need no Google account: PageSpeed Insights (Core Web
// Vitals + Lighthouse scores), IndexNow (instant indexing on Bing, Yandex,
// Seznam, Naver...) and an on-site audit that crawls our own sitemap.

import { kvGet, kvSet } from './db'
import { SITE } from '@/lib/site'

// ---------- PageSpeed Insights ----------

export type Psi = {
  url: string; strategy: 'mobile' | 'desktop'; at: string
  scores: { performance: number; seo: number; accessibility: number; bestPractices: number }
  lab: { lcp?: string; cls?: string; tbt?: string; fcp?: string; si?: string }
  field: { lcp?: number; inp?: number; cls?: number; category?: string } | null
  issues: { title: string; score: number | null }[]
}

export async function runPageSpeed(url: string, strategy: 'mobile' | 'desktop'): Promise<Psi> {
  const q = new URLSearchParams({ url, strategy })
  for (const c of ['performance', 'seo', 'accessibility', 'best-practices']) q.append('category', c)
  if (process.env.PAGESPEED_API_KEY) q.set('key', process.env.PAGESPEED_API_KEY)
  const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`, { cache: 'no-store' })
  const j = await res.json()
  if (!res.ok) throw new Error(j.error?.message ?? `PageSpeed returned ${res.status}`)
  const lh = j.lighthouseResult, cats = lh.categories, a = lh.audits
  const metric = (k: string) => j.loadingExperience?.metrics?.[k]?.percentile as number | undefined
  const r: Psi = {
    url, strategy, at: new Date().toISOString(),
    scores: { performance: Math.round(cats.performance.score * 100), seo: Math.round(cats.seo.score * 100), accessibility: Math.round(cats.accessibility.score * 100), bestPractices: Math.round(cats['best-practices'].score * 100) },
    lab: { lcp: a['largest-contentful-paint']?.displayValue, cls: a['cumulative-layout-shift']?.displayValue, tbt: a['total-blocking-time']?.displayValue, fcp: a['first-contentful-paint']?.displayValue, si: a['speed-index']?.displayValue },
    field: j.loadingExperience?.metrics ? { lcp: metric('LARGEST_CONTENTFUL_PAINT_MS'), inp: metric('INTERACTION_TO_NEXT_PAINT'), cls: metric('CUMULATIVE_LAYOUT_SHIFT_SCORE'), category: j.loadingExperience.overall_category } : null,
    issues: Object.values(a as Record<string, { title: string; score: number | null; scoreDisplayMode: string }>)
      .filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== 'informative' && x.scoreDisplayMode !== 'notApplicable' && x.scoreDisplayMode !== 'manual')
      .sort((x, y) => (x.score ?? 0) - (y.score ?? 0)).slice(0, 12).map((x) => ({ title: x.title, score: x.score })),
  }
  const all = (await kvGet<Psi[]>('psi'))?.value ?? []
  await kvSet('psi', [r, ...all.filter((x) => !(x.url === url && x.strategy === strategy))].slice(0, 40))
  return r
}

export const pageSpeedHistory = async () => (await kvGet<Psi[]>('psi'))?.value ?? []

// ---------- IndexNow ----------

export const indexNowKey = () => process.env.INDEXNOW_KEY?.trim() || null

export async function submitIndexNow(urls: string[]) {
  const key = indexNowKey()
  if (!key) throw new Error('Set INDEXNOW_KEY first')
  const host = new URL(SITE.url).host
  let sent = 0
  for (let i = 0; i < urls.length; i += 10000) {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key, keyLocation: `${SITE.url}/indexnow-key.txt`, urlList: urls.slice(i, i + 10000) }),
    })
    if (![200, 202].includes(res.status)) throw new Error(`IndexNow returned ${res.status}`)
    sent += Math.min(10000, urls.length - i)
  }
  await kvSet('indexnow', { at: new Date().toISOString(), sent })
  return sent
}

// ---------- On-site audit ----------

export type AuditPage = {
  path: string; status: number; ms: number
  title: string; titleLen: number; desc: number; h1: number; canonical: string; noindex: boolean
  schema: string[]; words: number; imgsNoAlt: number; internalLinks: number
  problems: string[]
}
export type Audit = { at: string; checked: number; total: number; pages: AuditPage[]; summary: Record<string, number> }

const pick = (html: string, re: RegExp) => html.match(re)?.[1]?.trim() ?? ''

function analyze(path: string, status: number, ms: number, html: string): AuditPage {
  const title = pick(html, /<title[^>]*>([^<]*)<\/title>/i).replace(/&amp;/g, '&')
  const desc = pick(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/i)
  const canonical = pick(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i)
  const robots = pick(html, /<meta[^>]+name="robots"[^>]+content="([^"]*)"/i)
  const h1 = (html.match(/<h1[\s>]/gi) ?? []).length
  const schema = [...new Set([...html.matchAll(/"@type":"([A-Za-z]+)"/g)].map((m) => m[1]))]
  const body = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
  const words = body.split(/\s+/).filter((w) => /[a-z]/i.test(w)).length
  const imgsNoAlt = (html.match(/<img(?![^>]*\balt=)[^>]*>/gi) ?? []).length
  const internalLinks = (html.match(/<a[^>]+href="\/[^"]*"/gi) ?? []).length
  const noindex = /noindex/i.test(robots)
  const problems: string[] = []
  if (status !== 200) problems.push(`HTTP ${status}`)
  if (!title) problems.push('Missing title')
  else if (title.length > 65) problems.push('Title over 65 characters')
  else if (title.length < 25) problems.push('Title under 25 characters')
  if (!desc) problems.push('Missing meta description')
  else if (desc.length > 165) problems.push('Description over 165 characters')
  else if (desc.length < 70) problems.push('Description under 70 characters')
  if (h1 !== 1) problems.push(h1 ? `${h1} H1 tags` : 'No H1')
  if (!canonical) problems.push('No canonical')
  else if (!noindex && canonical.replace(SITE.url, '') !== path && canonical !== `${SITE.url}${path}`) problems.push('Canonical points elsewhere')
  if (!schema.length) problems.push('No structured data')
  if (!noindex && words < 300) problems.push('Thin content (<300 words)')
  if (imgsNoAlt) problems.push(`${imgsNoAlt} images without alt`)
  if (ms > 2500) problems.push('Slow server response (>2.5s)')
  return { path, status, ms, title, titleLen: title.length, desc: desc.length, h1, canonical, noindex, schema, words, imgsNoAlt, internalLinks, problems }
}

/** Crawls the sitemap through the local server (no CDN or anti-bot in the way). */
export async function runAudit(limit = 400): Promise<Audit> {
  const base = `http://127.0.0.1:${process.env.PORT || 3000}`
  const sm = await fetch(`${base}/sitemap.xml`, { cache: 'no-store' }).then((r) => r.text())
  const all = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)
  // Check every kind of page: spread the sample across the whole sitemap.
  const step = Math.max(1, Math.floor(all.length / limit))
  const paths = all.filter((_, i) => i % step === 0).slice(0, limit)
  const pages: AuditPage[] = []
  let i = 0
  const worker = async () => {
    while (i < paths.length) {
      const path = paths[i++]
      const t = Date.now()
      try {
        const res = await fetch(base + path, { cache: 'no-store', headers: { 'User-Agent': 'LawMatchNow-Audit/1.0' } })
        pages.push(analyze(path, res.status, Date.now() - t, await res.text()))
      } catch (err) {
        pages.push({ ...analyze(path, 0, Date.now() - t, ''), problems: [`Fetch failed: ${(err as Error).message}`] })
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
  const summary: Record<string, number> = {}
  for (const p of pages) for (const pr of p.problems) { const k = pr.replace(/^\d+ /, 'N '); summary[k] = (summary[k] ?? 0) + 1 }
  const audit = { at: new Date().toISOString(), checked: pages.length, total: all.length, pages: pages.sort((a, b) => b.problems.length - a.problems.length), summary }
  await kvSet('audit', audit)
  return audit
}

export const lastAudit = async () => (await kvGet<Audit>('audit'))?.value ?? null
