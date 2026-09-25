import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { formatDate } from '@/lib/render'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { caps } from '@/lib/usage'
import { dayString, daysBefore } from '@/lib/visits'

export const dynamic = 'force-dynamic'

const RANGES = [
  { key: 'today', label: 'Today', days: 0 },
  { key: 'week', label: '7 days', days: 6 },
  { key: 'all', label: 'All time', days: -1 },
] as const

// The team's launch-day view: who signed up, what they built, what it cost.
// Only emails in SAYSITES_ADMIN_EMAILS can see it. Days are UTC.
export default async function LaunchStatsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const user = await requireUser()
  if (!isAdmin(user.email)) notFound()
  const { range: r } = await searchParams
  const range = RANGES.find((x) => x.key === r) ?? RANGES[0]
  const today = dayString(new Date())
  const since = range.days < 0 ? '2000-01-01' : daysBefore(today, range.days)
  const store = getStore()
  const [s, spend] = await Promise.all([store.launchStats(since), store.dayUsage(today)])
  const cap = caps().allDaily
  const share = Math.min(1, spend.micros / cap)
  const money = (micros: number) => `$${(micros / 1e6).toFixed(2)}`
  const n = (x: number) => new Intl.NumberFormat('en-US').format(x)
  const when = range.days < 0 ? 'in total' : range.key === 'today' ? 'today' : 'this week'

  return (
    <div className="narrow stack">
      <div className="dash-head">
        <div>
          <p className="crumbs"><a href="/dashboard">My sites</a> / Launch</p>
          <h1>Launch</h1>
          <p className="muted" style={{ margin: 0 }}>Live numbers. Refresh to update.</p>
        </div>
        <nav className="launch-range" aria-label="Range">
          {RANGES.map((x) => (
            <a key={x.key} href={`?range=${x.key}`} aria-current={x.key === range.key ? 'page' : undefined}>{x.label}</a>
          ))}
        </nav>
      </div>

      <div className="stats four">
        <div className="stat"><span className="stat-label">Signups {when}</span><strong>{n(s.usersSince)}</strong><span className="muted">{n(s.users)} accounts in total</span></div>
        <div className="stat"><span className="stat-label">From /birthday</span><strong>{n(s.birthday)}</strong><span className="muted">signed up with BIRTHDAY</span></div>
        <div className="stat"><span className="stat-label">Sites built {when}</span><strong>{n(s.sitesSince)}</strong><span className="muted">{n(s.sites)} in total</span></div>
        <div className="stat"><span className="stat-label">Paying</span><strong>{n(s.paying)}</strong><span className="muted">active subscriptions</span></div>
        <div className="stat"><span className="stat-label">Feedback {when}</span><strong>{n(s.feedbackSince)}</strong><span className="muted"><a href="/dashboard/feedback">{n(s.feedback)} in the inbox</a></span></div>
        <div className="stat"><span className="stat-label">Visitors to their sites</span><strong>{n(s.viewsSince)}</strong><span className="muted">page views {when}</span></div>
        <div className="stat"><span className="stat-label">Customers reached</span><strong>{n(s.callsSince + s.messagesSince)}</strong><span className="muted">{n(s.callsSince)} calls · {n(s.messagesSince)} messages</span></div>
        <div className="stat"><span className="stat-label">Sofie today</span><strong className={share >= 0.8 ? 'bad' : share >= 0.5 ? 'warn' : undefined}>{money(spend.micros)}</strong><span className="muted">{n(spend.messages)} requests · cap {money(cap)}</span></div>
      </div>

      <div className="card sofie-meter">
        <span className="stat-label">Today’s Sofie spend against the daily cap</span>
        <div className="meter"><i style={{ width: `${Math.round(share * 100)}%` }} /></div>
        <p className="muted small">
          {share >= 0.8
            ? 'Close to the cap. When it’s reached, Sofie pauses for everyone until midnight UTC. Raise SAYSITES_DAILY_AI_BUDGET in Vercel if signups are real.'
            : `${Math.round(share * 100)}% used. At the cap Sofie pauses for everyone until midnight UTC; sites stay live.`}
        </p>
      </div>

      <div className="card launch-card">
        <div className="card-head"><h3>Newest accounts</h3></div>
        {s.recent.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>No one yet.</p>
        ) : (
          <div className="launch-table">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Sites</th><th>Plan</th></tr></thead>
              <tbody>
                {s.recent.map((u) => (
                  <tr key={u.email}>
                    <td>{u.name}</td>
                    <td><a href={`mailto:${u.email}`}>{u.email}</a></td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>{u.sites}</td>
                    <td>{[u.status ?? 'trial', u.promo === 'BIRTHDAY' ? 'birthday' : '', u.reward ? '3 free months' : ''].filter(Boolean).join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
