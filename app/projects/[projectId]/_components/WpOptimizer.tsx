'use client'

// Browse the connected site's pages AND posts, then optimize them — one at a
// time (Forge writes an improved SEO title + meta description + optional JSON-LD
// schema, you review, deploy, verified by read-back with one-click undo) or in
// BULK: select many (or all), and Forge optimizes each through the same verified,
// individually-reversible deployment path. Runs entirely on the secure per-project
// WordPress API (credentials stay server-side).

import { useMemo, useRef, useState } from 'react'
import {
  Loader2, Wand2, Sparkles, ExternalLink, Rocket, Check, X, FileText, FileType2,
  Layers, Scissors, Code2, AlertTriangle, ListChecks, Link2,
} from 'lucide-react'
import { api, ApiError } from '../../../lib/client'

type PostType = 'posts' | 'pages'
type Filter = 'all' | PostType
interface WpItem { id: number; type: PostType; link: string; title: string; status: string }
interface WpPost { postId: number; postType: PostType; title: string; metaDescription: string; content: string; link: string }

function pathOf(url: string): string { try { const u = new URL(url); return (u.pathname + u.search) || '/' } catch { return url } }
function keyOf(it: { type: PostType; id: number }): string { return `${it.type}:${it.id}` }

// Pick up to `n` OTHER real items from the already-loaded site listing as
// internal-link candidates — never invented, always something the WordPress
// REST API just returned. Mirrors the rule engine's internal-linking fix
// generator (lib/foundation/operator/fixgen.ts), just sourced from the
// items this component already has in hand instead of a crawl.
function pickLinkCandidates(current: WpItem, all: WpItem[], n = 3): { url: string; anchor: string }[] {
  return all
    .filter((it) => keyOf(it) !== keyOf(current) && it.link && it.title)
    .slice(0, n)
    .map((it) => ({ url: it.link, anchor: it.title.replace(/<[^>]+>/g, '').split(/[·|—–]/)[0].trim() || it.link }))
}

// Trim a title to <=max chars on a word boundary, without an ellipsis (titles
// shouldn't end in "…"). Kept deterministic so it works even when AI is offline.
function shortenTitle(t: string, max = 60): string {
  const s = t.trim()
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).replace(/[\s\-–—:,;.|]+$/, '').trim()
}

