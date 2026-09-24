'use client'

import { useActionState } from 'react'
import { createSite, logIn, signUp, type FormState } from '@/app/actions'

function Error({ state }: { state: FormState }) {
  return state.error ? <p className="error" role="alert">{state.error}</p> : null
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, {})
  return (
    <form action={action}>
      <Error state={state} />
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

export function NewSiteForm({ types, palettes }: { types: [string, string][]; palettes: [string, string, string][] }) {
  const [state, action, pending] = useActionState(createSite, {})
  return (
    <form action={action}>
      <Error state={state} />
      <label className="field"><span>Business name</span><input className="input" name="name" placeholder="Rivertown Plumbing" required maxLength={120} /></label>
      <label className="field">
        <span>What kind of business?</span>
        <select className="input" name="type" defaultValue="" required>
          <option value="" disabled>Choose one</option>
          {types.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </label>
      <div className="row">
        <label className="field"><span>City</span><input className="input" name="city" placeholder="Rivertown" required maxLength={60} /></label>
        <label className="field"><span>State</span><input className="input" name="region" placeholder="OH" required maxLength={40} /></label>
      </div>
      <div className="row">
        <label className="field"><span>Phone <em className="muted">(optional)</em></span><input className="input" name="phone" type="tel" placeholder="(555) 201-4480" maxLength={30} /></label>
        <label className="field"><span>Email <em className="muted">(optional)</em></span><input className="input" name="email" type="email" placeholder="hello@yourbusiness.com" /></label>
      </div>
      <label className="field">
        <span>What do you offer?</span>
        <textarea className="input" name="services" placeholder={'Drain cleaning\nLeak repair\nWater heaters'} />
        <small>One per line. These become your services section and page.</small>
      </label>
      <fieldset className="field" style={{ border: 0, padding: 0, margin: '0 0 22px' }}>
        <span style={{ display: 'block', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Pick a color style</span>
        <div className="swatches">
          {palettes.map(([k, label, color], i) => (
            <div className="swatch" key={k}>
              <input type="radio" id={`p-${k}`} name="palette" value={k} defaultChecked={i === 0} />
              <label htmlFor={`p-${k}`}><i style={{ background: color }} />{label}</label>
            </div>
          ))}
        </div>
      </fieldset>
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>{pending ? 'Building your website…' : 'Build my website'}</button>
    </form>
  )
}
