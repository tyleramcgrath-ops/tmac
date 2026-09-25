import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import { leagues, tradePlural, weekStart } from '@/lib/league'
import { getStore } from '@/lib/store'
import { dayString, daysBefore } from '@/lib/visits'
import '../home.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The SaySites Index: organic visibility of local businesses, weekly',
  description: 'A weekly measure of how findable local businesses on SaySites are in Google search, by trade: earned through fast pages, accurate details and useful content, not paid ads.',
  alternates: { canonical: '/visibility-index' },
}

function fmtWeek(start: string) {
  const f = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  return `${f(start)} – ${f(daysBefore(start, -6))}`
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2)) : 0
}

// Published without names: owners see each other only inside the dashboard,
// and only when they share their own standing.
export default async function IndexPage() {
  const today = dayString(new Date())
  const start = weekStart(today)
  let rows: { name: string; count: number; median: number; top: number; gainers: number }[] = []
  try {
    const all = await getStore().leagueSites(daysBefore(start, 7 * 14))
    rows = leagues(all, start, today).map((l) => ({
      name: l.trade ? `${tradePlural(l.trade)[0].toUpperCase()}${tradePlural(l.trade).slice(1)}` : 'Other trades',
      count: l.standings.length,
      median: median(l.standings.map((s) => s.score)),
      top: Math.max(...l.standings.map((s) => s.score)),
      gainers: l.standings.filter((s) => s.gain > 0).length,
    }))
  } catch {
    // Without the database the page still stands, as the empty state.
  }
  const total = rows.reduce((n, r) => n + r.count, 0)

  return (
    <MarketingShell>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">The SaySites Index · {fmtWeek(start)}</p>
          <h1>Earned, not bought.</h1>
          <p>Every week we measure how findable each SaySites business is in Google, from 0 to 100: technical health, accurate local details, useful content, trust and traffic. No paid placement moves this number. Owners see where they stand against their trade privately, and compare by name only with peers who share in return.</p>
        </div>
      </section>
      <section className="lb">
        <div className="wrap">
          {rows.length === 0 ? (
            <div className="lb-empty">
              <h2>This week’s index is being compiled.</h2>
              <p>Figures appear here as businesses build and improve their sites.</p>
              <a className="b b-dark" href="/signup">Build your site</a>
            </div>
          ) : (
            <table className="ix">
              <caption>{total} {total === 1 ? 'business' : 'businesses'} measured this week</caption>
              <thead>
                <tr><th scope="col">Trade</th><th scope="col">Businesses</th><th scope="col">Median score</th><th scope="col">Highest</th><th scope="col">Improved this week</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name}>
                    <th scope="row">{r.name}</th>
                    <td>{r.count}</td>
                    <td>{r.median}</td>
                    <td>{r.top}</td>
                    <td>{Math.round((r.gainers / r.count) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="lb-note">Every SaySites website follows Google Search Essentials and Google’s spam policies. Scores reward what search engines reward: fast pages, accurate business details, useful content and real reviews. Business names and visitor numbers are never published.</p>
        </div>
      </section>
    </MarketingShell>
  )
}