export function WpBrowseOptimize({ projectId, onDeployed }: { projectId: string; onDeployed: () => void }) {
  const [items, setItems] = useState<WpItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [openingKey, setOpeningKey] = useState<string | null>(null)
  const [editing, setEditing] = useState<WpPost | null>(null)
  const [bulk, setBulk] = useState<{ items: WpItem[]; opts: BulkOpts } | null>(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const { items } = await api.listWordpressItems(projectId, 'all')
      setItems(items); setLoaded(true); setSelected(new Set())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not list your site’s content.'); setItems([]); setLoaded(true)
    } finally { setLoading(false) }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((it) => (filter === 'all' || it.type === filter))
      .filter((it) => !q || it.title.toLowerCase().includes(q) || it.link.toLowerCase().includes(q))
  }, [items, filter, query])

  const counts = useMemo(() => ({
    all: items.length,
    posts: items.filter((i) => i.type === 'posts').length,
    pages: items.filter((i) => i.type === 'pages').length,
  }), [items])

  const visibleKeys = visible.map(keyOf)
  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((k) => selected.has(k))
  const selectedItems = items.filter((it) => selected.has(keyOf(it)))

  function toggle(it: WpItem) {
    setSelected((prev) => { const n = new Set(prev); const k = keyOf(it); n.has(k) ? n.delete(k) : n.add(k); return n })
  }
  function toggleAllVisible() {
    setSelected((prev) => {
      const n = new Set(prev)
      if (allVisibleSelected) visibleKeys.forEach((k) => n.delete(k))
      else visibleKeys.forEach((k) => n.add(k))
      return n
    })
  }

  async function openOne(it: WpItem) {
    setOpeningKey(keyOf(it)); setError('')
    try {
      const { post } = await api.getWordpressItem(projectId, it.type, it.id)
      setEditing(post)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not open item.')
    } finally { setOpeningKey(null) }
  }

  const filterBtn = (f: Filter, label: string, n: number, Icon: typeof FileText) => (
    <button onClick={() => setFilter(f)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${filter === f ? 'rf-btn-primary' : 'rf-btn-ghost'}`}>
      <Icon className="h-3.5 w-3.5" /> {label} <span className="opacity-60">{n}</span>
    </button>
  )

  return (
    <div className="rf-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Optimize pages &amp; posts</p>
          <p className="mt-0.5 text-xs text-[var(--rf-muted)]">Browse everything on your site and optimize one — or select many and let Forge optimize them all at once. Every change is verified and individually undoable.</p>
        </div>
        {!loaded ? (
          <button onClick={load} disabled={loading} className="rf-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />} Load my content
          </button>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {filterBtn('all', 'All', counts.all, Layers)}
            {filterBtn('pages', 'Pages', counts.pages, FileType2)}
            {filterBtn('posts', 'Posts', counts.posts, FileText)}
            <button onClick={load} disabled={loading} className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-60">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Refresh'}
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
      {loading && <p className="mt-3 flex items-center gap-2 text-sm text-[var(--rf-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading every page and post…</p>}

      {!loading && loaded && (
        items.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--rf-muted)]">No pages or posts found on the connected site.</p>
        ) : (
          <>
            {/* Toolbar: search + select-all */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by title or URL…"
                className="rf-card min-w-[180px] flex-1 bg-transparent px-3 py-1.5 text-xs text-white focus:outline-none"
              />
              <button onClick={toggleAllVisible} className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium">
                <ListChecks className="h-3.5 w-3.5" /> {allVisibleSelected ? 'Clear' : 'Select all'} ({visible.length})
              </button>
            </div>

            <div className="mt-3 max-h-[420px] divide-y divide-[var(--rf-card-line)] overflow-y-auto rounded-lg border border-[var(--rf-card-line)]">
              {visible.map((it) => {
                const k = keyOf(it)
                return (
                  <div key={k} className={`flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-white/[0.02] ${selected.has(k) ? 'bg-[var(--rf-blue-bright)]/[0.06]' : ''}`}>
                    <input type="checkbox" checked={selected.has(k)} onChange={() => toggle(it)} className="h-4 w-4 shrink-0 accent-[var(--rf-blue-bright)]" />
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${it.type === 'pages' ? 'bg-[var(--rf-violet)]/15 text-[var(--rf-violet)]' : 'bg-[var(--rf-blue-bright)]/15 text-[var(--rf-blue-bright)]'}`}>{it.type === 'pages' ? 'Page' : 'Post'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[var(--rf-text)]" dangerouslySetInnerHTML={{ __html: it.title || pathOf(it.link) }} />
                      <p className="truncate text-[11px] text-[var(--rf-faint)]">{pathOf(it.link)}{it.status && it.status !== 'publish' ? ` · ${it.status}` : ''}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <a href={it.link} target="_blank" rel="noreferrer" className="text-[var(--rf-faint)] hover:text-white"><ExternalLink className="h-3.5 w-3.5" /></a>
                      <button onClick={() => openOne(it)} disabled={openingKey === k} className="rf-btn-primary inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-60">
                        {openingKey === k ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} Optimize
                      </button>
                    </div>
                  </div>
                )
              })}
              {visible.length === 0 && <p className="px-3 py-4 text-sm text-[var(--rf-muted)]">Nothing matches that filter.</p>}
            </div>
          </>
        )
      )}

      {selectedItems.length > 0 && <BulkBar count={selectedItems.length} onRun={(opts) => setBulk({ items: selectedItems, opts })} onClear={() => setSelected(new Set())} />}

      {editing && (
        <Optimizer
          projectId={projectId} post={editing}
          linkCandidates={pickLinkCandidates(
            { id: editing.postId, type: editing.postType, link: editing.link, title: editing.title, status: '' },
            items
          )}
          onClose={() => setEditing(null)} onDeployed={() => { setEditing(null); onDeployed() }}
        />
      )}
      {bulk && (
        <BulkRunner
          projectId={projectId} items={bulk.items} allItems={items} opts={bulk.opts}
          onClose={() => setBulk(null)}
          onFinished={() => { setSelected(new Set()); onDeployed() }}
        />
      )}
    </div>
  )
}

