// Client-side analytics derived from a project's latest persisted scan pages.
// Everything here is computed from REAL crawl data (the same PageResult shape
// /api/crawl produces and the scan store persists) — no fabrication. The
// per-engine AI readiness values are MODELED estimates from on-page signals,
// clearly labeled as such wherever they render.

export type Severity = 'critical' | 'warning' | 'info'
export interface FixItem { severity: Severity; category: string; title: string }
export interface PageResult {
  url: string; status: number; overall: number
  scores: { technical: number; content: number; schema: number; ai: number }
  wordCount: number; title: string; titleLength: number
  metaDescription: string; canonical: string; mixedContent: boolean
  h1Count: number; schemaTypes: string[]; internalTargets: string[]
  https: boolean; indexable: boolean; fixes: FixItem[]
}
export interface Issue { severity: Severity; category: string; title: string; affectedPages: number }
export interface Dup { value: string; pages: string[] }
export interface Analytics {
  siteScore: number
  categories: { technical: number; content: number; schema: number; ai: number }
  severityTotals: { critical: number; warning: number; info: number }
  totals: { avgWordCount: number; pagesWithSchema: number; nonIndexable: number; httpsPages: number }
  issues: Issue[]
  distribution: { excellent: number; good: number; fair: number; poor: number }
  issuesByCategory: { category: string; count: number }[]
  duplicates: { titles: Dup[]; metas: Dup[] }
  links: { inbound: Record<string, number>; orphans: PageResult[]; topLinked: { url: string; count: number }[]; avgInbound: number; noInternalLinks: number }
  index: { noindex: PageResult[]; nonCanonical: PageResult[]; mixed: PageResult[]; nonOk: PageResult[] }
  schemaCoverage: { type: string; count: number }[]
}
export interface PageSpeed { available: boolean; performance: number | null; lcpMs: number | null; cls: number | null; inpMs: number | null; strategy?: string }

export const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)))
export const norm = (u: string) => { try { const x = new URL(u); return x.hostname.replace(/^www\./, '') + (x.pathname.replace(/\/+$/, '') || '/') } catch { return u.replace(/\/+$/, '') } }
export function pathOf(url: string): string { try { const u = new URL(url); return (u.pathname + u.search) || '/' } catch { return url } }
export function scoreColor(n: number): string { return n >= 80 ? 'text-[var(--rf-green)]' : n >= 60 ? 'text-[var(--rf-cyan)]' : n >= 40 ? 'text-[var(--rf-amber)]' : 'text-[var(--rf-red)]' }
export const gradeInfo = (s: number) => s >= 90 ? { letter: 'A', color: 'var(--rf-green)' } : s >= 80 ? { letter: 'B', color: 'var(--rf-cyan)' } : s >= 70 ? { letter: 'C', color: 'var(--rf-blue-bright)' } : s >= 55 ? { letter: 'D', color: 'var(--rf-amber)' } : { letter: 'F', color: 'var(--rf-red)' }

function pathnameOf(url: string): string { try { return new URL(url).pathname } catch { return url } }

