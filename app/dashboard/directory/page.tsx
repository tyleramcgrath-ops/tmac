import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { DIRECTORY_RANGES, NEXT, STARTED_VIA, directoryRows, filterRows, readDirectoryParams, tally, type DirectoryRow, type Next } from '@/lib/directory'
import { siteOrigin } from '@/lib/schema'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { dayString, daysBefore } from '@/lib/visits'

export const dynamic = 'force-dynamic'

const n = (x: number) => new Intl.NumberFormat('en-US').format(x)
const date = (iso: string) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }) : '—')
const TONE: Partial<Record<Next, string>> = { failed: 'bad', ending: 'warn', ended: 'warn', proof: 'warn', unpublished: 'warn', nosite: 'warn', star: 'ok' }

// Every site and every account (admins only): who made it, where the
// business is, how it started, and what it has done since, with the next
// step for each so the team knows who to contact first. lib/directory.
export default async function DirectoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser()
  if (!isAdmin(user.email)) notFound()
  const params = await searchParams
  const { range, filter } = readDirectoryParams(params)
  const since = daysBefore(dayString(new Date()), range.days)
  const raw = await getStore().directory(since)
  const { sites: all, noSite: signups } = directoryRows(raw)
  // The team's own accounts aren't customers.
  const noSite = signups.filter((u) => !isAdmin(u.email))
  const web = new Map(raw.sites.map((s) => [s.id, siteOrigin(s.site).replace(/^https:\/\//, '')]))
  const rows = filterRows(all, filter)
  const owners = new Set(all.map((r) => r.ownerId)).size
  const todo = [...all.filter((r) => r.next !== 'fine' && !isAdmin(r.ownerEmail)).map((r) => ({ who: r.business, sub: `${r.ownerName} · ${r.ownerEmail}`, next: r.next, priority: r.priority, key: r.siteId })), ...noSite.map((u) => ({ who: u.name, sub: u.email, next: u.next, priority: u.priority, key: u.id }))]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 12)
  const q = (extra: Record<string, string>) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ range: range.key, ...filter, ...extra })) if (v) p.set(k, v)
    return `?${p}`
  }
  const filtered = Object.values(filter).some(Boolean)
  const exportHref = `/dashboard/directory/export${q({})}`
  const options = (xs: { key: string; n: number }[]) => xs.map((x) => <option key={x.key} value={x.key}>{x.key} ({x.n})</option>)
  const states = tally(all, (r) => r.state)
  const types = tally(all, (r) => r.type)
  const vias = tally(all, (r) => r.startedVia)
  const statuses = tally([...all, ...noSite], (r) => r.status)

  return (
    <div className="stack directory">
      <div className="dash-head">
        <div>
          <p className="crumbs"><a href="/dashboard">My sites</a> / All sites</p>
          <h1>All sites</h1>
          <p className="muted" style={{ margin: 0 }}>Every site and who made it. Visits, calls and leads over {range.key === 'all' ? 'all time' : `the last ${range.label}`}.</p>
        </div>
        <nav className="launch-range" aria-label="Range">
          {DIRECTORY_RANGES.map((x) => <a key={x.key} href={q({ range: x.key })} aria-current={x.key === range.key ? 'page' : undefined}>{x.label}</a>)}
        </nav>
      </div>

      <div className="stats four">
        <div className="stat"><span className="stat-label">Sites</span><strong>{n(all.length)}</strong><span className="muted">{n(all.filter((r) => r.published > 0).length)} published</span></div>
        <div className="stat"><span className="stat-label">Accounts</span><strong>{n(owners + noSite.length)}</strong><span className="muted">{n(noSite.length)} with no site yet</span></div>
        <div className="stat"><span className="stat-label">Paying</span><strong>{n(statuses.find((s) => s.key === 'Paying')?.n ?? 0)}</strong><span className="muted">{n(statuses.find((s) => s.key === 'Free trial')?.n ?? 0)} on a free trial</span></div>
        <div className="stat"><span className="stat-label">States</span><strong>{n(states.length)}</strong><span className="muted">{states.slice(0, 3).map((s) => `${s.key} ${s.n}`).join(' · ') || '—'}</span></div>
      </div>

      {todo.length > 0 && (
        <section className="an-sec" aria-labelledby="dir-todo">
          <h2 id="dir-todo">Who to contact first</h2>
          <ol className="card dir-todo">
            {todo.map((t) => (
              <li key={t.key}><div><b>{t.who}</b><span className="muted">{t.sub}</span></div><span className={`pill ${TONE[t.next] ?? ''}`}>{NEXT[t.next]}</span></li>
            ))}
          </ol>
        </section>
      )}

      <section className="an-sec" aria-labelledby="dir-mix">
        <h2 id="dir-mix">Where they are and how they started</h2>
        <div className="dir-mix">
          <Mix title="By state" items={states} href={(k) => q({ state: k })} />
          <Mix title="By kind of business" items={types} href={(k) => q({ type: k })} />
          <Mix title="How they started" items={vias.map((v) => ({ ...v, label: STARTED_VIA[v.key as keyof typeof STARTED_VIA] }))} href={(k) => q({ via: k })} />
        </div>
      </section>

      <section className="an-sec" aria-labelledby="dir-all">
        <h2 id="dir-all">Every site</h2>
        <form className="dir-filters" method="get">
          <input type="hidden" name="range" value={range.key} />
          <label><span>Search</span><input name="q" defaultValue={filter.q} placeholder="Business, owner, email, city" /></label>
          <label><span>State</span><select name="state" defaultValue={filter.state}><option value="">All</option>{options(states)}</select></label>
          <label><span>Kind</span><select name="type" defaultValue={filter.type}><option value="">All</option>{options(types)}</select></label>
          <label><span>Started</span><select name="via" defaultValue={filter.via}><option value="">All</option>{vias.map((v) => <option key={v.key} value={v.key}>{STARTED_VIA[v.key as keyof typeof STARTED_VIA]} ({v.n})</option>)}</select></label>
          <label><span>Account</span><select name="status" defaultValue={filter.status}><option value="">All</option>{options(tally(all, (r) => r.status))}</select></label>
          <label><span>Next step</span><select name="next" defaultValue={filter.next}><option value="">All</option>{tally(all, (r) => r.next).map((x) => <option key={x.key} value={x.key}>{NEXT[x.key as Next]} ({x.n})</option>)}</select></label>
          <div className="dir-actions">
            <button className="btn btn-primary btn-sm" type="submit">Show</button>
            {filtered && <a className="btn btn-ghost btn-sm" href={q({ q: '', type: '', state: '', via: '', next: '', status: '' })}>Clear</a>}
            <a className="btn btn-ghost btn-sm" href={exportHref}>Download CSV</a>
          </div>
        </form>
        <p className="muted" style={{ margin: 0 }}>{n(rows.length)} of {n(all.length)} sites. The CSV has these rows with every column.</p>
        {rows.length === 0 ? (
          <p className="card muted">{all.length ? 'No sites match.' : 'No sites yet. They show up here the moment someone builds one.'}</p>
        ) : (
          <div className="card launch-table dir-table">
            <table>
              <thead>
                <tr><th>Business</th><th>Next step</th><th>Where</th><th>Owner</th><th>Account</th><th>Started</th><th className="num">Pages live</th><th className="num">Visits</th><th className="num">Calls</th><th className="num">Leads</th><th className="num">Sofie</th><th>Last edit</th></tr>
              </thead>
              <tbody>{rows.map((r) => <Row key={r.siteId} r={r} web={web.get(r.siteId) ?? ''} />)}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className="an-sec" aria-labelledby="dir-nosite">
        <h2 id="dir-nosite">Signed up, no site yet</h2>
        {noSite.length === 0 ? (
          <p className="card muted">Everyone who signed up has a site.</p>
        ) : (
          <div className="card launch-table">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Signed up</th><th>Account</th><th>Promo</th></tr></thead>
              <tbody>
                {noSite.map((u) => (
                  <tr key={u.id}><td>{u.name}</td><td className="dir-sel">{u.email}</td><td>{date(u.createdAt)}</td><td>{u.status}{u.trialDaysLeft != null && u.status === 'Free trial' ? `, ${u.trialDaysLeft} day${u.trialDaysLeft === 1 ? '' : 's'} left` : ''}</td><td>{u.promo || '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Row({ r, web }: { r: DirectoryRow; web: string }) {
  return (
    <tr>
      <td>
        <b>{r.business}</b>
        <span className="dir-sub">{r.type}{r.phone ? ` · ${r.phone}` : ''}</span>
        <a className="dir-sub" href={`https://${web}`} target="_blank" rel="noreferrer">{web}</a>
      </td>
      <td className="dir-next"><span className={`pill ${TONE[r.next] ?? ''}`}>{NEXT[r.next]}</span></td>
      <td>{[r.city, r.state].filter(Boolean).join(', ') || '—'}</td>
      <td>
        {r.ownerName}
        <span className="dir-sub dir-sel">{r.ownerEmail}</span>
        <span className="dir-sub">Joined {date(r.signedUp)}</span>
      </td>
      <td>
        {r.status}
        {r.trialDaysLeft != null && r.status === 'Free trial' && <span className="dir-sub">{r.trialDaysLeft} day{r.trialDaysLeft === 1 ? '' : 's'} left</span>}
        {r.plan && <span className="dir-sub">{r.plan}</span>}
        {r.promo && <span className="dir-sub">Code {r.promo}</span>}
      </td>
      <td>{STARTED_VIA[r.startedVia]}<span className="dir-sub">{date(r.createdAt)}</span>{r.ownership && <span className="dir-sub">{r.ownership}</span>}</td>
      <td className="num">{n(r.published)}/{n(r.pages)}</td>
      <td className="num">{n(r.views)}</td>
      <td className="num">{n(r.calls)}</td>
      <td className="num">{n(r.leads)}{r.leadsAll > r.leads && <span className="dir-sub">{n(r.leadsAll)} all time</span>}</td>
      <td className="num">{r.sofieChats ? `$${r.sofieSpend.toFixed(2)}` : '—'}{r.sofieChats > 0 && <span className="dir-sub">{n(r.sofieChats)} asks</span>}</td>
      <td>{date(r.updatedAt)}</td>
    </tr>
  )
}

function Mix({ title, items, href }: { title: string; items: { key: string; n: number; label?: string }[]; href: (key: string) => string }) {
  const max = Math.max(1, ...items.map((i) => i.n))
  return (
    <div className="card dir-mix-card">
      <h3>{title}</h3>
      {items.length === 0 ? <p className="muted">—</p> : (
        <ul>
          {items.slice(0, 8).map((i) => (
            <li key={i.key}><a href={href(i.key)}><span>{i.label ?? i.key}</span><b>{n(i.n)}</b></a><i style={{ width: `${(i.n / max) * 100}%` }} /></li>
          ))}
        </ul>
      )}
    </div>
  )
}
