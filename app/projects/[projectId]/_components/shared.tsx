'use client'

// Shared presentational primitives for the project workspace tabs (Phase D.6
// P8). Pure, stateless display bits + the one small stateful DangerZone.

import { useState } from 'react'
import { api, ApiError } from '../../../lib/client'

export function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">{label}</p>
      <p className={`text-lg font-semibold ${tone ?? 'text-white'}`}>{value}</p>
    </div>
  )
}

export function StatusChip({ status }: { status: string }) {
  const tone: Record<string, string> = {
    completed: 'text-[var(--rf-green)]',
    verified: 'text-[var(--rf-green)]',
    partial: 'text-yellow-300',
    running: 'text-[var(--rf-blue-bright)]',
    queued: 'text-[var(--rf-muted)]',
    failed: 'text-red-300',
    verify_failed: 'text-yellow-300',
    rolled_back: 'text-[var(--rf-muted)]',
    cancelled: 'text-[var(--rf-muted)]',
    regressed: 'text-red-300',
  }
  return <span className={`rf-mono text-[11px] uppercase ${tone[status] ?? 'text-[var(--rf-muted)]'}`}>{status.replace('_', ' ')}</span>
}

export function SeverityDot({ s }: { s: string }) {
  const c = s === 'critical' ? 'bg-red-400' : s === 'warning' ? 'bg-yellow-400' : 'bg-sky-400'
  return <span className={`inline-block h-2 w-2 rounded-full ${c}`} />
}

export function ChangeRow({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <div className="rounded-md border border-[var(--rf-card-line)] p-2">
      <p className="text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">{label}</p>
      <p className="text-xs text-red-300 line-through">{before || '(empty)'}</p>
      <p className="text-xs text-[var(--rf-green)]">{after || '(empty)'}</p>
    </div>
  )
}

export function DangerZone({ projectId, onDeleted }: { projectId: string; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  return (
    <div className="text-right">
      {!confirming ? (
        <button onClick={() => setConfirming(true)} className="rf-btn-ghost rounded-lg px-3 py-1.5 text-xs text-red-300">
          Delete project
        </button>
      ) : (
        <div className="rf-card p-3 text-xs">
          <p className="mb-2 text-white">Delete this project and all its data?</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirming(false)} className="rf-btn-ghost rounded-md px-2 py-1">Cancel</button>
            <button
              onClick={async () => {
                try {
                  await api.deleteProject(projectId)
                  onDeleted()
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : 'Delete failed.')
                }
              }}
              className="rounded-md bg-red-500/80 px-2 py-1 font-semibold text-white"
            >
              Delete
            </button>
          </div>
          {error && <p className="mt-1 text-red-300">{error}</p>}
        </div>
      )}
    </div>
  )
}