export function analyze(pages: PageResult[]): Analytics | null {
  if (pages.length === 0) return null
  const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length)

  const grouped = new Map<string, Issue>()
  for (const p of pages) for (const f of p.fixes ?? []) {
    const key = `${f.severity}|${f.category}|${f.title}`
    const g = grouped.get(key)
    if (g) g.affectedPages++
    else grouped.set(key, { severity: f.severity, category: f.category, title: f.title, affectedPages: 1 })
  }
  const rank: Record<string, number> = { critical: 0, warning: 1, info: 2 }
  const issues = [...grouped.values()].sort((a, b) => rank[a.severity] - rank[b.severity] || b.affectedPages - a.affectedPages)

  const catCount = new Map<string, number>()
  for (const p of pages) for (const f of p.fixes ?? []) catCount.set(f.category, (catCount.get(f.category) || 0) + 1)
  const issuesByCategory = [...catCount.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count)

  const dupOf = (key: (p: PageResult) => string): Dup[] => {
    const m = new Map<string, string[]>()
    for (const p of pages) { const v = String(key(p) ?? '').trim(); if (!v) continue; const arr = m.get(v.toLowerCase()) || []; arr.push(p.url); m.set(v.toLowerCase(), arr) }
    return [...m.entries()].filter(([, arr]) => arr.length > 1).map(([, arr]) => ({ value: key(pages.find((p) => norm(p.url) === norm(arr[0]))!) || arr[0], pages: arr })).sort((a, b) => b.pages.length - a.pages.length)
  }

  const pageKeys = new Set(pages.map((p) => norm(p.url)))
  const keyToUrl = new Map(pages.map((p) => [norm(p.url), p.url]))
  const inbound: Record<string, number> = {}
  for (const p of pages) for (const t of p.internalTargets ?? []) { const k = norm(t); if (pageKeys.has(k) && k !== norm(p.url)) inbound[k] = (inbound[k] || 0) + 1 }
  const orphans = pages.filter((p) => { const path = pathnameOf(p.url); return path !== '/' && !(inbound[norm(p.url)] > 0) })
  const topLinked = Object.entries(inbound).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, count]) => ({ url: keyToUrl.get(k) || k, count }))
  const inboundVals = pages.map((p) => inbound[norm(p.url)] || 0)

  const schemaMap = new Map<string, number>()
  for (const p of pages) for (const t of p.schemaTypes ?? []) schemaMap.set(t, (schemaMap.get(t) || 0) + 1)

  return {
    siteScore: avg(pages.map((p) => p.overall)),
    categories: { technical: avg(pages.map((p) => p.scores.technical)), content: avg(pages.map((p) => p.scores.content)), schema: avg(pages.map((p) => p.scores.schema)), ai: avg(pages.map((p) => p.scores.ai)) },
    severityTotals: { critical: issues.filter((i) => i.severity === 'critical').length, warning: issues.filter((i) => i.severity === 'warning').length, info: issues.filter((i) => i.severity === 'info').length },
    totals: { avgWordCount: avg(pages.map((p) => p.wordCount)), pagesWithSchema: pages.filter((p) => p.schemaTypes.length > 0).length, nonIndexable: pages.filter((p) => !p.indexable).length, httpsPages: pages.filter((p) => p.https).length },
    issues,
    distribution: { excellent: pages.filter((p) => p.overall >= 90).length, good: pages.filter((p) => p.overall >= 70 && p.overall < 90).length, fair: pages.filter((p) => p.overall >= 50 && p.overall < 70).length, poor: pages.filter((p) => p.overall < 50).length },
    issuesByCategory,
    duplicates: { titles: dupOf((p) => p.title), metas: dupOf((p) => p.metaDescription) },
    links: { inbound, orphans, topLinked, avgInbound: inboundVals.length ? Math.round((inboundVals.reduce((a, b) => a + b, 0) / inboundVals.length) * 10) / 10 : 0, noInternalLinks: pages.filter((p) => p.internalTargets.length === 0).length },
    index: { noindex: pages.filter((p) => p.status === 200 && !p.indexable), nonCanonical: pages.filter((p) => p.canonical && norm(p.canonical) !== norm(p.url)), mixed: pages.filter((p) => p.mixedContent), nonOk: pages.filter((p) => p.status !== 200) },
    schemaCoverage: [...schemaMap.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
  }
}

/* ── AI readiness (estimate from on-page crawl signals only) ─────────────────
 * The overall AI-readiness estimate composes measurable on-page signals. It is
 * NOT a measurement of visibility or citations in any AI engine. */
export function aiReadiness(a: Analytics, pages: number): number {
  const schemaPct = pages ? (a.totals.pagesWithSchema / pages) * 100 : 0
  const indexPct = pages ? ((pages - a.totals.nonIndexable) / pages) * 100 : 0
  return clamp(a.categories.ai * 0.5 + schemaPct * 0.2 + indexPct * 0.15 + a.categories.content * 0.15)
}

export function readinessSignals(a: Analytics, pages: number): { name: string; value: number; detail: string }[] {
  const pct = (n: number) => (pages ? Math.round((n / pages) * 100) : 0)
  return [
    { name: 'Structured data coverage', value: pct(a.totals.pagesWithSchema), detail: `${a.totals.pagesWithSchema}/${pages} pages have JSON-LD schema` },
    { name: 'Indexability', value: pct(pages - a.totals.nonIndexable), detail: `${pages - a.totals.nonIndexable}/${pages} pages indexable` },
    { name: 'Content depth', value: clamp(Math.round((a.totals.avgWordCount / 900) * 100)), detail: `${a.totals.avgWordCount} avg words/page` },
    { name: 'Content quality score', value: a.categories.content, detail: 'titles, metas, headings, thin-page checks' },
    { name: 'Technical health', value: a.categories.technical, detail: 'from crawl fix list' },
    { name: 'HTTPS coverage', value: pct(a.totals.httpsPages), detail: `${a.totals.httpsPages}/${pages} pages on HTTPS` },
  ]
}

/* Per-engine AI-readiness ESTIMATES. These are deterministic projections of the
 * same on-page signals under slightly different per-engine weightings (some
 * engines lean more on schema, some on content depth, etc). They are MODELED
 * estimates of how ready your on-page content is to be understood/cited — NOT
 * measurements of live visibility in any engine. Every render labels them so. */
