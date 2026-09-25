'use client'

import { useActionState } from 'react'
import type { SettingsState } from '@/app/dashboard/sites/[id]/manage-actions'
import { DAYS, DAY_NAMES, type WeekHours } from '@/lib/hours'

export interface SettingsValues {
  name: string
  phone: string
  email: string
  street: string
  city: string
  region: string
  postalCode: string
  tagline: string
  topbar: string
  ctaLabel: string
  hasCta: boolean
  callBar: boolean
  week: WeekHours
  palette: string
  design: string
}

type Action = (prev: SettingsState, form: FormData) => Promise<SettingsState>

export function SettingsForm({ action, values, palettes, designs }: {
  action: Action
  values: SettingsValues
  palettes: { key: string; label: string; colors: string[] }[]
  designs: { key: string; label: string; note: string }[]
}) {
  const [state, run, pending] = useActionState(action, {})
  return (
    <form action={run} className="settings">
      <fieldset className="card">
        <legend>Your business</legend>
        <p className="muted help">Shown in your header, footer and Google listing.</p>
        <label className="field"><span>Business name</span><input className="input" name="name" defaultValue={values.name} required maxLength={120} /></label>
        <div className="row">
          <label className="field"><span>Phone</span><input className="input" name="phone" type="tel" defaultValue={values.phone} maxLength={30} /></label>
          <label className="field"><span>Email</span><input className="input" name="email" type="email" defaultValue={values.email} maxLength={200} /></label>
        </div>
        <label className="field"><span>Street address <em className="muted">(optional)</em></span><input className="input" name="street" defaultValue={values.street} autoComplete="street-address" maxLength={200} /></label>
        <div className="row row-3">
          <label className="field"><span>City</span><input className="input" name="city" defaultValue={values.city} maxLength={80} /></label>
          <label className="field"><span>State</span><input className="input" name="region" defaultValue={values.region} maxLength={40} /></label>
          <label className="field"><span>ZIP code</span><input className="input" name="postalCode" defaultValue={values.postalCode} maxLength={20} /></label>
        </div>
        <label className="field"><span>A line about you <em className="muted">(footer)</em></span><input className="input" name="tagline" defaultValue={values.tagline} maxLength={200} placeholder="Family-run and proud to serve the valley since 2009." /></label>
      </fieldset>

      <fieldset className="card">
        <legend>Opening hours</legend>
        <p className="muted help">Shown in your footer and sent to Google, so people know when to call.</p>
        <div className="hours">
          {DAYS.map((d) => {
            const h = values.week[d]
            return (
              <div className="hours-row" key={d}>
                <label className="hours-day">
                  <input type="checkbox" name={`open-${d}`} defaultChecked={!!h} />
                  <span>{DAY_NAMES[d]}</span>
                </label>
                <input className="input" type="time" name={`from-${d}`} defaultValue={h?.open ?? '09:00'} aria-label={`${DAY_NAMES[d]} opens`} />
                <span className="muted">to</span>
                <input className="input" type="time" name={`to-${d}`} defaultValue={h?.close ?? '17:00'} aria-label={`${DAY_NAMES[d]} closes`} />
              </div>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="card">
        <legend>Look and feel</legend>
        <p className="muted help">Change the whole site at once. Your words and photos stay the same.</p>
        <span className="label">Style</span>
        <div className="choice-grid">
          {designs.map((d) => (
            <label key={d.key} className="choice">
              <input type="radio" name="design" value={d.key} defaultChecked={values.design === d.key} />
              <strong>{d.label}</strong>
              <span className="muted">{d.note}</span>
            </label>
          ))}
        </div>
        <span className="label">Colors</span>
        <div className="swatches">
          {palettes.map((p) => (
            <div className="swatch" key={p.key}>
              <input type="radio" id={`pal-${p.key}`} name="palette" value={p.key} defaultChecked={values.palette === p.key} />
              <label htmlFor={`pal-${p.key}`}>
                <span className="swatch-dots">{p.colors.map((c) => <i key={c} style={{ background: c }} />)}</span>
                {p.label}
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="card">
        <legend>Header</legend>
        <label className="field"><span>Top bar message <em className="muted">(leave empty to hide it)</em></span><input className="input" name="topbar" defaultValue={values.topbar} maxLength={120} placeholder="Licensed and insured · Same-day service" /></label>
        {values.hasCta && <label className="field"><span>Header button</span><input className="input" name="ctaLabel" defaultValue={values.ctaLabel} maxLength={40} /></label>}
        <label className="check"><input type="checkbox" name="callBar" defaultChecked={values.callBar} /> On phones, show a Call button pinned to the bottom of the screen <em className="muted">(needs a phone number)</em></label>
      </fieldset>

      <div className="save-bar">
        {state.error && <p className="error" role="alert">{state.error}</p>}
        {state.saved && !pending && <p className="saved" role="status">Saved. Your website is updated.</p>}
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</button>
      </div>
    </form>
  )
}
