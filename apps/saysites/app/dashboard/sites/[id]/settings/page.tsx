import { notFound } from 'next/navigation'
import { SettingsForm } from '@/components/SettingsForm'
import { toWeek } from '@/lib/hours'
import { requireUser } from '@/lib/session'
import { DESIGN_GLOBALS, PALETTES } from '@/lib/starter'
import { flairOf } from '@/lib/schema'
import { getStore } from '@/lib/store'
import { liveUrl } from '@/lib/urls'
import { ActionForm } from '@/components/ActionForm'
import { checkDomain, deleteWebsite, requestDomain, saveSettings } from '../manage-actions'
import { HOSTING_IP } from '@/lib/hosts'

const DESIGNS = [
  { key: 'bold', label: 'Bold', note: 'Big photo header, strong type. Great for trades.' },
  { key: 'editorial', label: 'Editorial', note: 'Serif headings, calm and refined.' },
  { key: 'warm', label: 'Warm', note: 'Soft cream, rounded, friendly.' },
]

const FLAIR_CHOICES = [
  { key: 'editorial', label: 'Editorial', note: 'Numbered sections, fine rules, photos that unveil as you scroll.' },
  { key: 'luxe', label: 'Luxe', note: 'Framed photos, gold-line headings, a slim reading bar.' },
  { key: 'soft', label: 'Soft', note: 'Arched photos, rounded cards, gentle fades.' },
  { key: 'bold', label: 'Bold', note: 'A slanted header, strong underlines, cards that slide in.' },
  { key: 'studio', label: 'Studio', note: 'Square photos that turn from black and white to colour.' },
  { key: 'clean', label: 'Clean', note: 'Simple and quiet. Lets your words lead.' },
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
            callBar: site.header?.callBar !== false,
            week: toWeek(b.hours),
            palette,
            design,
            flair: flairOf(site.globals),
            motion: site.globals.motion !== false,
          }}
          flairs={FLAIR_CHOICES}
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
            {site.customDomain ? (
              <p className="muted small">Connected. Your site lives at <strong>{site.customDomain}</strong>, and Google is told that’s its home.</p>
            ) : (
              <>
                <p className="muted small">Already own a name like <strong>{site.subdomain.replace(/-/g, '')}.com</strong>? Point it here and your site moves over.</p>
                <ActionForm action={requestDomain.bind(null, site.id)} submit={site.pendingDomain ? 'Change domain' : 'Use this domain'}>
                  <label className="field"><span>Your domain</span><input className="input" name="domain" placeholder="smithlaw.com" defaultValue={site.pendingDomain ?? ''} required autoComplete="off" /></label>
                </ActionForm>
                {site.pendingDomain && (
                  <>
                    <p className="muted small">At the company where you bought <strong>{site.pendingDomain}</strong>, open its DNS settings and add:</p>
                    <ol className="steps-sm">
                      <li>An <strong>A</strong> record for <code>@</code> pointing to <code>{HOSTING_IP}</code>.</li>
                      <li>A <strong>CNAME</strong> record for <code>www</code> pointing to <code>{site.subdomain}.saysites.com</code>.</li>
                    </ol>
                    <p className="muted small">Remove any other A or CNAME records for <code>@</code> and <code>www</code>. We add your domain’s security certificate within one working day; then press the button below.</p>
                    <ActionForm action={checkDomain.bind(null, site.id)} submit="Check my domain"><span /></ActionForm>
                  </>
                )}
              </>
            )}
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
