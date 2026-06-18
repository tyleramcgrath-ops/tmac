'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Report } from '@/lib/types'
import { readWpConnection } from '@/lib/client-wp'

interface FaqItem {
  q: string
  a: string
}

interface ProposedChanges {
  title?: string
  metaDescription?: string
  shortAnswer?: string
  faq: FaqItem[]
}

function propose(report: Report): ProposedChanges {
  const ai = report.results?.ai
  return {
    title: ai?.suggestedTitles?.[0],
    metaDescription: ai?.suggestedMetaDescriptions?.[0],
    shortAnswer: ai?.shortAnswerBlock ?? undefined,
    faq: (ai?.faqSuggestions ?? []).slice(0, 6).map((q) => ({ q, a: '' })),
  }
}

type ResultLine = { kind: string; applied: boolean; message: string }

export function WordPressPanel({ report }: { report: Report }) {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [siteLabel, setSiteLabel] = useState('')
  const [proposed] = useState<ProposedChanges>(() => propose(report))

  const [useTitle, setUseTitle] = useState(true)
  const [useMeta, setUseMeta] = useState(true)
  const [useShort, setUseShort] = useState(true)
  const [useFaq, setUseFaq] = useState(false)
  const [faq, setFaq] = useState<FaqItem[]>(proposed.faq)

  const [applying, setApplying] = useState(false)
  const [results, setResults] = useState<ResultLine[] | null>(null)
  const [pageLink, setPageLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const conn = readWpConnection()
    setConnected(Boolean(conn))
    if (conn) setSiteLabel(conn.site)
  }, [])

  const pageUrl = report.results?.userAnalysis?.page?.finalUrl ?? report.input.url
  const nothingToApply = !proposed.title && !proposed.metaDescription && !proposed.shortAnswer && faq.length === 0

  async function apply() {
    setApplying(true)
    setError(null)
    setResults(null)
    const conn = readWpConnection()
    if (!conn) {
      setError('No WordPress connection found. Connect your site on the Settings page first.')
      setApplying(false)
      return
    }
    const readyFaq = useFaq ? faq.filter((f) => f.q.trim() && f.a.trim()) : []
    const changes = {
      title: useTitle ? proposed.title : undefined,
      metaDescription: useMeta ? proposed.metaDescription : undefined,
      shortAnswer: useShort ? proposed.shortAnswer : undefined,
      faq: readyFaq,
    }
    try {
      const res = await fetch('/api/wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', connection: conn, pageUrl, changes }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'WordPress update failed.')
      } else {
        setResults(data.results ?? [])
        setPageLink(data.page?.link ?? null)
      }
    } catch {
      setError('Could not reach the server to apply changes.')
    }
    setApplying(false)
  }

  if (connected === null) return null

  return (
    <section className="card border-l-4 border-l-blue-600">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="section-title !mb-0">Apply fixes to WordPress</h2>
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">Auto-fix</span>
      </div>

      {!connected ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-6 text-center">
          <p className="mx-auto max-w-md text-sm text-slate-600">
            Connect your WordPress site once and this tool can apply the recommended fixes for you — update the page
            title, meta description, add a short answer block and an FAQ section, all from here.
          </p>
          <Link href="/settings" className="btn-primary mt-4">Connect WordPress in Settings</Link>
        </div>
      ) : nothingToApply ? (
        <p className="section-subtitle">No auto-applicable changes were generated for this page.</p>
      ) : (
        <>
          <p className="section-subtitle">
            Connected to <strong>{siteLabel}</strong>. Review the changes below, then apply the ones you want to{' '}
            <span className="break-all">{pageUrl}</span>. Nothing changes until you click Apply.
          </p>

          <div className="space-y-3">
            {proposed.title && (
              <label className="flex gap-3 rounded-lg border border-slate-100 p-3">
                <input type="checkbox" checked={useTitle} onChange={(e) => setUseTitle(e.target.checked)} className="mt-1" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Update page title</p>
                  <p className="text-sm text-emerald-700">{proposed.title}</p>
                </div>
              </label>
            )}

            {proposed.metaDescription && (
              <label className="flex gap-3 rounded-lg border border-slate-100 p-3">
                <input type="checkbox" checked={useMeta} onChange={(e) => setUseMeta(e.target.checked)} className="mt-1" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Update meta description (AIOSEO)</p>
                  <p className="text-sm text-emerald-700">{proposed.metaDescription}</p>
                </div>
              </label>
            )}

            {proposed.shortAnswer && (
              <label className="flex gap-3 rounded-lg border border-slate-100 p-3">
                <input type="checkbox" checked={useShort} onChange={(e) => setUseShort(e.target.checked)} className="mt-1" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Add a short-answer paragraph at the top</p>
                  <p className="text-sm text-slate-600">{proposed.shortAnswer}</p>
                </div>
              </label>
            )}

            {faq.length > 0 && (
              <div className="rounded-lg border border-slate-100 p-3">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={useFaq} onChange={(e) => setUseFaq(e.target.checked)} />
                  <span className="text-sm font-semibold text-slate-800">Add an FAQ section</span>
                </label>
                {useFaq && (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs text-slate-500">Write a short answer for each question you want to include (blank answers are skipped).</p>
                    {faq.map((item, i) => (
                      <div key={i} className="rounded-md bg-slate-50 p-2">
                        <p className="mb-1 text-sm font-medium text-slate-700">{item.q}</p>
                        <textarea
                          className="input min-h-[3rem] text-sm"
                          placeholder="Your answer (40–60 words)…"
                          value={item.a}
                          onChange={(e) => setFaq((f) => f.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          {results && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="mb-1 text-sm font-semibold text-emerald-800">Changes applied</p>
              <ul className="space-y-1 text-sm text-emerald-900">
                {results.map((r, i) => (
                  <li key={i}>{r.applied ? '✓' : '•'} {r.message}</li>
                ))}
              </ul>
              {pageLink && (
                <a href={pageLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-medium text-blue-700 hover:underline">
                  View the updated page →
                </a>
              )}
            </div>
          )}

          <button className="btn-primary mt-4" onClick={apply} disabled={applying}>
            {applying ? 'Applying to WordPress…' : 'Apply selected changes'}
          </button>
        </>
      )}
    </section>
  )
}
