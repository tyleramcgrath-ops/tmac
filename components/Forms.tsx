'use client'

import { useActionState, useEffect, useState } from 'react'
import { createSite, logIn, signUp, type FormState } from '@/app/actions'
import { TEMPLATES, templateFor } from '@/lib/templates'
import { typeFromName } from '@/lib/type-hints'
import type { PlaceDetails } from '@/lib/places'
import { findOnGoogle, pickFromGoogle, type GoogleSearchResult } from '@/app/dashboard/new/google-actions'

function Error({ state }: { state: FormState }) {
  return state.error ? <p className="error" role="alert">{state.error}</p> : null
}

export function SignUpForm({ idea = '', template = '', claim = '', promo = '', approve = '' }: { idea?: string; template?: string; claim?: string; promo?: string; approve?: string }) {
  const [state, action, pending] = useActionState(signUp, {})
  return (
    <form action={action}>
      <Error state={state} />
      {idea && <input type="hidden" name="idea" value={idea} />}
      {template && <input type="hidden" name="template" value={template} />}
      {claim && <input type="hidden" name="claim" value={claim} />}
      {approve && <input type="hidden" name="approve" value={approve} />}
      {promo && <input type="hidden" name="promo" value={promo} />}
      <label className="field"><span>Your name</span><input className="input" name="name" autoComplete="name" required /></label>
      <label className="field"><span>Email</span><input className="input" name="email" type="email" autoComplete="email" required /></label>
      <label className="field"><span>Password</span><input className="input" name="password" type="password" autoComplete="new-password" minLength={8} required /><small>At least 8 characters.</small></label>
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>{pending ? 'Creating your account…' : 'Create my account'}</button>
      <p className="muted small" style={{ margin: '12px 0 0', textAlign: 'center' }}>By creating an account you confirm you’re 18 or older and agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy</a>.</p>
    </form>
  )
}

export function LogInForm({ claim = '', approve = '' }: { claim?: string; approve?: string }) {
  const [state, action, pending] = useActionState(logIn, {})
  return (
    <form action={action}>
      <Error state={state} />
      {claim && <input type="hidden" name="claim" value={claim} />}
      {approve && <input type="hidden" name="approve" value={approve} />}
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

// "Start from your Google listing": search, tap your business, and the
// form below fills in with what Google has (lib/places).
function GoogleStart({ onPick }: { onPick: (p: PlaceDetails) => void }) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState<GoogleSearchResult>({})
  const [picked, setPicked] = useState<PlaceDetails | null>(null)
  const search = async () => {
    if (q.trim().length < 3 || busy) return
    setBusy(true)
    setRes(await findOnGoogle(q))
    setBusy(false)
  }
  const pick = async (id: string) => {
    setBusy(true)
    const r = await pickFromGoogle(id)
    setBusy(false)
    if (r.place) {
      setPicked(r.place)
      setRes({})
      onPick(r.place)
    } else setRes({ error: r.error })
  }
  if (picked)
    return (
      <div className="gstart done" role="status">
        <b>Filled in from Google</b>
        <span>{picked.name}{picked.city ? `, ${picked.city}` : ''}{picked.hours.length ? ', hours added' : ''}. Check the details below, add what you offer, and build.</span>
      </div>
    )
  return (
    <div className="gstart">
      <b>On Google Maps? Start from your listing.</b>
      <span>Type your business name and town, then tap your business. We fill in the rest.</span>
      <div className="gstart-row">
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search() } }} placeholder="Rosie’s Bakery Portland" aria-label="Your business on Google" maxLength={120} />
        <button type="button" className="btn btn-ghost" onClick={search} disabled={busy}>{busy ? 'Looking…' : 'Find it'}</button>
      </div>
      {res.error && <small className="error">{res.error}</small>}
      {res.matches && (
        <ul className="gstart-list">
          {res.matches.map((m) => (
            <li key={m.id}><button type="button" onClick={() => pick(m.id)} disabled={busy}><strong>{m.name}</strong><span>{m.address}</span></button></li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function NewSiteForm({ types, palettes, idea = '', template = '', google = false }: { types: [string, string][]; palettes: [string, string, string][]; idea?: string; template?: string; google?: boolean }) {
  const [state, action, pending] = useActionState(createSite, {})
  const [tpl, setTpl] = useState(templateFor(template)?.key ?? '')
  const [info, setInfo] = useState({ name: '', type: '', city: '', region: '', phone: '', services: '' })
  const [fromGoogle, setFromGoogle] = useState<PlaceDetails | null>(null)
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
        {google && (
          <GoogleStart
            onPick={(p) => {
              setFromGoogle(p)
              setInfo((v) => ({ ...v, name: p.name || v.name, type: p.type, city: p.city || v.city, region: p.region || v.region, phone: p.phone ?? v.phone }))
            }}
          />
        )}
        {fromGoogle && (
          <>
            <input type="hidden" name="placeId" value={fromGoogle.placeId} />
            {fromGoogle.street && <input type="hidden" name="street" value={fromGoogle.street} />}
            {fromGoogle.postalCode && <input type="hidden" name="postalCode" value={fromGoogle.postalCode} />}
            {fromGoogle.hours.length > 0 && <input type="hidden" name="hours" value={fromGoogle.hours.join('\n')} />}
          </>
        )}
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