// ── Bulk options bar ─────────────────────────────────────────────────────────

interface BulkOpts { shorten: boolean; schema: boolean; internalLinks: boolean }

// Schema and internal links each occupy the single body-content-transform
// slot a deploy supports, so they're mutually exclusive per run (checking
// one clears the other) rather than silently dropping whichever loses.
function BulkBar({ count, onRun, onClear }: { count: number; onRun: (o: BulkOpts) => void; onClear: () => void }) {
  const [shorten, setShorten] = useState(false)
  const [schema, setSchema] = useState(false)
  const [internalLinks, setInternalLinks] = useState(false)
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-[var(--rf-blue-bright)]/30 bg-[var(--rf-blue-bright)]/[0.06] px-4 py-3">
      <span className="text-sm font-semibold text-white">{count} selected</span>
      <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[var(--rf-muted)]">
        <input type="checkbox" checked={shorten} onChange={(e) => setShorten(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--rf-blue-bright)]" />
        <Scissors className="h-3.5 w-3.5" /> Shorten titles to ≤60 chars
      </label>
      <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[var(--rf-muted)]">
        <input type="checkbox" checked={schema} onChange={(e) => { setSchema(e.target.checked); if (e.target.checked) setInternalLinks(false) }} className="h-3.5 w-3.5 accent-[var(--rf-blue-bright)]" />
        <Code2 className="h-3.5 w-3.5" /> Add structured data (schema)
      </label>
      <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[var(--rf-muted)]">
        <input type="checkbox" checked={internalLinks} onChange={(e) => { setInternalLinks(e.target.checked); if (e.target.checked) setSchema(false) }} className="h-3.5 w-3.5 accent-[var(--rf-blue-bright)]" />
        <Link2 className="h-3.5 w-3.5" /> Add internal links
      </label>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={onClear} className="rf-btn-ghost rounded-lg px-3 py-1.5 text-xs font-medium">Clear</button>
        <button onClick={() => onRun({ shorten, schema, internalLinks })} className="rf-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" /> Optimize {count} with Forge
        </button>
      </div>
    </div>
  )
}

// ── Bulk runner ──────────────────────────────────────────────────────────────

type RowStatus = 'queued' | 'working' | 'verified' | 'applied' | 'skipped' | 'failed'
interface RunRow { key: string; item: WpItem; status: RowStatus; note: string }

function badge(s: RowStatus): { text: string; cls: string; Icon: typeof Check } {
  switch (s) {
    case 'verified': return { text: 'Verified', cls: 'text-[var(--rf-green)]', Icon: Check }
    case 'applied': return { text: 'Applied (unverified)', cls: 'text-amber-400', Icon: AlertTriangle }
    case 'skipped': return { text: 'No change', cls: 'text-[var(--rf-faint)]', Icon: X }
    case 'failed': return { text: 'Failed', cls: 'text-[var(--rf-red)]', Icon: X }
    case 'working': return { text: 'Working…', cls: 'text-[var(--rf-blue-bright)]', Icon: Loader2 }
    default: return { text: 'Queued', cls: 'text-[var(--rf-faint)]', Icon: Loader2 }
  }
}

