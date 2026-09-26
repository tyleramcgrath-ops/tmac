'use client'

import { useActionState, useEffect, useState } from 'react'
import { createSite, logIn, signUp, type FormState } from '@/app/actions'
import { TEMPLATES, templateFor } from '@/lib/templates'
import { typeFromName } from '@/lib/type-hints'

function Error({ state }: { state: FormState }) {
  return state.error ? <p className="error" role="alert">{state.error}</p> : null
}

export function SignUpForm({ idea = '', template = '', claim = '', promo = '' }: { idea?: string; template?: string; claim?: string; promo?: string }) {
  const [state, action, pending] = useActionState(signUp, {})
  return (
    <form action={action}>
      <Error state={state} />
      {idea && <input type="hidden" name="idea" value={idea} />}
      {template && <input type="hidden" name="template" value={template} />}
      {claim && <input type="hidden" name="claim" value={claim} />}
      {promo && <input type="hidden" name="promo" value={promo} />}
      <label className="field"><span>Your name</span><input className="input" name="name" autoComplete="name" required /></label>
      <label className="field"><span>Email</span><input className="input" name="email" type="email" autoComplete="email" required /></label>
      <label className="field"><span>Password</span><input className="input" name="password" type="password" autoComplete="new-password" minLength={8} required /><small>At least 8 characters.</small></label>
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>{pending ? 'Creating your account…' : 'Create my account'}</button>
    </form>
  )
}

export function LogInForm({ claim = '' }: { claim?: string }) {
  const [state, action, pending] = useActionState(logIn, {})
  return (
    <form action={action}>
      <Error state={state} />
      {claim && <input type="hidden" name="claim" value={claim} />}
      <label className="field"><span>Email</span><input className="input" name="email" type="email" autoComplete="email" required /></label>
      <label className="field"><span>Password</span><input className="input" name="password" type="password" autoComplete="current-password" required /></label>
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>{pending ? 'Logging in…' : 'Log in'}</button>
    </form>
  )
}

