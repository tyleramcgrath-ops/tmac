'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, AlertTriangle, Zap, ArrowLeft, Plug, CheckCircle2, SearchCheck, BarChart3, KeyRound } from 'lucide-react'

type GState = 'not_configured' | 'disconnected' | 'authorization_required' | 'connected' | 'healthy' | 'syncing' | 'stale' | 'failed'
interface Readiness { configured: boolean; missing: string[]; encryptionConfigured: boolean; redirectUri: string | null }
interface IntegrationStatus { state: GState; propertySelected: boolean; dataPoints: number; lastSync: string | null; lastDataDate: string | null; scopes: string[] }
interface Project { id: string; name: string; domain: string }
interface StatusResponse {
  ok: boolean; readiness: Readiness
  callbackPaths: { gsc: string; ga4: string }
  project: Project | null; gsc: IntegrationStatus | null; ga4: IntegrationStatus | null
}
interface ListProject { id: string; name: string; domain: string }

const STATE_META: Record<GState, { label: string; color: string }> = {
  not_configured: { label: 'Not configured', color: 'var(--rf-faint)' },
  disconnected: { label: 'Not connected', color: 'var(--rf-muted)' },
  authorization_required: { label: 'Authorization required', color: 'var(--rf-amber)' },
  connected: { label: 'Connected · awaiting sync', color: 'var(--rf-cyan)' },
  healthy: { label: 'Healthy', color: 'var(--rf-green)' },
  syncing: { label: 'Syncing', color: 'var(--rf-cyan)' },
  stale: { label: 'Stale', color: 'var(--rf-amber)' },
  failed: { label: 'Failed', color: 'var(--rf-red)' },
}

