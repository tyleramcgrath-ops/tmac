'use client'

// Starting a website, one easy question at a time. Three ways in: describe
// the business step by step, start from its Google listing, or rebuild the
// website it already has. Every step has an example, Back and Next, and the
// real site builds itself on the right as the owner answers.

import { useActionState, useEffect, useRef, useState } from 'react'
import { createSite } from '@/app/actions'
import { createRedesign } from '@/app/redesign/actions'
import { findOnGoogle, pickFromGoogle, type GoogleSearchResult } from '@/app/dashboard/new/google-actions'
import { LogoMark } from './Logo'
import { TEMPLATES, templateFor } from '@/lib/templates'
import { typeFromName } from '@/lib/type-hints'
import type { PlaceDetails } from '@/lib/places'

type Path = 'describe' | 'google' | 'redesign'
type Step = 'start' | 'google' | 'redesign' | 'name' | 'type' | 'where' | 'offer' | 'contact' | 'photos' | 'look' | 'review'
const FLOW: Step[] = ['name', 'type', 'where', 'offer', 'contact', 'photos', 'look', 'review']

// What each kind of business usually offers and what its photos show, as
// examples the owner can tap.
const HINTS: Record<string, { examples: string; offer: string; photos: string }> = {
  plumber: { examples: 'Drains, leaks, water heaters', offer: 'Drain cleaning\nLeak repair\nWater heater installation', photos: 'plumber at work' },
  electrician: { examples: 'Wiring, panels, lighting', offer: 'Panel upgrades\nLighting installation\nEV charger installation', photos: 'electrician at work' },
  hvac: { examples: 'Heating, air conditioning', offer: 'AC repair\nFurnace installation\nMaintenance plans', photos: 'hvac technician' },
  roofer: { examples: 'Roof repair, replacement', offer: 'Roof replacement\nStorm damage repair\nGutters', photos: 'roofer working on a roof' },
  landscaper: { examples: 'Lawns, gardens, patios', offer: 'Lawn care\nGarden design\nPatios and walkways', photos: 'landscaped garden' },
  cleaner: { examples: 'Homes, offices, move-outs', offer: 'House cleaning\nDeep cleaning\nMove-out cleaning', photos: 'clean bright home' },
  autorepair: { examples: 'Repairs, brakes, inspections', offer: 'Brake repair\nOil changes\nState inspections', photos: 'auto mechanic at work' },
  dentist: { examples: 'Cleanings, crowns, braces', offer: 'Cleanings and exams\nCrowns\nTeeth whitening', photos: 'dental clinic' },
  salon: { examples: 'Cuts, color, styling', offer: 'Haircuts\nColor\nBlowouts', photos: 'hair salon' },
  lawyer: { examples: 'Any practice area', offer: 'Estate planning\nFamily law\nReal estate closings', photos: 'law office meeting' },
  doctor: { examples: 'Clinics, practices', offer: 'Annual physicals\nSame-day visits\nVaccinations', photos: 'doctor with patient' },
  medspa: { examples: 'Facials, injectables', offer: 'Facials\nBotox\nLaser treatments', photos: 'spa treatment room' },
  restaurant: { examples: 'Dine-in, takeout, catering', offer: 'Dinner\nTakeout\nCatering', photos: 'restaurant food' },
  bakery: { examples: 'Bakeries, cafés, coffee', offer: 'Fresh bread\nCelebration cakes\nCoffee', photos: 'bakery bread and pastries' },
  store: { examples: 'Shops and boutiques', offer: 'Gifts\nHome goods\nLocal crafts', photos: 'boutique shop interior' },
  professional: { examples: 'Marketing, consulting, accounting', offer: 'Marketing strategy\nSEO\nWeb design', photos: 'marketing team meeting' },
  other: { examples: 'Anything else', offer: 'Your main service\nYour second service\nYour third service', photos: '' },
}