function b64url(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function NewSiteForm({ types, palettes, idea = '', template = '' }: { types: [string, string][]; palettes: [string, string, string][]; idea?: string; template?: string }) {
  const [state, action, pending] = useActionState(createSite, {})
  const [tpl, setTpl] = useState(templateFor(template)?.key ?? '')
  const [info, setInfo] = useState({ name: '', type: '', city: '', region: '', phone: '', services: '' })
  const [palette, setPalette] = useState(templateFor(template)?.palette ?? palettes[0]?.[0] ?? 'ocean')
  const [src, setSrc] = useState('')
  const set = (k: keyof typeof info) => (e: { target: { value: string } }) => setInfo((v) => ({ ...v, [k]: e.target.value }))
  const chosen = templateFor(tpl)
  const typeLabel = types.find(([k]) => k === info.type)?.[1]
  const prompt = chosen?.prompt({ ...info, typeLabel, services: info.services.split(/\n|,/).map((x) => x.trim()).filter(Boolean) })
  const hinted = typeFromName(info.name)
  const mismatch = hinted && info.type && hinted !== info.type ? hinted : null
  const hintLabel = types.find(([k]) => k === (mismatch ?? ''))?.[1]

  // Rebuild the preview a moment after typing stops.
  useEffect(() => {
    if (!info.type) return setSrc('')
    const t = setTimeout(() => setSrc(`/dashboard/new/preview/${b64url(JSON.stringify({ ...info, palette, ...(tpl ? { design: tpl } : {}) }))}`), 450)
    return () => clearTimeout(t)
  }, [info, palette, tpl])

  return (
    <div className="new-grid">
      <form action={action} className="card">
        <Error state={state} />
        {idea && <input type="hidden" name="idea" value={idea} />}
        <label className="field">
          <span>What kind of business?</span>
          <select className="input" name="type" value={info.type} onChange={set('type')} required>
            <option value="" disabled>Choose one</option>
            {types.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
          <small>This decides your pages, photos and wording, so pick the closest match.</small>
        </label>
        <label className="field"><span>Business name</span><input className="input" name="name" placeholder="Rivertown Plumbing" required maxLength={120} value={info.name} onChange={(e) => { set('name')(e); const h = typeFromName(e.target.value); if (h && !info.type) setInfo((v) => ({ ...v, type: h })) }} /></label>
        {mismatch && (
          <p className="notice warn" role="status">
            “{info.name}” sounds like a {hintLabel?.toLowerCase()}, but you picked {typeLabel?.toLowerCase()}.{' '}
            <button type="button" className="linkish" onClick={() => setInfo((v) => ({ ...v, type: mismatch }))}>Switch to {hintLabel}</button>
          </p>
        )}
        <div className="row">
          <label className="field"><span>City</span><input className="input" name="city" placeholder="Rivertown" required maxLength={60} value={info.city} onChange={set('city')} /></label>
          <label className="field"><span>State or province</span><input className="input" name="region" placeholder="OH" required maxLength={40} value={info.region} onChange={set('region')} /></label>
        </div>
        <label className="field">
          <span>{info.type === 'lawyer' ? 'Practice areas' : 'What do you offer?'}</span>
          <textarea className="input" name="services" placeholder={info.type === 'lawyer' ? 'Estate planning\nFamily law\nReal estate closings' : 'Drain cleaning\nLeak repair\nWater heaters'} value={info.services} onChange={set('services')} />
          <small>One per line, the way your customers would say it. Each becomes its own section, so be specific.</small>
        </label>
        <div className="row">
          <label className="field"><span>Phone <em className="muted">(optional)</em></span><input className="input" name="phone" type="tel" placeholder="(555) 201-4480" maxLength={30} value={info.phone} onChange={set('phone')} /></label>
          <label className="field"><span>Email <em className="muted">(optional)</em></span><input className="input" name="email" type="email" placeholder="hello@yourbusiness.com" /></label>
        </div>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: '0 0 22px' }}>
          <span style={{ display: 'block', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Colors</span>
          <div className="swatches">
            {palettes.map(([k, label, color]) => (
              <div className="swatch" key={k}>
                <input type="radio" id={`p-${k}`} name="palette" value={k} checked={palette === k} onChange={() => setPalette(k)} />
                <label htmlFor={`p-${k}`}><i style={{ background: color }} />{label}</label>
              </div>
            ))}
          </div>
        </fieldset>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: '0 0 22px' }}>
          <span style={{ display: 'block', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Style</span>
          <div className="tpl-grid">
            <label className={`tpl tpl-none${tpl === '' ? ' on' : ''}`}>
              <input type="radio" name="template" value="" checked={tpl === ''} onChange={() => setTpl('')} />
              <strong>Made for {typeLabel ? typeLabel.toLowerCase() : 'your business'}</strong>
              <span>Recommended. The layout that suits your kind of business.</span>
            </label>
            {TEMPLATES.map((t) => (
              <label key={t.key} className={`tpl${tpl === t.key ? ' on' : ''}`}>
                <input type="radio" name="template" value={t.key} checked={tpl === t.key} onChange={() => { setTpl(t.key); if (t.key === 'upscale' || palette === 'noir') setPalette(t.palette) }} />
                <strong>{t.name}</strong>
                <span>{t.bestFor}</span>
              </label>
            ))}
          </div>
          {chosen && <small>Sofie will also rewrite the whole site in this style after it’s built.</small>}
        </fieldset>
        <label className="field">
          <span>Website language</span>
          <select className="input" name="language" defaultValue="en">
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </label>
        {prompt && (
          <details className="tpl-prompt">
            <summary>What Sofie will be asked to do</summary>
            <p>{prompt}</p>
          </details>
        )}
        <button className="btn btn-primary btn-block" type="submit" disabled={pending}>{pending ? 'Building your website…' : 'Build this website'}</button>
      </form>
      <aside className="new-preview" aria-label="Preview of your website">
        <div className="new-preview-bar"><i /><i /><i /><span>{info.name ? `${info.name}` : 'Your website'}</span></div>
        <div className={`new-preview-frame${src ? '' : ' empty'}`}>
          {src ? <iframe src={src} title="Your website, as it will look" loading="lazy" /> : <p className="muted">Pick your kind of business and your website appears here, built from what you type.</p>}
        </div>
        <small className="muted">This is your real site. Everything updates as you type, and you can change any of it later.</small>
      </aside>
    </div>
  )
}
