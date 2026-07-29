'use client'

// Connect Google — Search Console + Analytics. Real OAuth (lib/foundation/
// oauth/google.ts + the /api/oauth/google/callback, .../integrations* routes),
// not a simulated toggle: clicking Connect genuinely navigates to Google's
// consent screen, and once granted, the Morning Brief / analytics endpoints
// start reading real data instead of their honest "not connected" fallback.
// `configured` (no GOOGLE_CLIENT_ID/SECRET on this deployment) is checked so
// the button is never shown if it would just dead-end.

import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError, type IntegrationDTO, type WpConnectionDTO } from '../../lib/client'

const LABEL: Record<IntegrationDTO['kind'], string> = {
  'search-console': 'Google Search Console',
  analytics: 'Google Analytics',
}

export default function IntegrationsPanel({
  projectId,
  onGoogleReturn,
}: {
  projectId: string | null
  // Called (in addition to setting the notice below) the moment a ?google=
  // round-trip is detected, so the parent can summon the HUD and open this
  // drawer even if the page reloaded straight to a sleeping room — see
  // PanelHost.tsx's handleGoogleReturn.
  onGoogleReturn?: () => void
}) {
  const [integrations, setIntegrations] = useState<IntegrationDTO[] | null>(null)
  const [configured, setConfigured] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const [sites, setSites] = useState<{ siteUrl: string; permissionLevel: string }[] | null>(null)

  const [wp, setWp] = useState<WpConnectionDTO | null | undefined>(undefined)
  const [wpNotice, setWpNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const [wpForm, setWpForm] = useState({ siteUrl: '', username: '', appPassword: '' })
  const [wpBusy, setWpBusy] = useState(false)

  const load = async () => {
    if (!projectId) return
    try {
      const res = await api.listIntegrations(projectId)
      setIntegrations(res.integrations)
      setConfigured(res.configured)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load integrations.')
    }
    try {
      const res = await api.getWordpress(projectId)
      setWp(res.connection)
    } catch {
      setWp(null)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // Surface the Google OAuth round-trip result (?google=connected|error — see
  // app/api/oauth/google/callback/route.ts's backTo()).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const g = params.get('google')
    if (!g) return
    if (g === 'connected') setNotice({ ok: true, text: 'Google connected — Search Console & Analytics are now live.' })
    else setNotice({ ok: false, text: `Google connection failed: ${params.get('reason') ?? 'unknown error'}` })
    onGoogleReturn?.()
    const url = new URL(window.location.href)
    ;['google', 'reason'].forEach((k) => url.searchParams.delete(k))
    window.history.replaceState({}, '', url.toString())
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const gsc = integrations?.find((i) => i.kind === 'search-console')
  const analytics = integrations?.find((i) => i.kind === 'analytics')

  async function connect() {
    if (!projectId) return
    setBusy('connect')
    setError('')
    try {
      const { url } = await api.startGoogleConnect(projectId, 'all')
      window.location.href = url
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start the Google connection.')
      setBusy(null)
    }
  }

  async function disconnect(kind: 'search-console' | 'analytics') {
    if (!projectId) return
    setBusy(kind)
    try {
      await api.disconnectIntegration(projectId, kind)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not disconnect.')
    } finally {
      setBusy(null)
    }
  }

  async function loadSites() {
    if (!projectId) return
    setBusy('sites')
    try {
      const res = await api.listGoogleSearchConsoleSites(projectId)
      setSites(res.sites)
      if (res.error) setError(res.error)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not list Search Console properties.')
    } finally {
      setBusy(null)
    }
  }

  async function connectWp(e: FormEvent) {
    e.preventDefault()
    if (!projectId) return
    setWpBusy(true)
    setWpNotice(null)
    try {
      const res = await api.connectWordpress(projectId, wpForm)
      setWp(res.connection)
      setWpForm({ siteUrl: '', username: '', appPassword: '' })
      setWpNotice({ ok: true, text: `Connected to ${res.connection.siteUrl}${res.connection.seoPlugin ? ` — detected ${res.connection.seoPlugin}` : ''}.` })
    } catch (err) {
      setWpNotice({ ok: false, text: err instanceof ApiError ? err.message : 'Could not connect to WordPress.' })
    } finally {
      setWpBusy(false)
    }
  }

  async function disconnectWp() {
    if (!projectId) return
    setWpBusy(true)
    setWpNotice(null)
    try {
      await api.disconnectWordpress(projectId)
      setWp(null)
    } catch (err) {
      setWpNotice({ ok: false, text: err instanceof ApiError ? err.message : 'Could not disconnect WordPress.' })
    } finally {
      setWpBusy(false)
    }
  }

  async function pickSite(siteUrl: string) {
    if (!projectId) return
    setBusy('pick')
    try {
      await api.setIntegrationResource(projectId, 'search-console', siteUrl)
      await load()
      setSites(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not set the Search Console property.')
    } finally {
      setBusy(null)
    }
  }

  if (!projectId) {
    return (
      <>
        <p className="ns-panel-eyebrow">Integrations</p>
        <h2>No project yet.</h2>
      </>
    )
  }

  return (
    <div>
      <div className="ns-panel-head">
        <p className="ns-panel-eyebrow">Integrations</p>
        <p className="ns-panel-status">{gsc?.status === 'connected' || analytics?.status === 'connected' ? 'Live' : 'Not connected'}</p>
      </div>
      <h2>Connect Google</h2>
      <p className="ns-panel-body">
        Search Console and Analytics feed the Morning Briefing with your real ranking, click, and traffic data —
        read-only, nothing is ever written back to your Google account.
      </p>

      {notice && (
        <p className={`ns-integ-notice${notice.ok ? '' : ' err'}`} role="status" aria-live="polite">
          {notice.text}
          {!notice.ok && configured && (
            <button type="button" className="ns-integ-btn ns-integ-retry" disabled={busy === 'connect'} onClick={connect}>
              {busy === 'connect' ? 'Retrying…' : 'Retry'}
            </button>
          )}
        </p>
      )}
      {error && <p className="ns-integ-notice err" role="alert">{error}</p>}

      {!configured ? (
        <p className="ns-integ-notice">Google connection isn&rsquo;t configured on this deployment yet (needs GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).</p>
      ) : (
        <>
          <hr className="ns-panel-divider" />
          <ul className="ns-row-list">
            {([gsc, analytics].filter(Boolean) as IntegrationDTO[]).map((i) => (
              <li key={i.kind} className="ns-row" data-status={i.status === 'connected' ? 'completed' : i.status === 'error' ? 'failed' : undefined}>
                <span className="ns-row-dot" aria-hidden />
                <span className="ns-row-text">
                  <span className="ns-row-title">{LABEL[i.kind]}</span>
                  <span className="ns-row-desc">
                    {i.status === 'connected' ? `Connected${i.accountEmail ? ` as ${i.accountEmail}` : ''}${i.resourceId ? ` — ${i.resourceId}` : ''}` : i.detail}
                  </span>
                </span>
                {i.status === 'connected' && (
                  <button type="button" className="ns-integ-btn" disabled={busy === i.kind} onClick={() => disconnect(i.kind)}>
                    {busy === i.kind ? '…' : 'Disconnect'}
                  </button>
                )}
              </li>
            ))}
          </ul>

          {(!gsc || gsc.status !== 'connected') && (!analytics || analytics.status !== 'connected') && (
            <div className="ns-onboard-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="ns-onboard-primary" disabled={busy === 'connect'} onClick={connect}>
                {busy === 'connect' ? 'Connecting…' : 'Connect Google'}
              </button>
            </div>
          )}

          {gsc?.status === 'connected' && (
            <div style={{ marginTop: '0.9rem' }}>
              <button type="button" className="ns-integ-btn" disabled={busy === 'sites'} onClick={loadSites}>
                {busy === 'sites' ? 'Loading…' : gsc.resourceId ? 'Change Search Console property' : 'Choose Search Console property'}
              </button>
              {sites && sites.length > 0 && (
                <ul className="ns-row-list" style={{ marginTop: '0.6rem' }}>
                  {sites.map((s) => (
                    <li key={s.siteUrl} className="ns-row">
                      <span className="ns-row-text">
                        <span className="ns-row-title">{s.siteUrl}</span>
                        <span className="ns-row-desc">{s.permissionLevel}</span>
                      </span>
                      <button type="button" className="ns-integ-btn" disabled={busy === 'pick'} onClick={() => pickSite(s.siteUrl)}>
                        Use this
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      <hr className="ns-panel-divider" />
      <h2>Connect WordPress</h2>
      <p className="ns-panel-body">
        Lets Operator publish approved fixes directly to your live site — application password only, never your
        account password, encrypted at rest. Every deploy is verified by re-reading the page after writing.
      </p>

      {wpNotice && (
        <p className={`ns-integ-notice${wpNotice.ok ? '' : ' err'}`} role={wpNotice.ok ? 'status' : 'alert'} aria-live={wpNotice.ok ? 'polite' : 'assertive'}>
          {wpNotice.text}
        </p>
      )}

      {wp === undefined ? null : wp ? (
        <ul className="ns-row-list">
          <li className="ns-row" data-status="completed">
            <span className="ns-row-dot" aria-hidden />
            <span className="ns-row-text">
              <span className="ns-row-title">{wp.siteUrl}</span>
              <span className="ns-row-desc">
                Connected as {wp.username}
                {wp.seoPlugin ? ` — ${wp.seoPlugin}` : ''}
              </span>
            </span>
            <button type="button" className="ns-integ-btn" disabled={wpBusy} onClick={disconnectWp}>
              {wpBusy ? '…' : 'Disconnect'}
            </button>
          </li>
        </ul>
      ) : (
        <form onSubmit={connectWp} className="ns-onboard-actions" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.6rem' }}>
          <label className="ns-sr-only" htmlFor="wp-site-url">WordPress site URL</label>
          <input
            id="wp-site-url"
            type="url"
            required
            placeholder="https://yoursite.com"
            value={wpForm.siteUrl}
            onChange={(e) => setWpForm({ ...wpForm, siteUrl: e.target.value })}
            className="ns-onboard-input"
          />
          <label className="ns-sr-only" htmlFor="wp-username">WordPress username</label>
          <input
            id="wp-username"
            type="text"
            required
            placeholder="WordPress username"
            value={wpForm.username}
            onChange={(e) => setWpForm({ ...wpForm, username: e.target.value })}
            className="ns-onboard-input"
          />
          <label className="ns-sr-only" htmlFor="wp-app-password">WordPress application password</label>
          <input
            id="wp-app-password"
            type="password"
            required
            placeholder="Application password"
            value={wpForm.appPassword}
            onChange={(e) => setWpForm({ ...wpForm, appPassword: e.target.value })}
            className="ns-onboard-input"
            autoComplete="off"
          />
          <button type="submit" className="ns-onboard-primary" disabled={wpBusy}>
            {wpBusy ? 'Connecting…' : 'Connect WordPress'}
          </button>
        </form>
      )}
    </div>
  )
}
