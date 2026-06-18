'use client'

import { useEffect, useState } from 'react'
import { clearWpConnection, readWpConnection, saveWpConnection } from '@/lib/client-wp'

export function WordPressConnect() {
  const [site, setSite] = useState('')
  const [username, setUsername] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [connectedSite, setConnectedSite] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const conn = readWpConnection()
    if (conn) {
      setSite(conn.site)
      setUsername(conn.username)
      setConnectedSite(conn.site)
    }
  }, [])

  async function testAndSave() {
    setTesting(true)
    setStatus(null)
    const connection = { site, username, appPassword }
    try {
      const res = await fetch('/api/wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', connection }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setStatus({ kind: 'error', text: data.message ?? data.error ?? 'Connection failed.' })
      } else {
        saveWpConnection(connection)
        setConnectedSite(site)
        setStatus({ kind: 'ok', text: `${data.message} Saved in this browser.` })
        setAppPassword('')
      }
    } catch {
      setStatus({ kind: 'error', text: 'Could not reach the server to test the connection.' })
    }
    setTesting(false)
  }

  function disconnect() {
    clearWpConnection()
    setConnectedSite(null)
    setSite('')
    setUsername('')
    setAppPassword('')
    setStatus(null)
  }

  return (
    <div className="card">
      {connectedSite && (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Connected to <strong>{connectedSite}</strong>. Re-enter your details below to update, or disconnect.
        </p>
      )}

      <div className="space-y-3">
        <div>
          <label className="label" htmlFor="wp-site">WordPress site address</label>
          <input id="wp-site" className="input" placeholder="https://yoursite.com" value={site} onChange={(e) => setSite(e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="wp-user">Username</label>
            <input id="wp-user" className="input" placeholder="your-wp-username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="wp-pass">Application password</label>
            <input id="wp-pass" type="password" className="input" placeholder="xxxx xxxx xxxx xxxx" value={appPassword} onChange={(e) => setAppPassword(e.target.value)} />
          </div>
        </div>
      </div>

      <details className="mt-3 text-sm text-slate-500">
        <summary className="cursor-pointer font-medium text-blue-700">How do I get an application password?</summary>
        <ol className="mt-2 list-inside list-decimal space-y-1">
          <li>In WordPress admin, go to <strong>Users → Profile</strong> (or Edit your user).</li>
          <li>Scroll to <strong>Application Passwords</strong>.</li>
          <li>Type a name like “SEO Tool” and click <strong>Add New Application Password</strong>.</li>
          <li>Copy the password it shows (with spaces is fine) and paste it above. You won’t see it again, but you can always create another.</li>
        </ol>
        <p className="mt-2">Use an Administrator or Editor account. Your details are stored only in this browser and sent securely to your own site.</p>
      </details>

      {status && (
        <p className={`mt-3 rounded-lg border px-3 py-2 text-sm ${status.kind === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {status.text}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button className="btn-primary" onClick={testAndSave} disabled={testing}>
          {testing ? 'Testing…' : 'Test & save connection'}
        </button>
        {connectedSite && (
          <button className="btn-secondary !text-red-600 hover:!bg-red-50" onClick={disconnect}>Disconnect</button>
        )}
      </div>
    </div>
  )
}
