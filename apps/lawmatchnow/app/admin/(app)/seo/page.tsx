import type { Metadata } from 'next'
import Link from 'next/link'
import { ActionForm } from '@/components/admin/ActionForm'
import { Bars, Kpi, Panel, RangePicker, Setup, daysParam, fmt, pct } from '@/components/admin/ui'
import { kvGet } from '@/lib/admin/db'
import { gscConfigured, gscOverview } from '@/lib/admin/google'
import { indexNowKey, lastAudit, pageSpeedHistory } from '@/lib/admin/seo'
import { SITE, fmtDate } from '@/lib/site'
import { audit, indexNow, inspectUrl, pageSpeed, submitSitemap } from '../../actions'

export const metadata: Metadata = { title: 'SEO' }
type Props = { searchParams: Promise<{ d?: string }> }

const short = (url: string) => url.replace(SITE.url, '') || '/'
const score = (n: number) => <span className={`ad-score ${n >= 90 ? 'good' : n >= 50 ? 'ok' : 'bad'}`}>{n}</span>

export default async function Seo({ searchParams }: Props) {
  const days = daysParam((await searchParams).d)
  const [gsc, psi, aud, ixn] = await Promise.all([
    gscConfigured() ? gscOverview(days).then((v) => ({ v }), (e: Error) => ({ error: e.message })) : null,
    pageSpeedHistory().catch(() => []),
    lastAudit().catch(() => null),
    kvGet<{ at: string; sent: number }>('indexnow').catch(() => null),
  ])
  return (
    <>
      <div className="ad-head">
        <div><div className="eyebrow">Search</div><h1>SEO</h1></div>
        <RangePicker days={days} base="/admin/seo" />
      </div>

      <h2 className="ad-h2">Google Search Console</h2>
      {!gsc && <Setup title="Connect Search Console to see the searches you appear for, clicks, rankings and indexing.">Uses the same Google service account as Analytics.</Setup>}
      {gsc && 'error' in gsc && <div className="ad-warn">Search Console: {gsc.error}</div>}
      {gsc && 'v' in gsc && (
        <>
          <div className="ad-kpis">
            <Kpi label="Clicks from Google" value={gsc.v.clicks} />
            <Kpi label="Impressions" value={gsc.v.impressions} />
            <Kpi label="Click-through rate" value={pct(gsc.v.ctr)} />
            <Kpi label="Average position" value={gsc.v.position.toFixed(1)} />
          </div>
          <div className="ad-grid">
            <Panel title="Clicks and impressions" wide><Bars data={gsc.v.daily} a="clicks" b="impressions" labelA="Clicks" labelB="Impressions" /></Panel>
            <Panel title="Quick wins: ranking 5–20" wide>
              <p className="muted">Searches where you already show up on page 1–2. Improving these pages (better title, more depth, internal links) is usually the fastest way to more clicks.</p>
              <SearchTable rows={gsc.v.opportunities.map((r) => ({ ...r, ctr: r.impressions ? r.clicks / r.impressions : 0 }))} />
            </Panel>
            <Panel title="Top searches" wide><SearchTable rows={gsc.v.queries} /></Panel>
            <Panel title="Top pages in Google" wide><SearchTable rows={gsc.v.pages.map((p) => ({ ...p, k: short(p.k) }))} link /></Panel>
            <Panel title="Sitemaps">
              {gsc.v.sitemaps.length ? (
                <ul className="ad-list">{gsc.v.sitemaps.map((s) => <li key={s.path}><b>{short(s.path)}</b><span className="muted">{s.contents?.map((c) => `${fmt(Number(c.submitted))} submitted${c.indexed ? `, ${fmt(Number(c.indexed))} indexed` : ''}`).join(' · ')}{s.lastDownloaded ? ` · read ${fmtDate(s.lastDownloaded)}` : ''}{Number(s.errors) ? ` · ${s.errors} errors` : ''}</span></li>)}</ul>
              ) : <p className="muted">No sitemap submitted yet.</p>}
              <ActionForm action={submitSitemap} submit="Submit sitemap to Google" />
            </Panel>
            <Panel title="Check a page in Google's index">
              <ActionForm action={inspectUrl} submit="Inspect">
                <div className="field"><label htmlFor="ins">Page path</label><input id="ins" name="path" placeholder="/miami/personal-injury" /></div>
              </ActionForm>
            </Panel>
          </div>
        </>
      )}

      <h2 className="ad-h2">Speed and Core Web Vitals</h2>
      <div className="ad-grid">
        <Panel title="Run a PageSpeed test">
          <ActionForm action={pageSpeed} submit="Test with Google PageSpeed" pendingLabel="Testing (about 30 seconds)…">
            <div className="field"><label htmlFor="ps">Page path</label><input id="ps" name="path" defaultValue="/" /></div>
            <div className="field"><label htmlFor="st">Device</label><select id="st" name="strategy"><option value="mobile">Mobile</option><option value="desktop">Desktop</option></select></div>
          </ActionForm>
        </Panel>
        <Panel title="Results" wide>
          {psi.length ? (
            <div className="cmp-wrap"><table className="cmp wide">
              <thead><tr><th>Page</th><th>Device</th><th>Performance</th><th>SEO</th><th>Accessibility</th><th>Best practices</th><th>LCP</th><th>CLS</th><th>Real users</th><th>Tested</th></tr></thead>
              <tbody>{psi.map((r) => (
                <tr key={r.url + r.strategy}>
                  <td><Link href={short(r.url)}>{short(r.url)}</Link></td><td>{r.strategy}</td>
                  <td>{score(r.scores.performance)}</td><td>{score(r.scores.seo)}</td><td>{score(r.scores.accessibility)}</td><td>{score(r.scores.bestPractices)}</td>
                  <td>{r.lab.lcp}</td><td>{r.lab.cls}</td><td>{r.field?.category ?? 'Not enough data'}</td><td>{fmtDate(r.at)}</td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : <p className="muted">No tests yet. Test the home page, a city page and a law guide.</p>}
          {psi[0]?.issues.length ? <><h3>Top fixes for {short(psi[0].url)} ({psi[0].strategy})</h3><ul>{psi[0].issues.map((i) => <li key={i.title}>{i.title}</li>)}</ul></> : null}
        </Panel>
      </div>

      <h2 className="ad-h2">Site audit</h2>
      <div className="ad-grid">
        <Panel title="Crawl the site">
          <p className="muted">Checks titles, descriptions, headings, canonicals, structured data, word count, image alt text and response time on up to 400 pages across the sitemap.</p>
          <ActionForm action={audit} submit="Run audit" pendingLabel="Crawling (1–2 minutes)…" />
          {aud && <p className="muted">Last run {fmtDate(aud.at)}: {aud.checked} of {fmt(aud.total)} pages checked.</p>}
        </Panel>
        {aud && (
          <Panel title="Issues found">
            {Object.keys(aud.summary).length ? <ul className="ad-list">{Object.entries(aud.summary).sort((a, b) => b[1] - a[1]).map(([k, n]) => <li key={k}><b>{k}</b><span className="muted">{n} pages</span></li>)}</ul> : <p>No issues found.</p>}
          </Panel>
        )}
        {aud && aud.pages.some((p) => p.problems.length) && (
          <Panel title="Pages to fix" wide>
            <div className="cmp-wrap"><table className="cmp wide">
              <thead><tr><th>Page</th><th>Problems</th><th>Title</th><th>Words</th><th>Schema</th><th>ms</th></tr></thead>
              <tbody>{aud.pages.filter((p) => p.problems.length).slice(0, 60).map((p) => (
                <tr key={p.path}><td><Link href={p.path}>{p.path}</Link>{p.noindex && <small>noindex</small>}</td><td>{p.problems.join('; ')}</td><td>{p.titleLen}</td><td>{p.words}</td><td>{p.schema.join(', ')}</td><td>{p.ms}</td></tr>
              ))}</tbody>
            </table></div>
          </Panel>
        )}
      </div>

      <h2 className="ad-h2">Instant indexing</h2>
      <div className="ad-grid">
        <Panel title="IndexNow (Bing, Yahoo, DuckDuckGo results, Yandex)">
          {indexNowKey() ? (
            <>
              <p className="muted">Tells Bing and partner search engines about every page in the sitemap right away. Run it after publishing new content.</p>
              <ActionForm action={indexNow} submit="Submit all pages to IndexNow" pendingLabel="Submitting…" />
              {ixn && <p className="muted">Last sent {fmtDate(ixn.value.at)}: {fmt(ixn.value.sent)} URLs.</p>}
            </>
          ) : <Setup title="Add INDEXNOW_KEY to turn this on.">Any random string of 8–128 letters and numbers.</Setup>}
        </Panel>
        <Panel title="More tools">
          <ul className="ad-list">
            <li><a href="https://search.google.com/search-console" target="_blank" rel="noopener">Google Search Console</a><span className="muted">Coverage, Core Web Vitals, manual actions</span></li>
            <li><a href="https://www.bing.com/webmasters" target="_blank" rel="noopener">Bing Webmaster Tools</a><span className="muted">Also feeds ChatGPT search and Copilot</span></li>
            <li><a href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(SITE.url)}`} target="_blank" rel="noopener">Rich Results Test</a><span className="muted">Check structured data</span></li>
            <li><a href="https://analytics.google.com/" target="_blank" rel="noopener">Google Analytics</a><span className="muted">Property G-BB1PLHVBT0</span></li>
            <li><a href={`${SITE.url}/sitemap.xml`} target="_blank" rel="noopener">sitemap.xml</a> · <a href={`${SITE.url}/robots.txt`} target="_blank" rel="noopener">robots.txt</a> · <a href={`${SITE.url}/llms.txt`} target="_blank" rel="noopener">llms.txt</a></li>
          </ul>
        </Panel>
      </div>
    </>
  )
}

function SearchTable({ rows, link = false }: { rows: { k: string; clicks: number; impressions: number; ctr: number; position: number }[]; link?: boolean }) {
  if (!rows.length) return <p className="muted">No data yet. Search Console data appears 2–3 days after Google starts showing the site.</p>
  return (
    <div className="cmp-wrap"><table className="cmp wide">
      <thead><tr><th>{link ? 'Page' : 'Search'}</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead>
      <tbody>{rows.map((r) => <tr key={r.k}><td>{link ? <Link href={r.k}>{r.k}</Link> : r.k}</td><td>{fmt(r.clicks)}</td><td>{fmt(r.impressions)}</td><td>{pct(r.ctr)}</td><td>{r.position.toFixed(1)}</td></tr>)}</tbody>
    </table></div>
  )
}
