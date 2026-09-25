import { notFound } from 'next/navigation'
import { LeagueReveal } from '@/components/LeagueReveal'
import { RankWatcher } from '@/components/RankWatcher'
import { ScoreTicker } from '@/components/ScoreTicker'
import { ScoreDial } from '@/components/ScoreDial'
import { leagueFor, leagues, pointsToClimb, tradePlural, weekStart } from '@/lib/league'
import { LEAGUE_STYLES, LEAGUE_TERMS, leagueTerms } from '@/lib/league-style'
import { requireUser } from '@/lib/session'
import { scoreSite } from '@/lib/site-score'
import { getStore } from '@/lib/store'
import { questLink } from '@/lib/visibility'
import { dayString, daysBefore } from '@/lib/visits'
import { setLeaguePublic, setLeagueStyle } from '../manage-actions'

export default async function VisibilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const today = dayString(new Date())
  const [pages, media, visits] = await Promise.all([store.pagesForSite(site.id), store.mediaForSite(site.id), store.visitsSince(site.id, daysBefore(today, 59))])
  const { vis: v } = await scoreSite(store, site, today, pages, media, visits)

  // This week, live; and last week, final, for the Monday reveal.
  const start = weekStart(today)
  const lastStart = daysBefore(start, 7)
  const everyone = await store.leagueSites(daysBefore(start, 7 * 14))
  const now = leagueFor(leagues(everyone, start, today), site.id)
  const last = leagueFor(leagues(everyone, lastStart, daysBefore(start, 1)), site.id)
  const daysLeft = 7 - Math.round((Date.parse(today) - Date.parse(start)) / 86_400_000)
  const climb = now ? pointsToClimb(now.league, now.me) : null
  // The smallest quest that's enough, preferring ones Sofie can do.
  const climbQuest = climb ? [...v.quests].filter((q) => q.points >= climb).sort((a, b) => a.points - b.points || Number(!!b.sofie) - Number(!!a.sofie))[0] : undefined
  const table = now ? now.league.standings.filter((s, i) => i < 8 || s.siteId === site.id) : []
  const terms = leagueTerms(site.league?.style)
  const style = site.league?.style ?? 'classic'
  const trade = (l: NonNullable<typeof now>['league']) => (l.trade ? `${tradePlural(l.trade)[0].toUpperCase()}${tradePlural(l.trade).slice(1)}` : 'All trades')
  const leagueTitle = now ? terms.group(trade(now.league)) : ''
  const history = everyone.find((e) => e.site.id === site.id)?.scores ?? []
  const setPublic = setLeaguePublic.bind(null, site.id)
  const setStyle = setLeagueStyle.bind(null, site.id)

  return (
    <section className="stack">
      <div className="sec-head">
        <div>
          <h2>Visibility</h2>
          <p className="muted">How findable your site is on Google, from 0 to 100, and exactly what raises it. Each opportunity follows Google’s guidelines and brings real visitors.</p>
        </div>
      </div>

      <div className="vis-top">
        <div className="card vis-score">
          <ScoreDial siteId={site.id} score={v.score} band={v.band} size={188} />
          <ul className="vis-areas">
            {v.areas.map((a) => (
              <li key={a.area}>
                <span>{a.area}</span>
                <span className="vis-bar" aria-hidden="true"><i style={{ width: `${(a.earned / a.of) * 100}%` }} /></span>
                <span className="muted small">{a.earned}/{a.of}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card vis-league">
          {last && <LeagueReveal siteId={site.id} week={lastStart} heading={terms.lastWeek} cta={terms.letterCta} place={terms.position(last.me.rank)} of={terms.of(last.league.standings.length)} league={terms.group(trade(last.league))} titles={last.me.titles.map((k) => terms.titles[k])} />}
          {now && <RankWatcher siteId={site.id} week={start} rank={now.me.rank} title={terms.position(now.me.rank)} caption={`You moved up since you last looked. ${leagueTitle}, this week.`} />}
          {now ? (
            <>
              <div className="card-head">
                <span className="stat-label">{terms.thisWeek} · {leagueTitle}</span>
                <span className="muted small">{daysLeft === 1 ? 'Closes tonight' : `${daysLeft} days left`}</span>
              </div>
              <div className="league-me">
                <strong>{terms.position(now.me.rank)}</strong>
                <span className="muted">{terms.of(now.league.standings.length)}</span>
                <span className={`league-move${now.me.momentum ? ' is-up' : ''}`}>{terms.move(now.me.momentum)}</span>
                {now.me.streak > 1 && <span className="league-streak">{terms.streak(now.me.streak)}</span>}
              </div>
              {climb ? (
                <p className="small" style={{ margin: 0 }}>
                  <strong>{terms.climb(climb)}</strong>
                  {climbQuest ? <>: <a href={questLink(climbQuest)}>{climbQuest.title.charAt(0).toLowerCase() + climbQuest.title.slice(1)}</a> is worth +{climbQuest.points}.</> : '.'}
                </p>
              ) : (
                <p className="small" style={{ margin: 0 }}><strong>{terms.leader}</strong></p>
              )}
            </>
          ) : (
            <p className="muted small">Your first weekly standing appears here once your score has been recorded.</p>
          )}
          <ScoreTicker history={history} score={v.score} label="Your score" />
          <form action={setStyle} className="league-style" aria-label="How your standings are worded">
            {LEAGUE_STYLES.map((k) => (
              <button key={k} type="submit" name="style" value={k} className={k === style ? 'on' : undefined} aria-pressed={k === style} title={LEAGUE_TERMS[k].hint}>{LEAGUE_TERMS[k].name}</button>
            ))}
          </form>
        </div>
      </div>

      {now && (site.league?.public ? (
        <div className="card">
          <div className="card-head">
            <h3>{leagueTitle}</h3>
            <span className="muted small">{terms.ranked}</span>
          </div>
          <ol className="standings">
            {table.map((s) => (
              <li key={s.siteId} className={s.siteId === site.id ? 'is-me' : undefined}>
                <span className="st-rank">{style === 'arena' ? `#${s.rank}` : s.rank}</span>
                <span className="st-name">
                  <span>{s.siteId === site.id ? `${site.business.name} (you)` : s.label}</span>
                  {s.titles.map((t) => (
                    <span key={t} className="title-seal">{terms.titles[t]}</span>
                  ))}
                </span>
                <span className="st-score muted small">{s.score}</span>
                <span className={`st-mom${s.momentum ? ' is-up' : ' muted'}`}>{terms.move(s.momentum)}</span>
              </li>
            ))}
          </ol>
          <div className="league-public">
            <p className="muted small" style={{ margin: 0, flex: 1 }}>You share your standing, so you see everyone who shares theirs. Businesses that keep theirs private appear without a name. Visitor numbers are never shown.</p>
            <form action={setPublic}>
              <button className="btn btn-ghost btn-sm" type="submit">Stop sharing</button>
            </form>
          </div>
        </div>
      ) : (
        <div className="card compare-invite">
          <div>
            <span className="stat-label">Peer comparison</span>
            <h3>See how you compare with {now.league.standings.length - 1} other {now.league.trade ? tradePlural(now.league.trade) : 'businesses'} on SaySites</h3>
            <p className="muted small" style={{ margin: 0 }}>Comparison is reciprocal. Share your standing and you’ll see every business that shares theirs, by name, with their Visibility Score and weekly gain. Visitor numbers stay private either way, and you can stop sharing at any time.</p>
          </div>
          <form action={setPublic}>
            <input type="hidden" name="public" value="on" />
            <button className="btn btn-primary" type="submit">Share and compare</button>
          </form>
        </div>
      ))}

      <div className="card">
        <div className="card-head">
          <h3>Opportunities</h3>
          <span className="muted small">{v.quests.length ? `${100 - v.score} points to earn` : 'All done'}</span>
        </div>
        {v.quests.length === 0 ? (
          <p className="muted">Every opportunity is taken. Keep posting monthly to hold your score.</p>
        ) : (
          <ol className="quests">
            {v.quests.map((q) => (
              <li key={q.id} className="quest">
                <span className="quest-pts">+{q.points}</span>
                <div className="quest-body">
                  <strong>{q.title}</strong>
                  <span className="muted small">{q.why}</span>
                </div>
                <span className="quest-area muted small">{q.area}</span>
                <a className={`btn btn-sm ${q.sofie ? 'btn-primary' : 'btn-ghost'}`} href={questLink(q)}>{q.sofie ? 'Ask Sofie' : 'Go'}</a>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
