import type { Metadata } from 'next'
import { Panel } from '@/components/admin/ui'
import { hasDb } from '@/lib/admin/db'
import { ga4Configured, googleConfigured, gscConfigured, serviceEmail } from '@/lib/admin/google'
import { mailConfigured } from '@/lib/admin/mail'
import { indexNowKey } from '@/lib/admin/seo'

export const metadata: Metadata = { title: 'Settings' }

const Dot = ({ on }: { on: boolean }) => <span className={`ad-dot ${on ? 'on' : ''}`}>{on ? 'Connected' : 'Not set up'}</span>

export default function Settings() {
  const svc = serviceEmail()
  const items = [
    {
      name: 'Database (leads + traffic)', on: hasDb(), env: ['DATABASE_URL'],
      how: <>Use a PostgreSQL connection string. The SaySites database works: copy its <code>DATABASE_URL</code> into this app. LawMatchNow&apos;s tables all start with <code>lmn_</code> and create themselves.</>,
    },
    {
      name: 'Lead emails', on: mailConfigured() && !!process.env.LEAD_EMAIL_TO, env: ['LEAD_EMAIL_TO', 'SMTP_USER', 'SMTP_PASS', 'SMTP_HOST', 'SMTP_PORT', 'MAIL_FROM'],
      how: <>Create a mailbox in SiteGround (e.g. <code>leads@lawmatchnow.com</code>) and set <code>SMTP_USER</code>/<code>SMTP_PASS</code> to it; <code>SMTP_HOST</code> is usually <code>mail.lawmatchnow.com</code>, port 465. <code>LEAD_EMAIL_TO</code> is where alerts go (comma-separate several). Visitors also get an automatic confirmation; set <code>LEAD_AUTOREPLY=off</code> to stop that. Resend still works instead of SMTP via <code>RESEND_API_KEY</code>.</>,
    },
    {
      name: 'Webhook / CRM', on: !!process.env.LEAD_WEBHOOK_URL, env: ['LEAD_WEBHOOK_URL'],
      how: <>Optional. Every lead is POSTed here as JSON: use a Zapier or Make &quot;catch hook&quot; URL to send leads to Google Sheets, HubSpot, Clio Grow, Slack, text messages and more.</>,
    },
    {
      name: 'Google Analytics + Search Console', on: googleConfigured(), env: ['GOOGLE_SERVICE_ACCOUNT_JSON', 'GA4_PROPERTY_ID', 'GSC_SITE_URL'],
      how: (
        <ol>
          <li>In <a href="https://console.cloud.google.com/" target="_blank" rel="noopener">Google Cloud Console</a>, create a project, enable the <b>Google Analytics Data API</b> and the <b>Google Search Console API</b>.</li>
          <li>Create a <b>service account</b>, add a JSON key, and paste the whole JSON file as <code>GOOGLE_SERVICE_ACCOUNT_JSON</code>.</li>
          <li>Google Analytics → Admin → Property access management: add the service account&apos;s email as a <b>Viewer</b>. Put the numeric <b>Property ID</b> (Admin → Property details) in <code>GA4_PROPERTY_ID</code>.</li>
          <li>Search Console → Settings → Users and permissions: add the same email with <b>Full</b> permission (needed to submit sitemaps). Set <code>GSC_SITE_URL</code> to <code>sc-domain:lawmatchnow.com</code> (or the exact URL-prefix property).</li>
        </ol>
      ),
      extra: svc ? <>Service account: <code>{svc}</code> · Analytics {ga4Configured() ? 'ready' : 'needs GA4_PROPERTY_ID'} · Search Console {gscConfigured() ? 'ready' : 'needs GSC_SITE_URL'}</> : null,
    },
    {
      name: 'IndexNow', on: !!indexNowKey(), env: ['INDEXNOW_KEY'],
      how: <>Any random 32-character string of letters and numbers. The site serves it at <code>/indexnow-key.txt</code> so Bing can verify you.</>,
    },
    {
      name: 'PageSpeed API key', on: !!process.env.PAGESPEED_API_KEY, env: ['PAGESPEED_API_KEY'],
      how: <>Optional. Tests work without it, but a free key from Google Cloud (PageSpeed Insights API) avoids rate limits.</>,
    },
  ]
  return (
    <>
      <div className="ad-head"><div><div className="eyebrow">Setup</div><h1>Settings</h1></div></div>
      <p className="muted">Add these in SiteGround: Site Tools → Devs → Node.js → your app → Environment variables, then restart the app.</p>
      <div className="ad-grid">
        {items.map((i) => (
          <Panel key={i.name} title={i.name} actions={<Dot on={i.on} />} wide>
            <div className="ad-how">{i.how}</div>
            {i.extra && <p className="muted">{i.extra}</p>}
            <p className="muted">Variables: {i.env.map((e) => <code key={e}>{e} </code>)}</p>
          </Panel>
        ))}
      </div>
    </>
  )
}