export default function GoogleIntegrationsPage() {
  const [projects, setProjects] = useState<ListProject[]>([])
  const [projectId, setProjectId] = useState('')
  const [data, setData] = useState<StatusResponse | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauth' | 'error'>('loading')
  const [properties, setProperties] = useState<{ service: string; source: string; preview: boolean; items: any[] } | null>(null)
  const [loadingProps, setLoadingProps] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const s = await fetch('/api/auth/session')
        if (s.status === 401) { setStatus('unauth'); return }
        const sj = await s.json()
        const oid = sj.organization?.id
        const pr = await fetch(`/api/projects/list?organizationId=${encodeURIComponent(oid)}`)
        const pj = await pr.json()
        const list: ListProject[] = (pj.projects ?? []).map((p: any) => ({ id: p.id, name: p.name, domain: p.domain }))
        setProjects(list)
        if (list.length > 0) setProjectId(list[0].id)
        else { await loadStatus(''); }
      } catch { setStatus('error') }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadStatus = useCallback(async (pid: string) => {
    setStatus('loading'); setProperties(null)
    try {
      const res = await fetch(`/api/integrations/google/status${pid ? `?projectId=${encodeURIComponent(pid)}` : ''}`)
      if (res.status === 401) { setStatus('unauth'); return }
      const json = await res.json()
      if (!res.ok) { setStatus('error'); return }
      setData(json); setStatus('ready')
    } catch { setStatus('error') }
  }, [])

  useEffect(() => { if (projectId) loadStatus(projectId) }, [projectId, loadStatus])

  const loadProperties = async (service: 'gsc' | 'ga4') => {
    if (!projectId) return
    setLoadingProps(service)
    try {
      const res = await fetch(`/api/integrations/google/properties?projectId=${encodeURIComponent(projectId)}&service=${service}`)
      const json = await res.json()
      if (res.ok) setProperties({ service, source: json.source, preview: json.preview, items: json.properties ?? json.accounts ?? [] })
    } catch { /* ignore */ } finally { setLoadingProps(null) }
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="rf-grid pointer-events-none fixed inset-0 -z-10 opacity-50" />
      <div className="rf-glow pointer-events-none fixed left-1/2 top-[-160px] -z-10 h-[420px] w-[760px] -translate-x-1/2 opacity-40" />

      <header className="sticky top-0 z-30 border-b border-[var(--rf-card-line)] bg-[rgba(5,7,14,0.8)] px-4 py-3 backdrop-blur-xl lg:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href="/app" className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"><ArrowLeft className="h-3.5 w-3.5" /> Dashboard</a>
            <span className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)]"><Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} /></span><span className="text-sm font-semibold text-white">Google integrations</span></span>
          </div>
          {projects.length > 0 && (
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="rf-card cursor-pointer bg-transparent px-2.5 py-1.5 text-xs text-white focus:outline-none">
              {projects.map((p) => <option key={p.id} value={p.id} className="bg-[#0b1120]">{p.name}</option>)}
            </select>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-6">
        {status === 'loading' && <div className="rf-card grid place-items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[var(--rf-blue-bright)]" /></div>}
        {status === 'unauth' && <div className="rf-card rf-topline grid place-items-center py-16 text-center"><p className="text-lg font-semibold text-white">Sign in to manage integrations</p><a href="/app" className="rf-btn-primary mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold">Go to sign in</a></div>}
        {status === 'error' && <div className="rf-card grid place-items-center py-16 text-center"><AlertTriangle className="h-8 w-8 text-[var(--rf-red)]" /><p className="mt-3 text-sm text-[var(--rf-muted)]">Couldn&apos;t load integration status.</p></div>}

        {status === 'ready' && data && (
          <div className="space-y-4">
            {/* Configuration banner */}
            {!data.readiness.configured ? (
              <div className="rf-card rf-topline p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--rf-amber)]/15 text-[var(--rf-amber)]"><KeyRound className="h-5 w-5" /></span>
                  <div>
                    <p className="text-sm font-semibold text-white">Google OAuth is not configured for this RankForge environment.</p>
                    <p className="mt-1 text-xs text-[var(--rf-muted)]">Add the following environment variables (names only — never commit the values), then redeploy. Full steps are in <span className="rf-mono text-[var(--rf-cyan)]">docs/GOOGLE_INTEGRATIONS_SETUP.md</span>.</p>
                    <ul className="mt-2 space-y-1">
                      {data.readiness.missing.map((m) => <li key={m} className="rf-mono text-xs text-[var(--rf-amber)]">• {m}</li>)}
                    </ul>
                    <p className="mt-3 text-[11px] text-[var(--rf-faint)]">Redirect URIs to register with Google:</p>
                    <p className="rf-mono text-[11px] text-[var(--rf-muted)]">{data.callbackPaths.gsc}</p>
                    <p className="rf-mono text-[11px] text-[var(--rf-muted)]">{data.callbackPaths.ga4}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rf-card flex items-center gap-2 p-3 text-xs text-[var(--rf-green)]"><CheckCircle2 className="h-4 w-4" /> Google OAuth is configured for this environment.</div>
            )}

            {!data.project ? (
              <div className="rf-card grid place-items-center py-14 text-center"><p className="text-sm font-medium text-white">No project selected</p><p className="mt-1 text-xs text-[var(--rf-muted)]">Create a project first, then connect Google here.</p></div>
            ) : (
              <>
                <IntegrationCard title="Google Search Console" icon={SearchCheck} status={data.gsc} configured={data.readiness.configured} onPick={() => loadProperties('gsc')} picking={loadingProps === 'gsc'} adds="Real clicks, impressions, CTR, and average position per query and page." />
                <IntegrationCard title="Google Analytics 4" icon={BarChart3} status={data.ga4} configured={data.readiness.configured} onPick={() => loadProperties('ga4')} picking={loadingProps === 'ga4'} adds="Organic sessions, engagement, conversions, and revenue by landing page." />

                {properties && (
                  <div className="rf-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-4 py-2.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">{properties.service === 'gsc' ? 'Search Console properties' : 'Analytics accounts'}</span>
                      {properties.preview && <span className="rounded-full bg-[var(--rf-amber)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--rf-amber)]">Preview (mock — live pending credentials)</span>}
                    </div>
                    <div className="divide-y divide-[var(--rf-card-line)]">
                      {properties.items.map((it, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                          <span className="truncate text-[var(--rf-text)]">{it.siteUrl ?? it.displayName ?? it.propertyId}</span>
                          <span className="shrink-0 text-[11px] text-[var(--rf-faint)]">{it.type ?? it.accountId ?? ''}</span>
                        </div>
                      ))}
                    </div>
                    <p className="border-t border-[var(--rf-card-line)] px-4 py-2 text-[11px] text-[var(--rf-faint)]">{properties.preview ? 'These are illustrative properties. Once Google OAuth is configured and you authorize, this list will show your real properties and you can assign one to the project.' : 'Select a property to assign it to this project.'}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function IntegrationCard({ title, icon: Icon, status, configured, onPick, picking, adds }: { title: string; icon: typeof Plug; status: IntegrationStatus | null; configured: boolean; onPick: () => void; picking: boolean; adds: string }) {
  const state = status?.state ?? (configured ? 'disconnected' : 'not_configured')
  const meta = STATE_META[state]
  return (
    <div className="rf-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--rf-violet)]/15 text-[var(--rf-violet)]"><Icon className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mt-0.5 text-xs text-[var(--rf-muted)]">{adds}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: meta.color, background: 'rgba(255,255,255,0.05)' }}>{meta.label}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-[var(--rf-muted)]">
        <span>Property <span className="text-white">{status?.propertySelected ? 'selected' : '—'}</span></span>
        <span>Data points <span className="text-white">{status?.dataPoints ?? 0}</span></span>
        <span>Last sync <span className="text-white">{status?.lastSync ? new Date(status.lastSync).toLocaleDateString() : '—'}</span></span>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={onPick} disabled={picking} className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-60">{picking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plug className="h-3.5 w-3.5" />} {configured ? 'Select property' : 'Preview property picker'}</button>
      </div>
    </div>
  )
}
