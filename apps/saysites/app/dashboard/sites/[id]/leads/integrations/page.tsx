import { notFound } from 'next/navigation'
import { LeadsNav } from '@/components/LeadsNav'
import { INTEGRATIONS, INTEGRATION_INFO, type IntegrationKind } from '@/lib/crm-sync'
import { loadCrm } from '@/lib/leads'
import { requireUser } from '@/lib/session'
import { getStore } from '@/lib/store'
import { connectIntegration, disconnectIntegration, testIntegration } from '../actions'

const MARK: Record<IntegrationKind, string> = { hubspot: 'HS', salesforce: 'SF', pipedrive: 'PD', clio: 'CG', webhook: 'Z' }
const mask = (v: string) => (v.length > 8 ? `${v.slice(0, 4)}…${v.slice(-4)}` : '••••')

export default async function IntegrationsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ note?: string }> }) {
  const [{ id }, { note }] = await Promise.all([params, searchParams])
  const user = await requireUser()
  const store = getStore()
  const site = await store.siteForUser(user.id, id)
  if (!site) notFound()
  const state = await loadCrm(store, site.id)
  const bad = note?.startsWith('bad-') ? INTEGRATION_INFO[note.slice(4) as IntegrationKind] : undefined
  const on = note?.startsWith('on-') ? INTEGRATION_INFO[note.slice(3) as IntegrationKind] : undefined

  return (
    <section className="stack leads">
      <div className="sec-head">
        <div>
          <h2>Leads</h2>
          <p className="muted">Already use a CRM? Every new lead is sent there the moment it arrives, and stays here too.</p>
        </div>
      </div>
      <LeadsNav siteId={site.id} on="integrations" />
      {bad && <p className="notice bad">That doesn’t look like a {bad.name} {bad.fields[0].label.toLowerCase()}. Check it and try again.</p>}
      {on && <p className="notice good">{on.name} is connected. Press “Send a test lead” to see one arrive.</p>}

      <div className="int-grid">
        {INTEGRATIONS.map((k) => {
          const info = INTEGRATION_INFO[k]
          const int = state.integrations[k]
          return (
            <div key={k} className={`card int-card${int?.on ? ' is-on' : ''}`}>
              <div className="int-head">
                <span className={`int-mark int-${k}`} aria-hidden="true">{MARK[k]}</span>
                <div>
                  <h3>{info.name}</h3>
                  <span className="muted small">{int?.on ? 'Connected' : 'Not connected'}</span>
                </div>
              </div>
              <p className="muted small">{info.blurb}</p>
              {int?.on ? (
                <>
                  <dl className="lead-dl">
                    {info.fields.map((f) => (
                      <div key={f.key}><dt>{f.label}</dt><dd>{f.secret ? mask(int.config[f.key] ?? '') : int.config[f.key]}</dd></div>
                    ))}
                  </dl>
                  {int.last && <p className={`small int-last${int.last.ok ? '' : ' bad'}`}>{int.last.ok ? '✓' : '!'} {int.last.text} <span className="muted">{new Date(int.last.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span></p>}
                  <div className="int-actions">
                    <form action={testIntegration.bind(null, site.id, k)}><button className="btn btn-primary btn-sm" type="submit">Send a test lead</button></form>
                    <form action={disconnectIntegration.bind(null, site.id, k)}><button className="btn btn-ghost btn-sm" type="submit">Disconnect</button></form>
                  </div>
                </>
              ) : (
                <details className="int-connect">
                  <summary className="btn btn-ghost btn-sm">Connect {info.name.split(',')[0]}</summary>
                  <ol className="int-steps small">
                    {info.steps.map((s) => <li key={s}>{s}</li>)}
                  </ol>
                  <form action={connectIntegration.bind(null, site.id, k)} className="stack">
                    {info.fields.map((f) => (
                      <label key={f.key} className="field">
                        <span>{f.label}</span>
                        <input className="input" name={f.key} type={f.secret ? 'password' : 'text'} placeholder={f.hint} autoComplete="off" required maxLength={500} />
                      </label>
                    ))}
                    <div><button className="btn btn-primary btn-sm" type="submit">Connect</button></div>
                  </form>
                </details>
              )}
            </div>
          )
        })}
      </div>
      <p className="muted small">Keys are kept with your site and used only to send your leads. Disconnect any time.</p>
    </section>
  )
}
