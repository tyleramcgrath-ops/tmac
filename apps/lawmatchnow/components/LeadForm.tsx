'use client'

import { useState, type FormEvent } from 'react'
import { leadSource } from '@/components/Tracker'

type Kind = 'evaluation' | 'contact-attorney' | 'claim' | 'general'
type Option = { value: string; label: string }

async function send(form: HTMLFormElement, kind: Kind, extra: Record<string, string> = {}) {
  const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>
  const res = await fetch('/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, ...extra, kind, page: location.pathname, source: leadSource() }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || 'Something went wrong. Please try again.')
  ;(window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.('event', 'generate_lead', { lead_type: kind, practice: data.practice ?? '' })
}

function Status({ state, error, done }: { state: string; error: string; done: string }) {
  if (state === 'done') return <p className="form-note ok" role="status">{done}</p>
  if (state === 'error') return <p className="form-note err" role="alert">{error}</p>
  return null
}

const Honeypot = () => (
  <div className="hp" aria-hidden="true">
    <label>Leave this empty<input name="company_website" tabIndex={-1} autoComplete="off" /></label>
  </div>
)

const Consent = () => (
  <p className="consent mb-0">
    By submitting, you agree we may share these details with attorneys who can help, and to our{' '}
    <a href="/privacy">privacy policy</a> and <a href="/terms">terms</a>. Submitting does not create an attorney-client relationship.
  </p>
)

/** A short three-step free case review, used on /get-started. */
export function CaseEvaluation({ areas, initialPractice = '', initialLocation = '' }: {
  areas: Option[]; initialPractice?: string; initialLocation?: string
}) {
  const [step, setStep] = useState(initialPractice ? 1 : 0)
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [practice, setPractice] = useState(initialPractice)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (step < 2) return setStep(step + 1)
    setState('sending')
    try {
      await send(e.currentTarget, 'evaluation')
      setState('done')
    } catch (err) {
      setError((err as Error).message)
      setState('error')
    }
  }

  if (state === 'done')
    return (
      <div className="wizard">
        <div className="eyebrow">Received</div>
        <h2 style={{ fontSize: '2.2rem' }}>Thank you. Your request is in.</h2>
        <p className="muted">
          We&apos;ll review what you shared and connect you with attorneys who handle this kind of case, usually within one
          business day. If this is an emergency, call 911. If you have a court date or deadline soon, mention it when an
          attorney contacts you.
        </p>
      </div>
    )

  return (
    <form className="wizard form" onSubmit={onSubmit}>
      <div className="progress" aria-hidden="true">
        {[0, 1, 2].map((i) => <i key={i} className={i <= step ? 'on' : ''} />)}
      </div>
      <p className="muted mb-0" style={{ fontSize: '0.85rem' }}>Step {step + 1} of 3</p>
      <Honeypot />
      <input type="hidden" name="practice" value={practice} />

      <div hidden={step !== 0}>
        <h2 style={{ fontSize: '1.9rem' }}>What do you need help with?</h2>
        <fieldset className="choices">
          <legend className="sr-only">Legal issue</legend>
          {areas.map((a) => (
            <label className="choice" key={a.value}>
              <input type="radio" name="practice_choice" value={a.value} checked={practice === a.value}
                onChange={() => { setPractice(a.value); setStep(1) }} required={step === 0} />
              <span>{a.label}</span>
            </label>
          ))}
        </fieldset>
      </div>

      <div hidden={step !== 1} className="form">
        <h2 style={{ fontSize: '1.9rem' }}>Tell us a little about it</h2>
        <div className="row2">
          <div className="field">
            <label htmlFor="ev-loc">City and state</label>
            <input id="ev-loc" name="location" defaultValue={initialLocation} placeholder="e.g. Tampa, FL" required={step === 1} autoComplete="address-level2" />
          </div>
          <div className="field">
            <label htmlFor="ev-when">When did this happen?</label>
            <select id="ev-when" name="timing" defaultValue="">
              <option value="">Choose one</option>
              <option>In the last week</option>
              <option>In the last month</option>
              <option>1 to 12 months ago</option>
              <option>More than a year ago</option>
              <option>It hasn&apos;t happened yet (planning ahead)</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="ev-desc">What happened?</label>
          <textarea id="ev-desc" name="message" required={step === 1} maxLength={3000}
            placeholder="A few sentences is enough. Please don't include anything you wouldn't want an attorney to read." />
        </div>
      </div>

      <div hidden={step !== 2} className="form">
        <h2 style={{ fontSize: '1.9rem' }}>Where should attorneys reach you?</h2>
        <div className="row2">
          <div className="field">
            <label htmlFor="ev-name">Full name</label>
            <input id="ev-name" name="name" required={step === 2} autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="ev-phone">Phone</label>
            <input id="ev-phone" name="phone" type="tel" required={step === 2} autoComplete="tel" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="ev-email">Email</label>
          <input id="ev-email" name="email" type="email" required={step === 2} autoComplete="email" />
        </div>
        <Consent />
      </div>

      <Status state={state} error={error} done="" />
      <div className="wizard-nav">
        {step > 0 ? <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>Back</button> : <span />}
        {step > 0 && (
          <button className="btn btn-primary" disabled={state === 'sending'}>
            {step < 2 ? 'Continue' : state === 'sending' ? 'Sending…' : 'Get my free case review'}
          </button>
        )}
      </div>
    </form>
  )
}

/** Single-step form: contacting a listed attorney, claiming a profile, or writing to us. */
export function SimpleLeadForm({ kind, attorney, submitLabel, practiceOptions }: {
  kind: Exclude<Kind, 'evaluation'>; attorney?: { slug: string; name: string }; submitLabel: string; practiceOptions?: Option[]
}) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('sending')
    try {
      await send(e.currentTarget, kind, attorney ? { attorney: attorney.slug } : {})
      setState('done')
      e.currentTarget.reset()
    } catch (err) {
      setError((err as Error).message)
      setState('error')
    }
  }

  const done =
    kind === 'contact-attorney' ? `Sent. ${attorney?.name ?? 'The attorney'}'s office will get your message.`
      : kind === 'claim' ? 'Thanks. We’ll verify your bar license and email you within two business days.'
        : 'Thanks, we got your message and will reply by email.'

  return (
    <form className="form" onSubmit={onSubmit}>
      <Honeypot />
      <div className="row2">
        <div className="field"><label htmlFor={`${kind}-name`}>Full name</label><input id={`${kind}-name`} name="name" required autoComplete="name" /></div>
        <div className="field"><label htmlFor={`${kind}-email`}>Email</label><input id={`${kind}-email`} name="email" type="email" required autoComplete="email" /></div>
      </div>
      <div className="row2">
        <div className="field"><label htmlFor={`${kind}-phone`}>Phone{kind === 'general' ? ' (optional)' : ''}</label><input id={`${kind}-phone`} name="phone" type="tel" required={kind !== 'general'} autoComplete="tel" /></div>
        {kind === 'claim' ? (
          <div className="field"><label htmlFor="claim-bar">Bar number and state</label><input id="claim-bar" name="bar" required placeholder="e.g. 123456 (FL)" /></div>
        ) : practiceOptions ? (
          <div className="field">
            <label htmlFor={`${kind}-practice`}>Legal issue</label>
            <select id={`${kind}-practice`} name="practice" defaultValue="">
              <option value="">Choose one</option>
              {practiceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ) : (
          <div className="field"><label htmlFor={`${kind}-loc`}>City and state</label><input id={`${kind}-loc`} name="location" autoComplete="address-level2" /></div>
        )}
      </div>
      {kind === 'claim' && (
        <div className="field"><label htmlFor="claim-firm">Firm name and website</label><input id="claim-firm" name="firm" placeholder="Firm name, https://…" /></div>
      )}
      <div className="field">
        <label htmlFor={`${kind}-msg`}>{kind === 'claim' ? 'Anything we should know? (optional)' : 'How can we help?'}</label>
        <textarea id={`${kind}-msg`} name="message" required={kind !== 'claim'} maxLength={3000} />
      </div>
      {kind !== 'claim' && <Consent />}
      <Status state={state} error={error} done={done} />
      <div><button className="btn btn-primary" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : submitLabel}</button></div>
    </form>
  )
}
