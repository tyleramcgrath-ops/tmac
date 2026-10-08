import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { REPORT_MIN_SITES, hostOf, type Prospect } from '@/lib/prospects'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { addToCampaign, buildBatch, publishReport, togglePause, unpublishReport } from '../actions'

export const dynamic = 'force-dynamic'

const status = (p: Prospect) =>
  p.unsubscribedAt ? 'Unsubscribed' : p.claimedAt ? 'Claimed' : p.viewedAt ? `Opened${p.views && p.views > 1 ? ` ${p.views}×` : ''}` : p.error ? 'Couldn’t read the site' : !p.previewId ? 'Waiting to build' : p.noEmail ? 'Asks not to be emailed' : !p.email ? 'No email found' : 'In the email list'

export default async function CampaignPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ note?: string; added?: string }> }) {
  const user = await requireUser()
  if (!isAdmin(user.email)) notFound()
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const store = getStore()
  const c = (await store.campaigns()).find((x) => x.slug === slug)
  if (!c) notFound()
  const [prospects, report] = await Promise.all([store.prospects(slug), store.report(c.reportSlug ?? slug)])
  const measured = prospects.filter((p) => p.before).length
  const notes: Record<string, string> = {
    started: `Started. ${sp.added ?? 0} businesses added. Build their redesigns below, 25 at a time.`,
    building: 'Building the next 25 in the background. Refresh in a few minutes to see them.',
    added: `${sp.added ?? 0} businesses added.`,
    published: 'Published. The report is live.',
    report: `A report needs at least ${REPORT_MIN_SITES} measured sites.`,
  }

  return (
    <section className="stack">
      <div className="sec-head">
        <div>
          <p className="muted small"><a href="/dashboard/outreach">Outreach</a></p>
          <h2>{c.title}</h2>
          <p className="muted">{prospects.length} businesses{c.searched ? `, ${c.searched} found by search` : ''}. {c.paused ? 'Paused: nothing builds.' : `${prospects.filter((p) => !p.previewId && !p.error).length} waiting to be built.`}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <form action={buildBatch.bind(null, slug)}><button className="btn btn-primary btn-sm">Build the next 25</button></form>
          <form action={togglePause.bind(null, slug)}><button className="btn btn-ghost btn-sm">{c.paused ? 'Resume' : 'Pause'}</button></form>
          <a className="btn btn-ghost btn-sm" href={`/dashboard/outreach/${slug}/export`}>Download the email list</a>
        </div>
      </div>
      {sp.note && notes[sp.note] && <p className={`notice ${sp.note === 'report' ? 'bad' : 'good'}`}>{notes[sp.note]}</p>}

      <div className="card stack">
        <h3>City report</h3>
        {c.city ? (
          <>
            <p className="muted">Published under SaySites’ name: the numbers for every measured site together, and by name only the lightest ten sites. {measured} of {REPORT_MIN_SITES} measured sites needed{measured >= REPORT_MIN_SITES ? ', ready' : ''}.</p>
            {report?.publishedAt && <p>Live at <a href={`/reports/${report.slug}`}>/reports/{report.slug}</a>.</p>}
            <form action={publishReport.bind(null, slug)} className="stack">
              <label className="field"><span>Title</span><input className="input" name="title" defaultValue={report?.title ?? ''} maxLength={120} placeholder={`${c.trade} websites in ${c.city}`} /></label>
              <label className="field"><span>A short introduction (optional)</span><textarea className="input" name="intro" rows={3} defaultValue={report?.intro ?? ''} maxLength={1200} /></label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" disabled={measured < REPORT_MIN_SITES}>{report?.publishedAt ? 'Update with the latest numbers' : 'Publish the report'}</button>
              </div>
            </form>
            {report?.publishedAt && <form action={unpublishReport.bind(null, slug)}><button className="btn btn-ghost btn-sm">Unpublish</button></form>}
          </>
        ) : (
          <p className="muted">Reports need a city; this list was pasted without one.</p>
        )}
      </div>

      <div className="card">
        <h3>Businesses</h3>
        <div className="seo-table-wrap">
          <table className="seo-table">
            <thead><tr><th>Business</th><th>Email</th><th>Their page</th><th>Rebuilt</th><th>Status</th><th /></tr></thead>
            <tbody>
              {prospects.map((p) => (
                <tr key={p.id}>
                  <th>{p.name ?? hostOf(p.url)}<br /><span className="muted small">{hostOf(p.url)}</span></th>
                  <td>{p.email ?? '–'}</td>
                  <td>{p.before ? `${p.before.kb} KB, ${p.before.scripts} scripts` : '–'}</td>
                  <td>{p.after ? `${p.after.kb} KB` : '–'}</td>
                  <td>{status(p)}</td>
                  <td>{p.previewId && <a href={`/redesign/${p.previewId}`} target="_blank" rel="noopener">Preview</a>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form action={addToCampaign.bind(null, slug)} className="card stack">
        <h3>Add more businesses</h3>
        <textarea className="input" name="list" rows={3} placeholder={'smithlaw.com, jane@smithlaw.com, Smith Law'} />
        <div><button className="btn btn-ghost">Add</button></div>
      </form>
    </section>
  )
}
