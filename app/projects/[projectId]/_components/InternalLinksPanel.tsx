'use client'

// Turns the "Internal Links" audit tab's orphan / no-outbound-link findings
// into a one-click fix, instead of only ever being read-only diagnostics.
// Every page is matched to a real WordPress post by URL — never guessed — and
// link candidates are always OTHER real posts/pages already on the connected
// site, deployed through the same verified append-internal-links content
// transform every other internal-linking path in the app uses.

import { useEffect, useMemo, useState } from 'react'
import { Check, Link2, Loader2 } from 'lucide-react'
import { api, ApiError } from '../../../lib/client'
import { pathOf } from './dashboard/analytics'
import { rankLinkCandidates } from '@/lib/foundation/reco/link-ranking'

interface WpItem { id: number; type: 'posts' | 'pages'; link: string; title: string; status: string }
export interface LinkTarget { url: string; title: string; reason: string }

function keyOf(it: { type: string; id: number }): string {
  return `${it.type}:${it.id}`
}

// Picks link targets by topical relevance to the page being linked FROM
// (title + URL overlap), not an arbitrary slice — the same real pages either
// way, just the ones actually related to this content, which is what search
// engines and readers benefit from.
function pickLinkCandidates(current: WpItem, all: WpItem[], n = 3): { url: string; anchor: string }[] {
  const pool = all.filter((it) => keyOf(it) !== keyOf(current) && it.link && it.title)
  return rankLinkCandidates({ url: current.link, title: current.title }, pool.map((it) => ({ url: it.link, title: it.title })), n)
}

type RowState = { status: 'idle' | 'busy' | 'linked' | 'skipped' | 'error'; note: string }

export function InternalLinksPanel({ projectId, targets }: { projectId: string; targets: LinkTarget[] }) {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [items, setItems] = useState<WpItem[] | null>(null)
  const [rowState, setRowState] = useState<Record<string, RowState>>({})
  const [runningAll, setRunningAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { connection } = await api.getWordpress(projectId)
        if (cancelled) return
        setConnected(!!connection)
        if (connection) {
          const { items } = await api.listWordpressItems(projectId, 'all')
          if (!cancelled) setItems(items)
        }
      } catch {
        if (!cancelled) setConnected(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [projectId])

  const matched = useMemo(() => {
    const m = new Map<string, WpItem>()
    if (!items) return m
    const byPath = new Map(items.map((it) => [pathOf(it.link), it]))
    for (const t of targets) {
      const it = byPath.get(pathOf(t.url))
      if (it) m.set(t.url, it)
    }
    return m
  }, [items, targets])

  async function linkOne(url: string) {
    const it = matched.get(url)
    if (!it || !items) return
    setRowState((s) => ({ ...s, [url]: { status: 'busy', note: '' } }))
    const links = pickLinkCandidates(it, items)
    if (links.length === 0) {
      setRowState((s) => ({ ...s, [url]: { status: 'skipped', note: 'No other pages to link to.' } }))
      return
    }
    try {
      const { deployment } = await api.deployWordpress(projectId, {
        postId: it.id,
        postType: it.type,
        internalLinks: links,
        reason: 'Internal linking — Internal Links tab',
      })
      setRowState((s) => ({
        ...s,
        [url]: deployment.status === 'failed' ? { status: 'error', note: deployment.result || 'Deploy failed.' } : { status: 'linked', note: '' },
      }))
    } catch (err) {
      setRowState((s) => ({ ...s, [url]: { status: 'error', note: err instanceof ApiError ? err.message : 'Deploy failed.' } }))
    }
  }

  async function linkAll() {
    setRunningAll(true)
    const linkable = targets.filter((t) => matched.has(t.url) && rowState[t.url]?.status !== 'linked')
    for (const t of linkable) {
      await linkOne(t.url)
    }
    setRunningAll(false)
  }

  if (connected === false) {
    return (
      <p className="rf-card px-4 py-3 text-xs text-[var(--rf-muted)]">
        Connect WordPress (in the WordPress tab) to fix these automatically — you can still see the list above.
      </p>
    )
  }
  if (connected === null || items === null) return null // loading; the plain list above already shows the findings

  const linkableCount = targets.filter((t) => matched.has(t.url) && rowState[t.url]?.status !== 'linked').length

  return (
    <div className="rf-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--rf-muted)]">Fix automatically</span>
        <button
          onClick={linkAll}
          disabled={runningAll || linkableCount === 0}
          className="rf-btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {runningAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
          {runningAll ? 'Linking…' : `Link all (${linkableCount})`}
        </button>
      </div>
      <div className="divide-y divide-[var(--rf-card-line)]">
        {targets.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[var(--rf-green)]">
            <Check className="mr-1 inline h-4 w-4" /> Nothing to fix — great internal linking.
          </p>
        ) : (
          targets.map((t) => {
            const st = rowState[t.url]
            const hasMatch = matched.has(t.url)
            return (
              <div key={t.url} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-[var(--rf-muted)]">{pathOf(t.url)}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">{t.reason}</p>
                </div>
                {st?.status === 'linked' ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs text-[var(--rf-green)]"><Check className="h-3.5 w-3.5" /> Linked</span>
                ) : st?.status === 'busy' ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--rf-blue-bright)]" />
                ) : st?.status === 'skipped' || st?.status === 'error' ? (
                  <span className={`shrink-0 text-[11px] ${st.status === 'error' ? 'text-[var(--rf-red)]' : 'text-[var(--rf-faint)]'}`}>{st.note}</span>
                ) : hasMatch ? (
                  <button onClick={() => linkOne(t.url)} className="rf-btn-ghost shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium">
                    Link this page
                  </button>
                ) : (
                  <span className="shrink-0 text-[11px] text-[var(--rf-faint)]">No matching WordPress post</span>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
