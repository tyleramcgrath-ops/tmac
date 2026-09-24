'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import type { SettingsState } from '@/app/dashboard/sites/[id]/manage-actions'

type Action = (prev: SettingsState, form: FormData) => Promise<SettingsState>

export function PostForm({ action, values, photos, isNew }: {
  action: Action
  values: { title: string; date: string; body: string; imageSrc: string; imageAlt: string }
  photos: { src: string; alt: string }[]
  isNew: boolean
}) {
  const [state, run, pending] = useActionState(action, {})
  const [img, setImg] = useState(values.imageSrc)
  const [alt, setAlt] = useState(values.imageAlt)
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (isNew && state.saved) {
      ref.current?.reset()
      setImg('')
      setAlt('')
    }
  }, [state, isNew])
  return (
    <form action={run} ref={ref} className="post-form">
      <div className="row row-post">
        <label className="field"><span>Title</span><input className="input" name="title" defaultValue={values.title} required maxLength={140} placeholder="5 signs your water heater is about to fail" /></label>
        <label className="field"><span>Date</span><input className="input" type="date" name="date" defaultValue={values.date} required /></label>
      </div>
      <label className="field">
        <span>Post</span>
        <textarea className="input post-body" name="body" defaultValue={values.body} required rows={10} placeholder={'Write it the way you’d explain it to a customer.\n\nLeave a blank line between paragraphs.\n\n## Start a line with ## for a subheading'} />
      </label>
      <span className="label">Photo <em className="muted">(optional)</em></span>
      <div className="pf-picks">
        {photos.map((p) => (
          <button type="button" key={p.src} className={img === p.src ? 'on' : ''} onClick={() => { setImg(p.src); setAlt(p.alt) }} aria-label={`Use photo: ${p.alt}`}>
            <img src={p.src.replace(/w=\d+/, 'w=160')} alt="" />
          </button>
        ))}
        {img && <button type="button" className="pf-clear" onClick={() => { setImg(''); setAlt('') }}>No photo</button>}
      </div>
      <input type="hidden" name="imageSrc" value={img} />
      <input type="hidden" name="imageAlt" value={alt} />
      <div className="save-row">
        {state.error && <p className="error" role="alert">{state.error}</p>}
        {state.saved && !pending && <p className="saved" role="status">{isNew ? 'Published.' : 'Saved.'}</p>}
        <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>{pending ? 'Publishing…' : isNew ? 'Publish post' : 'Save post'}</button>
      </div>
    </form>
  )
}
