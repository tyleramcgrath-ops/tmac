'use client'

import { useEffect, useState } from 'react'
import type { KeyStatus } from '@/lib/config'
import { CLIENT_KEY_NAMES, type ClientKeyName, readClientKeys, setClientKey } from '@/lib/client-keys'
import { WordPressConnect } from '@/components/WordPressConnect'

const KEY_INFO: Record<ClientKeyName, { label: string; help: string; required: boolean; link?: string }> = {
  SERP_API_KEY: {
    label: 'SERP API key (SerpAPI)',
    help: 'Required. Fetches the live top 10 Google organic results.',
    required: true,
    link: 'https://serpapi.com/manage-api-key',
  },
  ANTHROPIC_API_KEY: {
    label: 'Anthropic (Claude) API key',
    help: 'Optional. Powers AI-written recommendations. Without it you still get rule-based suggestions.',
    required: false,
    link: 'https://console.anthropic.com/settings/keys',
  },
  OPENAI_API_KEY: {
    label: 'OpenAI API key',
    help: 'Optional fallback AI provider — only needed if you are not using the Claude key.',
    required: false,
    link: 'https://platform.openai.com/api-keys',
  },
  PAGESPEED_API_KEY: {
    label: 'Google PageSpeed API key',
    help: 'Optional. PageSpeed works without a key but with very low rate limits.',
    required: false,
    link: 'https://developers.google.com/speed/docs/insights/v5/get-started',
  },
  DATAFORSEO_API_KEY: {
    label: 'DataForSEO API key (login:password)',
    help: 'Optional. Enables backlink and domain-authority comparison.',
    required: false,
    link: 'https://app.dataforseo.com/api-access',
  },
}

export default function SettingsPage() {
  const [envStatus, setEnvStatus] = useState<Record<string, KeyStatus>>({})
  const [values, setValues] = useState<Partial<Record<ClientKeyName, string>>>({})
  const [saved, setSaved] = useState<Partial<Record<ClientKeyName, boolean>>>({})
  const [flash, setFlash] = useState<string | null>(null)

  useEffect(() => {
    // Which keys are already set on the host (environment variables)?
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, KeyStatus> = {}
        for (const k of (data.keys ?? []) as KeyStatus[]) map[k.name] = k
        setEnvStatus(map)
      })
      .catch(() => {})
    // Which keys has the user stored in this browser?
    const stored = readClientKeys()
    setSaved(Object.fromEntries(CLIENT_KEY_NAMES.map((n) => [n, Boolean(stored[n])])))
  }, [])

  function save(name: ClientKeyName) {
    setClientKey(name, values[name] ?? '')
    setSaved((s) => ({ ...s, [name]: Boolean((values[name] ?? '').trim()) }))
    setValues((v) => ({ ...v, [name]: '' }))
    setFlash(`${KEY_INFO[name].label} saved in this browser.`)
    setTimeout(() => setFlash(null), 2500)
  }

  function remove(name: ClientKeyName) {
    setClientKey(name, '')
    setSaved((s) => ({ ...s, [name]: false }))
    setValues((v) => ({ ...v, [name]: '' }))
    setFlash(`${KEY_INFO[name].label} removed.`)
    setTimeout(() => setFlash(null), 2500)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings & API keys</h1>
        <p className="mt-1 text-sm text-slate-500">
          Paste your keys here and click Save — they are stored privately in <strong>this browser</strong> and sent
          securely with each analysis. Nothing is shared with other users. A key set as an environment variable on the
          host always takes precedence and shows as “set on server”.
        </p>
      </div>

      {flash && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash}</p>
      )}

      {CLIENT_KEY_NAMES.map((name) => {
        const info = KEY_INFO[name]
        const onServer = envStatus[name]?.source === 'env'
        const inBrowser = Boolean(saved[name])
        return (
          <div key={name} className="card">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                {info.label}
                {info.required && (
                  <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">REQUIRED</span>
                )}
              </h2>
              {onServer ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Set on server</span>
              ) : inBrowser ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Saved in browser</span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Not set</span>
              )}
            </div>
            <p className="mb-3 text-xs text-slate-500">
              {info.help}{' '}
              {info.link && (
                <a href={info.link} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                  Get a key →
                </a>
              )}
            </p>

            {onServer ? (
              <p className="text-xs text-slate-400">This key is set via an environment variable on the host — manage it there.</p>
            ) : (
              <div className="flex gap-2">
                <input
                  type="password"
                  className="input"
                  placeholder={inBrowser ? 'Saved — enter a new value to replace' : 'Paste your key…'}
                  value={values[name] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
                />
                <button className="btn-primary" onClick={() => save(name)}>Save</button>
                {inBrowser && (
                  <button className="btn-secondary !text-red-600 hover:!bg-red-50" onClick={() => remove(name)}>
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        Keys saved here live only in this browser (this device). If you clear your browser data or use another device,
        re-enter them. For a permanent, server-side setup, set them as environment variables on your host instead.
      </p>

      <div className="pt-2">
        <h2 className="text-lg font-bold text-slate-900">Connect WordPress</h2>
        <p className="mt-1 text-sm text-slate-500">
          Connect your self-hosted WordPress site so the tool can apply recommended fixes (title, meta description, FAQ,
          short-answer block) directly to your pages.
        </p>
      </div>
      <WordPressConnect />
    </div>
  )
}
