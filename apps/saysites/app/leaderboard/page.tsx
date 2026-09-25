import type { Metadata } from 'next'
import { MarketingShell } from '@/components/MarketingShell'
import { leagues, ordinal, tradePlural, weekStart } from '@/lib/league'
import { siteOrigin, type Site } from '@/lib/schema'
import { getStore } from '@/lib/store'
import { dayString, daysBefore } from '@/lib/visits'
import '../home.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The SaySites leaderboard: local businesses climbing Google this week',
  description: 'Every week, local businesses on SaySites compete in their trade on momentum: how much more findable their website became, and how much their traffic grew. Here are this week’s leaders.',
  alternates: { canonical: '/leaderboard' },
}

function fmtWeek(start: string) {
  const f = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  return `${f(start)} – ${f(daysBefore(start, -6))}`
}

export default async function LeaderboardPage() {
  const today = dayString(new Date())
  const start = weekStart(today)
  let board: (ReturnType<typeof leagues>[number] & { size: number })[] = []
  let sites = new Map<string, Site>()
  try {
    const store = getStore()
    const all = await store.leagueSites(daysBefore(start, 7 * 14))
    sites = new Map(all.map((s) => [s.site.id, s.site]))
    board = leagues(all, start, today)
      .map((l) => ({ ...l, size: l.standings.length, standings: l.standings.filter((s) => s.isPublic && sites.has(s.siteId)).slice(0, 10) }))
      .filter((l) => l.standings.length > 0)
  } catch {
    // Without the database the page still stands, as the empty state.
    board = []
  }

  return (
    <MarketingShell>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Leaderboard · {fmtWeek(start)}</p>
          <h1>Who’s getting found this week.</h1>
          <p>Every SaySites website plays in a weekly league with others in its trade. Rankings go by momentum, not size: points added to the site’s Visibility Score, plus growth in visitors. A corner bakery that did the work this week beats a chain that didn’t.</p>
        </div>
      </section>
      <section className="lb">
        <div className="wrap">
          {board.length === 0 ? (
            <div className="lb-empty">
              <h2>This week’s standings are forming.</h2>
              <p>Businesses that choose to be listed appear here, with a link to their website.</p>
              <a className="b b-dark" href="/signup">Build your site and join a league</a>
            </div>
          ) : (
            <div className="lb-grid">
              {board.map((l) => (
                <article key={l.name} className="lb-league">
                  <header>
                    <h2>{l.trade ? `${tradePlural(l.trade)[0].toUpperCase()}${tradePlural(l.trade).slice(1)}` : 'Open league'}</h2>
                    <span>{l.size} competing this week</span>
                  </header>
                  <ol>
                    {l.standings.map((s) => {
                      const site = sites.get(s.siteId)
                      const where = site?.business.address?.city ?? site?.business.area?.split(',')[0]
                      return (
                        <li key={s.siteId}>
                          <span className="lb-rank">{ordinal(s.rank)}</span>
                          <span className="lb-name">
                            {site ? <a href={siteOrigin(site)}>{s.label}</a> : s.label}
                            <small>{[where, ...s.titles].filter(Boolean).join(' · ')}</small>
                          </span>
                          <span className="lb-score" title="Visibility Score">{s.score}</span>
                        </li>
                      )
                    })}
                  </ol>
                </article>
              ))}
            </div>
          )}
          <p className="lb-note">Scores run from 0 to 100 and measure how findable a site is: technical health, local details, useful content, trust and traffic. Visitor numbers are never published.</p>
        </div>
      </section>
    </MarketingShell>
  )
}