function BulkRunner({ projectId, items, allItems, opts, onClose, onFinished }: {
  projectId: string; items: WpItem[]; allItems: WpItem[]; opts: BulkOpts; onClose: () => void; onFinished: () => void
}) {
  const [rows, setRows] = useState<RunRow[]>(() => items.map((it) => ({ key: keyOf(it), item: it, status: 'queued', note: '' })))
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>('ready')
  const cancelRef = useRef(false)

  function patch(key: string, status: RowStatus, note = '') {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, status, note } : r)))
  }

  async function processItem(it: WpItem): Promise<{ status: RowStatus; note: string }> {
    const { post } = await api.getWordpressItem(projectId, it.type, it.id)
    let title = post.title
    let meta = post.metaDescription
    let jsonLd: string | undefined
    const internalLinks = opts.internalLinks ? pickLinkCandidates(it, allItems) : undefined
    let aiNote = ''
    try {
      const excerpt = post.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000)
      const r = await api.forgeRewrite({ url: post.link, currentTitle: title, currentMeta: meta, excerpt })
      if (r.seoTitle) title = r.seoTitle
      if (r.metaDescription) meta = r.metaDescription
      if (opts.schema && r.jsonLd) jsonLd = r.jsonLd
    } catch (e) {
      // AI offline: shorten can still run against the current title; schema needs AI.
      aiNote = e instanceof ApiError ? `AI unavailable (${e.message})` : 'AI unavailable'
    }
    if (opts.shorten) title = shortenTitle(title)

    const changedTitle = title !== post.title
    const changedMeta = meta !== post.metaDescription
    if (!changedTitle && !changedMeta && !jsonLd && !internalLinks?.length) {
      return { status: 'skipped', note: aiNote || (opts.internalLinks ? 'No other pages available to link to.' : 'Already optimal — nothing to change.') }
    }
    const { deployment } = await api.deployWordpress(projectId, {
      postId: it.id, postType: it.type,
      title: changedTitle ? title : undefined,
      metaDescription: changedMeta ? meta : undefined,
      jsonLd,
      internalLinks,
      reason: 'Bulk SEO optimization via Forge',
    })
    const st: RowStatus = deployment.status === 'verified' ? 'verified' : deployment.status === 'failed' ? 'failed' : 'applied'
    return { status: st, note: aiNote || deployment.result || '' }
  }

  async function run() {
    setPhase('running'); cancelRef.current = false
    for (const it of items) {
      if (cancelRef.current) { patch(keyOf(it), 'skipped', 'Stopped by user.'); continue }
      patch(keyOf(it), 'working')
      try {
        const r = await processItem(it)
        patch(keyOf(it), r.status, r.note)
      } catch (e) {
        patch(keyOf(it), 'failed', e instanceof ApiError ? e.message : 'Failed.')
      }
    }
    setPhase('done')
    onFinished()
  }

  const done = rows.filter((r) => r.status !== 'queued' && r.status !== 'working').length
  const summary = {
    verified: rows.filter((r) => r.status === 'verified').length,
    applied: rows.filter((r) => r.status === 'applied').length,
    skipped: rows.filter((r) => r.status === 'skipped').length,
    failed: rows.filter((r) => r.status === 'failed').length,
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8" onClick={phase === 'running' ? undefined : onClose}>
      <div className="rf-card rf-topline relative my-auto w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-5 py-3.5">
          <span className="flex items-center gap-2 text-sm font-semibold text-white"><Sparkles className="h-4 w-4 text-[var(--rf-violet)]" /> Bulk optimize &amp; deploy — {items.length} item{items.length !== 1 ? 's' : ''}</span>
          <button onClick={onClose} disabled={phase === 'running'} className="rf-btn-ghost grid h-8 w-8 place-items-center rounded-lg disabled:opacity-40"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-5 py-4">
          {phase === 'ready' && (
            <div className="rounded-xl border border-[var(--rf-card-line-strong)] bg-white/[0.02] p-3 text-sm">
              <p className="text-white">Forge will optimize the SEO title &amp; meta description of each item and deploy live.</p>
              <ul className="mt-2 space-y-1 text-[13px] text-[var(--rf-muted)]">
                <li>• {opts.shorten ? 'Titles will be shortened to ≤60 characters.' : 'Titles kept at Forge’s recommended length.'}</li>
                <li>• {opts.schema ? 'Structured data (JSON-LD) will be added to each item’s body.' : opts.internalLinks ? 'Links to other real pages on your site will be added to each item’s body.' : 'No structured data or internal links will be added.'}</li>
                <li>• Each change is read back to verify, and every one can be undone individually from the deployment history.</li>
              </ul>
              <div className="mt-3 flex gap-2">
                <button onClick={run} className="rf-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"><Rocket className="h-4 w-4" /> Start optimizing {items.length}</button>
                <button onClick={onClose} className="rf-btn-ghost rounded-xl px-4 py-2 text-sm font-medium">Cancel</button>
              </div>
            </div>
          )}

          {phase !== 'ready' && (
            <>
              <div className="flex items-center justify-between text-xs text-[var(--rf-muted)]">
                <span>{done}/{items.length} processed</span>
                {phase === 'running' && <button onClick={() => { cancelRef.current = true }} className="rf-btn-ghost rounded-lg px-2.5 py-1 font-medium">Stop</button>}
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[var(--rf-blue-bright)] transition-all" style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} />
              </div>

              <div className="mt-3 max-h-[46vh] divide-y divide-[var(--rf-card-line)] overflow-y-auto rounded-lg border border-[var(--rf-card-line)]">
                {rows.map((r) => {
                  const b = badge(r.status)
                  return (
                    <div key={r.key} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[var(--rf-text)]" dangerouslySetInnerHTML={{ __html: r.item.title || pathOf(r.item.link) }} />
                        {r.note && <p className="truncate text-[11px] text-[var(--rf-faint)]">{r.note}</p>}
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-medium ${b.cls}`}>
                        <b.Icon className={`h-3.5 w-3.5 ${r.status === 'working' || r.status === 'queued' ? 'animate-spin' : ''}`} /> {b.text}
                      </span>
                    </div>
                  )
                })}
              </div>

              {phase === 'done' && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p className="text-sm text-white">
                    {summary.verified} verified · {summary.applied} applied · {summary.skipped} skipped{summary.failed ? ` · ${summary.failed} failed` : ''}
                  </p>
                  <button onClick={onClose} className="rf-btn-primary ml-auto rounded-xl px-4 py-2 text-sm font-semibold">Done</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Single-item optimizer ────────────────────────────────────────────────────

function Optimizer({ projectId, post, linkCandidates, onClose, onDeployed }: { projectId: string; post: WpPost; linkCandidates: { url: string; anchor: string }[]; onClose: () => void; onDeployed: () => void }) {
  const [title, setTitle] = useState(post.title)
  const [meta, setMeta] = useState(post.metaDescription)
  const [jsonLd, setJsonLd] = useState('')
  const [schemaType, setSchemaType] = useState('')
  const [deploySchema, setDeploySchema] = useState(false)
  const [deployInternalLinks, setDeployInternalLinks] = useState(false)
  const [showSchema, setShowSchema] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiNote, setAiNote] = useState('')
  const [aiErr, setAiErr] = useState('')
  const [step, setStep] = useState<'edit' | 'confirm' | 'applying' | 'done' | 'error'>('edit')
  const [error, setError] = useState('')

  const changed = (title !== post.title ? 1 : 0) + (meta !== post.metaDescription ? 1 : 0) + (deploySchema && jsonLd.trim() ? 1 : 0) + (deployInternalLinks && linkCandidates.length > 0 ? 1 : 0)

  async function writeWithAI() {
    setAiBusy(true); setAiErr(''); setAiNote('')
    try {
      const excerpt = post.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000)
      const r = await api.forgeRewrite({ url: post.link, currentTitle: title, currentMeta: meta, excerpt })
      if (r.seoTitle) setTitle(r.seoTitle)
      if (r.metaDescription) setMeta(r.metaDescription)
      if (r.jsonLd) { setJsonLd(r.jsonLd); setDeploySchema(true) }
      if (r.schemaType) setSchemaType(r.schemaType)
      if (r.rationale) setAiNote(r.rationale)
    } catch (e) {
      setAiErr(e instanceof ApiError ? e.message : 'AI generation failed.')
    } finally { setAiBusy(false) }
  }

  async function deploy() {
    setStep('applying'); setError('')
    try {
      await api.deployWordpress(projectId, {
        postId: post.postId,
        postType: post.postType,
        title: title !== post.title ? title : undefined,
        metaDescription: meta !== post.metaDescription ? meta : undefined,
        jsonLd: deploySchema && jsonLd.trim() ? jsonLd : undefined,
        internalLinks: deployInternalLinks && linkCandidates.length > 0 ? linkCandidates : undefined,
        reason: 'One-click SEO optimization via Forge',
      })
      setStep('done')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Deploy failed.'); setStep('error')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8" onClick={onClose}>
      <div className="rf-card rf-topline relative my-auto w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-5 py-3.5">
          <span className="flex items-center gap-2 text-sm font-semibold text-white"><Wand2 className="h-4 w-4 text-[var(--rf-blue-bright)]" /> Optimize &amp; deploy</span>
          <button onClick={onClose} className="rf-btn-ghost grid h-8 w-8 place-items-center rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[74vh] overflow-y-auto p-5">
          <a href={post.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--rf-blue-bright)] hover:text-white">{pathOf(post.link)} <ExternalLink className="h-3 w-3" /></a>

          {step === 'done' ? (
            <div className="py-8 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--rf-green)]/10"><Check className="h-6 w-6 text-[var(--rf-green)]" /></span>
              <p className="mt-3 font-semibold text-white">Deployed to your site</p>
              <p className="mt-1 text-sm text-[var(--rf-muted)]">Your changes are live on WordPress. You can undo it from the deployment history below.</p>
              <div className="mt-4 flex justify-center gap-2">
                <a href={post.link} target="_blank" rel="noreferrer" className="rf-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold">View page <ExternalLink className="h-4 w-4" /></a>
                <button onClick={onDeployed} className="rf-btn-ghost rounded-xl px-4 py-2 text-sm font-medium">Done</button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="rf-mono text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">Forge writes an optimized title, meta &amp; schema</p>
                <button onClick={writeWithAI} disabled={aiBusy} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--rf-violet)]/40 bg-[var(--rf-violet)]/10 px-2.5 py-1 text-xs font-medium text-[var(--rf-violet)] hover:bg-[var(--rf-violet)]/20 disabled:opacity-60">
                  {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Write with AI
                </button>
              </div>
              {aiErr && <p className="mt-1 text-[11px] text-[var(--rf-red)]">{aiErr}</p>}
              {aiNote && <p className="mt-1 flex items-start gap-1.5 text-[11px] text-[var(--rf-muted)]"><Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[var(--rf-violet)]" />{aiNote}</p>}

              <div className="mt-3 flex items-center justify-between">
                <label className="block text-xs font-medium text-[var(--rf-muted)]">SEO title</label>
                <button onClick={() => setTitle((t) => shortenTitle(t))} disabled={title.length <= 60} className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--rf-blue-bright)] hover:text-white disabled:opacity-40">
                  <Scissors className="h-3 w-3" /> Shorten to ≤60
                </button>
              </div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="rf-card mt-1 w-full bg-transparent px-3 py-2 text-sm text-white focus:outline-none" />
              <p className={`mt-1 text-[11px] ${title.length > 60 ? 'text-amber-400' : 'text-[var(--rf-faint)]'}`}>{title.length} chars · aim 50–60</p>

              <label className="mt-4 block text-xs font-medium text-[var(--rf-muted)]">Meta description</label>
              <textarea value={meta} onChange={(e) => setMeta(e.target.value)} rows={3} className="rf-card mt-1 w-full resize-y bg-transparent px-3 py-2 text-sm text-white focus:outline-none" />
              <p className="mt-1 text-[11px] text-[var(--rf-faint)]">{meta.length} chars · aim 140–160</p>

              {/* Structured data (JSON-LD) */}
              <div className="mt-4 rounded-xl border border-[var(--rf-card-line)] p-3">
                <label className="flex cursor-pointer items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--rf-muted)]"><Code2 className="h-3.5 w-3.5" /> Structured data (JSON-LD){schemaType ? ` · ${schemaType}` : ''}</span>
                  <input type="checkbox" checked={deploySchema} onChange={(e) => { setDeploySchema(e.target.checked); if (e.target.checked) setDeployInternalLinks(false) }} disabled={!jsonLd.trim()} className="h-4 w-4 accent-[var(--rf-blue-bright)] disabled:opacity-40" />
                </label>
                {!jsonLd.trim() ? (
                  <p className="mt-1.5 text-[11px] text-[var(--rf-faint)]">Click “Write with AI” to generate schema for this page.</p>
                ) : (
                  <>
                    <button onClick={() => setShowSchema((s) => !s)} className="mt-1.5 text-[11px] font-medium text-[var(--rf-blue-bright)] hover:text-white">{showSchema ? 'Hide' : 'View'} JSON-LD</button>
                    {showSchema && <pre className="mt-1.5 max-h-40 overflow-auto rounded-lg bg-black/40 p-2 text-[10px] leading-relaxed text-[var(--rf-muted)]">{jsonLd}</pre>}
                    <p className="mt-1 text-[11px] text-[var(--rf-faint)]">Added to the post body as a managed block and verified after deploy (needs the WordPress user to allow HTML/scripts).</p>
                  </>
                )}
              </div>

              {/* Automatic internal linking */}
              <div className="mt-3 rounded-xl border border-[var(--rf-card-line)] p-3">
                <label className="flex cursor-pointer items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--rf-muted)]"><Link2 className="h-3.5 w-3.5" /> Automatic internal linking</span>
                  <input type="checkbox" checked={deployInternalLinks} onChange={(e) => { setDeployInternalLinks(e.target.checked); if (e.target.checked) setDeploySchema(false) }} disabled={linkCandidates.length === 0} className="h-4 w-4 accent-[var(--rf-blue-bright)] disabled:opacity-40" />
                </label>
                {linkCandidates.length === 0 ? (
                  <p className="mt-1.5 text-[11px] text-[var(--rf-faint)]">No other pages on your site to link to yet.</p>
                ) : (
                  <>
                    <p className="mt-1.5 text-[11px] text-[var(--rf-faint)]">Adds links to {linkCandidates.length} real page{linkCandidates.length !== 1 ? 's' : ''} on your site, added to the post body as a managed block:</p>
                    <ul className="mt-1 space-y-0.5">
                      {linkCandidates.map((l) => (
                        <li key={l.url} className="truncate text-[11px] text-[var(--rf-muted)]">→ {l.anchor} <span className="text-[var(--rf-faint)]">({pathOf(l.url)})</span></li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {step === 'error' && <p className="mt-3 text-xs text-[var(--rf-red)]">{error}</p>}

              {step === 'confirm' ? (
                <div className="mt-5 rounded-xl border border-[var(--rf-card-line-strong)] bg-white/[0.02] p-3">
                  <p className="text-sm text-white">Deploy {changed} change{changed !== 1 ? 's' : ''} to your live site?</p>
                  <p className="mt-1 text-[11px] text-[var(--rf-faint)]">The change is read back and verified, and you can undo it right after.</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={deploy} className="rf-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"><Rocket className="h-4 w-4" /> Deploy now</button>
                    <button onClick={() => setStep('edit')} className="rf-btn-ghost rounded-xl px-4 py-2 text-sm font-medium">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setStep('confirm')} disabled={changed === 0 || step === 'applying'} className="rf-btn-primary mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
                  {step === 'applying' ? <><Loader2 className="h-4 w-4 animate-spin" /> Deploying…</> : <><Rocket className="h-4 w-4" /> Review &amp; deploy ({changed})</>}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
