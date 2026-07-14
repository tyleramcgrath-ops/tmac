'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

interface IntegrationStatus {
  projectId: string
  integrations: {
    google: {
      connected: boolean
      connectedAt?: string
      expiresAt?: string
      lastSync?: string
      lastDataDate?: string
      dataPoints?: number
      ga4PropertyId?: string
      ga4LastSync?: string
    }
  }
}

interface GA4Property {
  id: string
  name: string
}

interface IntegrationsPanelProps {
  projectId: string
  domain: string
}

export function IntegrationsPanel({ projectId, domain }: IntegrationsPanelProps) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<'gsc' | 'ga4' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showGA4Properties, setShowGA4Properties] = useState(false)
  const [ga4Properties, setGA4Properties] = useState<GA4Property[]>([])
  const [loadingGA4Properties, setLoadingGA4Properties] = useState(false)

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

  const syncGSC = async () => {
    try {
      setSyncing('gsc')
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
      setSyncing(null)
    }
  }

  const loadGA4Properties = async () => {
    try {
      setLoadingGA4Properties(true)
      const res = await fetch(`/api/integrations/ga4/properties?projectId=${projectId}`)
      if (!res.ok) throw new Error('Failed to fetch GA4 properties')
      const data = await res.json()
      setGA4Properties(data.properties || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load GA4 properties')
    } finally {
      setLoadingGA4Properties(false)
    }
  }

  const selectGA4Property = async (propertyId: string) => {
    try {
      const res = await fetch('/api/integrations/ga4/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, ga4PropertyId: propertyId }),
      })
      if (!res.ok) throw new Error('Failed to configure GA4')
      await checkStatus()
      setShowGA4Properties(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Configuration failed')
    }
  }

  const syncGA4 = async () => {
    try {
      setSyncing('ga4')
      setError(null)
      const res = await fetch('/api/integrations/ga4/sync', {
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
      alert(`Synced ${result.syncedPages} pages from Google Analytics 4`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4 border border-[var(--rf-card-line)] rounded-xl">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading integrations...</span>
        </div>
      </div>
    )
  }

  const googleConnected = status?.integrations.google.connected
  const ga4Configured = status?.integrations.google.ga4PropertyId

  return (
    <div className="space-y-4 p-4 border border-[var(--rf-card-line)] rounded-xl">
      <h3 className="text-sm font-semibold text-white">Data Integrations</h3>

      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Google Search Console */}
      <div className="space-y-2 p-3 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {googleConnected ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
            <span className="text-xs font-medium text-white">Google Search Console</span>
          </div>
        </div>
        {googleConnected ? (
          <div className="text-xs text-[var(--rf-faint)] space-y-2">
            {status?.integrations.google.lastSync && (
              <div>
                Last sync: {new Date(status.integrations.google.lastSync).toLocaleDateString()}
              </div>
            )}
            <button
              onClick={syncGSC}
              disabled={syncing === 'gsc'}
              className="rf-btn-secondary text-xs w-full disabled:opacity-50"
            >
              {syncing === 'gsc' ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        ) : (
          <button
            onClick={connectGoogle}
            className="rf-btn-primary text-xs w-full"
          >
            Connect Google
          </button>
        )}
      </div>

      {/* Google Analytics 4 */}
      {googleConnected && (
        <div className="space-y-2 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {ga4Configured ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-xs font-medium text-white">Google Analytics 4</span>
            </div>
          </div>
          {ga4Configured ? (
            <div className="text-xs text-[var(--rf-faint)] space-y-2">
              <div>Property ID: {status?.integrations.google.ga4PropertyId}</div>
              {status?.integrations.google.ga4LastSync && (
                <div>
                  Last sync: {new Date(status.integrations.google.ga4LastSync).toLocaleDateString()}
                </div>
              )}
              <button
                onClick={syncGA4}
                disabled={syncing === 'ga4'}
                className="rf-btn-secondary text-xs w-full disabled:opacity-50"
              >
                {syncing === 'ga4' ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {!showGA4Properties ? (
                <button
                  onClick={() => {
                    setShowGA4Properties(true)
                    loadGA4Properties()
                  }}
                  className="rf-btn-primary text-xs w-full"
                >
                  Select GA4 Property
                </button>
              ) : (
                <>
                  {loadingGA4Properties ? (
                    <div className="flex items-center gap-2 text-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading properties...
                    </div>
                  ) : ga4Properties.length > 0 ? (
                    <div className="space-y-1">
                      {ga4Properties.map((prop) => (
                        <button
                          key={prop.id}
                          onClick={() => selectGA4Property(prop.id)}
                          className="rf-btn-ghost text-xs w-full text-left"
                        >
                          {prop.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-[var(--rf-faint)]">
                      No GA4 properties found. Create one in Google Analytics.
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
