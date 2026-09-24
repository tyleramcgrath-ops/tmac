'use client'

import { startTransition, useActionState, useEffect, useRef, useState } from 'react'
import type { UploadState } from '@/app/dashboard/sites/[id]/manage-actions'

type Action = (prev: UploadState, form: FormData) => Promise<UploadState>

const MAX_SIDE = 1600

// Shrinks the photo in the browser (longest side 1600px, WebP) so uploads are
// quick and pages stay fast, then sends it to the server action.
async function shrink(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.84))
  if (!blob) throw new Error('shrink failed')
  return { blob, width, height }
}

export function PhotoUpload({ action, logo = false }: { action: Action; logo?: boolean }) {
  const [state, run, pending] = useActionState(action, {})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState('')
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state.saved) {
      ref.current?.reset()
      setPreview('')
    }
  }, [state])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = new FormData(e.currentTarget)
    const file = form.get('file')
    if (!(file instanceof File) || !file.size) return setError('Choose a photo first.')
    setBusy(true)
    try {
      const { blob, width, height } = await shrink(file)
      form.set('file', new File([blob], 'photo.webp', { type: 'image/webp' }))
      form.set('width', String(width))
      form.set('height', String(height))
      startTransition(() => run(form))
    } catch {
      setError('That file couldn’t be opened as a photo. Try a JPEG or PNG.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form ref={ref} onSubmit={onSubmit} className="upload">
      <label className="drop">
        {preview ? <img src={preview} alt="" /> : <span><strong>Choose a photo</strong><br /><span className="muted small">JPEG, PNG or WebP. We resize it for you.</span></span>}
        <input type="file" name="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = e.target.files?.[0]; setPreview(f ? URL.createObjectURL(f) : '') }} />
      </label>
      <div className="upload-fields">
        <label className="field"><span>Describe the photo <em className="muted">(for Google and screen readers)</em></span><input className="input" name="alt" maxLength={200} placeholder="Our team fitting a new boiler in a kitchen" /></label>
        {logo && <label className="check"><input type="checkbox" name="asLogo" /> Use this as my logo</label>}
        <div className="save-row">
          {(error || state.error) && <p className="error" role="alert">{error || state.error}</p>}
          {state.saved && !pending && <p className="saved" role="status">Uploaded.</p>}
          <button className="btn btn-primary btn-sm" type="submit" disabled={busy || pending}>{busy || pending ? 'Uploading…' : 'Upload'}</button>
        </div>
      </div>
    </form>
  )
}
