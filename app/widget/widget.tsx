'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Loader2, Search, Zap } from 'lucide-react'
import {
  ScanReport,
  ScanLoading,
  ScanError,
  type ScanResult,
} from '@/app/rankforge/components/scan'

type Status = 'idle' | 'loading' | 'done' | 'error'

/**
 * Self-contained, inline version of the SEO scan for use inside an <iframe>
 * (see /public/widget.js). Reuses the same /api/seo-scan + /api/leads endpoints
 * and the shared report renderer, and reports its height to the host page so the
 * embedding iframe can auto-resize.
 */
export function ScanWidget({ initialDomain = '' }: { initialDomain?: string }) {
  const [domain, setDomain] = useState(initialDomain)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  // Report content height to the parent window for iframe auto-resize.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const post = () => {
      const height = el.getBoundingClientRect().height
      window.parent?.postMessage({ type: 'rankforge:height', height }, '*')
    }
    post()
    const ro = new ResizeObserver(post)
    ro.observe(el)
    return () => ro.disconnect()
  }, [status, result])

  async function run(e: React.FormEvent) {
    e.preventDefault()
    const value = domain.trim()
    if (!value) return
    setStatus('loading')
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/seo-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: value, keyword: keyword.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Scan failed. Please try again.')
        setStatus('error')
        return
      }
      setResult(data as ScanResult)
      setStatus('done')
    } catch {
      setError('Network error — please try again.')
      setStatus('error')
    }
  }

  return (
    <div ref={rootRef} className="rf-card rf-topline overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)]">
            <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-sm font-semibold text-white">
            Free SEO Audit
          </span>
        </div>
        <span className="rf-mono text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">
          by RankForge AI
        </span>
      </div>

      <div className="p-5">
        <form onSubmit={run} className="space-y-2.5">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="rf-card flex flex-1 items-center gap-3 px-4 py-3 focus-within:border-[var(--rf-card-line-strong)]">
              <Search className="h-5 w-5 shrink-0 text-[var(--rf-faint)]" />
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Enter your domain"
                aria-label="Enter your domain"
                inputMode="url"
                autoComplete="off"
                className="w-full bg-transparent text-[15px] text-white placeholder:text-[var(--rf-faint)] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="rf-btn-primary flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Scanning…
                </>
              ) : (
                <>
                  Run Free Scan <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
          <div className="rf-card flex items-center gap-3 px-4 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-[var(--rf-faint)]" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Target keyword (optional)"
              aria-label="Target keyword (optional)"
              autoComplete="off"
              className="w-full bg-transparent text-sm text-white placeholder:text-[var(--rf-faint)] focus:outline-none"
            />
          </div>
        </form>

        {status !== 'idle' && (
          <div className="mt-5">
            {status === 'loading' && <ScanLoading />}
            {status === 'error' && <ScanError message={error} />}
            {status === 'done' && result && <ScanReport result={result} />}
          </div>
        )}
      </div>
    </div>
  )
}
