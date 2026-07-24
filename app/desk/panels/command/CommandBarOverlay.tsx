'use client'

// Command Bar — the UI layer (Engine -> API -> UI). Pure presentation: it
// sends raw text + confirmation state to the API and renders whatever comes
// back. No intent classification, no permission logic, no execution happens
// here — see lib/foundation/commands/engine.ts. Compass calls only ever
// reflect a real request that is actually in flight or a real result that
// actually came back; nothing here is a timed animation.

import { useEffect, useRef, useState } from 'react'
import { api, ApiError, type CommandResultDTO, type MissionDTO } from '../../../lib/client'
import type { CompassState } from '../../compass'

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function CommandBarOverlay({
  open,
  onClose,
  projectId,
  projectName,
  onCompassState,
}: {
  open: boolean
  onClose: () => void
  projectId: string | null
  projectName: string | null
  onCompassState: (s: CompassState) => void
}) {
  const [input, setInput] = useState('')
  const [pending, setPending] = useState<CommandResultDTO | null>(null)
  const [history, setHistory] = useState<CommandResultDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [currentMission, setCurrentMission] = useState<MissionDTO | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open || !projectId) return
    setInput('')
    setPending(null)
    inputRef.current?.focus()
    onCompassState('listening')
    api.getMissionQueue(projectId).then((r) => setCurrentMission(r.queue.currentMission)).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId])

  // Escape closes cleanly — captured on window so it pre-empts the room's
  // own document-level Escape handler (panels dismiss) while the bar is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCompassState('idle')
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onClose, onCompassState])

  if (!open) return null

  function handleResult(result: CommandResultDTO) {
    if (result.status === 'pending-confirmation') {
      setPending(result)
      onCompassState(result.riskLevel === 'consequential' ? 'warning' : 'planning')
      return
    }
    setPending(null)
    setHistory((h) => [...h, result])
    setInput('')
    if (result.status === 'executed') onCompassState(result.riskLevel === 'read-only' ? 'idle' : 'success')
    else if (result.status === 'rejected-permission') onCompassState('warning')
    else if (result.status === 'failed') onCompassState('error')
    else onCompassState('idle')
  }

  async function submit(raw: string) {
    if (!projectId || !raw.trim() || loading) return
    setLoading(true)
    onCompassState('thinking')
    try {
      const { result } = await api.runCommand(projectId, {
        commandId: genId(),
        raw,
        missionId: currentMission?.id ?? null,
        confirmed: false,
      })
      handleResult(result)
    } catch (err) {
      onCompassState('warning')
      setHistory((h) => [
        ...h,
        {
          commandId: genId(), raw, intent: 'unsupported', riskLevel: null, projectId, missionId: null,
          targetResource: null, requestedParams: {}, permission: 'denied', confirmationRequired: false,
          status: 'failed', message: err instanceof ApiError ? err.message : 'Something went wrong.',
          evidence: null, auditedAt: null,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function confirm() {
    if (!projectId || !pending || loading) return
    setLoading(true)
    onCompassState('executing')
    try {
      const { result } = await api.runCommand(projectId, {
        commandId: pending.commandId,
        raw: pending.raw,
        missionId: pending.missionId,
        confirmed: true,
      })
      handleResult(result)
    } catch {
      onCompassState('error')
      setPending(null)
    } finally {
      setLoading(false)
    }
  }

  function cancelPending() {
    setPending(null)
    onCompassState('idle')
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (pending) void confirm()
      else void submit(input)
    }
  }

  return (
    <div className="ns-cmdbar" role="dialog" aria-label="Command bar" aria-modal="true">
      <div className="ns-cmdbar-inner">
        <div className="ns-cmdbar-context">
          <span>{projectName ?? 'No project'}</span>
          {currentMission && <span className="ns-cmdbar-mission">→ {currentMission.title}</span>}
        </div>
        <input
          ref={inputRef}
          className="ns-cmdbar-input"
          type="text"
          placeholder='Ask North Star — "what needs my approval?"'
          value={input}
          disabled={loading || !!pending}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {pending && (
          <div className="ns-cmdbar-confirm" data-risk={pending.riskLevel ?? undefined}>
            <p>{pending.message}</p>
            <div className="ns-cmdbar-confirm-actions">
              <button type="button" onClick={() => void confirm()} disabled={loading}>
                {pending.riskLevel === 'consequential' ? 'Confirm — do it' : 'Confirm'}
              </button>
              <button type="button" onClick={cancelPending} disabled={loading}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {!pending && history.length > 0 && (
          <ul className="ns-cmdbar-history">
            {[...history].reverse().slice(0, 6).map((h) => (
              <li key={h.commandId} data-status={h.status}>
                <span className="ns-cmdbar-raw">{h.raw}</span>
                <span className="ns-cmdbar-msg">{h.message}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="ns-cmdbar-hint">Enter to run · Esc to close</p>
      </div>
    </div>
  )
}
