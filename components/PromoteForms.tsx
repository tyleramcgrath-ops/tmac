'use client'

import { useActionState, useState } from 'react'

type State = { error?: string; saved?: boolean }
type Action = (prev: State, form: FormData) => Promise<State>
type Look = { primary: string; background: string; text: string; name: string }

function SaveRow({ state, pending, submit, done }: { state: State; pending: boolean; submit: string; done: string }) {
  return (
    <div className="save-row">
      {state.error && <p className="error" role="alert">{state.error}</p>}
      {state.saved && !pending && <p className="saved" role="status">{done}</p>}
      <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>{pending ? 'Saving…' : submit}</button>
    </div>
  )
}

// What the top of the owner's site will look like, in the site's own colours.
function Preview({ look, promo, button }: { look: Look; promo?: string; button?: string }) {
  return (
    <div className="pm-prev" aria-hidden="true" style={{ background: look.background, color: look.text }}>
      {promo && <div className="pm-bar" style={{ background: look.primary, color: look.background }}>{promo}</div>}
      <div className="pm-head">
        <b>{look.name}</b>
        {button && <span style={{ background: look.primary, color: look.background }}>{button}</span>}
      </div>
    </div>
  )
}

export function PromoForm({ action, look, initial }: { action: Action; look: Look; initial: { text: string; href: string; until: string } }) {
  const [state, run, pending] = useActionState(action, {})
  const [text, setText] = useState(initial.text)
  return (
    <form action={run} className="action-form">
      <Preview look={look} promo={text || 'Your promotion shows here'} />
      <label className="field">
        <span>Your promotion</span>
        <input className="input" name="text" value={text} onChange={(e) => setText(e.target.value)} maxLength={100} placeholder="10% off your first visit this month" required />
        <small>{100 - text.length} characters left. Short and specific works best.</small>
      </label>
      <div className="pm-two">
        <label className="field">
          <span>Link it to <em className="muted">(optional)</em></span>
          <input className="input" name="href" defaultValue={initial.href} maxLength={300} placeholder="/contact" />
          <small>One of your pages, like /contact or /shop, or a web address.</small>
        </label>
        <label className="field">
          <span>Last day <em className="muted">(optional)</em></span>
          <input className="input" type="date" name="until" defaultValue={initial.until} />
          <small>It disappears by itself after this day.</small>
        </label>
      </div>
      <SaveRow state={state} pending={pending} submit={initial.text ? 'Save' : 'Put it on my site'} done="Saved. It’s on every page now." />
    </form>
  )
}

export function BookingForm({ action, look, labels, initial }: { action: Action; look: Look; labels: readonly string[]; initial: { url: string; label: string } }) {
  const [state, run, pending] = useActionState(action, {})
  const [label, setLabel] = useState(initial.label || labels[0])
  return (
    <form action={run} className="action-form">
      <Preview look={look} button={label} />
      <label className="field">
        <span>Your booking page</span>
        <input className="input" name="url" defaultValue={initial.url} maxLength={300} placeholder="https://calendly.com/your-name" required />
        <small>Open your booking page (Square, Calendly, Vagaro, Booksy, Acuity, OpenTable…) and copy the address from the top of your browser.</small>
      </label>
      <fieldset className="field pm-labels">
        <legend>The button says</legend>
        <div>
          {labels.map((l) => (
            <label key={l} className={l === label ? 'on' : ''}>
              <input type="radio" name="label" value={l} checked={l === label} onChange={() => setLabel(l)} />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      <SaveRow state={state} pending={pending} submit={initial.url ? 'Save' : 'Add the button'} done="Saved. The button is on every page now." />
    </form>
  )
}
