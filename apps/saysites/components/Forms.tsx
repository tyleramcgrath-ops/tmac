'use client'

import { useActionState, useState } from 'react'
import { createSite, logIn, signUp, type FormState } from '@/app/actions'
import { photosFor } from '@/lib/photos'
import { TEMPLATES, templateFor } from '@/lib/templates'

function Error({ state }: { state: FormState }) {
  return state.error ? <p className="error" role="alert">{state.error}</p> : null
}

export function SignUpForm({ idea = '', template = '' }: { idea?: string; template?: string }) {
  const [state, action, pending] = useActionState(signUp, {})
  return (
    <form action={action}>
      <Error state={state} />
      {idea && <input type="hidden" name="idea" value={idea} />}
      {template && <input type="hidden" name="template" value={template} />}
      <label className="field"><span>Your name</span><input className="input" name="name" autoComplete="name" required /></label>
      <label className="field"><span>Email</span><input className="input" name="email" type="email" autoComplete="email" required /></label>
      <label className="field"><span>Password</span><input className="input" name="password" type="password" autoComplete="new-password" minLength={8} required /><small>At least 8 characters.</small></label>
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>{pending ? 'Creating your account…' : 'Create my account'}</button>
    </form>
  )
}

export function LogInForm() {
  const [state, action, pending] = useActionState(logIn, {})
  return (
    <form action={action}>
      <Error state={state} />
      <label className="field"><span>Email</span><input className="input" name="email" type="email" autoComplete="email" required /></label>
      <label className="field"><span>Password</span><input className="input" name="password" type="password" autoComplete="current-password" required /></label>
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>{pending ? 'Logging in…' : 'Log in'}</button>
    </form>
  )
}

export function NewSiteForm({ types, palettes, idea = '', template = '' }: { types: [string, string][]; palettes: [string, string, string][]; idea?: string; template?: string }) {
  const [state, action, pending] = useActionState(createSite, {})
  const [tpl, setTpl] = useState(templateFor(template)?.key ?? '')
  const [info, setInfo] = useState({ name: '', type: '', city: '', region: '', phone: '', services: '' })
  const set = (k: keyof typeof info) => (e: { target: { value: string } }) => setInfo((v) => ({ ...v, [k]: e.target.value }))
  const chosen = templateFor(tpl)
  const typeLabel = types.find(([k]) => k === info.type)?.[1]
  const prompt = chosen?.prompt({ ...info, typeLabel, services: info.services.split(/\n|,/).map((x) => x.trim()).filter(Boolean) })
  return (
    <form action={action}>
      <Error state={state} />
      {idea && <input type="hidden" name="idea" value={idea} />}
      <fieldset className="field" style={{ border: 0, padding: 0, margin: '0 0 22px' }}>
        <span style={{ display: 'block', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Start from a Talk &amp; Design template <em className="muted">(optional)</em></span>
        <div className="tpl-grid">
          {TEMPLATES.map((t) => (
            <label key={t.key} className={`tpl${tpl === t.key ? ' on' : ''}`}>
              <input type="radio" name="template" value={t.key} checked={tpl === t.key} onChange={() => setTpl(t.key)} />
              <img src={`${photosFor(t.key === 'bold' ? 'plumber' : t.key === 'editorial' ? 'salon' : 'bakery').hero.src.replace(/w=\d+/, 'w=480')}`} alt="" width={480} height={320} loading="lazy" />
              <strong>{t.name}</strong>
              <span>{t.bestFor}</span>
              <a href={`/preview/${t.example}`} target="_blank" rel="noopener">See the example →</a>
            </label>
          ))}
          <label className={`tpl tpl-none${tpl === '' ? ' on' : ''}`}>
            <input type="radio" name="template" value="" checked={tpl === ''} onChange={() => setTpl('')} />
            <strong>Pick for me</strong>
            <span>We’ll choose the design that suits your kind of business.</span>
          </label>
        </div>
      </fieldset>
      <label className="field"><span>Business name</span><input className="input" name="name" placeholder="Rivertown Plumbing" required maxLength={120} value={info.name} onChange={set('name')} /></label>
      <label className="field">
        <span>What kind of business?</span>
        <select className="input" name="type" value={info.type} onChange={set('type')} required>
          <option value="" disabled>Choose one</option>
          {types.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </label>
      <div className="row">
        <label className="field"><span>City</span><input className="input" name="city" placeholder="Rivertown" required maxLength={60} value={info.city} onChange={set('city')} /></label>
        <label className="field"><span>State</span><input className="input" name="region" placeholder="OH" required maxLength={40} value={info.region} onChange={set('region')} /></label>
      </div>
      <div className="row">
        <label className="field"><span>Phone <em className="muted">(optional)</em></span><input className="input" name="phone" type="tel" placeholder="(555) 201-4480" maxLength={30} value={info.phone} onChange={set('phone')} /></label>
        <label className="field"><span>Email <em className="muted">(optional)</em></span><input className="input" name="email" type="email" placeholder="hello@yourbusiness.com" /></label>
      </div>
      <label className="field">
        <span>What do you offer?</span>
        <textarea className="input" name="services" placeholder={'Drain cleaning\nLeak repair\nWater heaters'} value={info.services} onChange={set('services')} />
        <small>One per line. These become your services section and page.</small>
      </label>
      <fieldset className="field" style={{ border: 0, padding: 0, margin: '0 0 22px' }}>
        <span style={{ display: 'block', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Pick a color style</span>
        <div className="swatches">
          {palettes.map(([k, label, color], i) => (
            <div className="swatch" key={k}>
              <input type="radio" id={`p-${k}`} name="palette" value={k} defaultChecked={chosen ? k === chosen.palette : i === 0} key={`${k}-${tpl}`} />
              <label htmlFor={`p-${k}`}><i style={{ background: color }} />{label}</label>
            </div>
          ))}
        </div>
      </fieldset>
      {prompt && (
        <div className="tpl-prompt" aria-live="polite">
          <span>Your Talk &amp; Design prompt</span>
          <p>{prompt}</p>
          <small>This is all it takes. Sofie designs your site from these words, and you can keep talking to change anything.</small>
        </div>
      )}
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>{pending ? 'Designing your website…' : chosen ? 'Talk & Design my website' : 'Build my website'}</button>
    </form>
  )
}
