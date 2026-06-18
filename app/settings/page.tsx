'use client'

import { useEffect, useState } from 'react'
import type { KeyStatus } from '@/lib/config'

const KEY_INFO: Record<string, { label: string; help: string; required: boolean }> = {
  SERP_API_KEY: {
    label: 'SERP API key (SerpAPI)',
    help: 'Required. Fetches the live top 10 Google organic results. Get one at serpapi.com.',
    required: true,
  },
  ANTHROPIC_API_KEY: {
    label: 'Anthropic (Claude) API key',
    help: 'Recommended. Powers tailored AI recommendations. Get one at console.anthropic.com.',
    required: false,
  },
  OPENAI_API_KEY: {
    label: 'OpenAI API key',
    help: 'Optional fallback AI provider for recommendations.',
    required: false,
  },
  PAGESPEED_API_KEY: {
    label: 'Google PageSpeed API key',
    help: 'Optional. PageSpeed works without a key but rate limits are very low; a key is strongly recommended.',
    required: false,
  },
  DATAFORSEO_API_KEY: {
    label: 'DataForSEO API key (login:password)',
    help: 'Optional. Enables backlink and domain-authority comparison.',
    required: false,
  },
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<KeyStatus[] | null>(null)
  const [canSave, setCanSave] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setKeys(data.keys ?? [])
        setCanSave(Boolean(data.canSave))
      })
      .catch(() => setMessage({ kind: 'error', text: 'Failed to load settings.' }))
  }, [])

  async function save(name: string) {
    setSaving(name)
    setMessage(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, value: values[name] ?? '' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ kind: 'error', text: data.error ?? 'Failed to save key.' })
      } else {
        setKeys(data.keys)
        setValues((v) => ({ ...v, [name]: '' }))
        setMessage({ kind: 'ok', text: 'Key saved (encrypted at rest).' })
      }
    } catch {
      setMessage({ kind: 'error', text: 'Network error while saving the key.' })
    }
    setSaving(null)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings & API keys</h1>
        <p className="mt-1 text-sm text-slate-500">
          Keys set via environment variables always take precedence and are never displayed. Keys
          saved here are encrypted with AES-256-GCM using <code className="rounded bg-slate-100 px-1">APP_SECRET</code>{' '}
          and are never sent to the frontend.
        </p>
      </div>

      {!canSave && keys !== null && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Saving from this page is disabled</strong> because <code>APP_SECRET</code> is not set.
          Add keys via environment variables (see <code>.env.example</code>), or set <code>APP_SECRET</code> to
          enable encrypted storage from the UI.
        </p>
      )}

      {message && (
        <p
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.kind === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </p>
      )}

      {keys === null ? (
        <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
      ) : (
        keys.map((key) => {
          const info = KEY_INFO[key.name]
          return (
            <div key={key.name} className="card">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">
                  {info?.label ?? key.name}
                  {info?.required && <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">REQUIRED</span>}
                </h2>
                {key.configured ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Configured ({key.source === 'env' ? 'environment' : 'saved'})
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Not configured</span>
                )}
              </div>
              <p className="mb-3 text-xs text-slate-500">{info?.help}</p>
              {key.source !== 'env' && (
                <div className="flex gap-2">
                  <input
                    type="password"
                    className="input"
                    placeholder={key.configured ? 'Enter a new value to replace (empty to remove)' : 'Paste key…'}
                    value={values[key.name] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [key.name]: e.target.value }))}
                    disabled={!canSave}
                  />
                  <button className="btn-primary" onClick={() => save(key.name)} disabled={!canSave || saving === key.name}>
                    {saving === key.name ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
              {key.source === 'env' && (
                <p className="text-xs text-slate-400">Set via environment variable — manage it in your deployment configuration.</p>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
