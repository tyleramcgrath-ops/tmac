import { notFound } from 'next/navigation'
import { LeagueReveal } from '@/components/LeagueReveal'
import { ScoreDial } from '@/components/ScoreDial'
import { leagueFor, leagues, ordinal, pointsToClimb, tradePlural, weekStart } from '@/lib/league'
import { requireUser } from '@/lib/session'
import { scoreSite } from '@/lib/site-score'
import { getStore } from '@/lib/store'
import { questLink } from '@/lib/visibility'
import { dayString, daysBefore } from '@/lib/visits'
import { setLeaguePublic } from '../manage-actions'

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
  const leagueTitle = now ? (now.league.trade ? `${tradePlural(now.league.trade)[0].toUpperCase()}${tradePlural(now.league.trade).slice(1)}` : 'The SaySites league') : ''
  const setPublic = setLeaguePublic.bind(null, site.id)

  return (
    <section className="stack">
      <div className="sec-head">
        <div>
          <h2>Visibility</h2>
          <p className="muted">How findable your site is on Google, from 0 to 100, and exactly what raises it. Every quest is something that brings real visitors.</p>
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
          {last && <LeagueReveal siteId={site.id} week={lastStart} place={ordinal(last.me.rank)} of={last.league.standings.length} league={last.league.name} titles={last.me.titles} />}
          {now ? (
            <>
              <div className="card-head">
                <span className="stat-label">This week · {now.league.name}</span>
                <span className="muted small">{daysLeft === 1 ? 'Closes tonight' : `${daysLeft} days left`}</span>
              </div>
              <div className="league-me">
                <strong>{ordinal(now.me.rank)}</strong>
                <span className="muted">of {now.league.standings.length}</span>
                {now.me.streak > 1 && <span className="league-streak" title="Weeks in a row you gained ground">{now.me.streak}-week streak</span>}
              </div>
              {climb ? (
                <p className="small" style={{ margin: 0 }}>
                  <strong>{climb} Visibility point{climb === 1 ? '' : 's'}</strong> would move you up a place
                  {climbQuest ? <>: <a href={questLink(climbQuest)}>{climbQuest.title.charAt(0).toLowerCase() + climbQuest.title.slice(1)}</a> is worth +{climbQuest.points}.</> : '.'}
                </p>
              ) : (
                <p className="small" style={{ margin: 0 }}><strong>You lead the league.</strong> Keep adding points to hold it until Sunday.</p>
              )}
            </>
          ) : (
            <p className="muted small">Your first standing appears here as your score is recorded.</p>
          )}
        </div>
      </div>

      {now && (
        <div className="card">
          <div className="card-head">
            <h3>{leagueTitle}</h3>
            <span className="muted small">Ranked by momentum: points gained this week plus traffic growth</span>
          </div>
          <ol className="standings">
            {table.map((s) => (
              <li key={s.siteId} className={s.siteId === site.id ? 'is-me' : undefined}>
                <span className="st-rank">{s.rank}</span>
                <span className="st-name">
                  <span>{s.siteId === site.id ? `${site.business.name} (you)` : s.label}</span>
                  {s.titles.map((t) => (
                    <span key={t} className="title-seal">{t}</span>
                  ))}
                </span>
                <span className="st-score muted small">{s.score}</span>
                <span className={`st-mom${s.momentum ? '' : ' muted'}`}>{s.momentum ? `+${s.momentum}` : '0'}</span>
              </li>
            ))}
          </ol>
          <form action={setPublic} className="league-public">
            <label className="check">
              <input type="checkbox" name="public" defaultChecked={!!site.league?.public} />
              <span>Show my business name in the league and on the saysites.com leaderboard, with a link to my site</span>
            </label>
            <button className="btn btn-ghost btn-sm" type="submit">Save</button>
          </form>
          <p className="muted small" style={{ margin: 0 }}>Other owners never see your visitor numbers, only your score and momentum.</p>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h3>Quests</h3>
          <span className="muted small">{v.quests.length ? `${100 - v.score} points to earn` : 'All done'}</span>
        </div>
        {v.quests.length === 0 ? (
          <p className="muted">Every quest is complete. Keep posting monthly to hold your score.</p>
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
