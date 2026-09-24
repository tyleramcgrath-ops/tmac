'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import type { SettingsState } from '@/app/dashboard/sites/[id]/manage-actions'

type Action = (prev: SettingsState, form: FormData) => Promise<SettingsState>

export interface ProductValues {
  name: string
  price: string
  description: string
  imageSrc: string
  imageAlt: string
  buyUrl: string
  soldOut: boolean
}

export function ProductForm({ action, values, photos, isNew }: { action: Action; values: ProductValues; photos: { src: string; alt: string }[]; isNew: boolean }) {
  const [state, run, pending] = useActionState(action, {})
  const [img, setImg] = useState(values.imageSrc)
  const [alt, setAlt] = useState(values.imageAlt)
  const ref = useRef<HTMLFormElement>(null)
  // A new-product form clears itself after a successful save.
  useEffect(() => {
    if (isNew && state.saved) {
      ref.current?.reset()
      setImg('')
      setAlt('')
    }
  }, [state, isNew])
  return (
    <form action={run} ref={ref} className="product-form">
      <div className="pf-photo">
        {img ? <img src={img.replace(/w=\d+/, 'w=400')} alt="" /> : <span className="muted small">No photo</span>}
      </div>
      <div className="pf-fields">
        <div className="row">
          <label className="field"><span>Name</span><input className="input" name="name" defaultValue={values.name} required maxLength={120} placeholder="Country sourdough loaf" /></label>
          <label className="field"><span>Price</span><input className="input" name="price" defaultValue={values.price} required inputMode="decimal" placeholder="12.50" /></label>
        </div>
        <label className="field"><span>Description <em className="muted">(optional)</em></span><textarea className="input" name="description" defaultValue={values.description} maxLength={600} rows={2} /></label>
        <label className="field"><span>Photo link <em className="muted">(https://…)</em></span><input className="input" name="imageSrc" value={img} onChange={(e) => setImg(e.target.value)} placeholder="https://" /></label>
        {photos.length > 0 && (
          <div className="pf-picks" aria-label="Or pick a photo">
            {photos.map((p) => (
              <button type="button" key={p.src} onClick={() => { setImg(p.src); setAlt(p.alt) }} aria-label={`Use photo: ${p.alt}`}>
                <img src={p.src.replace(/w=\d+/, 'w=160')} alt="" />
              </button>
            ))}
          </div>
        )}
        <input type="hidden" name="imageAlt" value={alt} />
        <label className="field"><span>Stripe payment link <em className="muted">(optional)</em></span><input className="input" name="buyUrl" defaultValue={values.buyUrl} placeholder="https://buy.stripe.com/…" /><small>Customers pay you directly. Without a link, the button says “Ask about this” and opens your contact page.</small></label>
        <label className="check"><input type="checkbox" name="soldOut" defaultChecked={values.soldOut} /> Sold out</label>
        <div className="save-row">
          {state.error && <p className="error" role="alert">{state.error}</p>}
          {state.saved && !pending && <p className="saved" role="status">{isNew ? 'Added.' : 'Saved.'}</p>}
          <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>{pending ? 'Saving…' : isNew ? 'Add product' : 'Save'}</button>
        </div>
      </div>
    </form>
  )
}
