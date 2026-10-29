'use client'

// The content plan — "what should I write next?", answered from data instead of
// from a blank text box.
//
// Content Studio can draft a post about any keyword, but you had to already
// know the keyword. This ranks real opportunities and hands each one straight
// to the drafter, so the hardest step (deciding) is done before you type.
//
// Each row states its evidence in plain numbers — impressions, current
// position, current word count. There is deliberately no "estimated traffic
// gain": that number requires assuming a CTR curve nobody can verify per site,
// and it would be the most-quoted and least-true thing on the page.

import { useCallback, useEffect, useState } from 'react'
import {
  Loader2, PenSquare, RefreshCw, Merge, Expand, HelpCircle, FilePlus2,
  Binoculars, ChevronDown, ChevronRight, Plug,
} from 'lucide-react'
import { api, ApiError, type ContentPlanDTO, type ContentOpportunityDTO, type ContentActionDTO } from '../../../lib/client'

const num = (n: number) => n.toLocaleString()
const pathOf = (u: string) => { try { return new URL(u).pathname || '/' } catch { return u } }

const ACTIONS: Record<ContentActionDTO, { label: string; verb: string; icon: typeof Merge; color: string; blurb: string }> = {
  consolidate: {
    label: 'Consolidate', verb: 'Merge into one page', icon: Merge, color: 'var(--rf-violet)',
    blurb: 'Several of your pages compete for one query. Merging concentrates the signal Google is splitting.',
  },
  expand: {
    label: 'Expand', verb: 'Expand this page', icon: Expand, color: 'var(--rf-green)',
    blurb: 'You already rank and the page is thin. Google finds it relevant — it is just underbuilt.',
  },
  answer: {
    label: 'Answer', verb: 'Write the answer', icon: HelpCircle, color: 'var(--rf-blue-bright)',
    blurb: 'A question you appear for on a page that does not really answer it.',
  },
  create: {
    label: 'Create', verb: 'Write a new page', icon: FilePlus2, color: 'var(--rf-amber)',
    blurb: 'Real impressions, no page written for it. Demand you have nothing to serve.',
  },
  'competitor-gap': {
    label: 'Competitor bet', verb: 'Draft this topic', icon: Binoculars, color: 'var(--rf-faint)',
    blurb: 'A competitor covers this. No demand data behind it — their bet, not a measurement.',
  },
}

const ORDER: ContentActionDTO[] = ['consolidate', 'expand', 'answer', 'create', 'competitor-gap']

