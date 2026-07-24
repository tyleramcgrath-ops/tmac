'use client'

import { useEffect, useState } from 'react'
import { api, ApiError, type AtlasSnapshotDTO, type GoogleTrendsDTO } from '../../../lib/client'

// Smooth quadratic-curve sparkline through real GSC click points — mirrors
// the curve-building approach used by the room's own SVG elements, just fed
// by real day-by-day trend data instead of a hardcoded series.
function buildSparkline(points: { clicks: number }[]) {
  if (points.length < 2) return null
  const vals = points.map((p) => p.clicks)
  const min = Math.min(...vals)
  const span = Math.max(1, Math.max(...vals) - min)
  const pts = points.map((p, i) => [
    +(i * 120 / (points.length - 1)).toFixed(1),
    +(31 - ((p.clicks - min) / span) * 27).toFixed(1),
  ] as [number, number])
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const xc = (pts[i - 1][0] + pts[i][0]) / 2
    const yc = (pts[i - 1][1] + pts[i][1]) / 2
    d += ` Q ${pts[i - 1][0]} ${pts[i - 1][1]} ${xc.toFixed(2)} ${yc.toFixed(2)}`
  }
  d += ` L ${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`
  return { d, lastY: pts[pts.length - 1][1] }
}

export default function BriefingPanel({
  projectId,
  projectsResolved,
}: {
  projectId: string | null
  projectsResolved: boolean
}) {
  const [snapshot, setSnapshot] = useState<AtlasSnapshotDTO | null>(null)
  const [trends, setTrends] = useState<GoogleTrendsDTO | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const [atlas, trend] = await Promise.all([api.getAtlas(projectId), api.getGoogleTrends(projectId)])
        if (cancelled) return
        setSnapshot(atlas.snapshot)
        setTrends(trend)
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load the morning briefing.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (!projectsResolved || loading) {
    return (
      <>
        <p className="ns-panel-eyebrow">Morning briefing</p>
        <span className="ns-skeleton-line" style={{ width: '70%' }} aria-hidden />
        <span className="ns-skeleton-line" style={{ width: '100%', marginTop: '0.9rem' }} aria-hidden />
      </>
    )
  }

  if (!projectId) {
    return (
      <>
        <p className="ns-panel-eyebrow">Morning briefing</p>
        <h2>No project yet.</h2>
        <p className="ns-panel-body">Create a project to start receiving a morning briefing here.</p>
      </>
    )
  }

  if (error || !snapshot) {
    return (
      <>
        <p className="ns-panel-eyebrow">Morning briefing</p>
        <h2>Not connected yet.</h2>
        <p className="ns-panel-body">{error ?? 'Connect a data source to see your briefing here.'}</p>
      </>
    )
  }

  const brief = snapshot.briefing
  const bodyLine =
    brief.overnight[0]?.detail ?? brief.newOpportunities[0]?.detail ?? 'Nothing new since your last visit.'
  const gscTrend = trends?.gsc.ok ? trends.gsc.points : null
  const spark = gscTrend ? buildSparkline(gscTrend) : null

  return (
    <>
      <p className="ns-panel-eyebrow">Morning briefing</p>
      <h2>{brief.headline || 'Your week, understood.'}</h2>
      {spark ? (
        <svg className="ns-spark" viewBox="0 0 120 36" aria-hidden>
          <defs>
            <linearGradient id="ns-spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(240,200,120,0.35)" />
              <stop offset="1" stopColor="rgba(240,200,120,0)" />
            </linearGradient>
          </defs>
          <path d={`${spark.d} L 120 36 L 0 36 Z`} fill="url(#ns-spark-fill)" stroke="none" />
          <path d={spark.d} fill="none" stroke="#ecc276" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="120" cy={spark.lastY} r="2.2" fill="#ffe2a4" />
        </svg>
      ) : (
        <p className="ns-panel-body" style={{ opacity: 0.7 }}>
          Connect Search Console to see traffic trend here.
        </p>
      )}
      <p className="ns-panel-body">{bodyLine}</p>
    </>
  )
}
