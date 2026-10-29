'use client'

// AI search landscape — who answer engines actually cite for your topics.
//
// The citation tracker only ever answered yes/no: were we cited? But the engine
// hands back its entire source list, so the more useful question was always
// answerable and never asked — WHO WON INSTEAD, and how often does each of them
// win? That is a competitive scoreboard, and it was sitting in a discarded
// array.
//
// Three sections, in the order you'd actually use them:
//   1. Scoreboard  — share of voice across your prompts, you vs everyone
//   2. Losses      — prompt by prompt: who got cited, what the answer said,
//                    and what the sources have in common
//   3. Prompts     — what to start tracking, drawn from real search demand
//
// What this never does: predict a citation. No model says "add an FAQ and
// you'll be cited". Guidance is observations about what got cited plus facts
// about your own page — the causal link between them is explicitly not claimed.

import { useCallback, useEffect, useState } from 'react'
import {
  Loader2, RefreshCw, Plug, Sparkles, Trophy, ChevronDown, ChevronRight,
  Plus, Check, MessageSquareQuote, Quote,
} from 'lucide-react'
import { api, ApiError, type AiSearchPlanDTO, type PromptSuggestionDTO } from '../../../../lib/client'

const num = (n: number) => n.toLocaleString()
const pct = (n: number) => `${Math.round(n * 100)}%`
const hostLabel = (h: string) => h.replace(/^www\./, '')

const SHAPE_LABEL: Record<PromptSuggestionDTO['shape'], string> = {
  question: 'question',
  comparison: 'comparison',
  recommendation: 'shortlist',
}