export function ContentPlan({ projectId, busy, onDraft }: {
  projectId: string
  busy: boolean
  onDraft: (topic: string) => void | Promise<void>
}) {
  const [plan, setPlan] = useState<ContentPlanDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<ContentActionDTO | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [drafted, setDrafted] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setPlan(await api.getContentPlan(projectId)) }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Could not build the content plan.') }
    finally { setLoading(false) }
  }, [projectId])
  useEffect(() => { void load() }, [load])

  async function draft(o: ContentOpportunityDTO) {
    setDrafted((s) => new Set(s).add(o.id))
    await onDraft(o.topic)
  }

  if (loading && !plan) {
    return <div className="rf-card flex items-center gap-2 p-5 text-sm text-[var(--rf-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Working out what to write next…</div>
  }
  if (error && !plan) {
    return <div className="rf-card p-5"><p className="text-sm text-[var(--rf-red)]">{error}</p><button onClick={() => void load()} className="rf-btn-ghost mt-3 rounded-lg px-3 py-1.5 text-xs">Retry</button></div>
  }
  if (!plan) return null

  const rows = plan.opportunities.filter((o) => filter === 'all' || o.action === filter)
  const s = plan.summary

  // Nothing to suggest. Say which input is missing rather than showing an empty
  // card that reads as "your content is perfect".
  if (s.total === 0) {
    return (
      <div className="rf-card p-5">
        <p className="text-sm font-semibold text-white">No content opportunities to show yet</p>
        <ul className="mt-2 space-y-1 text-xs text-[var(--rf-muted)]">
          {plan.searchConsoleUnavailable && (
            <li className="flex items-start gap-1.5"><Plug className="mt-0.5 h-3 w-3 shrink-0" /> Search Console is not connected, so there is no demand data to rank topics by. That is the single biggest input here — {plan.searchConsoleUnavailable}</li>
          )}
          {!plan.hasCrawl && <li className="flex items-start gap-1.5"><Plug className="mt-0.5 h-3 w-3 shrink-0" /> No crawl has run, so page word counts are unknown and “expand this thin page” cannot be computed. Run an audit.</li>}
          {plan.competitorsTracked === 0 && <li className="flex items-start gap-1.5"><Plug className="mt-0.5 h-3 w-3 shrink-0" /> No competitors tracked, so competitor topic gaps are unavailable.</li>}
          {!plan.searchConsoleUnavailable && plan.hasCrawl && (
            <li>Every input is connected and nothing crossed the thresholds — no split queries, no thin pages ranking 4-20, no unanswered questions with real impressions.</li>
          )}
        </ul>
        <button onClick={() => void load()} className="rf-btn-ghost mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs"><RefreshCw className="h-3.5 w-3.5" /> Recheck</button>
      </div>
    )
  }

  return (
    <div className="rf-card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--rf-card-line)] px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-white">What to write next</p>
          <p className="mt-0.5 text-xs text-[var(--rf-muted)]">
            {s.total} opportunit{s.total === 1 ? 'y' : 'ies'} from your own Search Console demand
            {plan.hasCrawl ? ` and ${num(plan.pagesCrawled)} crawled pages` : ''}
            {s.addressableImpressions != null && <> · <span className="text-white">{num(s.addressableImpressions)}</span> impressions behind them</>}
          </p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs disabled:opacity-60">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Refresh
        </button>
      </div>

      {/* Filter by the kind of work, since "merge two pages" and "write a new
          post" are different afternoons. */}
      <div className="flex flex-wrap gap-1.5 border-b border-[var(--rf-card-line)] px-4 py-2.5">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-full px-2.5 py-1 text-[11px] ${filter === 'all' ? 'bg-white/[0.08] text-white' : 'text-[var(--rf-muted)] hover:bg-white/[0.03]'}`}
        >All {s.total}</button>
        {ORDER.filter((a) => s.byAction[a] > 0).map((a) => {
          const meta = ACTIONS[a]
          const active = filter === a
          return (
            <button
              key={a}
              onClick={() => setFilter(active ? 'all' : a)}
              title={meta.blurb}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${active ? 'bg-white/[0.08] text-white' : 'text-[var(--rf-muted)] hover:bg-white/[0.03]'}`}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
              {meta.label} {s.byAction[a]}
            </button>
          )
        })}
      </div>

      <ul className="divide-y divide-[var(--rf-card-line)]">
        {rows.map((o) => {
          const meta = ACTIONS[o.action]
          const Icon = meta.icon
          const open = expanded === o.id
          return (
            <li key={o.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in srgb, ${meta.color} 14%, transparent)`, color: meta.color }}>
                  <Icon className="h-3.5 w-3.5" />
                </span>

                <div className="min-w-0 flex-1">
                  <button onClick={() => setExpanded(open ? null : o.id)} className="flex w-full items-center gap-2 text-left">
                    {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--rf-faint)]" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--rf-faint)]" />}
                    <span className="truncate text-sm text-white">{o.topic}</span>
                    <span className="rf-mono shrink-0 text-[10px] uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</span>
                  </button>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-5 text-[11px] text-[var(--rf-faint)]">
                    {o.impressions > 0 && <span><span className="text-[var(--rf-muted)]">{num(o.impressions)}</span> impressions</span>}
                    {o.position != null && <span>currently <span className="text-[var(--rf-muted)]">#{o.position.toFixed(1)}</span></span>}
                    {o.targetWordCount != null && <span><span className="text-[var(--rf-muted)]">{num(o.targetWordCount)}</span> words today</span>}
                    {o.pagesInvolved.length > 1 && <span><span className="text-[var(--rf-muted)]">{o.pagesInvolved.length}</span> pages competing</span>}
                  </div>

                  {open && (
                    <div className="mt-2 space-y-2 pl-5">
                      <p className="text-xs leading-relaxed text-[var(--rf-muted)]">{o.reason}</p>
                      {o.pagesInvolved.length > 0 && (
                        <ul className="space-y-0.5">
                          {o.pagesInvolved.map((u) => (
                            <li key={u}>
                              <a href={u} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[var(--rf-muted)] hover:text-white">{pathOf(u)}</a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => void draft(o)}
                  disabled={busy}
                  className="rf-btn-ghost inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium disabled:cursor-not-allowed disabled:opacity-60"
                  title={meta.verb}
                >
                  {busy && drafted.has(o.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <PenSquare className="h-3 w-3" />}
                  {busy && drafted.has(o.id) ? 'Drafting…' : 'Draft'}
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {plan.searchConsoleUnavailable && (
        <p className="border-t border-[var(--rf-card-line)] px-4 py-2.5 text-[11px] text-[var(--rf-faint)]">
          <Plug className="mr-1 inline h-3 w-3" />
          These are competitor topics only. Connect Search Console to rank topics by demand you can actually measure.
        </p>
      )}
      {!plan.searchConsoleUnavailable && !plan.hasCrawl && (
        <p className="border-t border-[var(--rf-card-line)] px-4 py-2.5 text-[11px] text-[var(--rf-faint)]">
          Run an audit to unlock “expand this thin page” — it needs word counts from a crawl.
        </p>
      )}
    </div>
  )
}
