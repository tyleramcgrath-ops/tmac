'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

interface GSCStatus {
  projectId: string
  integrations: {
    google: {
      connected: boolean
      connectedAt?: string
      expiresAt?: string
      lastSync?: string
      lastDataDate?: string
      dataPoints?: number
    }
  }
}

interface GSCIntegrationProps {
  projectId: string
  domain: string
}

export function GSCIntegration({ projectId, domain }: GSCIntegrationProps) {
  const [status, setStatus] = useState<GSCStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkStatus()
  }, [projectId])

  const checkStatus = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/integrations/status?projectId=${projectId}`)
      if (!res.ok) throw new Error('Failed to check status')
      const data = await res.json()
      setStatus(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const connectGoogle = async () => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, provider: 'google' }),
      })
      if (!res.ok) throw new Error('Failed to initiate OAuth')
      const { authUrl } = await res.json()
      window.location.href = authUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    }
  }

  const syncNow = async () => {
    try {
      setSyncing(true)
      setError(null)
      const res = await fetch('/api/integrations/gsc/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Sync failed')
      }
      const result = await res.json()
      await checkStatus()
      alert(`Synced ${result.syncedPages} pages from Google Search Console`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4 border border-[var(--rf-card-line)] rounded-xl">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading integration status...</span>
        </div>
      </div>
    )
  }

  const googleConnected = status?.integrations.google.connected

  return (
    <div className="space-y-4 p-4 border border-[var(--rf-card-line)] rounded-xl">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            {googleConnected ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                Google Search Console
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                Google Search Console
              </>
            )}
          </h3>
          <p className="text-xs text-[var(--rf-faint)] mt-1">
            Import clicks, impressions, CTR, rankings, and top queries
          </p>
        </div>
      </div>

      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
          {error}
        </div>
      )}

      {!googleConnected ? (
        <button
          onClick={connectGoogle}
          className="rf-btn-primary w-full text-sm"
        >
          Connect Google Search Console
        </button>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {status?.integrations.google.lastSync && (
              <div className="p-2 bg-white/5 rounded">
                <div className="text-[var(--rf-faint)]">Last Sync</div>
                <div className="text-white font-mono">
                  {new Date(status.integrations.google.lastSync).toLocaleDateString()}
                </div>
              </div>
            )}
            {status?.integrations.google.dataPoints && (
              <div className="p-2 bg-white/5 rounded">
                <div className="text-[var(--rf-faint)]">Pages Tracked</div>
                <div className="text-white font-mono">
                  {status.integrations.google.dataPoints}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={syncNow}
            disabled={syncing}
            className="rf-btn-secondary w-full text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {syncing ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <ExternalLink className="h-3 w-3" />
                Sync Now
              </>
            )}
          </button>

          <a
            href={`https://search.google.com/search-console?resource_id=https%3A%2F%2F${encodeURIComponent(domain)}%2F`}
            target="_blank"
            rel="noopener noreferrer"
            className="rf-btn-ghost w-full text-xs flex items-center justify-center gap-2"
          >
            <ExternalLink className="h-3 w-3" />
            Open in Google Search Console
          </a>
        </div>
      )}
    </div>
  )
}
