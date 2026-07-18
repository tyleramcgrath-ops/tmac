'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getBrief,
  getCitations,
  listProposals,
  listSites,
  type ChangeProposal,
  type CitationDelta,
  type CitationSnapshot,
  type MonitoredSite,
  type WhileYouWereAwayBrief,
} from '@/lib/north-star-api'

export interface LiveState {
  loading: boolean
  error: string | null
  sites: MonitoredSite[]
  activeSite: MonitoredSite | null
  brief: WhileYouWereAwayBrief | null
  citations: CitationSnapshot | null
  citationDeltas: CitationDelta[]
  proposals: ChangeProposal[]
}

const EMPTY: LiveState = {
  loading: true,
  error: null,
  sites: [],
  activeSite: null,
  brief: null,
  citations: null,
  citationDeltas: [],
  proposals: [],
}

/**
 * Loads the real Business Twin for the office: the monitored sites, and for the
 * active one, its overnight brief, AI-citation snapshot, and pending fix
 * proposals. Honest by construction — everything is null/empty until real runs
 * exist, so the UI shows genuine "connect me / no runs yet" states, never fakes.
 */
export function useNorthStarLive(siteIdOverride?: string): LiveState & { refresh: () => void } {
  const [state, setState] = useState<LiveState>(EMPTY)
  const [nonce, setNonce] = useState(0)
  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setState((s) => ({ ...s, loading: true, error: null }))
      try {
        const sites = await listSites()
        const active = siteIdOverride ? sites.find((s) => s.id === siteIdOverride) ?? null : sites[0] ?? null
        if (!active) {
          if (!cancelled) setState({ ...EMPTY, loading: false, sites })
          return
        }
        const [briefRes, citeRes, proposals] = await Promise.all([
          getBrief(active.id).catch(() => ({ brief: null })),
          getCitations(active.id).catch(() => ({ latest: null, history: [], deltas: [] })),
          listProposals(active.id).catch(() => []),
        ])
        if (cancelled) return
        setState({
          loading: false,
          error: null,
          sites,
          activeSite: active,
          brief: briefRes.brief ?? null,
          citations: citeRes.latest ?? null,
          citationDeltas: citeRes.deltas ?? [],
          proposals,
        })
      } catch (err) {
        if (!cancelled) setState({ ...EMPTY, loading: false, error: err instanceof Error ? err.message : 'Failed to load.' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [siteIdOverride, nonce])

  return { ...state, refresh }
}
