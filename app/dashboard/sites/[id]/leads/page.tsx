import { notFound } from 'next/navigation'
import { LeadsNav } from '@/components/LeadsNav'
import { INTEGRATIONS } from '@/lib/crm-sync'
import { STAGES, STAGE_HINT, STAGE_LABEL, leadStats, loadCrm, type Stage } from '@/lib/leads'
import { mailReady } from '@/lib/mail'
import { requireUser } from '@/lib/session'
import { getStore, type Message } from '@/lib/store'
import { previewPath } from '@/lib/urls'
import { moveLead } from './actions'

const NEXT: Partial<Record<Stage, Stage>> = { new: 'contacted', contacted: 'booked', booked: 'won' }
const NEXT_LABEL: Partial<Record<Stage, string>> = { new: 'Mark contacted', contacted: 'Mark booked', booked: 'Mark won' }

export default async function LeadsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string; stage?: string; q?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = `${today.slice(0, 7)}-01`
  const [messages, state, calls] = await Promise.all([store.messagesForSite(site.id), loadCrm(store, site.id), store.callsSince(site.id, monthStart)])
  const stats = leadStats(messages, state, monthStart)
  const stageOf = (m: Message): Stage => state.leads[m.id]?.stage ?? 'new'
  const q = (sp.q ?? '').trim().toLowerCase()
  const shown = messages.filter((m) => !q || `${m.name} ${m.email} ${m.phone} ${m.body}`.toLowerCase().includes(q))
  const list = sp.view === 'list'
  const stage = (STAGES as readonly string[]).includes(sp.stage ?? '') ? (sp.stage as Stage) : null
  const base = `/dashboard/sites/${site.id}/leads`
  const connected = INTEGRATIONS.filter((k) => state.integrations[k]?.on)
  const due = messages.filter((m) => {
    const f = state.leads[m.id]?.followUpOn
    return f && f <= today && !['won', 'lost'].includes(stageOf(m))
  })

  return (
    <section className="stack leads">
      <div className="sec-head">
        <div>
          <h2>Leads</h2>
          <p className="muted">Every request your website brings in, from first message to new client.</p>
        </div>
        {messages.length > 0 && <a className="btn btn-ghost btn-sm" href={`${base}/export`}>Download as a spreadsheet</a>}
      </div>
      <LeadsNav siteId={site.id} on="pipeline" />

      <div className="stats lead-stats">
        <div className="stat">
          <span className="stat-label">This month</span>
          <strong>{stats.thisMonth}</strong>
          <span className="muted">lead{stats.thisMonth === 1 ? '' : 's'}, plus {calls} call tap{calls === 1 ? '' : 's'}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Waiting on you</span>
          <strong className={stats.byStage.new ? 'warn' : 'good'}>{stats.byStage.new}</strong>
          <span className="muted">{stats.byStage.new ? 'not answered yet' : 'all answered'}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Time to answer</span>
          <strong>{stats.responseMins === null ? '–' : fmtMins(stats.responseMins)}</strong>
          <span className="muted">typical, first contact</span>
        </div>
        <div className="stat">
          <span className="stat-label">Became clients</span>
          <strong>{stats.byStage.won}</strong>
          <span className="muted">{stats.winRate === null ? 'none decided yet' : `${stats.winRate}% of decided leads`}</span>
        </div>
      </div>

      {(!mailReady() || connected.length === 0) && messages.length > 0 && (
        <div className="card leads-tip">
          <p className="small" style={{ margin: 0 }}>
            {!mailReady() ? 'Automatic replies and alerts start once email is switched on for SaySites. ' : ''}
            {connected.length === 0 ? <>Use HubSpot, Salesforce or another CRM? <a href={`${base}/integrations`}>Send every lead there automatically</a>.</> : null}
          </p>
        </div>
      )}

      {due.length > 0 && (
        <div className="card">
          <div className="card-head"><h3>Follow up today</h3><span className="muted small">{due.length}</span></div>
          <ul className="lead-rows">
            {due.map((m) => <LeadRow key={m.id} m={m} stage={stageOf(m)} base={base} />)}
          </ul>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="card empty">
          <h3>No leads yet</h3>
          <p className="muted">Every request form on your site sends its leads here. Try one yourself to see how it works.</p>
          <a className="btn btn-ghost" href={`${previewPath(site)}/contact`} target="_blank" rel="noopener">Open my Contact page ↗</a>
        </div>
      ) : (
        <>
          <div className="leads-bar">
            <form className="leads-search" role="search">
              {list && <input type="hidden" name="view" value="list" />}
              <label className="sr-only" htmlFor="lead-q">Search leads</label>
              <input className="input" id="lead-q" name="q" type="search" defaultValue={sp.q ?? ''} placeholder="Search by name, email, phone or words" />
            </form>
            <div className="seg" role="group" aria-label="View">
              <a href={`${base}${q ? `?q=${encodeURIComponent(q)}` : ''}`} aria-current={!list ? 'page' : undefined}>Board</a>
              <a href={`${base}?view=list${q ? `&q=${encodeURIComponent(q)}` : ''}`} aria-current={list ? 'page' : undefined}>List</a>
            </div>
          </div>

          {list ? (
            <div className="card">
              <div className="chips" role="group" aria-label="Filter by stage">
                <a href={`${base}?view=list`} aria-current={!stage ? 'page' : undefined}>All {messages.length}</a>
                {STAGES.map((s) => (
                  <a key={s} href={`${base}?view=list&stage=${s}`} aria-current={stage === s ? 'page' : undefined}>{STAGE_LABEL[s]} {stats.byStage[s]}</a>
                ))}
              </div>
              <ul className="lead-rows">
                {shown.filter((m) => !stage || stageOf(m) === stage).map((m) => <LeadRow key={m.id} m={m} stage={stageOf(m)} base={base} />)}
              </ul>
            </div>
          ) : (
            <div className="lead-board">
              {STAGES.filter((s) => s !== 'lost').map((s) => {
                const col = shown.filter((m) => stageOf(m) === s)
                return (
                  <section key={s} className={`lead-col lead-col-${s}`} aria-label={STAGE_LABEL[s]}>
                    <header>
                      <h3>{STAGE_LABEL[s]} <span className="muted">{col.length}</span></h3>
                      <span className="muted small">{STAGE_HINT[s]}</span>
                    </header>
                    {col.slice(0, 30).map((m) => (
                      <article key={m.id} className={`lead-card${m.read ? '' : ' unread'}`}>
                        <a className="lead-card-main" href={`${base}/${m.id}`}>
                          <strong>{m.name || 'Someone'}</strong>
                          <span className="lead-snip">{m.body.slice(0, 110)}</span>
                          <span className="muted small">{when(m.createdAt)}{m.page !== '/' ? ` · ${m.page}` : ''}</span>
                        </a>
                        {NEXT[s] && (
                          <form action={moveLead.bind(null, site.id, m.id)}>
                            <input type="hidden" name="stage" value={NEXT[s]} />
                            <input type="hidden" name="from" value="board" />
                            <button className="btn btn-ghost btn-sm" type="submit">{NEXT_LABEL[s]}</button>
                          </form>
                        )}
                      </article>
                    ))}
                    {col.length > 30 && <a className="small" href={`${base}?view=list&stage=${s}`}>See all {col.length}</a>}
                  </section>
                )
              })}
            </div>
          )}
          {!list && stats.byStage.lost > 0 && <p className="muted small"><a href={`${base}?view=list&stage=lost`}>{stats.byStage.lost} marked Lost</a></p>}
        </>
      )}
    </section>
  )
}

function LeadRow({ m, stage, base }: { m: Message; stage: Stage; base: string }) {
  return (
    <li className={m.read ? undefined : 'unread'}>
      <a href={`${base}/${m.id}`}>
        <strong>{m.name || 'Someone'}</strong>
        <span className="lead-snip">{m.body.slice(0, 120)}</span>
        <span className={`lead-stage lead-stage-${stage}`}>{STAGE_LABEL[stage]}</span>
        <time className="muted small" dateTime={m.createdAt}>{when(m.createdAt)}</time>
      </a>
    </li>
  )
}

function fmtMins(mins: number): string {
  if (mins < 60) return `${mins} min`
  const h = Math.round(mins / 60)
  return h < 48 ? `${h} h` : `${Math.round(h / 24)} days`
}

function when(iso: string): string {
  const d = new Date(iso)
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

