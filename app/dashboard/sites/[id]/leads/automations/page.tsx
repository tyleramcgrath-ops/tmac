import { notFound } from 'next/navigation'
import { LeadsNav } from '@/components/LeadsNav'
import { fill, loadCrm, valuesFor } from '@/lib/leads'
import { mailReady } from '@/lib/mail'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { saveAutomations } from '../actions'

export default async function AutomationsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ note?: string }> }) {
  const [{ id }, { note }] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const { automations: a } = await loadCrm(store, site.id)
  const sample = valuesFor(site, { name: 'Jordan Ellis', email: 'jordan@example.com' })
  const ready = mailReady()

  return (
    <section className="stack leads">
      <div className="sec-head">
        <div>
          <h2>Leads</h2>
          <p className="muted">Answer every lead in seconds, even when you’re busy, and never let one slip.</p>
        </div>
      </div>
      <LeadsNav siteId={site.id} on="automations" />
      {note === 'saved' && <p className="notice good">Saved. New leads use these from now on.</p>}
      {!ready && <p className="notice">Automatic emails start once email is switched on for SaySites. You can set everything up now.</p>}

      <form action={saveAutomations.bind(null, site.id)} className="stack">
        <div className="card auto-card">
          <label className="auto-switch"><input type="checkbox" name="replyOn" defaultChecked={a.reply.on} /> <span><strong>Reply to every lead instantly</strong><span className="muted small">The moment someone sends a request, they get an email from {site.business.name} saying it arrived. Replies come to you.</span></span></label>
          <label className="field"><span>Subject</span><input className="input" name="replySubject" defaultValue={a.reply.subject} maxLength={200} /></label>
          <label className="field"><span>Message</span><textarea className="input" name="replyBody" rows={8} defaultValue={a.reply.body} maxLength={4000} /></label>
          <Preview subject={fill(a.reply.subject, sample)} body={fill(a.reply.body, sample)} />
        </div>

        <div className="card auto-card">
          <label className="auto-switch"><input type="checkbox" name="alertOn" defaultChecked={a.alert.on} /> <span><strong>Email me each new lead</strong><span className="muted small">Their message, email and phone number, and a link to the lead. Reply to that email and it goes straight to them.</span></span></label>
          <label className="field"><span>Send to</span><input className="input" name="alertTo" type="email" defaultValue={a.alert.to} placeholder={site.business.email || user.email} maxLength={200} /></label>
        </div>

        <div className="card auto-card">
          <label className="auto-switch"><input type="checkbox" name="remindOn" defaultChecked={a.remind.on} /> <span><strong>Remind me about leads I haven’t answered</strong><span className="muted small">If a lead is still marked New after this long, you get one reminder.</span></span></label>
          <label className="field field-inline"><span>After</span><input className="input" name="remindHours" type="number" min={1} max={72} defaultValue={a.remind.hours} /><span>hours</span></label>
        </div>

        <div className="card auto-card">
          <label className="auto-switch"><input type="checkbox" name="followOn" defaultChecked={a.followUp.on} /> <span><strong>Follow up with leads automatically</strong><span className="muted small">If you haven’t marked a lead Contacted after this many days, they get one follow-up email. Once you’ve been in touch, it never sends.</span></span></label>
          <label className="field field-inline"><span>After</span><input className="input" name="followDays" type="number" min={1} max={14} defaultValue={a.followUp.days} /><span>days</span></label>
          <label className="field"><span>Subject</span><input className="input" name="followSubject" defaultValue={a.followUp.subject} maxLength={200} /></label>
          <label className="field"><span>Message</span><textarea className="input" name="followBody" rows={7} defaultValue={a.followUp.body} maxLength={4000} /></label>
          <Preview subject={fill(a.followUp.subject, sample)} body={fill(a.followUp.body, sample)} />
        </div>

        <div className="card auto-card">
          <label className="auto-switch"><input type="checkbox" name="reviewOn" defaultChecked={a.review.on} /> <span><strong>Ask new clients for a review</strong><span className="muted small">When you mark a lead Won, they get one friendly email asking for a review, with your review link. One email per client, never more.</span></span></label>
          {!site.business.reviewUrl && <p className="notice">Add your review link on the <a href={`/dashboard/sites/${site.id}/reviews`}>Reviews</a> tab first. Until then, no review emails are sent.</p>}
          <label className="field field-inline"><span>After</span><input className="input" name="reviewDays" type="number" min={0} max={30} defaultValue={a.review.days} /><span>days</span></label>
          <label className="field"><span>Subject</span><input className="input" name="reviewSubject" defaultValue={a.review.subject} maxLength={200} /></label>
          <label className="field"><span>Message</span><textarea className="input" name="reviewBody" rows={8} defaultValue={a.review.body} maxLength={4000} /></label>
          <Preview subject={fill(a.review.subject, sample)} body={fill(a.review.body, { ...sample, review: sample.review || `${sample.website}/review` })} />
        </div>

        <div className="card auto-card">
          <label className="auto-switch"><input type="checkbox" name="reportOn" defaultChecked={a.report.on} /> <span><strong>Send me a monthly results email</strong><span className="muted small">On the 1st: last month’s leads, phone taps, visitors, how fast you answered, new clients, where leads came from and your SEO. Quiet months aren’t sent.</span></span></label>
          <p className="small" style={{ margin: 0 }}><a href={`/dashboard/sites/${site.id}/leads/report`}>See your report</a></p>
        </div>

        <p className="muted small">In your messages, {'{first}'} becomes their first name, {'{business}'} your business name, {'{phone}'} your phone number and {'{review}'} your review link. A line with nothing to fill in is left out.</p>
        <div><button className="btn btn-primary" type="submit">Save automations</button></div>
      </form>
    </section>
  )
}

function Preview({ subject, body }: { subject: string; body: string }) {
  return (
    <details className="auto-preview">
      <summary className="small">See it as a lead would</summary>
      <div className="auto-mail">
        <strong>{subject}</strong>
        <p>{body}</p>
      </div>
    </details>
  )
}
