import { notFound } from 'next/navigation'
import { DayBars } from '@/components/DayBars'
import { isAdmin } from '@/lib/admin'
import { fillDays, revenue, sum, type DayRow, type Metric } from '@/lib/analytics'
import { publishedArticles } from '@/lib/articles'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { dayString, daysBefore } from '@/lib/visits'

export const dynamic = 'force-dynamic'

const RANGES = [
  { key: '7', label: '7 days', days: 6 },
  { key: '30', label: '30 days', days: 29 },
  { key: '90', label: '90 days', days: 89 },
  { key: '365', label: '12 months', days: 364 },
] as const

const n = (x: number) => new Intl.NumberFormat('en-US').format(x)
const usd = (x: number) => `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: x % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(x)}`
const cents = (micros: number) => (micros > 0 && micros < 10_000 ? 'under $0.01' : `$${(micros / 1e6).toFixed(2)}`)
const PLAN: Record<string, string> = { site: 'Site', store: 'Store', law: 'Law firm', lawpro: 'Law firm, we build' }

// Everything about SaySites in one place, for the team: money, growth, our
// own leads, what customers' sites earn them, and what it all costs. Only
// emails in SAYSITES_ADMIN_EMAILS can see it. Days are UTC.
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const user = await requireUser()
  if (!isAdmin(user.email)) notFound()
  const { range: r } = await searchParams
  const range = RANGES.find((x) => x.key === r) ?? RANGES[1]
  const today = dayString(new Date())
  const since = daysBefore(today, range.days)
  const prevSince = daysBefore(since, range.days + 1)
  const store = getStore()
  const [raw, prevRaw, articles] = await Promise.all([store.analytics(since), store.analytics(prevSince), publishedArticles(store)])
  const rows = fillDays(raw.daily, since, today)
  const prev = fillDays(prevRaw.daily.filter((d) => d.day < since), prevSince, daysBefore(since, 1))
  const money = revenue(raw.billing)
  const days = rows.map((d) => d.day)
  const total = (m: Metric) => sum(rows, m)
  const aiSpend = total('aiMicros')

  const Stat = ({ label, m, note, format = n }: { label: string; m: Metric; note?: string; format?: (x: number) => string }) => <Tile label={label} value={total(m)} before={sum(prev, m)} note={note} format={format} />
  const Chart = ({ title, m, format }: { title: string; m: Metric; format?: (x: number) => string }) => (
    <figure className="an-chart">
      <figcaption><span>{title}</span><b>{(format ?? n)(total(m))}</b></figcaption>
      <DayBars days={days} values={rows.map((d) => d[m])} label={title} format={format} />
    </figure>
  )

  return (
    <div className="stack analytics">
      <div className="dash-head">
        <div>
          <p className="crumbs"><a href="/dashboard">My sites</a> / Analytics</p>
          <h1>Analytics</h1>
          <p className="muted" style={{ margin: 0 }}>Everything SaySites records, live. Compared with the {range.label} before. Days are UTC.</p>
        </div>
        <nav className="launch-range" aria-label="Range">
          {RANGES.map((x) => <a key={x.key} href={`?range=${x.key}`} aria-current={x.key === range.key ? 'page' : undefined}>{x.label}</a>)}
        </nav>
      </div>

      <section className="an-sec" aria-labelledby="an-money">
        <h2 id="an-money">Money</h2>
        <div className="stats four">
          <div className="stat"><span className="stat-label">Monthly revenue</span><strong>{usd(money.mrr)}</strong><span className="muted">from {n(money.paying)} paying account{money.paying === 1 ? '' : 's'}, at list prices</span></div>
          <div className="stat"><span className="stat-label">On a free trial</span><strong>{n(money.trial)}</strong><span className="muted">{n(money.comp)} comped</span></div>
          <div className="stat"><span className="stat-label">Payment failed</span><strong className={money.pastDue ? 'warn' : undefined}>{n(money.pastDue)}</strong><span className="muted">past due, still counted above</span></div>
          <div className="stat"><span className="stat-label">Canceled</span><strong>{n(money.canceled)}</strong><span className="muted">all time</span></div>
        </div>
        {money.plans.length > 0 && (
          <div className="card launch-table">
            <table>
              <thead><tr><th>Plan</th><th>Billed</th><th className="num">Accounts</th><th className="num">Monthly revenue</th></tr></thead>
              <tbody>{money.plans.map((p) => <tr key={`${p.plan}${p.interval}`}><td>{PLAN[p.plan] ?? p.plan}</td><td>{p.interval === 'year' ? 'Yearly' : 'Monthly'}</td><td className="num">{n(p.count)}</td><td className="num">{usd(Math.round(p.mrr * 100) / 100)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className="an-sec" aria-labelledby="an-growth">
        <h2 id="an-growth">Growth</h2>
        <div className="stats four">
          <Stat label="Signups" m="signups" note={`${n(raw.totals.users)} accounts in total`} />
          <Stat label="Sites built" m="sites" note={`${n(raw.totals.sites)} sites in total`} />
          <div className="stat"><span className="stat-label">Own domains</span><strong>{n(raw.totals.customDomains)}</strong><span className="muted">sites on their own address</span></div>
          <div className="stat"><span className="stat-label">Staff logins</span><strong>{n(raw.totals.members)}</strong><span className="muted">people invited by owners</span></div>
        </div>
        <div className="an-charts">
          <Chart title="Signups" m="signups" />
          <Chart title="Sites built" m="sites" />
        </div>
      </section>

      <section className="an-sec" aria-labelledby="an-ours">
        <h2 id="an-ours">Our own leads</h2>
        <div className="stats four">
          <Stat label="Let’s talk requests" m="talks" note="from the form on saysites.com" />
          <Stat label="Free redesigns" m="previews" note="previews people asked for" />
          <div className="stat"><span className="stat-label">Blog articles</span><strong>{n(articles.length)}</strong><span className="muted"><a href="/dashboard/blog">write one</a></span></div>
          <div className="stat"><span className="stat-label">Visitors to saysites.com</span><strong className="an-ext">Google Analytics</strong><span className="muted"><a href="https://analytics.google.com/" rel="noopener" target="_blank">open it ↗</a></span></div>
        </div>
        <div className="an-charts">
          <Chart title="Let’s talk requests" m="talks" />
          <Chart title="Free redesigns" m="previews" />
        </div>
        <p className="muted small"><a href="/dashboard/feedback">Read every Let’s talk request in the inbox</a>.</p>
      </section>

      <section className="an-sec" aria-labelledby="an-customers">
        <h2 id="an-customers">What customers’ sites bring in</h2>
        <div className="stats four">
          <Stat label="Visitors" m="views" note="page views, all customer sites" />
          <Stat label="Leads" m="leads" note="form requests" />
          <Stat label="Call taps" m="calls" note="taps on a phone number" />
          <div className="stat"><span className="stat-label">Per site</span><strong>{raw.totals.sites ? (Math.round(((total('leads') + total('calls')) / raw.totals.sites) * 10) / 10).toString() : '0'}</strong><span className="muted">leads and calls per site</span></div>
        </div>
        <div className="an-charts three">
          <Chart title="Visitors" m="views" />
          <Chart title="Leads" m="leads" />
          <Chart title="Call taps" m="calls" />
        </div>
        <div className="card launch-table">
          <div className="card-head"><h3>Top sites</h3><span className="muted small">most leads and calls</span></div>
          {raw.topSites.length === 0 ? (
            <p className="muted small" style={{ margin: 0 }}>No visits or leads in this range yet.</p>
          ) : (
            <table>
              <thead><tr><th>Site</th><th className="num">Leads</th><th className="num">Call taps</th><th className="num">Visitors</th></tr></thead>
              <tbody>{raw.topSites.map((s) => <tr key={s.id}><td>{s.name} <span className="muted small">{s.subdomain}.saysites.com</span></td><td className="num">{n(s.leads)}</td><td className="num">{n(s.calls)}</td><td className="num">{n(s.views)}</td></tr>)}</tbody>
            </table>
          )}
        </div>
      </section>

      <section className="an-sec" aria-labelledby="an-costs">
        <h2 id="an-costs">Costs</h2>
        <div className="stats four">
          <Stat label="Sofie (AI)" m="aiMicros" format={cents} note="model cost" />
          <div className="stat"><span className="stat-label">Share of revenue</span><strong>{money.mrr ? `${Math.round((aiSpend / 1e6 / (money.mrr * ((range.days + 1) / 30))) * 100)}%` : '–'}</strong><span className="muted">AI cost against revenue for the range</span></div>
        </div>
        <div className="an-charts">
          <Chart title="Sofie cost" m="aiMicros" format={cents} />
        </div>
        <p className="muted small">Hosting is a flat plan; Google lookups (SerpApi) are billed by that account. <a href="/dashboard/health">Hosting health</a> · <a href="/dashboard/launch">Launch stats</a></p>
      </section>

      <details className="card">
        <summary className="small">Every day, as a table</summary>
        <div className="launch-table an-days">
          <table>
            <thead><tr><th>Day</th><th className="num">Signups</th><th className="num">Sites</th><th className="num">Let’s talk</th><th className="num">Redesigns</th><th className="num">Visitors</th><th className="num">Leads</th><th className="num">Calls</th><th className="num">Sofie</th></tr></thead>
            <tbody>{[...rows].reverse().map((d: DayRow) => <tr key={d.day}><td>{d.day}</td><td className="num">{d.signups}</td><td className="num">{d.sites}</td><td className="num">{d.talks}</td><td className="num">{d.previews}</td><td className="num">{n(d.views)}</td><td className="num">{d.leads}</td><td className="num">{d.calls}</td><td className="num">{cents(d.aiMicros)}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

function Tile({ label, value, before, note, format }: { label: string; value: number; before: number; note?: string; format: (x: number) => string }) {
  const change = before ? Math.round(((value - before) / before) * 100) : null
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <strong>{format(value)}</strong>
      <span className="muted">
        {change === null ? (value ? 'new this period' : note) : `${change > 0 ? '+' : ''}${change}% vs before`}
        {change !== null && note ? `, ${note}` : ''}
      </span>
    </div>
  )
}
