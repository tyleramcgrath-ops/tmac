'use client'

import { useEffect, useState } from 'react'
import { api, ApiError, type OperatorPreviewDTO, type RecommendationDTO } from '../../../lib/client'
import { Field, inputClass, Spinner } from '../../../lib/ui'

// One-click fix (Phase H). Instead of asking the user to hand-type a value, we
// ask the Operator for the concrete generated fix, show it, and deploy it
// through the same safety-gated, read-back-verified pipeline. This covers every
// fix kind: title/meta (editable), and the body-content fixes — https-upgrade,
// missing-H1, internal linking. Fixes the Operator can't safely automate are
// shown as advisory, never fabricated into a deploy.
const EDITABLE_KINDS = new Set(['title', 'metaDescription'])

export function DeployFromRecommendation({
  projectId,
  rec,
  onClose,
  onDeployed,
}: {
  projectId: string
  rec: RecommendationDTO
  onClose: () => void
  onDeployed: () => void
}) {
  const targetUrl = rec.evidence.affectedUrls[0]
  const [preview, setPreview] = useState<OperatorPreviewDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [edited, setEdited] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const { previews } = await api.operatorPreview(projectId, [rec.id])
        const p = previews[0] ?? null
        setPreview(p)
        if (p?.proposedValue && p.fixKind && EDITABLE_KINDS.has(p.fixKind)) setEdited(p.proposedValue)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not generate the fix.')
      } finally {
        setLoading(false)
      }
    })()
  }, [projectId, rec.id])

  const editable = preview?.fixKind ? EDITABLE_KINDS.has(preview.fixKind) : false

  async function deploy() {
    setError('')
    setBusy(true)
    try {
      const { results } = await api.operatorDeploy(projectId, [
        { recommendationId: rec.id, approve: true, editedValue: editable ? edited : undefined },
      ])
      const r = results[0]
      if (r?.ok) {
        onDeployed()
      } else {
        setError(r?.error ? `${r.error}${r.stage ? ` (${r.stage})` : ''}` : 'Deploy did not complete.')
        setBusy(false)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Deploy failed.')
      setBusy(false)
    }
  }

  const canDeploy = preview?.deployable === true && preview?.safety?.blocked !== true

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="rf-card max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto p-6">
        <div>
          <p className="text-lg font-semibold text-white">Fix on WordPress</p>
          <p className="mt-1 text-xs text-[var(--rf-muted)]">{rec.title}</p>
        </div>
        <div className="rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] p-3 text-xs">
          <p className="text-[var(--rf-muted)]">Evidence — affected page:</p>
          <p className="rf-mono text-[var(--rf-blue-bright)] break-all">{targetUrl}</p>
        </div>

        {loading ? (
          <Spinner label="Generating the fix…" />
        ) : !preview ? (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error || 'No fix available.'}</p>
        ) : (
          <>
            {!preview.deployable ? (
              <div className="rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
                <p className="font-semibold">This fix is advisory — not an automated WordPress write.</p>
                <p className="mt-1 text-yellow-100/80">{preview.note}</p>
                {preview.proposedValue && <pre className="mt-2 whitespace-pre-wrap rf-mono text-[11px] text-yellow-100/70">{preview.proposedValue}</pre>}
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-[var(--rf-card-line)] p-3 text-xs">
                  <p className="text-[var(--rf-muted)]">Fix type: <b className="text-white">{preview.fixKind}</b></p>
                  {preview.currentValue !== undefined && (
                    <p className="mt-1 text-[var(--rf-muted)]">Current: <span className="rf-mono text-[var(--rf-faint)] break-all">{preview.currentValue || '(empty)'}</span></p>
                  )}
                </div>
                {editable ? (
                  <Field label="Proposed value (edit before deploy)">
                    <textarea className={inputClass + ' min-h-[72px]'} value={edited} onChange={(e) => setEdited(e.target.value)} />
                  </Field>
                ) : (
                  <div className="rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] p-3 text-xs">
                    <p className="text-[var(--rf-muted)]">Proposed change (applied to the live post body, then verified):</p>
                    <pre className="mt-1 whitespace-pre-wrap rf-mono text-[11px] text-[var(--rf-blue-bright)]">{preview.proposedValue}</pre>
                  </div>
                )}
                {preview.safety?.warnings && preview.safety.warnings.length > 0 && (
                  <ul className="rounded-lg bg-white/[0.02] px-3 py-2 text-[11px] text-[var(--rf-muted)]">
                    {preview.safety.warnings.map((w, i) => <li key={i}>• {w}</li>)}
                  </ul>
                )}
                <p className="text-[11px] text-[var(--rf-faint)]">
                  {preview.note} The change is applied, verified by read-back, recorded, and reversible; the recommendation is marked verified (or reopened if verification fails) automatically.
                </p>
              </>
            )}
            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="rf-btn-ghost rounded-lg px-4 py-2 text-sm">Close</button>
              {canDeploy && (
                <button onClick={deploy} disabled={busy} className="rf-btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">
                  {busy ? 'Deploying…' : 'Deploy & verify'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
