import { notFound } from 'next/navigation'
import { SettingsForm } from '@/components/SettingsForm'
import { toWeek } from '@/lib/hours'
import { requireUser } from '@/lib/session'
import { DESIGN_GLOBALS, PALETTES } from '@/lib/starter'
import { getStore } from '@/lib/store'
import { liveUrl } from '@/lib/urls'
import { ActionForm } from '@/components/ActionForm'
import { deleteWebsite, saveSettings } from '../manage-actions'

const DESIGNS = [
  { key: 'bold', label: 'Bold', note: 'Big photo header, strong type. Great for trades.' },
  { key: 'editorial', label: 'Editorial', note: 'Serif headings, calm and refined.' },
  { key: 'warm', label: 'Warm', note: 'Soft cream, rounded, friendly.' },
]

export default async function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const site = await getStore().siteForUser(user.id, id)
  if (!site) notFound()
  const b = site.business
  const palette = Object.entries(PALETTES).find(([, p]) => p.colors.primary === site.globals.colors.primary)?.[0] ?? ''
  const design = Object.entries(DESIGN_GLOBALS).find(([, g]) => g.buttonShape === site.globals.buttonShape && g.fonts.heading === site.globals.fonts.heading)?.[0] ?? ''

  return (
    <section className="stack">
      <div className="sec-head">
        <div>
          <h2>Settings</h2>
          <p className="muted">Business details, hours and the look of your whole site.</p>
        </div>
      </div>
      <div className="settings-layout">
        <SettingsForm
          action={saveSettings.bind(null, site.id)}
          values={{
            name: b.name,
            phone: b.phone ?? '',
            email: b.email ?? '',
            street: b.address?.street ?? '',
            city: b.address?.city ?? '',
            region: b.address?.region ?? '',
            postalCode: b.address?.postalCode ?? '',
            tagline: site.tagline ?? '',
            topbar: site.header?.topbar ?? '',
            ctaLabel: site.header?.cta?.label ?? '',
            hasCta: !!site.header?.cta,
            week: toWeek(b.hours),
            palette,
            design,
          }}
          palettes={Object.entries(PALETTES).map(([key, p]) => ({ key, label: p.label, colors: [p.colors.primary, p.colors.secondary, p.colors.accent] }))}
          designs={DESIGNS}
        />
        <aside className="stack">
          <div className="card">
            <h3>Your web address</h3>
            <p className="url">{liveUrl(site).replace('https://', '')}</p>
            <p className="muted small">Every site gets a free saysites.com address.</p>
          </div>
          <div className="card">
            <h3>Use your own domain</h3>
            <p className="muted small">Already own a name like <strong>{site.subdomain.replace(/-/g, '')}.com</strong>? Point it here and your site moves over with its Google rankings intact.</p>
            <ol className="steps-sm">
              <li>At your domain company, add a <strong>CNAME</strong> record for <code>www</code> pointing to <code>cname.vercel-dns.com</code>.</li>
              <li>Add an <strong>A</strong> record for <code>@</code> pointing to <code>76.76.21.21</code>.</li>
            </ol>
            <p className="muted small">One-click domain connection, right here, is coming soon.</p>
          </div>
          <div className="card danger-zone">
            <h3>Delete this website</h3>
            <p className="muted small">Removes the site, its pages, Sofie history, messages and products. It can’t be undone.</p>
            <ActionForm action={deleteWebsite.bind(null, site.id)} submit="Delete website" danger>
              <label className="field"><span>Type <strong>{site.business.name}</strong> to confirm</span><input className="input" name="confirm" required autoComplete="off" /></label>
            </ActionForm>
          </div>
        </aside>
      </div>
    </section>
  )
}
