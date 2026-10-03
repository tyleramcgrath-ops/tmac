import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { hostingFolders, schedulerRuns } from '@/lib/hosting-health'
import { mailFrom, mailReady } from '@/lib/mail'
import { requireUser } from '@/lib/session'
import { cleanUpNow, sendTestEmail } from './actions'

export const dynamic = 'force-dynamic'

const n = (x: number) => new Intl.NumberFormat('en-US').format(x)
const when = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

// The team's view of the hosting account: what's using the file (inode)
// limit, whether email can be sent, and whether the scheduler is running.
// Only emails in SAYSITES_ADMIN_EMAILS can see it.
export default async function HealthPage({ searchParams }: { searchParams: Promise<{ mail?: string; pruned?: string }> }) {
  const user = await requireUser()
  if (!isAdmin(user.email)) notFound()
  const { mail, pruned } = await searchParams
  const { cwd, levels } = hostingFolders()
  const runs = schedulerRuns()

  return (
    <div className="narrow stack">
      <div className="dash-head">
        <div>
          <p className="crumbs"><a href="/dashboard">My sites</a> / Hosting health</p>
          <h1>Hosting health</h1>
          <p className="muted" style={{ margin: 0 }}>Live from the server. Refresh to update.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Email</h3><span className={`small ${mailReady() ? 'good-text' : 'muted'}`}>{mailReady() ? 'Set up' : 'Not set up'}</span></div>
        {mail === 'ok' && <p className="notice good">Sent to {user.email}. Check your inbox (and spam).</p>}
        {mail && mail !== 'ok' && <p className="notice bad">Not sent. The mail server said: {mail}</p>}
        <p className="muted small">{mailReady() ? `Lead emails go out from ${mailFrom()}.` : 'Add SMTP_USER and SMTP_PASS in SiteGround (Devs, Node.js, environment variables), then restart the app.'}</p>
        <form action={sendTestEmail}><button className="btn btn-primary btn-sm" type="submit" disabled={!mailReady()}>Send me a test email</button></form>
      </div>

      <div className="card">
        <div className="card-head"><h3>Scheduler</h3><span className="muted small">Every 10 minutes</span></div>
        {runs.length ? (
          <ul className="report-list">
            {[...runs].reverse().map((r) => <li key={r.at}><span>{when(r.at)}</span><b>{r.error ? `Error: ${r.error}` : `${r.sent} email${r.sent === 1 ? '' : 's'} sent`}</b></li>)}
          </ul>
        ) : <p className="muted small">No run yet since the last restart. The first one is 10 minutes after the app starts.</p>}
      </div>

      <div className="card">
        <div className="card-head"><h3>Files on the server</h3><span className="muted small">SiteGround counts every file and folder</span></div>
        {pruned !== undefined && <p className="notice good">Cleanup removed {pruned} old release folder{pruned === '1' ? '' : 's'}.</p>}
        <p className="muted small">Running from <code>{cwd}</code>. The biggest folders are listed first; “running” is the live app.</p>
        {levels.map((l) => (
          <div key={l.path} className="health-level">
            <h4><code>{l.path}</code></h4>
            <ul className="report-list">
              {l.folders.map((f) => (
                <li key={f.path}><span><code>{f.name}</code>{f.current ? ' (running)' : ''}</span><b>{f.capped ? 'over ' : ''}{n(f.inodes)}</b></li>
              ))}
            </ul>
          </div>
        ))}
        <form action={cleanUpNow}><button className="btn btn-ghost btn-sm" type="submit">Remove old releases now</button></form>
        <p className="muted small">Removes old app copies beside the running one, keeping the one before it. SiteGround’s Builds History is separate: clear it in Site Tools if the file limit is close.</p>
      </div>
    </div>
  )
}
