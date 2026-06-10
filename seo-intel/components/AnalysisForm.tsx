'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const COUNTRIES = [
  ['us', 'United States'], ['gb', 'United Kingdom'], ['ca', 'Canada'], ['au', 'Australia'],
  ['de', 'Germany'], ['fr', 'France'], ['es', 'Spain'], ['it', 'Italy'], ['nl', 'Netherlands'],
  ['in', 'India'], ['br', 'Brazil'], ['mx', 'Mexico'], ['jp', 'Japan'], ['sg', 'Singapore'],
  ['se', 'Sweden'], ['ie', 'Ireland'], ['nz', 'New Zealand'], ['za', 'South Africa'],
] as const

export function AnalysisForm() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [keyword, setKeyword] = useState('')
  const [country, setCountry] = useState('us')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [language, setLanguage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, keyword, country, device, language: language || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to start the analysis.')
        setSubmitting(false)
        return
      }
      router.push(`/reports/${data.id}`)
    } catch {
      setError('Network error — could not reach the server.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="card">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="url">Your page URL</label>
          <input
            id="url" className="input" placeholder="https://example.com/your-page"
            value={url} onChange={(e) => setUrl(e.target.value)} required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="keyword">Target keyword</label>
          <input
            id="keyword" className="input" placeholder="e.g. best crm for small business"
            value={keyword} onChange={(e) => setKeyword(e.target.value)} required
          />
        </div>
        <div>
          <label className="label" htmlFor="country">Country</label>
          <select id="country" className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRIES.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="language">Language <span className="font-normal text-slate-400">(optional)</span></label>
          <input
            id="language" className="input" placeholder="e.g. en"
            value={language} onChange={(e) => setLanguage(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <span className="label">Device</span>
          <div className="flex gap-2">
            {(['desktop', 'mobile'] as const).map((d) => (
              <button
                key={d} type="button" onClick={() => setDevice(d)}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium capitalize transition ${
                  device === d
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button type="submit" className="btn-primary mt-5 w-full" disabled={submitting}>
        {submitting ? 'Starting analysis…' : 'Run SEO Comparison'}
      </button>
    </form>
  )
}
