'use client'

// Persistent command console — docked at the bottom of the HUD, not a
// modal. Reuses the exact engine-calling contract the old CommandBarOverlay
// used (raw text -> api.runCommand -> pending-confirmation -> confirmed);
// only the chrome changed from an overlay dialog to an always-docked bar.

import { useEffect, useState } from 'react'
import { api, type CommandResultDTO, type MissionDTO } from '../../../lib/client'
import type { CompassState } from '../../compass'

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function CommandConsole({
  projectId,
  panelsUp,
  onCompassState,
  inputRef,
}: {
  projectId: string | null
  panelsUp: boolean
  onCompassState: (s: CompassState) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  const [input, setInput] = useState('')
  const [pending, setPending] = useState<CommandResultDTO | null>(null)
  const [result, setResult] = useState<CommandResultDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentMission, setCurrentMission] = useState<MissionDTO | null>(null)

  useEffect(() => {
    if (!panelsUp || !projectId) return
    api.getMissionQueue(projectId).then((r) => setCurrentMission(r.queue.currentMission)).catch(() => {})
  }, [panelsUp, projectId])

  // A settled result reads for a few seconds, then clears itself — a real
  // answer to what was asked, not a persistent history log.
  useEffect(() => {
    if (!result) return
    const t = window.setTimeout(() => setResult(null), 6000)
    return () => window.clearTimeout(t)
  }, [result])

  function handleResult(res: CommandResultDTO) {
    if (res.status === 'pending-confirmation') {
      setPending(res)
      setResult(null)
      onCompassState(res.riskLevel === 'consequential' ? 'warning' : 'planning')
      return
    }
    setPending(null)
    setInput('')
    setResult(res)
    if (res.status === 'executed') onCompassState(res.riskLevel === 'read-only' ? 'idle' : 'success')
    else if (res.status === 'rejected-permission') onCompassState('warning')
    else if (res.status === 'failed') onCompassState('error')
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
    } catch {
      onCompassState('warning')
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
    } else if (e.key === 'Escape') {
      if (result) setResult(null)
      e.currentTarget.blur()
    }
  }

  return (
    <div className="ns-console ns-glass" aria-label="North Star command console">
      {pending && (
        <div className="ns-console-note ns-glass" data-risk={pending.riskLevel ?? undefined}>
          <p>{pending.message}</p>
          <div className="ns-console-actions">
            <button type="button" onClick={() => void confirm()} disabled={loading}>
              {pending.riskLevel === 'consequential' ? 'Confirm — do it' : 'Confirm'}
            </button>
            <button type="button" onClick={cancelPending} disabled={loading}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {!pending && result && (
        <div className="ns-console-note ns-glass" data-status={result.status}>
          <p>{result.message}</p>
        </div>
      )}
      <input
        ref={inputRef}
        className="ns-console-input"
        type="text"
        placeholder='Ask North Star — "what needs my approval?"'
        value={input}
        disabled={loading || !!pending}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <button
        type="button"
        className="ns-console-btn"
        disabled={loading || !input.trim() || !!pending}
        onClick={() => void submit(input)}
      >
        {loading ? '…' : 'Run'}
      </button>
    </div>
  )
}
