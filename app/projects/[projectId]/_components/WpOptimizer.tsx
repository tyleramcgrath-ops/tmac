'use client'

// Restored classic flow: browse the connected site's pages/posts and optimize
// any one of them with a single click — Forge writes an improved SEO title +
// meta description, you review, and deploy to the live site (verified by
// read-back, with one-click undo from the deployment history). Runs entirely
// on the secure per-project WordPress API (credentials stay server-side).

import { useState } from 'react'
import { Loader2, Wand2, Sparkles, ExternalLink, Rocket, Check, X, FileText, FileType2 } from 'lucide-react'
import { api, ApiError } from '../../../lib/client'

type PostType = 'posts' | 'pages'
interface WpItem { id: number; link: string; title: string; status: string }
interface WpPost { postId: number; postType: PostType; title: string; metaDescription: string; content: string; link: string }

function pathOf(url: string): string { try { const u = new URL(url); return (u.pathname + u.search) || '/' } catch { return url } }

export function WpBrowseOptimize({ projectId, onDeployed }: { projectId: string; onDeployed: () => void }) {
  const [type, setType] = useState<PostType>('posts')
  const [items, setItems] = useState<WpItem[]>([])
  const [loaded, setLoaded] = useState<PostType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openingId, setOpeningId] = useState<number | null>(null)
  const [editing, setEditing] = useState<WpPost | null>(null)

  async function list(t: PostType) {
    setType(t); setLoading(true); setError('')
    try {
      const { items } = await api.listWordpressItems(projectId, t)
      setItems(items); setLoaded(t)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not list items.'); setItems([]); setLoaded(t)
    } finally { setLoading(false) }
  }

  async function optimize(item: WpItem) {
    setOpeningId(item.id); setError('')
    try {
      const { post } = await api.getWordpressItem(projectId, type, item.id)
      setEditing(post)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not open item.')
    } finally { setOpeningId(null) }
  }

  return (
    <div className="rf-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Optimize a page or post</p>
          <p className="mt-0.5 text-xs text-[var(--rf-muted)]">Browse your site and one-click optimize any item — Forge writes the SEO title &amp; meta, you review, then deploy live.</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => list('posts')} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${type === 'posts' && loaded ? 'rf-btn-primary' : 'rf-btn-ghost'}`}><FileText className="h-3.5 w-3.5" /> Posts</button>
          <button onClick={() => list('pages')} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${type === 'pages' && loaded ? 'rf-btn-primary' : 'rf-btn-ghost'}`}><FileType2 className="h-3.5 w-3.5" /> Pages</button>
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
      {loading && <p className="mt-3 flex items-center gap-2 text-sm text-[var(--rf-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading {type}…</p>}

      {!loading && loaded && (
        items.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--rf-muted)]">No {loaded} found on the connected site.</p>
        ) : (
          <div className="mt-3 divide-y divide-[var(--rf-card-line)] overflow-hidden rounded-lg border border-[var(--rf-card-line)]">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm hover:bg-white/[0.02]">
                <div className="min-w-0">
                  <p className="truncate text-[var(--rf-text)]" dangerouslySetInnerHTML={{ __html: it.title || pathOf(it.link) }} />
                  <p className="truncate text-[11px] text-[var(--rf-faint)]">{pathOf(it.link)}{it.status && it.status !== 'publish' ? ` · ${it.status}` : ''}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a href={it.link} target="_blank" rel="noreferrer" className="text-[var(--rf-faint)] hover:text-white"><ExternalLink className="h-3.5 w-3.5" /></a>
                  <button onClick={() => optimize(it)} disabled={openingId === it.id} className="rf-btn-primary inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-60">
                    {openingId === it.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} Optimize
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {editing && <Optimizer projectId={projectId} post={editing} onClose={() => setEditing(null)} onDeployed={() => { setEditing(null); onDeployed() }} />}
    </div>
  )
}

function Optimizer({ projectId, post, onClose, onDeployed }: { projectId: string; post: WpPost; onClose: () => void; onDeployed: () => void }) {
  const [title, setTitle] = useState(post.title)
  const [meta, setMeta] = useState(post.metaDescription)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiNote, setAiNote] = useState('')
  const [aiErr, setAiErr] = useState('')
  const [step, setStep] = useState<'edit' | 'confirm' | 'applying' | 'done' | 'error'>('edit')
  const [error, setError] = useState('')

  const changed = (title !== post.title ? 1 : 0) + (meta !== post.metaDescription ? 1 : 0)

  async function writeWithAI() {
    setAiBusy(true); setAiErr(''); setAiNote('')
    try {
      const excerpt = post.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000)
      const r = await api.forgeRewrite({ url: post.link, currentTitle: title, currentMeta: meta, excerpt })
      if (r.seoTitle) setTitle(r.seoTitle)
      if (r.metaDescription) setMeta(r.metaDescription)
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
                <p className="rf-mono text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">Forge writes an optimized title &amp; meta</p>
                <button onClick={writeWithAI} disabled={aiBusy} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--rf-violet)]/40 bg-[var(--rf-violet)]/10 px-2.5 py-1 text-xs font-medium text-[var(--rf-violet)] hover:bg-[var(--rf-violet)]/20 disabled:opacity-60">
                  {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Write with AI
                </button>
              </div>
              {aiErr && <p className="mt-1 text-[11px] text-[var(--rf-red)]">{aiErr}</p>}
              {aiNote && <p className="mt-1 flex items-start gap-1.5 text-[11px] text-[var(--rf-muted)]"><Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[var(--rf-violet)]" />{aiNote}</p>}

              <label className="mt-3 block text-xs font-medium text-[var(--rf-muted)]">SEO title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="rf-card mt-1 w-full bg-transparent px-3 py-2 text-sm text-white focus:outline-none" />
              <p className="mt-1 text-[11px] text-[var(--rf-faint)]">{title.length} chars · aim 50–60</p>

              <label className="mt-4 block text-xs font-medium text-[var(--rf-muted)]">Meta description</label>
              <textarea value={meta} onChange={(e) => setMeta(e.target.value)} rows={3} className="rf-card mt-1 w-full resize-y bg-transparent px-3 py-2 text-sm text-white focus:outline-none" />
              <p className="mt-1 text-[11px] text-[var(--rf-faint)]">{meta.length} chars · aim 140–160</p>

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
