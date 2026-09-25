import { notFound } from 'next/navigation'
import { ScoreDial } from '@/components/ScoreDial'
import { checkPage, checkSpeed, renderPage } from '@/lib'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { questLink, visibility } from '@/lib/visibility'
import { dayString, daysBefore, summarizeVisits } from '@/lib/visits'

export default async function VisibilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const today = dayString(new Date())
  const [pages, media, visits] = await Promise.all([store.pagesForSite(site.id), store.mediaForSite(site.id), store.visitsSince(site.id, daysBefore(today, 59))])
  const checks = pages.map((p) => ({ issues: checkPage(p, pages), speed: checkSpeed(renderPage(site, p, pages)) }))
  const traffic = summarizeVisits(visits, today)
  const v = visibility({
    site,
    pages,
    seoErrors: checks.reduce((n, c) => n + c.issues.filter((i) => i.severity === 'error').length, 0),
    seoTips: checks.reduce((n, c) => n + c.issues.filter((i) => i.severity === 'warning').length, 0),
    fast: checks.every((c) => c.speed.pass),
    photos: media.filter((m) => m.mime !== 'image/svg+xml').length,
    visits30: traffic.total,
    visitsPrev30: traffic.previous,
    today,
  })
  const place = site.business.area ?? (site.business.address ? `${site.business.address.city}, ${site.business.address.region}` : '')
  const trade = site.business.schemaType === 'LocalBusiness' ? 'businesses like yours' : `${site.business.schemaType.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()}s`

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
          <span className="stat-label">Your league</span>
          <h3>{`${trade[0].toUpperCase()}${trade.slice(1)}`}{place ? ` · ${place}` : ''}</h3>
          <p className="muted small">Each Monday, see where you stand against {trade} on SaySites: ranked by momentum, not size, so a small business can top its league. Anonymous unless you choose to show your name.</p>
          <div className="league-seal" aria-hidden="true">
            <span>Opens soon</span>
          </div>
          <p className="small" style={{ margin: 0 }}>Every point you add this week counts toward your first standing.</p>
        </div>
      </div>

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
