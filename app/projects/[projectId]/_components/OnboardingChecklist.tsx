'use client'

// Guided first-run checklist (RC2 P3). Answers "what do I do next?" at the
// project level: run a scan → connect WordPress → deploy a fix. Driven by real
// state (scans, WP connection, verified deployments). Hides itself once every
// step is done, so it never nags an established project.

import { useCallback, useEffect, useState } from 'react'
import { api, type ScanSummary } from '../../../lib/client'

interface Step {
  label: string
  detail: string
  done: boolean
}

export function OnboardingChecklist({ projectId, scans, onGoScan }: { projectId: string; scans: ScanSummary[]; onGoScan?: () => void }) {
  const [wpConnected, setWpConnected] = useState<boolean | null>(null)
  const [hasVerifiedDeploy, setHasVerifiedDeploy] = useState(false)

  const load = useCallback(async () => {
    try {
      const { connection, deployments } = await api.getWordpress(projectId)
      setWpConnected(!!connection)
      setHasVerifiedDeploy(deployments.some((d) => d.status === 'verified'))
    } catch {
      setWpConnected(false)
    }
  }, [projectId])
  useEffect(() => {
    void load()
  }, [load])

  const scanned = scans.some((s) => s.status === 'completed' || s.status === 'partial')
  const steps: Step[] = [
    { label: 'Run your first scan', detail: 'Crawl the site to generate evidence-backed recommendations.', done: scanned },
    { label: 'Connect WordPress', detail: 'Add your site + an Application Password so fixes can be deployed.', done: wpConnected === true },
    { label: 'Deploy & verify a fix', detail: 'Push a recommendation to WordPress; it’s verified by read-back and reversible.', done: hasVerifiedDeploy },
  ]
  if (wpConnected === null) return null
  if (steps.every((s) => s.done)) return null

  const nextIdx = steps.findIndex((s) => !s.done)
  return (
    <div className="rf-card space-y-2 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Getting started</p>
        <span className="text-[11px] text-[var(--rf-muted)]">{steps.filter((s) => s.done).length}/{steps.length} done</span>
      </div>
      <ol className="space-y-1.5">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-start gap-2">
            <span className={`mt-0.5 grid h-4 w-4 flex-shrink-0 place-items-center rounded-full text-[9px] ${s.done ? 'bg-[var(--rf-green)] text-black' : i === nextIdx ? 'border border-[var(--rf-blue-bright)] text-[var(--rf-blue-bright)]' : 'border border-[var(--rf-card-line)] text-[var(--rf-faint)]'}`}>{s.done ? '✓' : i + 1}</span>
            <div>
              <p className={`text-xs font-medium ${s.done ? 'text-[var(--rf-faint)] line-through' : 'text-white'}`}>
                {s.label}
                {i === nextIdx && s.label.startsWith('Run') && onGoScan && (
                  <button onClick={onGoScan} className="ml-2 rf-btn-primary rounded px-2 py-0.5 text-[10px] font-semibold no-underline">Start</button>
                )}
              </p>
              {i === nextIdx && <p className="text-[11px] text-[var(--rf-muted)]">{s.detail}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
