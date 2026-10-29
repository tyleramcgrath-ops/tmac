// A site the SaySites team built for a client. They look it over, ask for
// changes, or approve it: it then moves to their own account.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ActionForm } from '@/components/ActionForm'
import { MarketingShell } from '@/components/MarketingShell'
import { PLAN_NAMES, PRICES } from '@/lib/billing'
import { getStore } from '@/lib/store'
import { APPROVE_CODE, approvePath } from '@/lib/urls'
import { requestChanges } from '../actions'
import '../../home.css'

export const metadata: Metadata = { title: 'Your new website', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function ApprovePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  if (!APPROVE_CODE.test(code)) notFound()
  const site = await getStore().siteByHandoff(code)
  if (!site?.handoff) notFound()
  const plan = site.handoff.plan
  const src = `/approve/${code}/site`
  return (
    <MarketingShell closing={false}>
      <section className="page-hero redesign-hero">
        <div className="wrap">
          <p className="kicker">Ready for you to look over</p>
          <h1>Here’s the new website for {site.business.name}.</h1>
          <p>Click around every page. If anything needs changing, tell us below and we will send you this same link again. When you are happy, approve it and it becomes yours.</p>
          <div className="ind-actions">
            <a className="b b-dark" href={approvePath(code)}>Approve my website</a>
            <a className="tplrow-link" href={src} target="_blank" rel="noopener">Open it full screen</a>
          </div>
        </div>
      </section>

      <section className="ind-sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="frame redesign-frame">
            <div className="frame-bar"><i /><i /><i /><span>{site.business.name}</span></div>
            <iframe src={src} title={`The new website for ${site.business.name}`} />
          </div>
        </div>
      </section>

      <section className="ind-sec ind-alt">
        <div className="wrap ind-two">
          <div>
            <p className="kicker">Something to change?</p>
            <h2>Tell us, in your own words.</h2>
            <p>Wording, photos, a page you want added, anything. We make the changes and send you the link again.</p>
            <ActionForm action={requestChanges.bind(null, code)} submit="Send my notes">
              <label className="field"><span>Your name</span><input className="input" name="name" maxLength={80} autoComplete="name" /></label>
              <label className="field"><span>Your email</span><input className="input" name="email" type="email" maxLength={200} autoComplete="email" /></label>
              <label className="field"><span>What would you like changed?</span><textarea className="input" name="notes" rows={6} required /></label>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />
            </ActionForm>
          </div>
          <div className="ind-seo">
            <div><h3>Approve it when you’re happy</h3><p>You create your login, the website moves to your account and you can see and change everything in it.</p></div>
            <div><h3>{PLAN_NAMES[plan]}, ${PRICES[plan].month} a month</h3><p>Hosting, your domain, SEO, security and updates are included. No contract.</p></div>
            <div><h3>Nothing goes live until you say so</h3><p>Your current website stays exactly as it is until your domain points to the new one.</p></div>
            <div><a className="b b-dark" href={approvePath(code)}>Approve my website</a></div>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