export function AiLandscape({ projectId, onTrackPrompt }: {
  projectId: string
  onTrackPrompt?: (prompt: string) => Promise<void> | void
}) {
  const [plan, setPlan] = useState<AiSearchPlanDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [adding, setAdding] = useState<string | null>(null)
  const [added, setAdded] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setPlan(await api.getAiSearchPlan(projectId)) }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Could not load the AI search landscape.') }
    finally { setLoading(false) }
  }, [projectId])
  useEffect(() => { void load() }, [load])

  async function addPrompt(p: PromptSuggestionDTO) {
    setAdding(p.prompt)
    try {
      await onTrackPrompt?.(p.prompt)
      setAdded((s) => new Set(s).add(p.prompt))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not track that prompt.')
    } finally { setAdding(null) }
  }

  if (loading && !plan) {
    return <div className="rf-card flex items-center gap-2 p-5 text-sm text-[var(--rf-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Reading who gets cited for your prompts…</div>
  }
  if (error && !plan) {
    return <div className="rf-card p-5"><p className="text-sm text-[var(--rf-red)]">{error}</p><button onClick={() => void load()} className="rf-btn-ghost mt-3 rounded-lg px-3 py-1.5 text-xs">Retry</button></div>
  }
  if (!plan) return null

  const l = plan.landscape
  const rivals = l.domains.filter((d) => !d.isUs)
  const us = l.domains.find((d) => d.isUs)
  const topShare = Math.max(1, ...l.domains.map((d) => d.timesCited))

  return (
    <div className="space-y-4">
      {error && <p className="text-xs text-[var(--rf-red)]">{error}</p>}

      {/* ── 1. Scoreboard ────────────────────────────────────────────────── */}
      {l.queriesAnalysed === 0 ? (
        <div className="rf-card p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-white"><Trophy className="h-4 w-4 text-[var(--rf-amber)]" /> No answers to compare yet</p>
          <ul className="mt-2 space-y-1 text-xs text-[var(--rf-muted)]">
            {l.queriesTracked === 0 && <li>Track a prompt below, then run a check — each check records every source the engine used, not just whether you appeared.</li>}
            {l.queriesTracked > 0 && !plan.hasSourceData && (
              <li>Your existing checks were recorded before source lists were captured. Run a check again and the full picture — who got cited instead of you — appears here.</li>
            )}
            {l.queriesTracked > 0 && plan.hasSourceData && (
              <li>The most recent check for each prompt could not reach the answer engine, so there is nothing to compare. A failed check is not evidence you were left out.</li>
            )}
          </ul>
          <button onClick={() => void load()} className="rf-btn-ghost mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs"><RefreshCw className="h-3.5 w-3.5" /> Recheck</button>
        </div>
      ) : (
        <div className="rf-card overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--rf-card-line)] px-4 py-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-white"><Trophy className="h-4 w-4 text-[var(--rf-amber)]" /> Who gets cited for your prompts</p>
              <p className="mt-0.5 text-xs text-[var(--rf-muted)]">
                You appear in <span className="text-white">{l.queriesWhereWeAppear}</span> of <span className="text-white">{l.queriesAnalysed}</span> answered prompt{l.queriesAnalysed === 1 ? '' : 's'}
                {plan.competitorsTracked > 0 && <> · {plan.competitorsTracked} competitor{plan.competitorsTracked === 1 ? '' : 's'} tracked</>}
              </p>
            </div>
            <button onClick={() => void load()} disabled={loading} className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs disabled:opacity-60">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Refresh
            </button>
          </div>

          <ul className="divide-y divide-[var(--rf-card-line)]">
            {[...(us ? [us] : []), ...rivals].map((d) => (
              <li key={d.host} className="px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`truncate text-sm ${d.isUs ? 'font-semibold text-[var(--rf-green)]' : 'text-white'}`}>{hostLabel(d.host)}</span>
                      {d.isUs && <span className="rf-mono shrink-0 rounded border border-[var(--rf-green)]/40 px-1 py-0.5 text-[9px] uppercase text-[var(--rf-green)]">you</span>}
                      {d.isCompetitor && <span className="rf-mono shrink-0 rounded border border-[var(--rf-amber)]/40 px-1 py-0.5 text-[9px] uppercase text-[var(--rf-amber)]">competitor</span>}
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(d.timesCited / topShare) * 100}%`, background: d.isUs ? 'var(--rf-green)' : d.isCompetitor ? 'var(--rf-amber)' : 'var(--rf-blue-bright)' }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="rf-mono text-sm font-semibold text-white">{pct(d.shareOfVoice)}</p>
                    <p className="text-[10px] text-[var(--rf-faint)]">{d.timesCited}/{l.queriesAnalysed} · avg #{d.avgPosition}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {!us && (
            <p className="border-t border-[var(--rf-card-line)] px-4 py-2.5 text-[11px] text-[var(--rf-amber)]">
              Your domain does not appear in any answer for the prompts you track.
            </p>
          )}
        </div>
      )}

      {/* ── 2. Losses, prompt by prompt ──────────────────────────────────── */}
      {plan.guidance.length > 0 && (
        <div className="rf-card overflow-hidden">
          <div className="border-b border-[var(--rf-card-line)] px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-white"><MessageSquareQuote className="h-4 w-4 text-[var(--rf-blue-bright)]" /> Prompts you are losing</p>
            <p className="mt-0.5 text-xs text-[var(--rf-muted)]">What the engine answered, who it read to get there, and what those sources have in common.</p>
          </div>
          <ul className="divide-y divide-[var(--rf-card-line)]">
            {plan.guidance.map((g) => {
              const cmp = l.comparisons.find((c) => c.query === g.query)
              const isOpen = open === g.query
              return (
                <li key={g.query} className="px-4 py-3">
                  <button onClick={() => setOpen(isOpen ? null : g.query)} className="flex w-full items-start gap-2 text-left">
                    {isOpen ? <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--rf-faint)]" /> : <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--rf-faint)]" />}
                    <span className="min-w-0 flex-1 truncate text-sm text-white">{g.query}</span>
                    <span className="shrink-0 rf-mono text-[10px] text-[var(--rf-faint)]">{cmp?.sourceCount ?? 0} sources</span>
                  </button>

                  <div className="mt-1 flex flex-wrap items-center gap-1.5 pl-5">
                    {(cmp?.citedInstead ?? []).slice(0, 6).map((c) => (
                      <a
                        key={c.url}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`rounded-full border px-2 py-0.5 text-[10px] ${c.isCompetitor ? 'border-[var(--rf-amber)]/40 text-[var(--rf-amber)]' : 'border-[var(--rf-card-line)] text-[var(--rf-muted)] hover:text-white'}`}
                        title={c.url}
                      >
                        {c.position}. {hostLabel(c.host)}
                      </a>
                    ))}
                  </div>

                  {isOpen && (
                    <div className="mt-2.5 space-y-2.5 pl-5">
                      {cmp?.answer && (
                        <div className="rounded-lg border border-[var(--rf-card-line)] bg-black/20 p-3">
                          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--rf-faint)]"><Quote className="h-3 w-3" /> What the engine said</p>
                          <p className="mt-1 text-xs leading-relaxed text-[var(--rf-muted)]">{cmp.answer}</p>
                        </div>
                      )}
                      {g.observations.map((o) => (
                        <div key={o.label}>
                          <p className="text-[11px] font-medium text-white">{o.label}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-[var(--rf-muted)]">{o.detail}</p>
                        </div>
                      ))}
                      {g.ourPage && (
                        <a href={g.ourPage.url} target="_blank" rel="noopener noreferrer" className="inline-block text-[11px] text-[var(--rf-blue-bright)] hover:underline">
                          Open your page for this topic →
                        </a>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* ── 3. Prompts to try next ───────────────────────────────────────── */}
      <div className="rf-card overflow-hidden">
        <div className="border-b border-[var(--rf-card-line)] px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-white"><Sparkles className="h-4 w-4 text-[var(--rf-violet)]" /> Prompts worth tracking</p>
          <p className="mt-0.5 text-xs text-[var(--rf-muted)]">
            Built from queries people really typed into Google, rephrased the way they would be typed into an assistant. Not invented questions.
          </p>
        </div>
        {plan.prompts.length === 0 ? (
          <p className="px-4 py-5 text-sm text-[var(--rf-muted)]">
            {plan.promptsUnavailable
              ? <><Plug className="mr-1 inline h-3 w-3" />Connect Search Console — prompt suggestions come from your real search demand, and inventing plausible-sounding questions instead would waste every check you run. {plan.promptsUnavailable}</>
              : 'No conversational queries in your Search Console data yet, or everything suitable is already tracked.'}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--rf-card-line)]">
            {plan.prompts.map((p) => (
              <li key={p.prompt} className="flex items-start justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">{p.prompt}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--rf-faint)]">
                    <span className="rf-mono">{SHAPE_LABEL[p.shape]}</span> · from “{p.sourceQuery}” · {num(p.impressions)} impressions · you rank #{p.position.toFixed(1)}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-[var(--rf-muted)]">{p.reason}</p>
                </div>
                {added.has(p.prompt) ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-[var(--rf-green)]"><Check className="h-3.5 w-3.5" /> tracking</span>
                ) : (
                  <button
                    onClick={() => void addPrompt(p)}
                    disabled={adding === p.prompt}
                    className="rf-btn-ghost inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[11px] disabled:opacity-60"
                  >
                    {adding === p.prompt ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Track
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
