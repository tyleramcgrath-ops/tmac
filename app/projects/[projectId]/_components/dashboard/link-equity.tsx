'use client'

// Link equity — "your best pages are the ones nobody links to."
//
// The Internal Links tab has only ever asked a structural question: is anything
// orphaned? That treats every page as equally worth reaching. The pages that
// actually earn impressions are the ones worth pointing authority at, and they
// are routinely the least-linked — a post that quietly ranks for 40 queries
// gets one link from an archive page, while About sits in the header sitewide.
//
// This ranks earning pages by how far their internal-link position trails their
// demand, and names the topically-related pages that should carry the new link,
// with the anchor text to use.
//
// It states facts and proposes an action. There is no predicted rank gain here:
// internal links are one input among many, and "+3 positions" would be a guess.

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, Link2, Plug, ChevronDown, ChevronRight, Copy, Check, Radar } from 'lucide-react'
import { api, ApiError, type LinkEquityPlanDTO, type LinkEquityRowDTO } from '../../../../lib/client'

const num = (n: number) => n.toLocaleString()
const pathOf = (u: string) => { try { return new URL(u).pathname || '/' } catch { return u } }

export function LinkEquity({ projectId }: { projectId: string }) {
  const [plan, setPlan] = useState<LinkEquityPlanDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setPlan(await api.getLinkEquity(projectId)) }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Could not analyse internal links.') }
    finally { setLoading(false) }
  }, [projectId])
  useEffect(() => { void load() }, [load])

  async function copyAnchor(row: LinkEquityRowDTO, suggestionFrom: string) {
    const html = `<a href="${row.url}">${row.suggestions[0]?.anchor ?? row.title ?? row.url}</a>`
    try {
      await navigator.clipboard.writeText(html)
      setCopied(`${row.url}|${suggestionFrom}`)
      setTimeout(() => setCopied(null), 2000)
    } catch { /* clipboard blocked — the markup is on screen anyway */ }
  }

  if (loading && !plan) {
    return <div className="rf-card flex items-center gap-2 p-5 text-sm text-[var(--rf-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Comparing your link graph against what actually earns…</div>
  }
  if (error && !plan) {
    return <div className="rf-card p-5"><p className="text-sm text-[var(--rf-red)]">{error}</p><button onClick={() => void load()} className="rf-btn-ghost mt-3 rounded-lg px-3 py-1.5 text-xs">Retry</button></div>
  }
  if (!plan) return null

  // Both halves of the join are required. Name the missing one instead of an
  // empty card that reads as "your internal linking is perfect".
  if (plan.rows.length === 0) {
    return (
      <div className="rf-card p-5">
        <div className="flex items-center gap-2"><Link2 className="h-4 w-4 text-[var(--rf-blue-bright)]" /><p className="text-sm font-semibold text-white">Link equity</p></div>
        <ul className="mt-2 space-y-1 text-xs text-[var(--rf-muted)]">
          {plan.searchConsoleUnavailable && (
            <li className="flex items-start gap-1.5"><Plug className="mt-0.5 h-3 w-3 shrink-0" /> Connect Search Console — without it there is no way to know which pages are worth linking to. {plan.searchConsoleUnavailable}</li>
          )}
          {!plan.hasCrawl && <li className="flex items-start gap-1.5"><Plug className="mt-0.5 h-3 w-3 shrink-0" /> Run an audit — the internal link graph comes from a crawl.</li>}
          {!plan.searchConsoleUnavailable && plan.hasCrawl && (
            <li>Your internal linking already tracks your demand — the pages that earn the most are also the ones most linked to. Nothing to move.</li>
          )}
        </ul>
        <button onClick={() => void load()} className="rf-btn-ghost mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs"><RefreshCw className="h-3.5 w-3.5" /> Recheck</button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rf-card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--rf-card-line)] px-4 py-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-white"><Link2 className="h-4 w-4 text-[var(--rf-blue-bright)]" /> Earning pages nobody links to</p>
            <p className="mt-0.5 text-xs text-[var(--rf-muted)]">
              {plan.rows.length} page{plan.rows.length === 1 ? '' : 's'} sit far lower on internal links than on search demand, across {num(plan.pagesCrawled)} crawled pages.
            </p>
          </div>
          <button onClick={() => void load()} disabled={loading} className="rf-btn-ghost inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs disabled:opacity-60">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Refresh
          </button>
        </div>

        <ul className="divide-y divide-[var(--rf-card-line)]">
          {plan.rows.map((r) => {
            const isOpen = open === r.url
            return (
              <li key={r.url} className="px-4 py-3">
                <button onClick={() => setOpen(isOpen ? null : r.url)} className="flex w-full items-start gap-2 text-left">
                  {isOpen ? <ChevronDown className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--rf-faint)]" /> : <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--rf-faint)]" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">{r.title || pathOf(r.url)}</p>
                    <p className="mt-0.5 truncate text-[11px] text-[var(--rf-faint)]">{pathOf(r.url)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="rf-mono text-sm font-semibold text-white">{r.inboundLinks}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">inbound link{r.inboundLinks === 1 ? '' : 's'}</p>
                  </div>
                </button>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-5 text-[11px] text-[var(--rf-faint)]">
                  <span><span className="text-[var(--rf-muted)]">{num(r.impressions)}</span> impressions</span>
                  <span><span className="text-[var(--rf-muted)]">{num(r.clicks)}</span> clicks</span>
                  <span><span className="text-[var(--rf-muted)]">{r.queries}</span> queries</span>
                  <span>#{r.demandRank} by demand · #{r.linkRank} by links</span>
                </div>

                {isOpen && (
                  <div className="mt-2.5 space-y-2 pl-5">
                    <p className="text-xs leading-relaxed text-[var(--rf-muted)]">
                      This page is your <span className="text-white">#{r.demandRank}</span> earner
                      {r.topQuery && <> (mostly from “{r.topQuery}”)</>}, but only <span className="text-white">{r.inboundLinks}</span> of your own page{r.inboundLinks === 1 ? '' : 's'} link{r.inboundLinks === 1 ? 's' : ''} to it — <span className="text-white">#{r.linkRank}</span> on the site. Internal links pass authority and help people find it.
                    </p>

                    {r.suggestions.length === 0 ? (
                      <p className="text-[11px] text-[var(--rf-faint)]">Every topically-related page already links here.</p>
                    ) : (
                      <>
                        <p className="text-[11px] uppercase tracking-wider text-[var(--rf-faint)]">Add a link from these pages</p>
                        <ul className="space-y-1">
                          {r.suggestions.map((sg) => (
                            <li key={sg.from} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--rf-card-line)] px-2.5 py-1.5">
                              <div className="min-w-0">
                                <a href={sg.from} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-[var(--rf-muted)] hover:text-white">{sg.fromTitle || pathOf(sg.from)}</a>
                                <p className="truncate text-[10px] text-[var(--rf-faint)]">anchor: “{sg.anchor}”</p>
                              </div>
                              <button
                                onClick={() => void copyAnchor(r, sg.from)}
                                className="rf-btn-ghost inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px]"
                                title="Copy the anchor markup"
                              >
                                {copied === `${r.url}|${sg.from}` ? <Check className="h-3 w-3 text-[var(--rf-green)]" /> : <Copy className="h-3 w-3" />}
                                {copied === `${r.url}|${sg.from}` ? 'Copied' : 'Copy link'}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {plan.uncrawledEarners.length > 0 && (
        <div className="rf-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[var(--rf-card-line)] px-4 py-2.5">
            <Radar className="h-3.5 w-3.5 text-[var(--rf-amber)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Ranking, but never crawled</span>
          </div>
          <p className="px-4 pt-2.5 text-[11px] text-[var(--rf-muted)]">
            Google ranks these pages and the crawler never reached them — usually a link-depth or sitemap gap. They cannot receive internal-link analysis until the crawl finds them.
          </p>
          <ul className="mt-1 divide-y divide-[var(--rf-card-line)]">
            {plan.uncrawledEarners.map((u) => (
              <li key={u.page} className="flex items-center justify-between gap-3 px-4 py-2">
                <a href={u.page} target="_blank" rel="noopener noreferrer" className="truncate text-xs text-[var(--rf-muted)] hover:text-white">{pathOf(u.page)}</a>
                <span className="shrink-0 rf-mono text-[11px] text-[var(--rf-faint)]">{num(u.impressions)} impr.</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
