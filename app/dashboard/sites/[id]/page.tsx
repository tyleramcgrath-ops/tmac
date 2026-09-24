import { notFound } from 'next/navigation'
import { checkPage, checkSpeed, renderPage } from '@/lib'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { liveUrl, previewPath } from '@/lib/urls'

export default async function SiteOverview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const [{ id }, { new: isNew }] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const [pages, messages, sofie] = await Promise.all([store.pagesForSite(site.id), store.messagesForSite(site.id, 4), store.sofieState(site.id)])

  // The same checks that gate publishing, summed up.
  const checks = pages.map((p) => ({ issues: checkPage(p, pages), speed: checkSpeed(renderPage(site, p, pages)) }))
  const errors = checks.reduce((n, c) => n + c.issues.filter((i) => i.severity === 'error').length, 0)
  const tips = checks.reduce((n, c) => n + c.issues.filter((i) => i.severity === 'warning').length, 0)
  const fast = checks.every((c) => c.speed.pass)
  const lastSofie = [...sofie.chat].reverse().find((t) => t.role === 'sofie' && t.changes?.length)
  const base = `/dashboard/sites/${site.id}`
  const b = site.business

  // A short setup checklist from what the site is still missing.
  const todo = [
    { done: !!b.phone, label: 'Add your phone number', href: `${base}/settings` },
    { done: !!b.hours?.length, label: 'Add your opening hours', href: `${base}/settings` },
    { done: !!b.address, label: 'Add your address for Google Maps', href: `${base}/settings` },
    { done: sofie.chat.length > 0, label: 'Make your first change with Sofie', href: `${base}/sofie` },
    { done: tips === 0 && errors === 0, label: 'Clear every SEO tip', href: `${base}/pages` },
  ]
  const doneCount = todo.filter((t) => t.done).length

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
          <div className="stats">
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
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Getting set up</h3>
              <span className="muted small">{doneCount} of {todo.length}</span>
            </div>
            <div className="meter" aria-hidden="true"><span style={{ width: `${(doneCount / todo.length) * 100}%` }} /></div>
            <ul className="todo">
              {todo.map((t) => (
                <li key={t.label} className={t.done ? 'done' : ''}>
                  <span className="tick" aria-hidden="true">{t.done ? '✓' : ''}</span>
                  {t.done ? <span>{t.label}</span> : <a href={t.href}>{t.label}</a>}
                </li>
              ))}
            </ul>
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
    </div>
  )
}
