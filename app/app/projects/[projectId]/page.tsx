'use client'

import { use, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, ApiError, type DeploymentDTO, type ProjectDTO, type RecommendationDTO, type ScanSummary } from '../../lib/client'
import { EmptyState, Field, inputClass, Spinner } from '../../lib/ui'
import { runCrawl } from '../../lib/crawl-runner'

type Tab = 'audit' | 'recommendations' | 'wordpress' | 'history'

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const router = useRouter()
  const [project, setProject] = useState<ProjectDTO | null>(null)
  const [scans, setScans] = useState<ScanSummary[]>([])
  const [tab, setTab] = useState<Tab>('audit')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const { project, scans } = await api.getProject(projectId)
      setProject(project)
      setScans(scans)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Project not found, or you do not have access.')
      } else {
        setError(err instanceof ApiError ? err.message : 'Could not load project.')
      }
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  if (error) return <EmptyState title="Unavailable" detail={error} action={<Link href="/app/projects" className="rf-btn-ghost rounded-lg px-4 py-2 text-sm">Back to projects</Link>} />
  if (!project) return <Spinner label="Loading project…" />

  const tabs: { id: Tab; label: string }[] = [
    { id: 'audit', label: 'Audit' },
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'wordpress', label: 'WordPress' },
    { id: 'history', label: 'History' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/app/projects" className="rf-mono text-xs text-[var(--rf-muted)] hover:text-white">← Projects</Link>
          <h1 className="mt-1 text-2xl font-semibold text-white">{project.name}</h1>
          <p className="rf-mono text-sm text-[var(--rf-blue-bright)]">{project.domain}</p>
        </div>
        <DangerZone projectId={projectId} onDeleted={() => router.replace('/app/projects')} />
      </div>

      <div className="flex gap-1 border-b border-[var(--rf-card-line)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium ${tab === t.id ? 'border-b-2 border-[var(--rf-blue-bright)] text-white' : 'text-[var(--rf-muted)] hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'audit' && <AuditTab project={project} scans={scans} onScanDone={load} />}
      {tab === 'recommendations' && <RecommendationsTab projectId={projectId} />}
      {tab === 'wordpress' && <WordPressTab projectId={projectId} />}
      {tab === 'history' && <HistoryTab scans={scans} />}
    </div>
  )
}

/* ---------------- Audit ---------------- */