export interface EngineReadiness { name: string; score: number }
export function engineReadiness(a: Analytics, pages: number): EngineReadiness[] {
  const pct = (n: number) => (pages ? (n / pages) * 100 : 0)
  const schema = pct(a.totals.pagesWithSchema)
  const index = pct(pages - a.totals.nonIndexable)
  const https = pct(a.totals.httpsPages)
  const depth = clamp(Math.round((a.totals.avgWordCount / 900) * 100))
  const content = a.categories.content
  const technical = a.categories.technical
  const aiCat = a.categories.ai
  // weights: [schema, index, depth, content, technical, https, aiCat]
  const ENGINES: { name: string; w: number[] }[] = [
    { name: 'ChatGPT', w: [0.18, 0.15, 0.20, 0.22, 0.10, 0.05, 0.10] },
    { name: 'Claude', w: [0.16, 0.15, 0.24, 0.22, 0.10, 0.05, 0.08] },
    { name: 'Gemini', w: [0.24, 0.16, 0.14, 0.16, 0.12, 0.06, 0.12] },
    { name: 'Perplexity', w: [0.20, 0.20, 0.16, 0.18, 0.10, 0.06, 0.10] },
    { name: 'Google AI Overview', w: [0.26, 0.22, 0.12, 0.14, 0.12, 0.06, 0.08] },
    { name: 'Microsoft Copilot', w: [0.18, 0.16, 0.18, 0.18, 0.14, 0.06, 0.10] },
    { name: 'Meta AI', w: [0.14, 0.16, 0.22, 0.22, 0.12, 0.04, 0.10] },
    { name: 'DeepSeek', w: [0.16, 0.14, 0.24, 0.20, 0.12, 0.04, 0.10] },
  ]
  const sig = [schema, index, depth, content, technical, https, aiCat]
  return ENGINES.map((e) => {
    const total = e.w.reduce((a, b) => a + b, 0)
    const score = clamp(e.w.reduce((acc, w, i) => acc + w * sig[i], 0) / total)
    return { name: e.name, score }
  })
}

/* ── Priority / revenue engine (modeled from user business inputs) ───────────*/
export interface Biz { monthlyVisits: number; valuePerVisit: number; name: string }
export const DEFAULT_BIZ: Biz = { monthlyVisits: 0, valuePerVisit: 0, name: '' }

export interface Priority {
  title: string; category: string; severity: Severity; affectedPages: number
  trafficGain: number; revenueGain: number; difficulty: 'Easy' | 'Medium' | 'Hard'
  minutes: number; confidence: number; section: string
}
const SEV_IMPACT: Record<Severity, number> = { critical: 0.05, warning: 0.02, info: 0.006 }
const CAT_META: Record<string, { difficulty: Priority['difficulty']; minutes: number; section: string }> = {
  'Critical technical fixes': { difficulty: 'Medium', minutes: 15, section: 'audit' },
  'Content gaps': { difficulty: 'Easy', minutes: 10, section: 'content' },
  'Schema opportunities': { difficulty: 'Easy', minutes: 5, section: 'schema' },
  'Internal link targets': { difficulty: 'Easy', minutes: 8, section: 'links' },
  'Keyword targeting': { difficulty: 'Easy', minutes: 6, section: 'content' },
}
export function buildPriorities(a: Analytics, pages: number, biz: Biz): { list: Priority[]; totalRevenue: number; totalTraffic: number } {
  const list: Priority[] = a.issues.slice(0, 24).map((i) => {
    const spread = Math.min(1, i.affectedPages / Math.max(1, pages))
    const frac = SEV_IMPACT[i.severity] * (0.4 + 0.6 * spread)
    const trafficGain = Math.round(biz.monthlyVisits * frac)
    const meta = CAT_META[i.category] ?? { difficulty: 'Medium' as const, minutes: 12, section: 'audit' }
    return {
      title: i.title, category: i.category, severity: i.severity, affectedPages: i.affectedPages,
      trafficGain, revenueGain: Math.round(trafficGain * biz.valuePerVisit),
      difficulty: meta.difficulty, minutes: meta.minutes + Math.min(30, i.affectedPages * 2),
      confidence: i.severity === 'critical' ? 85 : i.severity === 'warning' ? 70 : 55,
      section: meta.section,
    }
  })
  list.sort((x, y) => y.revenueGain - x.revenueGain || y.affectedPages - x.affectedPages)
  const totalTraffic = Math.min(Math.round(biz.monthlyVisits * 0.6), list.reduce((s, p) => s + p.trafficGain, 0))
  return { list, totalRevenue: Math.round(totalTraffic * biz.valuePerVisit), totalTraffic }
}