const b64url = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export function StartWizard({ types, palettes, idea = '', template = '', google = false }: { types: [string, string][]; palettes: [string, string, string][]; idea?: string; template?: string; google?: boolean }) {
  const [state, build, building] = useActionState(createSite, {})
  const [step, setStep] = useState<Step>('start')
  const [path, setPath] = useState<Path>('describe')
  const [info, setInfo] = useState({ name: '', type: typeFromName(idea) ?? '', city: '', region: '', phone: '', email: '', services: '' })
  // null until the owner types their own words; then exactly what they typed.
  const [photoHint, setPhotoHint] = useState<string | null>(null)
  const [palette, setPalette] = useState(templateFor(template)?.palette ?? palettes[0]?.[0] ?? 'ocean')
  const [tpl, setTpl] = useState(templateFor(template)?.key ?? '')
  // Law firms, medical practices and med spas pick one of their own designs
  // ('' lets SaySites pick one from the name, the same way the build does).
  const [lawStyle, setLawStyle] = useState('')
  const [place, setPlace] = useState<PlaceDetails | null>(null)
  const [src, setSrc] = useState('')
  const first = useRef<HTMLDivElement>(null)
  const set = (k: keyof typeof info) => (v: string) => setInfo((x) => ({ ...x, [k]: v }))
  const hint = HINTS[info.type] ?? HINTS.other
  const typeLabel = types.find(([k]) => k === info.type)?.[1] ?? ''
  const pro = info.type === 'lawyer' || info.type === 'doctor' || info.type === 'medspa'
  const at = FLOW.indexOf(step)

  // The live preview, a moment after typing stops.
  useEffect(() => {
    if (!info.type || !info.name) return setSrc('')
    const t = setTimeout(() => setSrc(`/dashboard/new/preview/${b64url(JSON.stringify({ ...info, palette, ...(tpl && !pro ? { design: tpl } : {}), ...(lawStyle && pro ? { lawStyle } : {}) }))}`), 450)
    return () => clearTimeout(t)
  }, [info, palette, tpl, lawStyle, pro])

  // Each new step puts the cursor in its first box.
  useEffect(() => {
    first.current?.querySelector<HTMLElement>('input, textarea, select, button.wiz-tile')?.focus()
  }, [step])

  useEffect(() => {
    if (state.error) setStep('review')
  }, [state])

  const ok: Partial<Record<Step, boolean>> = {
    name: info.name.trim().length >= 2,
    type: !!info.type,
    where: !!info.city.trim() && !!info.region.trim(),
    offer: info.services.trim().length > 0,
    contact: !info.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email),
    photos: true,
    look: true,
  }
  const next = () => {
    if (at >= 0 && at < FLOW.length - 1 && ok[step] !== false) setStep(FLOW[at + 1])
  }
  const back = () => {
    if (step === 'google' || step === 'redesign' || (step === 'name' && path === 'describe')) return setStep('start')
    if (path === 'google' && step === 'type') return setStep('google')
    if (at > 0) setStep(FLOW[at - 1])
  }
  const enterNext = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault()
      next()
    }
  }
  const startDescribe = () => {
    setPath('describe')
    setStep('name')
  }
  const fromGoogle = (p: PlaceDetails) => {
    setPlace(p)
    setInfo((x) => ({ ...x, name: p.name || x.name, type: p.type || x.type, city: p.city || x.city, region: p.region || x.region, phone: p.phone ?? x.phone }))
    setStep('type')
  }

  return (
    <div className="wiz" role="dialog" aria-modal="true" aria-labelledby="wiz-title">
      <div className={`wiz-in${step !== 'start' && step !== 'redesign' && step !== 'google' ? ' with-preview' : ''}`}>
        <section className="wiz-card">
          <header className="wiz-head">
            <span className="wiz-logo" aria-hidden="true"><LogoMark size={step === 'start' ? 56 : 30} /></span>
            <a className="wiz-close" href="/dashboard" aria-label="Close and go back to your dashboard">×</a>
          </header>
          {at >= 0 && (
            <div className="wiz-progress" aria-label={`Step ${at + 1} of ${FLOW.length}`}>
              <i style={{ width: `${((at + 1) / FLOW.length) * 100}%` }} />
              <span>Step {at + 1} of {FLOW.length}</span>
            </div>
          )}

          <form action={build} onKeyDown={enterNext}>
            {idea && <input type="hidden" name="idea" value={idea} />}
            {Object.entries(info).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            <input type="hidden" name="palette" value={palette} />
            <input type="hidden" name="template" value={pro ? '' : tpl} />
            <input type="hidden" name="lawStyle" value={pro ? lawStyle : ''} />
            <input type="hidden" name="photoHint" value={photoHint ?? hint.photos} />
            {place && (
              <>
                <input type="hidden" name="placeId" value={place.placeId} />
                {place.street && <input type="hidden" name="street" value={place.street} />}
                {place.postalCode && <input type="hidden" name="postalCode" value={place.postalCode} />}
                {place.hours.length > 0 && <input type="hidden" name="hours" value={place.hours.join('\n')} />}
              </>
            )}

            <div ref={first} className="wiz-body" key={step}>
              {step === 'start' && (
                <>
                  <h1 id="wiz-title">Let’s build your website.</h1>
                  <p className="wiz-sub">{idea ? <>You said: <strong>“{idea}”</strong>. </> : null}Pick how you’d like to start. You can change everything later, just by saying so.</p>
                  <div className="wiz-tiles">
                    <button type="button" className="wiz-tile" onClick={startDescribe}>
                      <strong>Tell us about your business</strong>
                      <span>A few easy questions, one at a time. About two minutes.</span>
                    </button>
                    {google && (
                      <button type="button" className="wiz-tile" onClick={() => { setPath('google'); setStep('google') }}>
                        <strong>Start from my Google listing</strong>
                        <span>We copy your name, address, phone and hours from Google.</span>
                      </button>
                    )}
                    <button type="button" className="wiz-tile" onClick={() => { setPath('redesign'); setStep('redesign') }}>
                      <strong>Rebuild the website I have</strong>
                      <span>Paste your address. Your pages, words and photos come over.</span>
                    </button>
                  </div>
                </>
              )}

              {step === 'google' && <GoogleFind onPick={fromGoogle} />}
              {step === 'redesign' && <RedesignStep />}

              {step === 'name' && (
                <Q title="What’s your business called?" help="Just the name, the way it’s on your sign.">
                  <input className="input wiz-input" value={info.name} onChange={(e) => { set('name')(e.target.value); const t = typeFromName(e.target.value); if (t && !info.type) set('type')(t) }} placeholder="McGrath Marketing Group" maxLength={120} autoComplete="organization" />
                </Q>
              )}

              {step === 'type' && (
                <Q title="What kind of business is it?" help="Pick the closest one. It decides your pages, wording and photos.">
                  <div className="wiz-types">
                    {types.map(([k, label]) => (
                      <button type="button" key={k} className={`wiz-tile small${info.type === k ? ' on' : ''}`} aria-pressed={info.type === k} onClick={() => { set('type')(k); setPhotoHint(null) }}>
                        <strong>{label}</strong>
                        <span>{(HINTS[k] ?? HINTS.other).examples}</span>
                      </button>
                    ))}
                  </div>
                </Q>
              )}

              {step === 'where' && (
                <Q title="Where are you?" help="Your town shows on your site and helps people nearby find you on Google.">
                  <div className="wiz-row">
                    <label className="field"><span>City or town</span><input className="input wiz-input" value={info.city} onChange={(e) => set('city')(e.target.value)} placeholder="Jupiter" maxLength={60} autoComplete="address-level2" /></label>
                    <label className="field"><span>State</span><input className="input wiz-input" value={info.region} onChange={(e) => set('region')(e.target.value)} placeholder="FL" maxLength={40} autoComplete="address-level1" /></label>
                  </div>
                </Q>
              )}

              {step === 'offer' && (
                <Q title={info.type === 'lawyer' ? 'Which practice areas?' : 'What do you offer?'} help="One per line, the way your customers would say it. Each one gets its own section.">
                  <textarea className="input wiz-input" rows={5} value={info.services} onChange={(e) => set('services')(e.target.value)} placeholder={hint.offer} />
                  {!info.services && <button type="button" className="linkish" onClick={() => set('services')(hint.offer)}>Use these examples to start</button>}
                </Q>
              )}

              {step === 'contact' && (
                <Q title="How do customers reach you?" help="Both are optional. Your phone number becomes a big call button on phones.">
                  <label className="field"><span>Phone</span><input className="input wiz-input" type="tel" value={info.phone} onChange={(e) => set('phone')(e.target.value)} placeholder="(561) 262-4570" maxLength={30} autoComplete="tel" /></label>
                  <label className="field"><span>Email</span><input className="input wiz-input" type="email" value={info.email} onChange={(e) => set('email')(e.target.value)} placeholder="hello@yourbusiness.com" maxLength={120} autoComplete="email" /></label>
                  {ok.contact === false && <p className="error" role="alert">That email doesn’t look right.</p>}
                </Q>
              )}

              {step === 'photos' && (
                <Q title="What should your photos show?" help="We find photos that fit. Swap any of them later, or upload your own on the Photos tab.">
                  <input className="input wiz-input" value={photoHint ?? hint.photos} onChange={(e) => setPhotoHint(e.target.value)} placeholder="marketing team meeting" maxLength={60} />
                  <p className="muted small">For example: “{hint.photos || 'your work, your shop, your team'}”. Use a few plain words.</p>
                </Q>
              )}

              {step === 'look' && (
                <Q title="Pick a look." help="Colors and a style. You can change both later.">
                  <div className="swatches" role="radiogroup" aria-label="Colors">
                    {palettes.map(([k, label, color]) => (
                      <button type="button" key={k} className={`wiz-swatch${palette === k ? ' on' : ''}`} aria-pressed={palette === k} onClick={() => setPalette(k)}>
                        <i style={{ background: color }} />{label}
                      </button>
                    ))}
                  </div>
                  {pro && (
                    <div className="wiz-types" style={{ marginTop: 16 }}>
                      {([
                        ['counsel', 'Counsel', 'Big photo header, words on the left. Confident.'],
                        ['classic', 'Classic', 'Centered headline over a full photo. Timeless.'],
                        ['modern', 'Modern', 'Words beside a large photo. Light and clean.'],
                      ] as const).map(([k, name, about]) => (
                        <button type="button" key={k} className={`wiz-tile small${(lawStyle || '') === k ? ' on' : ''}`} aria-pressed={lawStyle === k} onClick={() => setLawStyle(k)}>
                          <strong>{name}</strong>
                          <span>{about}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {!pro && (
                  <div className="wiz-types" style={{ marginTop: 16 }}>
                    <button type="button" className={`wiz-tile small${tpl === '' ? ' on' : ''}`} aria-pressed={tpl === ''} onClick={() => setTpl('')}>
                      <strong>Made for {typeLabel ? typeLabel.toLowerCase() : 'your business'}</strong>
                      <span>Recommended</span>
                    </button>
                    {TEMPLATES.map((t) => (
                      <button type="button" key={t.key} className={`wiz-tile small${tpl === t.key ? ' on' : ''}`} aria-pressed={tpl === t.key} onClick={() => { setTpl(t.key); if (t.key === 'upscale') setPalette(t.palette) }}>
                        <strong>{t.name}</strong>
                        <span>{t.bestFor}</span>
                      </button>
                    ))}
                  </div>
                  )}
                  {pro && !lawStyle && <p className="muted small">Not sure? The preview shows the one we picked for you. Tap any design to see it.</p>}
                </Q>
              )}

              {step === 'review' && (
                <Q title="Ready? Here’s your website." help="Check the details, then build it. You can change anything afterwards by telling Sofie.">
                  <dl className="wiz-summary">
                    {([
                      ['Name', info.name, 'name'],
                      ['Kind', typeLabel, 'type'],
                      ['Where', [info.city, info.region].filter(Boolean).join(', '), 'where'],
                      ['Offers', info.services.split('\n').filter(Boolean).join(', '), 'offer'],
                      ['Phone', info.phone || 'Not added', 'contact'],
                      ['Photos', (photoHint ?? hint.photos).trim() || 'Chosen for your kind of business', 'photos'],
                    ] as [string, string, Step][]).map(([k, v, s]) => (
                      <div key={k}><dt>{k}</dt><dd>{v}</dd><button type="button" className="linkish" onClick={() => setStep(s)}>Change</button></div>
                    ))}
                  </dl>
                  <label className="field"><span>Website language</span>
                    <select className="input" name="language" defaultValue="en"><option value="en">English</option><option value="es">Español</option></select>
                  </label>
                  {state.error && <p className="error" role="alert">{state.error}</p>}
                  <button className="btn btn-primary btn-block wiz-build" type="submit" disabled={building}>{building ? 'Building your website…' : 'Build my website'}</button>
                </Q>
              )}
            </div>

            {at >= 0 && step !== 'review' && (
              <div className="wiz-nav">
                <button type="button" className="btn btn-ghost" onClick={back}>Back</button>
                <button type="button" className="btn btn-primary" onClick={next} disabled={ok[step] === false}>Next</button>
              </div>
            )}
            {(step === 'review' || step === 'google' || step === 'redesign') && (
              <div className="wiz-nav"><button type="button" className="btn btn-ghost" onClick={back}>Back</button></div>
            )}
          </form>
        </section>

        {step !== 'start' && step !== 'redesign' && step !== 'google' && (
          <aside className={`wiz-preview${step === 'review' ? '' : ' early'}`} aria-label="Your website, as it builds">
            <div className="new-preview-bar"><i /><i /><i /><span>{info.name || 'Your website'}</span></div>
            <div className={`new-preview-frame${src ? '' : ' empty'}`}>
              {src ? <iframe src={src} title="Your website, as it will look" loading="lazy" /> : <p className="muted">Your website appears here as you answer.</p>}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

function Q({ title, help, children }: { title: string; help: string; children: React.ReactNode }) {
  return (
    <>
      <h1 id="wiz-title">{title}</h1>
      <p className="wiz-sub">{help}</p>
      <div className="wiz-fields">{children}</div>
    </>
  )
}

function GoogleFind({ onPick }: { onPick: (p: PlaceDetails) => void }) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState<GoogleSearchResult>({})
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
    if (r.place) onPick(r.place)
    else setRes({ error: r.error })
  }
  return (
    <Q title="Find your business on Google." help="Type your business name and town, then tap your business.">
      <div className="wiz-row">
        <input className="input wiz-input" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); search() } }} placeholder="McGrath Marketing Jupiter" aria-label="Your business on Google" maxLength={120} />
        <button type="button" className="btn btn-primary" onClick={search} disabled={busy}>{busy ? 'Looking…' : 'Find it'}</button>
      </div>
      {res.error && <p className="error" role="alert">{res.error}</p>}
      {res.matches && (
        <div className="wiz-types">
          {res.matches.map((m) => (
            <button type="button" key={m.id} className="wiz-tile small" onClick={() => pick(m.id)} disabled={busy}><strong>{m.name}</strong><span>{m.address}</span></button>
          ))}
        </div>
      )}
    </Q>
  )
}

// Forms can't nest, so this button sends the wizard's form to the redesign
// action instead (formAction); that action only reads the address.
function RedesignStep() {
  const [state, run, pending] = useActionState(createRedesign, {})
  return (
    <Q title="What’s your website’s address?" help="We read your pages and rebuild them on SaySites with your own words and photos. About twenty seconds. Nothing changes on your current site.">
      <div className="wiz-row">
        <input className="input wiz-input" name="url" placeholder="yourbusiness.com" inputMode="url" autoComplete="url" maxLength={300} />
        <button className="btn btn-primary" formAction={run} disabled={pending}>{pending ? 'Rebuilding…' : 'Rebuild it'}</button>
      </div>
      {state.error && <p className="error" role="alert">{state.error}</p>}
    </Q>
  )
}
