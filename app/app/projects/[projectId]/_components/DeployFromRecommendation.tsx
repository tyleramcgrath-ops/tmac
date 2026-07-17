'use client'

import { useEffect, useState } from 'react'
import { api, ApiError, type RecommendationDTO } from '../../../lib/client'
import { Field, inputClass, Spinner } from '../../../lib/ui'

// Deploy directly from a recommendation: resolves the WordPress post from the
// recommendation's evidence URL (honest manual fallback if unresolved), lets
// the user enter/edit the proposed value, and deploys with the recommendation
// linked. Crawl recommendations are diagnostic — the proposed value is the
// user's to supply, so we never fabricate one.
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
  const isTitle = /title/i.test(rec.title)
  const isMeta = /meta description/i.test(rec.title)
  const [resolving, setResolving] = useState(true)
  const [target, setTarget] = useState<{ postId: number; postType: string; title: string } | null>(null)
  const [postId, setPostId] = useState('')
  const [postType, setPostType] = useState('pages')
  const [title, setTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const { resolved, target } = await api.resolveWpTarget(projectId, targetUrl)
        if (resolved && target) {
          setTarget(target)
          setPostId(String(target.postId))
          setPostType(target.postType)
        }
      } catch (err) {
        // WordPress not connected, or lookup failed — fall back to manual entry.
        setError(err instanceof ApiError ? err.message : '')
      } finally {
        setResolving(false)
      }
    })()
  }, [projectId, targetUrl])

  async function deploy() {
    setError('')
    if (!postId) {
      setError('Enter the WordPress post ID for this page.')
      return
    }
    if (!title && !metaDescription) {
      setError('Enter the new title and/or meta description to deploy.')
      return
    }
    setBusy(true)
    try {
      await api.deployWordpress(projectId, {
        postId: Number(postId),
        postType,
        title: title || undefined,
        metaDescription: metaDescription || undefined,
        reason: `From recommendation: ${rec.title}`,
        recommendationId: rec.id,
      })
      onDeployed()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Deploy failed.')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="rf-card max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto p-6">
        <div>
          <p className="text-lg font-semibold text-white">Deploy fix to WordPress</p>
          <p className="mt-1 text-xs text-[var(--rf-muted)]">{rec.title}</p>
        </div>
        <div className="rounded-lg border border-[var(--rf-card-line)] bg-white/[0.02] p-3 text-xs">
          <p className="text-[var(--rf-muted)]">Evidence — affected page:</p>
          <p className="rf-mono text-[var(--rf-blue-bright)] break-all">{targetUrl}</p>
        </div>

        {resolving ? (
          <Spinner label="Resolving the WordPress post for this page…" />
        ) : (
          <>
            {target ? (
              <p className="rounded-lg bg-[var(--rf-green)]/10 px-3 py-2 text-xs text-[var(--rf-green)]">
                Matched WordPress {target.postType}/{target.postId}: “{target.title}”
              </p>
            ) : (
              <p className="rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
                Could not automatically match this page to a WordPress post. Enter the post ID manually below.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Post ID">
                <input className={inputClass} value={postId} onChange={(e) => setPostId(e.target.value)} />
              </Field>
              <Field label="Type">
                <select className={inputClass} value={postType} onChange={(e) => setPostType(e.target.value)}>
                  <option value="pages">pages</option>
                  <option value="posts">posts</option>
                </select>
              </Field>
            </div>
            {(isTitle || (!isMeta && !isTitle)) && (
              <Field label="New title">
                <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter the improved title" />
              </Field>
            )}
            {(isMeta || (!isMeta && !isTitle)) && (
              <Field label="New meta description">
                <input className={inputClass} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="Enter the improved meta description" />
              </Field>
            )}
            <p className="text-[11px] text-[var(--rf-faint)]">
              This recommendation is diagnostic — you supply the improved value. The change is applied, verified by read-back, recorded, and reversible; the recommendation is marked deployed/verified automatically.
            </p>
            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="rf-btn-ghost rounded-lg px-4 py-2 text-sm">Cancel</button>
              <button onClick={deploy} disabled={busy} className="rf-btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">
                {busy ? 'Deploying…' : 'Deploy & verify'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
