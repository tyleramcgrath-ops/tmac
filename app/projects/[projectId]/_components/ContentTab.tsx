'use client'

// Content Studio — AI drafts a blog post from real live Google results for a
// target keyword plus real tracked-competitor overlap (Mission Atlas). Never
// auto-published: a brief is only a draft until the user explicitly creates it
// as a WordPress draft, which is itself verified by read-back.

import { useCallback, useEffect, useState } from 'react'
import { FileText, Lightbulb, Loader2, PenSquare, Rocket, Sparkles, Trash2, X } from 'lucide-react'
import { api, ApiError, type ContentBriefDTO, type ContentGapDTO } from '../../../lib/client'
import { EmptyState, Field, inputClass, Spinner } from '../../../lib/ui'

function statusTone(status: ContentBriefDTO['status']): string {
  switch (status) {
    case 'published':
      return 'text-[var(--rf-green)] border-[var(--rf-green)]/40'
    case 'discarded':
      return 'text-[var(--rf-faint)] border-[var(--rf-card-line)]'
    default:
      return 'text-[var(--rf-blue-bright)] border-[var(--rf-blue-bright)]/40'
  }
}

export function ContentTab({ projectId }: { projectId: string }) {
  const [briefs, setBriefs] = useState<ContentBriefDTO[] | null>(null)
  const [gaps, setGaps] = useState<ContentGapDTO[] | null>(null)
  const [keyword, setKeyword] = useState('')
  const [busy, setBusy] = useState(false)
  const [draftingGap, setDraftingGap] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<ContentBriefDTO | null>(null)

  const load = useCallback(async () => {
    try {
      const { briefs } = await api.listContentBriefs(projectId)
      setBriefs(briefs)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load content briefs.')
      setBriefs([])
    }
  }, [projectId])
  useEffect(() => {
    void load()
  }, [load])
  useEffect(() => {
    api.getContentGaps(projectId).then(({ gaps }) => setGaps(gaps)).catch(() => setGaps([]))
  }, [projectId])

  async function generate(overrideKeyword?: string) {
    const kw = (overrideKeyword ?? keyword).trim()
    if (!kw) return
    setBusy(true)
    setError('')
    try {
      const { brief } = await api.generateContentBrief(projectId, kw)
      setKeyword('')
      setBriefs((b) => [brief, ...(b ?? [])])
      setOpen(brief)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Content generation failed.')
    } finally {
      setBusy(false)
      setDraftingGap(null)
    }
  }

  async function draftGap(gap: ContentGapDTO) {
    setDraftingGap(gap.url)
    await generate(gap.title)
    setGaps((g) => (g ?? []).filter((x) => x.url !== gap.url))
  }

  async function discard(id: string) {
    setBriefs((b) => (b ?? []).filter((x) => x.id !== id))
    try {
      await api.deleteContentBrief(projectId, id)
    } catch {
      void load()
    }
  }

  return (
    <div className="space-y-5">
      <div className="rf-card rf-topline p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--rf-violet)]" />
          <h2 className="text-sm font-semibold text-white">Content Studio</h2>
        </div>
        <p className="mt-1 text-xs text-[var(--rf-muted)]">
          Forge researches what’s actually ranking for a keyword — real Google results, real tracked competitors — then drafts an original blog post. Nothing publishes automatically; you review and create it as a WordPress draft when you’re ready.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <Field label="Target keyword">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !busy && generate()}
                placeholder="e.g. best crm for small teams"
                className={inputClass}
                disabled={busy}
              />
            </Field>
          </div>
          <button
            onClick={() => generate()}
            disabled={busy || !keyword.trim()}
            className="rf-btn-primary mt-1 inline-flex h-[38px] shrink-0 items-center gap-1.5 self-end rounded-lg px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenSquare className="h-4 w-4" />}
            {busy ? 'Researching & drafting…' : 'Research & draft'}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-[var(--rf-red)]">{error}</p>}
      </div>

      {gaps && gaps.length > 0 && (
        <div className="rf-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[var(--rf-card-line)] px-4 py-2.5">
            <Lightbulb className="h-3.5 w-3.5 text-[var(--rf-amber)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Content gaps — topics your competitors cover that you don’t</span>
          </div>
          <div className="divide-y divide-[var(--rf-card-line)]">
            {gaps.map((g) => (
              <div key={g.url} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-white">{g.title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--rf-faint)]">from {g.competitorDomain}</p>
                </div>
                <button
                  onClick={() => draftGap(g)}
                  disabled={busy}
                  className="rf-btn-ghost inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {draftingGap === g.url ? <Loader2 className="h-3 w-3 animate-spin" /> : <PenSquare className="h-3 w-3" />}
                  {draftingGap === g.url ? 'Drafting…' : 'Draft this'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {briefs === null ? (
        <Spinner label="Loading content briefs…" />
      ) : briefs.length === 0 ? (
        <EmptyState title="No drafts yet" detail="Enter a keyword above and Forge will research it and draft a post." />
      ) : (
        <div className="space-y-2">
          {briefs.map((b) => (
            <button
              key={b.id}
              onClick={() => setOpen(b)}
              className="rf-card flex w-full items-center justify-between gap-3 p-4 text-left transition hover:border-[var(--rf-blue-bright)]/40"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--rf-faint)]" />
                  <span className="truncate text-sm font-medium text-white">{b.title || b.keyword}</span>
                </div>
                <p className="mt-1 truncate text-xs text-[var(--rf-muted)]">Keyword: {b.keyword}{b.competitorsConsidered.length > 0 ? ` · vs ${b.competitorsConsidered.join(', ')}` : ''}</p>
              </div>
              <span className={`rf-mono shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase ${statusTone(b.status)}`}>{b.status}</span>
            </button>
          ))}
        </div>
      )}

      {open && (
        <BriefModal
          projectId={projectId}
          brief={open}
          onClose={() => setOpen(null)}
          onUpdated={(b) => {
            setOpen(b)
            setBriefs((all) => (all ?? []).map((x) => (x.id === b.id ? b : x)))
          }}
          onDiscarded={(id) => {
            setOpen(null)
            discard(id)
          }}
        />
      )}
    </div>
  )
}

function BriefModal({
  projectId,
  brief,
  onClose,
  onUpdated,
  onDiscarded,
}: {
  projectId: string
  brief: ContentBriefDTO
  onClose: () => void
  onUpdated: (b: ContentBriefDTO) => void
  onDiscarded: (id: string) => void
}) {
  const [postType, setPostType] = useState<'posts' | 'pages'>('posts')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  async function publish() {
    setBusy(true)
    setError('')
    setNote('')
    try {
      const { brief: updated, note } = await api.publishContentBrief(projectId, brief.id, postType)
      onUpdated(updated)
      setNote(note)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the WordPress draft. Connect WordPress for this project first.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8" onClick={onClose}>
      <div className="rf-card rf-topline relative my-auto w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-5 py-3.5">
          <span className="flex items-center gap-2 text-sm font-semibold text-white"><FileText className="h-4 w-4 text-[var(--rf-blue-bright)]" /> Content brief</span>
          <button onClick={onClose} className="rf-btn-ghost grid h-8 w-8 place-items-center rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[74vh] overflow-y-auto p-5">
          <p className="rf-mono text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">Target keyword: {brief.keyword}</p>

          <h3 className="mt-3 text-base font-semibold text-white">{brief.title}</h3>
          <p className="mt-1 text-sm text-[var(--rf-muted)]">{brief.metaDescription}</p>

          {brief.rationale && (
            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-[var(--rf-muted)]"><Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[var(--rf-violet)]" />{brief.rationale}</p>
          )}

          <div className="mt-4 rounded-xl border border-[var(--rf-card-line)] p-3">
            <p className="text-xs font-medium text-[var(--rf-muted)]">Research evidence</p>
            {brief.serpAvailable ? (
              <>
                <p className="mt-1 text-[11px] text-[var(--rf-faint)]">
                  {brief.serpResults.length} live Google result{brief.serpResults.length !== 1 ? 's' : ''} for this keyword{brief.competitorsConsidered.length > 0 ? `, including ${brief.competitorsConsidered.length} tracked competitor${brief.competitorsConsidered.length !== 1 ? 's' : ''}` : ''}.
                </p>
                <ul className="mt-1.5 space-y-1">
                  {brief.serpResults.slice(0, 5).map((r) => (
                    <li key={r.url} className="truncate text-[11px] text-[var(--rf-muted)]">
                      #{r.position} {r.title || r.url} {r.competitorDomain && <span className="text-[var(--rf-blue-bright)]">· {r.competitorDomain}</span>}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-1 text-[11px] text-[var(--rf-faint)]">Live SERP research unavailable — connect a SERP API to ground future drafts in real Google results. This draft was written from keyword intent only.</p>
            )}
          </div>

          <p className="mt-4 text-xs font-medium text-[var(--rf-muted)]">Draft</p>
          <div
            className="rf-card mt-1.5 max-h-72 overflow-y-auto bg-black/20 p-4 text-sm leading-relaxed text-[var(--rf-muted)] [&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mt-2 [&_h3]:font-semibold [&_h3]:text-white [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: brief.contentHtml }}
          />

          {error && <p className="mt-3 text-xs text-[var(--rf-red)]">{error}</p>}
          {note && <p className="mt-3 text-xs text-[var(--rf-green)]">{note}</p>}

          {brief.status === 'published' ? (
            <div className="mt-5 rounded-xl border border-[var(--rf-green)]/30 bg-[var(--rf-green)]/[0.06] p-3">
              <p className="text-sm text-white">Created as a WordPress draft.</p>
              {brief.wpLink && (
                <a href={brief.wpLink} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-[var(--rf-blue-bright)] hover:text-white">
                  Open in WordPress →
                </a>
              )}
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <select value={postType} onChange={(e) => setPostType(e.target.value as 'posts' | 'pages')} className={`${inputClass} w-auto`} disabled={busy}>
                <option value="posts">Post</option>
                <option value="pages">Page</option>
              </select>
              <button onClick={publish} disabled={busy} className="rf-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Create as WordPress draft
              </button>
              <button
                onClick={() => onDiscarded(brief.id)}
                className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-[var(--rf-muted)]"
              >
                <Trash2 className="h-3.5 w-3.5" /> Discard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