function AuditTab({ project, scans, onScanDone }: { project: ProjectDTO; scans: ScanSummary[]; onScanDone: () => void }) {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const latest = scans[0]

  async function run() {
    setRunning(true)
    setError('')
    setProgress('Starting scan…')
    let scanId = ''
    try {
      const started = await api.startScan(project.id)
      scanId = started.scan.id
      const result = await runCrawl(project.domain, (msg) => setProgress(msg))
      setProgress('Saving results…')
      await api.completeScan(project.id, scanId, result.pages, result.blocked, result.discovered)
      onScanDone()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'The crawl failed.'
      setError(message)
      if (scanId) await api.failScan(project.id, scanId, message).catch(() => {})
    } finally {
      setRunning(false)
      setProgress('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--rf-muted)]">Run a real crawl of {project.domain}. Results are persisted to this project.</p>
        <button onClick={run} disabled={running} className="rf-btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">
          {running ? 'Crawling…' : 'Run scan'}
        </button>
      </div>
      {running && <div className="rf-card p-4 text-sm text-[var(--rf-muted)]">{progress}</div>}
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {!running && !latest && <EmptyState title="No scans yet" detail="Run your first scan to populate this project's audit, recommendations, and history." />}
      {latest && (
        <div className="rf-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Latest scan</p>
            <StatusChip status={latest.status} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Site score" value={String(latest.summary.siteScore)} />
            <Stat label="Pages crawled" value={String(latest.summary.pagesCrawled)} />
            <Stat label="Blocked (unknown)" value={String(latest.summary.blockedCount)} />
            <Stat label="Critical issues" value={String(latest.summary.critical)} />
          </div>
          <p className="mt-3 text-[11px] text-[var(--rf-faint)]">Ran {new Date(latest.createdAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  )
}

/* ---------------- Recommendations ---------------- */

function RecommendationsTab({ projectId }: { projectId: string }) {
  const [recs, setRecs] = useState<RecommendationDTO[] | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const { recommendations } = await api.listRecommendations(projectId)
      setRecs(recommendations)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load recommendations.')
      setRecs([])
    }
  }, [projectId])
  useEffect(() => {
    void load()
  }, [load])

  async function setStatus(id: string, status: string) {
    try {
      const { recommendation } = await api.setRecommendationStatus(projectId, id, status)
      setRecs((prev) => (prev ?? []).map((r) => (r.id === id ? recommendation : r)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update.')
    }
  }

  if (recs === null) return <Spinner label="Loading recommendations…" />
  if (recs.length === 0) return <EmptyState title="No recommendations yet" detail="Run a scan on the Audit tab. Recommendations are derived from real crawl findings and stored with evidence and confidence." />

  return (
    <div className="space-y-3">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {recs.map((r) => (
        <div key={r.id} className="rf-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <SeverityDot s={r.severity} />
                <p className="font-medium text-white">{r.title}</p>
              </div>
              <p className="mt-1 text-xs text-[var(--rf-muted)]">{r.reasoning}</p>
            </div>
            <StatusChip status={r.status} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-[var(--rf-muted)] sm:grid-cols-4">
            <span>Confidence: <b className="text-white">{r.confidence}</b></span>
            <span>Impact: <b className="text-white">{r.expectedImpact.size}</b> ({r.expectedImpact.category})</span>
            <span>Risk: <b className="text-white">{r.risk.level}</b></span>
            <span>Evidence: <b className="text-white">{r.evidence.affectedUrls.length}</b> URLs</span>
          </div>
          <p className="mt-1 text-[10px] text-[var(--rf-faint)]">{r.confidenceBasis}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['accepted', 'modified', 'rejected', 'dismissed', 'open'].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(r.id, s)}
                disabled={r.status === s}
                className="rf-btn-ghost rounded-md px-2.5 py-1 text-[11px] capitalize disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------------- WordPress ---------------- */

function WordPressTab({ projectId }: { projectId: string }) {
  const [state, setState] = useState<{ connection: { siteUrl: string; username: string; aioseo: boolean } | null; deployments: DeploymentDTO[] } | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setState(await api.getWordpress(projectId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load WordPress state.')
      setState({ connection: null, deployments: [] })
    }
  }, [projectId])
  useEffect(() => {
    void load()
  }, [load])

  async function rollback(id: string) {
    try {
      await api.rollbackWordpress(projectId, id)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Rollback failed.')
    }
  }

  if (state === null) return <Spinner label="Loading WordPress…" />

  return (
    <div className="space-y-5">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {!state.connection ? (
        <ConnectWordPress projectId={projectId} onConnected={load} />
      ) : (
        <>
          <div className="rf-card p-4">
            <p className="text-sm font-semibold text-white">Connected</p>
            <p className="rf-mono text-xs text-[var(--rf-blue-bright)]">{state.connection.siteUrl}</p>
            <p className="mt-1 text-xs text-[var(--rf-muted)]">User {state.connection.username} · AIOSEO {state.connection.aioseo ? 'detected' : 'not detected'}</p>
          </div>
          <DeployForm projectId={projectId} onDeployed={load} />
        </>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold text-white">Deployment history</p>
        {state.deployments.length === 0 ? (
          <EmptyState title="No deployments yet" detail="Deployments are durable server-side records — they survive refresh, logout, and other devices. Nothing is shown as 'verified' unless the changed value was read back and matched." />
        ) : (
          <div className="space-y-2">
            {state.deployments.map((d) => (
              <div key={d.id} className="rf-card p-4 text-sm">
                <div className="flex items-center justify-between">
                  <a href={d.postUrl} target="_blank" rel="noreferrer" className="rf-mono text-xs text-[var(--rf-blue-bright)] hover:text-white">
                    {d.postType}/{d.postId}
                  </a>
                  <StatusChip status={d.status} />
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {d.after.title !== undefined && (
                    <ChangeRow label="Title" before={d.before.title} after={d.after.title ?? ''} />
                  )}
                  {d.after.metaDescription !== undefined && (
                    <ChangeRow label="Meta description" before={d.before.metaDescription} after={d.after.metaDescription ?? ''} />
                  )}
                </div>
                <p className="mt-2 text-[11px] text-[var(--rf-muted)]">Reason: {d.reason}</p>
                {d.verification && (
                  <p className="mt-1 text-[11px] text-[var(--rf-faint)]">
                    Verification: {d.verification.note} (title match: {String(d.verification.titleMatches)}, meta match: {String(d.verification.metaMatches)})
                  </p>
                )}
                <p className="mt-1 text-[11px] text-[var(--rf-faint)]">Result: {d.result}</p>
                {d.status !== 'rolled_back' && d.status !== 'failed' && (
                  <button onClick={() => rollback(d.id)} className="rf-btn-ghost mt-2 rounded-md px-3 py-1 text-[11px]">
                    Roll back
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DeployForm({ projectId, onDeployed }: { projectId: string; onDeployed: () => void }) {
  const [form, setForm] = useState({ postId: '', postType: 'pages', title: '', metaDescription: '', reason: '' })
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const changeCount = [form.title, form.metaDescription].filter(Boolean).length

  async function deploy() {
    setError('')
    setBusy(true)
    try {
      await api.deployWordpress(projectId, {
        postId: Number(form.postId),
        postType: form.postType,
        title: form.title || undefined,
        metaDescription: form.metaDescription || undefined,
        reason: form.reason,
      })
      setConfirming(false)
      setForm({ postId: '', postType: 'pages', title: '', metaDescription: '', reason: '' })
      onDeployed()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Deploy failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rf-card space-y-3 p-4">
      <p className="text-sm font-semibold text-white">New deployment</p>
      <p className="text-xs text-[var(--rf-muted)]">Writes to your live site. Every change is captured (before/after), verified by read-back, and stored as a durable, reversible record.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Post ID">
          <input className={inputClass} value={form.postId} onChange={(e) => setForm({ ...form, postId: e.target.value })} />
        </Field>
        <Field label="Type">
          <select className={inputClass} value={form.postType} onChange={(e) => setForm({ ...form, postType: e.target.value })}>
            <option value="pages">pages</option>
            <option value="posts">posts</option>
          </select>
        </Field>
        <Field label="Reason (required)">
          <input className={inputClass} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </Field>
      </div>
      <Field label="New title (optional)">
        <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </Field>
      <Field label="New meta description (optional)">
        <input className={inputClass} value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} />
      </Field>
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {!confirming ? (
        <button
          onClick={() => {
            if (!form.postId || !form.reason || changeCount === 0) {
              setError('Post ID, a reason, and at least one change are required.')
              return
            }
            setError('')
            setConfirming(true)
          }}
          className="rf-btn-ghost rounded-lg px-4 py-2 text-sm"
        >
          Review &amp; deploy
        </button>
      ) : (
        <div className="rounded-lg border border-[var(--rf-card-line-strong)] p-3">
          <p className="text-sm text-white">Deploy {changeCount} change{changeCount > 1 ? 's' : ''} to {form.postType}/{form.postId} on your live site?</p>
          <div className="mt-2 flex gap-2">
            <button onClick={() => setConfirming(false)} className="rf-btn-ghost rounded-md px-3 py-1.5 text-xs">Cancel</button>
            <button onClick={deploy} disabled={busy} className="rf-btn-primary rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-60">
              {busy ? 'Deploying…' : 'Confirm deploy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ConnectWordPress({ projectId, onConnected }: { projectId: string; onConnected: () => void }) {
  const [form, setForm] = useState({ siteUrl: '', username: '', appPassword: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.connectWordpress(projectId, form.siteUrl, form.username, form.appPassword)
      onConnected()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not connect.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="rf-card space-y-3 p-4">
      <p className="text-sm font-semibold text-white">Connect WordPress</p>
      <p className="text-xs text-[var(--rf-muted)]">Use a WordPress Application Password. It is validated against your site and stored encrypted server-side.</p>
      <Field label="Site URL">
        <input required placeholder="https://example.com" className={inputClass} value={form.siteUrl} onChange={(e) => setForm({ ...form, siteUrl: e.target.value })} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Username">
          <input required className={inputClass} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </Field>
        <Field label="Application password">
          <input required type="password" className={inputClass} value={form.appPassword} onChange={(e) => setForm({ ...form, appPassword: e.target.value })} />
        </Field>
      </div>
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      <button type="submit" disabled={saving} className="rf-btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">
        {saving ? 'Connecting…' : 'Connect & verify'}
      </button>
    </form>
  )
}

/* ---------------- History ---------------- */

function HistoryTab({ scans }: { scans: ScanSummary[] }) {
  if (scans.length === 0) return <EmptyState title="No scan history" detail="Scans you run appear here with their status and results." />
  return (
    <div className="space-y-2">
      {scans.map((s) => (
        <div key={s.id} className="rf-card flex items-center justify-between p-4 text-sm">
          <div>
            <p className="text-white">{new Date(s.createdAt).toLocaleString()}</p>
            <p className="text-xs text-[var(--rf-muted)]">
              {s.summary.pagesCrawled} pages · score {s.summary.siteScore} · {s.summary.blockedCount} blocked
              {s.error ? ` · ${s.error}` : ''}
            </p>
          </div>
          <StatusChip status={s.status} />
        </div>
      ))}
    </div>
  )
}

/* ---------------- Shared bits ---------------- */

function DangerZone({ projectId, onDeleted }: { projectId: string; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  return (
    <div className="text-right">
      {!confirming ? (
        <button onClick={() => setConfirming(true)} className="rf-btn-ghost rounded-lg px-3 py-1.5 text-xs text-red-300">
          Delete project
        </button>
      ) : (
        <div className="rf-card p-3 text-xs">
          <p className="mb-2 text-white">Delete this project and all its data?</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirming(false)} className="rf-btn-ghost rounded-md px-2 py-1">Cancel</button>
            <button
              onClick={async () => {
                try {
                  await api.deleteProject(projectId)
                  onDeleted()
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : 'Delete failed.')
                }
              }}
              className="rounded-md bg-red-500/80 px-2 py-1 font-semibold text-white"
            >
              Delete
            </button>
          </div>
          {error && <p className="mt-1 text-red-300">{error}</p>}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  const tone: Record<string, string> = {
    completed: 'text-[var(--rf-green)]',
    verified: 'text-[var(--rf-green)]',
    partial: 'text-yellow-300',
    running: 'text-[var(--rf-blue-bright)]',
    queued: 'text-[var(--rf-muted)]',
    failed: 'text-red-300',
    verify_failed: 'text-yellow-300',
    rolled_back: 'text-[var(--rf-muted)]',
    cancelled: 'text-[var(--rf-muted)]',
  }
  return <span className={`rf-mono text-[11px] uppercase ${tone[status] ?? 'text-[var(--rf-muted)]'}`}>{status.replace('_', ' ')}</span>
}

function SeverityDot({ s }: { s: string }) {
  const c = s === 'critical' ? 'bg-red-400' : s === 'warning' ? 'bg-yellow-400' : 'bg-sky-400'
  return <span className={`inline-block h-2 w-2 rounded-full ${c}`} />
}

function ChangeRow({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <div className="rounded-md border border-[var(--rf-card-line)] p-2">
      <p className="text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">{label}</p>
      <p className="text-xs text-red-300 line-through">{before || '(empty)'}</p>
      <p className="text-xs text-[var(--rf-green)]">{after || '(empty)'}</p>
    </div>
  )
}
