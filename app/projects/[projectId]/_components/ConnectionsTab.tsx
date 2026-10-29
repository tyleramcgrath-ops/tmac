'use client'

// Connections — the one place you go to plug data in.
//
// This exists because connecting Google Search Console used to live inside the
// Competitors tab, under a heading called "External data sources". Nobody found
// it, including the people who built it. A data source is not a competitor, and
// the first thing a new project needs is not buried three screens into an
// analysis feature.
//
// Each row says plainly what connecting it turns on, so the value is legible
// before you click rather than after.

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plug, Check, ArrowRight } from 'lucide-react'
import { api, ApiError, type IntegrationDTO } from '../../../lib/client'
import { GoogleIntegrationCard } from './AtlasTab'

const UNLOCKS: Record<IntegrationDTO['kind'], string[]> = {
  'search-console': [
    'Keywords & Rankings — every query your site ranks for',
    'Content Plan — what to write next, ranked by real demand',
    'Internal Links — which earning pages are starved of links',
    'AI Search — prompts to track, drawn from real searches',
  ],
  analytics: [
    'What the pages behind your keywords actually earn',
    'Traffic-channel concentration risk',
  ],
}

export function ConnectionsTab({ projectId }: { projectId: string }) {
  const [integrations, setIntegrations] = useState<IntegrationDTO[] | null>(null)
  const [configured, setConfigured] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await api.listIntegrations(projectId)
      setIntegrations(r.integrations)
      setConfigured(r.configured)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load connections.')
      setIntegrations([])
    }
  }, [projectId])
  useEffect(() => { void load() }, [load])

  async function connect() {
    setBusy(true); setError('')
    try {
      const { url } = await api.startGoogleConnect(projectId, 'all')
      window.location.href = url
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not start Google connect.')
      setBusy(false)
    }
  }

  if (integrations === null) {
    return <div className="rf-card flex items-center gap-2 p-5 text-sm text-[var(--rf-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading connections…</div>
  }

  const gsc = integrations.find((i) => i.kind === 'search-console')
  const anyConnected = integrations.some((i) => i.status === 'connected')

  return (
    <div className="space-y-4">
      <div className="rf-card rf-topline p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-white"><Plug className="h-4 w-4 text-[var(--rf-blue-bright)]" /> Google</p>
            <p className="mt-1 max-w-xl text-xs text-[var(--rf-muted)]">
              Search Console is the single most valuable thing to connect — it is free, it is the only source of real impression and position data for your own site, and four sections of this app are dark without it. Read-only access; nothing is ever written to your Google account.
            </p>
          </div>
          {configured && (
            <button onClick={connect} disabled={busy} className="rf-btn-primary inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plug className="h-3.5 w-3.5" />}
              {anyConnected ? 'Reconnect' : 'Connect Google'}
            </button>
          )}
        </div>

        {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}

        {!configured ? (
          <p className="mt-3 text-xs text-[var(--rf-muted)]">
            Google sign-in is not configured on this deployment, so there is nothing to connect yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {integrations.map((it) => (
              <div key={it.kind} className="space-y-2">
                <GoogleIntegrationCard
                  projectId={projectId}
                  it={it}
                  onDisconnect={async () => { await api.disconnectIntegration(projectId, it.kind); await load() }}
                  onSaveResource={async (v) => { await api.setIntegrationResource(projectId, it.kind, v); await load() }}
                />
                <ul className="space-y-0.5 pl-1">
                  {UNLOCKS[it.kind].map((u) => (
                    <li key={u} className="flex items-start gap-1.5 text-[11px] text-[var(--rf-faint)]">
                      {it.status === 'connected'
                        ? <Check className="mt-0.5 h-3 w-3 shrink-0 text-[var(--rf-green)]" />
                        : <ArrowRight className="mt-0.5 h-3 w-3 shrink-0" />}
                      {u}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {gsc?.status === 'connected' && (
          <p className="mt-4 border-t border-[var(--rf-card-line)] pt-3 text-[11px] text-[var(--rf-faint)]">
            Connected but seeing no keywords? Your site may be verified as a URL-prefix property rather than a domain property. Pick the exact one from the dropdown above and save.
          </p>
        )}
      </div>

      <div className="rf-card p-5">
        <p className="text-sm font-semibold text-white">WordPress</p>
        <p className="mt-1 text-xs text-[var(--rf-muted)]">
          Connecting WordPress is what turns a recommendation into an actual change on the site — it is the difference between a report and a fix. Set it up in the WordPress section.
        </p>
      </div>
    </div>
  )
}
