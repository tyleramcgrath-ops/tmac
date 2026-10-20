// First-party, cookieless traffic counts: page views per path per day, where
// sessions came from, and key actions (case-review clicks, phone taps...).
// Aggregated only: no IPs or personal data are stored.

import { hasDb, q } from './db'

const BOT = /bot|crawl|spider|slurp|bing|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|monitor|curl|wget|python|axios|node-fetch|go-http/i
export const isBot = (ua: string | null) => !ua || BOT.test(ua)

/** Where a session came from, from its referrer and campaign tags. */
export function classify(referrer: string, params: URLSearchParams, host: string): string {
  if (params.get('gclid') || params.get('gbraid') || params.get('wbraid')) return 'Google Ads'
  if (params.get('msclkid')) return 'Microsoft Ads'
  if (params.get('fbclid')) return 'Facebook'
  const utm = params.get('utm_source')
  if (utm) return `${utm}${params.get('utm_medium') ? ` / ${params.get('utm_medium')}` : ''}`.slice(0, 60)
  if (!referrer) return 'Direct'
  let h = ''
  try { h = new URL(referrer).hostname.replace(/^www\./, '') } catch { return 'Direct' }
  if (!h || h === host.replace(/^www\./, '')) return 'Internal'
  if (/(^|\.)google\./.test(h)) return 'Google (organic)'
  if (/(^|\.)bing\.com$/.test(h)) return 'Bing (organic)'
  if (/duckduckgo\.com$/.test(h)) return 'DuckDuckGo'
  if (/yahoo\./.test(h)) return 'Yahoo'
  if (/chatgpt\.com|openai\.com/.test(h)) return 'ChatGPT'
  if (/perplexity\.ai/.test(h)) return 'Perplexity'
  if (/claude\.ai/.test(h)) return 'Claude'
  if (/gemini\.google|bard\.google/.test(h)) return 'Gemini'
  if (/facebook\.com|fb\.com/.test(h)) return 'Facebook'
  if (/instagram\.com/.test(h)) return 'Instagram'
  if (/t\.co$|twitter\.com|x\.com/.test(h)) return 'X / Twitter'
  if (/linkedin\.com|lnkd\.in/.test(h)) return 'LinkedIn'
  if (/reddit\.com/.test(h)) return 'Reddit'
  if (/youtube\.com/.test(h)) return 'YouTube'
  return h.slice(0, 60)
}

const today = () => new Date().toISOString().slice(0, 10)

export async function recordView(path: string, session?: { source: string }) {
  if (!hasDb()) return
  await q(`INSERT INTO lmn_visits (day, path, views, visitors) VALUES ($1, $2, 1, $3)
           ON CONFLICT (day, path) DO UPDATE SET views = lmn_visits.views + 1, visitors = lmn_visits.visitors + EXCLUDED.visitors`,
    [today(), path.slice(0, 300), session ? 1 : 0])
  if (session) await q(`INSERT INTO lmn_referrers (day, source, visits) VALUES ($1, $2, 1)
                        ON CONFLICT (day, source) DO UPDATE SET visits = lmn_referrers.visits + 1`, [today(), session.source])
}

export async function recordEvent(name: string, label = '') {
  if (!hasDb()) return
  await q(`INSERT INTO lmn_events (day, name, label, count) VALUES ($1, $2, $3, 1)
           ON CONFLICT (day, name, label) DO UPDATE SET count = lmn_events.count + 1`, [today(), name.slice(0, 40), label.slice(0, 200)])
}

const since = (days: number) => `day > current_date - ${Math.max(1, Math.min(400, Math.floor(days)))}`

export async function trafficStats(days: number) {
  if (!hasDb()) return null
  const n = (rows: { n: string }[]) => Number(rows[0]?.n ?? 0)
  const prevWindow = `day <= current_date - ${days} AND day > current_date - ${days * 2}`
  const [views, sessions, prevViews, prevSessions] = await Promise.all([
    q<{ n: string }>(`SELECT coalesce(sum(views),0) AS n FROM lmn_visits WHERE ${since(days)}`),
    q<{ n: string }>(`SELECT coalesce(sum(visitors),0) AS n FROM lmn_visits WHERE ${since(days)}`),
    q<{ n: string }>(`SELECT coalesce(sum(views),0) AS n FROM lmn_visits WHERE ${prevWindow}`),
    q<{ n: string }>(`SELECT coalesce(sum(visitors),0) AS n FROM lmn_visits WHERE ${prevWindow}`),
  ])
  const byDay = await q<{ day: string; views: string; sessions: string }>(
    `SELECT to_char(day, 'YYYY-MM-DD') AS day, sum(views) AS views, sum(visitors) AS sessions FROM lmn_visits WHERE ${since(days)} GROUP BY day ORDER BY day`)
  const topPages = await q<{ path: string; views: string; sessions: string }>(
    `SELECT path, sum(views) AS views, sum(visitors) AS sessions FROM lmn_visits WHERE ${since(days)} GROUP BY path ORDER BY 2 DESC LIMIT 25`)
  const sources = await q<{ source: string; visits: string }>(
    `SELECT source, sum(visits) AS visits FROM lmn_referrers WHERE ${since(days)} GROUP BY source ORDER BY 2 DESC LIMIT 20`)
  const events = await q<{ name: string; n: string }>(
    `SELECT name, sum(count) AS n FROM lmn_events WHERE ${since(days)} GROUP BY name ORDER BY 2 DESC`)
  const sections = await q<{ section: string; views: string }>(
    `SELECT CASE
       WHEN path = '/' THEN 'Home'
       WHEN path LIKE '/state/%/%' THEN 'State law guides'
       WHEN path LIKE '/state/%' THEN 'State pages'
       WHEN path LIKE '/laws%' THEN '50-state tables'
       WHEN path LIKE '/attorney/%' THEN 'Attorney profiles'
       WHEN path LIKE '/practice-area/%' THEN 'Practice areas'
       WHEN path LIKE '/guide%' OR path LIKE '/blog%' THEN 'Guides & news'
       WHEN path LIKE '/admin%' THEN 'Admin'
       WHEN path ~ '^/[a-z-]+/[a-z-]+$' THEN 'City + practice'
       WHEN path ~ '^/[a-z-]+$' THEN 'City & other pages'
       ELSE 'Other' END AS section, sum(views) AS views
     FROM lmn_visits WHERE ${since(days)} GROUP BY 1 ORDER BY 2 DESC`)
  return {
    views: n(views), sessions: n(sessions), prevViews: n(prevViews), prevSessions: n(prevSessions),
    byDay: byDay.map((r) => ({ day: r.day, views: Number(r.views), sessions: Number(r.sessions) })),
    topPages: topPages.map((r) => ({ path: r.path, views: Number(r.views), sessions: Number(r.sessions) })),
    sources: sources.map((r) => ({ source: r.source, visits: Number(r.visits) })),
    events: Object.fromEntries(events.map((r) => [r.name, Number(r.n)])) as Record<string, number>,
    sections: sections.map((r) => ({ section: r.section, views: Number(r.views) })),
  }
}
