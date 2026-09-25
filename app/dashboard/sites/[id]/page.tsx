import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { liveUrl, previewPath } from '@/lib/urls'
import { dayString, daysBefore } from '@/lib/visits'
import { scoreSite } from '@/lib/site-score'
import { milestones } from '@/lib/milestones'
import { questLink } from '@/lib/visibility'
import { leagueFor, leagues, tradePlural, weekStart } from '@/lib/league'
import { leagueTerms } from '@/lib/league-style'
import { ScoreDial } from '@/components/ScoreDial'
import { Milestones } from '@/components/Milestones'

export default async function SiteOverview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const [{ id }, { new: isNew }] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const today = dayString(new Date())
  const [pages, messages, sofie, visits] = await Promise.all([
    store.pagesForSite(site.id),
    store.messagesForSite(site.id, 4),
    store.sofieState(site.id),
    store.visitsSince(site.id, daysBefore(today, 59)),
  ])
  const [media, everVisited] = await Promise.all([store.mediaForSite(site.id), store.visitsSince(site.id, '2000-01-01')])
  // The same checks that gate publishing, summed up.
  const { errors, tips, fast, traffic, vis } = await scoreSite(store, site, today, pages, media, visits)
  const sparkMax = Math.max(1, ...traffic.days.map((d) => d.views))
  const spark = traffic.days.map((d, i) => `${i ? 'L' : 'M'}${i} ${(20 - (d.views / sparkMax) * 18).toFixed(1)}`).join(' ')
  const lastSofie = [...sofie.chat].reverse().find((t) => t.role === 'sofie' && t.changes?.length)
  const base = `/dashboard/sites/${site.id}`
  const b = site.business
  const next = vis.quests[0]
  const start = weekStart(today)
  const lt = leagueTerms(site.league?.style)
  const standing = leagueFor(leagues(await store.leagueSites(daysBefore(start, 7 * 14)), start, today), site.id)
  const marks = milestones({
    siteName: b.name,
    base,
    hasLogo: !!b.logo,
    sofieChanged: sofie.chat.some((t) => t.role === 'sofie' && t.text.startsWith('Published.')),
    photos: media.filter((m) => m.mime !== 'image/svg+xml').length,
    visits: everVisited.length,
    messages: messages.length,
    posts: pages.filter((p) => p.post).length,
    products: site.store?.products.length ?? 0,
    customDomain: site.customDomain,
    seoClean: errors === 0 && tips === 0,
  })

  return (
    <div className="stack">
      {isNew && <p className="notice good"><strong>Your website is ready.</strong> Have a look, then use Sofie or Settings to make it yours.</p>}

      <div className="overview">
        <div className="card preview-card">
          <div className="browser">
            <div className="browser-bar"><i /><i /><i /><span>{liveUrl(site).replace('https://', '')}</span></div>
            <div className="browser-view">
              <iframe src={previewPath(site)} title={`${b.name} home page`} loading="lazy" tabIndex={-1} aria-hidden="true" />
            </div>
          </div>
          <div className="preview-actions">
            <a className="btn btn-primary" href={`${base}/sofie`}>Change it with Sofie</a>
            <a className="btn btn-ghost" href={previewPath(site)} target="_blank" rel="noopener">Open website ↗</a>
          </div>
        </div>

        <div className="stack">
          <div className="stats four">
            <a className="stat" href={`${base}/pages`}>
              <span className="stat-label">Speed</span>
              <strong className={fast ? 'good' : 'bad'}>{fast ? '95+' : 'Check'}</strong>
              <span className="muted">{fast ? 'Every page passes' : 'A page is too heavy'}</span>
            </a>
            <a className="stat" href={`${base}/pages`}>
              <span className="stat-label">SEO</span>
              <strong className={errors ? 'bad' : tips ? 'warn' : 'good'}>{errors ? `${errors} to fix` : tips ? `${tips} tip${tips > 1 ? 's' : ''}` : 'All good'}</strong>
              <span className="muted">{pages.length} page{pages.length === 1 ? '' : 's'} checked</span>
            </a>
            <a className="stat" href={`${base}/messages`}>
              <span className="stat-label">Messages</span>
              <strong>{messages.filter((m) => !m.read).length || messages.length}</strong>
              <span className="muted">{messages.some((m) => !m.read) ? 'new' : 'from your contact form'}</span>
            </a>
            <a className="stat" href={`${base}/visitors`}>
              <span className="stat-label">Visitors</span>
              <strong>{new Intl.NumberFormat('en-US').format(traffic.total)}</strong>
              {traffic.total ? (
                <svg className="spark" viewBox="0 0 29 21" preserveAspectRatio="none" aria-hidden="true"><path d={spark} /></svg>
              ) : (
                <span className="muted">page views, last 30 days</span>
              )}
            </a>
          </div>

          <div className="card vis-card">
            <ScoreDial siteId={site.id} score={vis.score} band={vis.band} size={128} />
            <div className="vis-next">
              <span className="stat-label">Visibility</span>
              {standing && standing.league.standings.length > 1 && (
                <a className="league-line" href={`${base}/visibility`}>
                  {lt.position(standing.me.rank)} {lt.of(standing.league.standings.length)} {standing.league.trade ? tradePlural(standing.league.trade) : 'businesses'} this week{standing.me.momentum ? ` · ${lt.move(standing.me.momentum)}` : ''}
                </a>
              )}
              {next ? (
                <>
                  <strong>Next: +{next.points} · {next.title}</strong>
                  <span className="muted small">{next.why}</span>
                  <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    <a className="btn btn-primary btn-sm" href={questLink(next)}>{next.sofie ? 'Ask Sofie' : 'Do it'}</a>
                    <a className="btn btn-ghost btn-sm" href={`${base}/visibility`}>All {vis.quests.length} opportunities</a>
                  </span>
                </>
              ) : (
                <strong>Every opportunity taken. Keep posting monthly to hold your score.</strong>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Latest messages</h3>
              <a className="small" href={`${base}/messages`}>See all</a>
            </div>
            {messages.length === 0 ? (
              <p className="muted small" style={{ margin: 0 }}>Nothing yet. When someone fills in your contact form, it lands here.</p>
            ) : (
              <ul className="mini-inbox">
                {messages.map((m) => (
                  <li key={m.id}>
                    <a href={`${base}/messages`}>
                      <strong>{m.name || 'Someone'}</strong>{!m.read && <span className="pill ok">New</span>}
                      <span className="muted">{m.body.slice(0, 80)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {lastSofie && (
            <div className="card sofie-card">
              <h3>Sofie’s last change</h3>
              <p className="small" style={{ margin: '0 0 8px' }}>{lastSofie.text.split('\n')[0].slice(0, 220)}</p>
              {sofie.draft ? <a className="btn btn-primary btn-sm" href={`${base}/sofie`}>Review and publish</a> : <span className="pill ok">Live</span>}
            </div>
          )}
        </div>
      </div>
      <Milestones siteId={site.id} siteName={b.name} domain={site.customDomain} isNew={!!isNew} items={marks} />
    </div>
  )
}
