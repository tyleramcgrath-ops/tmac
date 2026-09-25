import { notFound } from 'next/navigation'
import { pagePath } from '@/lib'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { changeLabel, dayString, daysBefore, summarizeVisits } from '@/lib/visits'

const fmt = new Intl.NumberFormat('en-US')
const dayLabel = (day: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' })

export default async function VisitorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const today = dayString(new Date())
  const [visits, pages] = await Promise.all([store.visitsSince(site.id, daysBefore(today, 59)), store.pagesForSite(site.id)])
  const s = summarizeVisits(visits, today)
  const names = new Map(pages.map((p) => [pagePath(p), p.post?.title ?? p.name]))
  const peak = Math.max(1, ...s.days.map((d) => d.views))
  const best = s.days.reduce((a, d) => (d.views > a.views ? d : a), s.days[0])
  const topMax = Math.max(1, ...s.pages.map((p) => p.views))
  const change = changeLabel(s.total, s.previous)

  return (
    <section className="stack">
      <div className="sec-head">
        <div>
          <h2>Visitors</h2>
          <p className="muted">Page views on your live website over the last 30 days. Counted without cookies or tracking scripts, so there’s no cookie banner and nothing slows your pages down.</p>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat-label">Last 30 days</span>
          <strong>{fmt.format(s.total)}</strong>
          <span className="muted">{change || 'page views'}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Today</span>
          <strong>{fmt.format(s.today)}</strong>
          <span className="muted">so far (UTC)</span>
        </div>
        <div className="stat">
          <span className="stat-label">Busiest day</span>
          <strong>{best.views ? fmt.format(best.views) : '–'}</strong>
          <span className="muted">{best.views ? dayLabel(best.day, { weekday: 'short', month: 'short', day: 'numeric' }) : 'no views yet'}</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Page views per day</h3>
          <span className="muted small">{dayLabel(s.days[0].day)} – {dayLabel(today)}</span>
        </div>
        {s.total === 0 ? (
          <div className="visits-empty">
            <p><strong>No visits counted yet.</strong></p>
            <p className="muted small">Counting starts the moment someone opens your live site. Share your address on Google, Facebook or your van, and they’ll show up here.</p>
          </div>
        ) : (
          <figure className="vchart" aria-label={`Page views per day. ${s.total} in total, most on ${dayLabel(best.day)}.`}>
            <span className="vchart-max" aria-hidden="true">{fmt.format(peak)}</span>
            <div className="vchart-bars">
              {s.days.map((d) => (
                <span key={d.day} className={d.day === today ? 'now' : undefined} title={`${dayLabel(d.day, { weekday: 'short', month: 'short', day: 'numeric' })}: ${d.views} view${d.views === 1 ? '' : 's'}`}>
                  <i style={{ height: d.views ? `max(3px, ${(d.views / peak) * 100}%)` : 0 }} />
                </span>
              ))}
            </div>
            <figcaption className="vchart-axis" aria-hidden="true">
              <span>{dayLabel(s.days[0].day)}</span>
              <span>{dayLabel(s.days[15].day)}</span>
              <span>Today</span>
            </figcaption>
          </figure>
        )}
      </div>

      {s.pages.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h3>Most viewed pages</h3>
            <span className="muted small">Last 30 days</span>
          </div>
          <ol className="top-pages">
            {s.pages.slice(0, 10).map((p) => (
              <li key={p.path}>
                <span className="tp-bar" style={{ width: `${(p.views / topMax) * 100}%` }} aria-hidden="true" />
                <span className="tp-name">{names.get(p.path) ?? p.path}<span className="muted"> {p.path}</span></span>
                <strong>{fmt.format(p.views)}</strong>
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className="muted small">Your own visits count too, and search engine bots are left out. Days run midnight to midnight UTC.</p>
    </section>
  )
}
