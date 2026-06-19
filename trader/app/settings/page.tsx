'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Badge, Button, Card, Field, Input, PageHeader } from '@/components/ui'
import { Disclaimer } from '@/components/disclaimer'
import { post } from '@/lib/client/api'

interface SettingsInfo {
  configured: Record<string, boolean>
  canSaveFromUi: boolean
  keyNames: string[]
}

export default function SettingsPage() {
  const [info, setInfo] = useState<SettingsInfo | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [test, setTest] = useState<Record<string, { ok: boolean; message: string }>>({})

  async function load() {
    const res = await fetch('/api/settings', { cache: 'no-store' })
    setInfo(await res.json())
  }
  useEffect(() => { void load() }, [])

  async function save(name: string) {
    try {
      await post('/api/settings', { action: 'save', name, value: values[name] })
      setValues((v) => ({ ...v, [name]: '' }))
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed')
    }
  }

  async function runTest(broker: string) {
    try {
      const r = await post('/api/settings', { action: 'test', broker })
      setTest((t) => ({ ...t, [broker]: { ok: !!r.ok, message: String(r.message ?? '') } }))
    } catch (e) {
      setTest((t) => ({ ...t, [broker]: { ok: false, message: e instanceof Error ? e.message : 'Failed' } }))
    }
  }

  if (!info) return <div className="text-sm text-muted">Loading…</div>

  return (
    <div>
      <PageHeader title="API Settings" subtitle="Broker credentials are stored encrypted server-side and never exposed to the browser." />
      <Disclaimer />

      {!info.canSaveFromUi && (
        <Card className="mb-6 border-[var(--warn)]/40">
          <p className="text-sm text-muted">
            <span className="font-medium text-[var(--text)]">APP_SECRET is not set.</span> Saving keys from this page is
            disabled. Provide credentials via environment variables instead (recommended), or set <code>APP_SECRET</code>{' '}
            to enable encrypted in-app storage. See the README.
          </p>
        </Card>
      )}

      {/* Alpaca (recommended) */}
      <Card className="mb-6 border-[var(--accent)]/40">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium">
            Alpaca <span className="ml-1 rounded bg-[var(--accent)]/15 px-1.5 py-0.5 text-xs text-[var(--accent)]">Recommended</span>
          </h3>
          <Button onClick={() => runTest('alpaca')}>Test connection</Button>
        </div>
        <p className="mb-4 text-sm text-muted">
          Simple key + secret (no request signing), built-in <b>paper</b> environment on the same API, and stocks + crypto
          with real market data. Get a free <b>paper</b> key at{' '}
          <span className="text-[var(--text)]">alpaca.markets → Paper Trading → API Keys</span>. Set{' '}
          <code>ALPACA_PAPER=false</code> only when you intend to trade real money.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <CredRow name="ALPACA_API_KEY" label="API Key ID" configured={info.configured.ALPACA_API_KEY} value={values.ALPACA_API_KEY ?? ''} disabled={!info.canSaveFromUi} onChange={(v) => setValues((s) => ({ ...s, ALPACA_API_KEY: v }))} onSave={() => save('ALPACA_API_KEY')} />
          <CredRow name="ALPACA_API_SECRET" label="API Secret" configured={info.configured.ALPACA_API_SECRET} value={values.ALPACA_API_SECRET ?? ''} disabled={!info.canSaveFromUi} onChange={(v) => setValues((s) => ({ ...s, ALPACA_API_SECRET: v }))} onSave={() => save('ALPACA_API_SECRET')} />
        </div>
        {test.alpaca && <TestResult result={test.alpaca} />}
      </Card>

      {/* Robinhood Crypto */}
      <Card className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium">Robinhood Crypto (official Crypto Trading API)</h3>
          <Button onClick={() => runTest('robinhood_crypto')}>Test connection</Button>
        </div>
        <p className="mb-4 text-sm text-muted">
          Generate an Ed25519 key pair, register the public key in the Robinhood API Credentials portal, and provide the
          API key + base64 private-key seed here. Used for live crypto trading only.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <CredRow name="RH_CRYPTO_API_KEY" label="API Key" configured={info.configured.RH_CRYPTO_API_KEY} value={values.RH_CRYPTO_API_KEY ?? ''} disabled={!info.canSaveFromUi} onChange={(v) => setValues((s) => ({ ...s, RH_CRYPTO_API_KEY: v }))} onSave={() => save('RH_CRYPTO_API_KEY')} />
          <CredRow name="RH_CRYPTO_PRIVATE_KEY" label="Private Key (base64 seed)" configured={info.configured.RH_CRYPTO_PRIVATE_KEY} value={values.RH_CRYPTO_PRIVATE_KEY ?? ''} disabled={!info.canSaveFromUi} onChange={(v) => setValues((s) => ({ ...s, RH_CRYPTO_PRIVATE_KEY: v }))} onSave={() => save('RH_CRYPTO_PRIVATE_KEY')} />
        </div>
        {test.robinhood_crypto && <TestResult result={test.robinhood_crypto} />}
      </Card>

      {/* Equities / Options scaffold */}
      <Card className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium">Robinhood Equities / Options</h3>
          <Button onClick={() => runTest('robinhood_equities_options')}>Test connection</Button>
        </div>
        <p className="text-sm text-muted">
          Programmatic equities/options require an approved integration (e.g. Robinhood Agentic Trading) — there is no
          self-serve public REST API equivalent to crypto. This adapter is a scaffold with clear TODOs; no password
          scraping or unofficial endpoints are used. Until approved access is wired in, equities/options run in paper mode only.
        </p>
        {test.robinhood_equities_options && <TestResult result={test.robinhood_equities_options} />}
      </Card>

      {/* Paper */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Paper Trading Simulator</h3>
            <p className="text-sm text-muted">No credentials needed — always available.</p>
          </div>
          <Button onClick={() => runTest('paper')}>Test</Button>
        </div>
        {test.paper && <TestResult result={test.paper} />}
      </Card>
    </div>
  )
}

function CredRow({ name, label, configured, value, disabled, onChange, onSave }: {
  name: string; label: string; configured: boolean; value: string; disabled: boolean
  onChange: (v: string) => void; onSave: () => void
}) {
  return (
    <Field label={label} hint={configured ? 'Configured ✓ (env or stored). Submitting overwrites the stored value.' : 'Not configured.'}>
      <div className="flex gap-2">
        <Input type="password" placeholder={configured ? '••••••••' : `Enter ${name}`} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
        <Button variant="primary" disabled={disabled || !value} onClick={onSave}>Save</Button>
      </div>
      {configured && <span className="mt-1 inline-block"><Badge tone="pos">configured</Badge></span>}
    </Field>
  )
}

function TestResult({ result }: { result: { ok: boolean; message: string } }) {
  return (
    <div className={`mt-3 flex items-center gap-2 rounded-lg p-2 text-sm ${result.ok ? 'bg-[var(--pos)]/10 text-[var(--pos)]' : 'bg-[var(--neg)]/10 text-[var(--neg)]'}`}>
      {result.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      {result.message}
    </div>
  )
}
