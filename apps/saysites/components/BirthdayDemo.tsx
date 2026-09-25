'use client'

// The birthday page demo: a small copy of the Sofie editor. The owner types,
// Sofie answers, and the site changes the way it really does: the first
// build, an upscale look (colours, fonts, buttons), a new header photo, new
// hours and a Reserve button, then Publish with the page checks. Decorative
// only; with reduced motion it shows the finished site without playing.

import { useEffect, useRef, useState } from 'react'

const photo = (id: string, w: number, h: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=72&w=${w}&h=${h}`
// Each photo in a few widths, so phones and laptops load only what they show.
const srcs = (id: string, ratio: number, widths: number[]) => ({
  src: photo(id, widths[widths.length - 1], Math.round(widths[widths.length - 1] / ratio)),
  srcSet: widths.map((w) => `${photo(id, w, Math.round(w / ratio))} ${w}w`).join(', '),
})

const HERO = { ...srcs('1622880833523-7cf1c0bd4296', 1.75, [560, 820, 1100]), sizes: '(max-width: 700px) 92vw, 560px' }
const SIDE = { ...srcs('1604068549290-dea0e4a305ca', 1, [240, 360, 480]), sizes: '(max-width: 700px) 40vw, 240px' }
const card = (id: string) => ({ ...srcs(id, 1.5, [180, 320]), sizes: '(max-width: 700px) 25vw, 160px' })
const CARDS = [
  { img: card('1599130143407-2a6ff8a196c9'), name: 'Wood-fired pizza', note: '90 seconds at 900°' },
  { img: card('1516685018646-549198525c1b'), name: 'Handmade pasta', note: 'Rolled every afternoon' },
  { img: card('1776362441386-c02107b86576'), name: 'The room', note: 'Candlelit, 40 seats' },
]

// Each step: what the owner types, then what Sofie says and what changed.
const STEPS = [
  { ask: 'A wood-fired Italian restaurant in Austin', reply: 'Built your site: Home, Menu and Visit.', changes: ['3 pages', 'Photos', 'Google details'] },
  { ask: 'make it darker and more upscale', reply: 'A dark, candlelit look, a classic serif and sharper buttons.', changes: ['Colours', 'Fonts', 'Buttons'] },
  { ask: 'put the oven photo up top', reply: 'Made the oven photo your header, sized to load fast.', changes: ['Header photo'] },
  { ask: 'add sunday brunch 10 to 2 and a reserve button', reply: 'Added Sunday brunch hours, and a Reserve button on every page.', changes: ['Hours', 'Reserve button'] },
] as const

type Phase = 'typing' | 'working' | 'done'

export function BirthdayDemo() {
  // step: how far the site has got (1 = built … 4 = hours, 5 = published).
  const [step, setStep] = useState(1)
  const [ask, setAsk] = useState(0)
  const [phase, setPhase] = useState<Phase>('done')
  const [typed, setTyped] = useState('')
  const [pressed, setPressed] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep(4)
      setAsk(3)
      return
    }
    let alive = true
    let visible = true
    const timers: ReturnType<typeof setTimeout>[] = []
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const tick = () => (visible ? timers.push(setTimeout(resolve, ms)) : timers.push(setTimeout(tick, 300)))
        tick()
      })
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    if (root.current) io.observe(root.current)

    const run = async () => {
      await wait(2600)
      let first = false
      while (alive) {
        for (let i = first ? 0 : 1; i < STEPS.length && alive; i++) {
          setAsk(i)
          setPhase('typing')
          const text = STEPS[i].ask
          for (let c = 1; c <= text.length && alive; c++) {
            setTyped(text.slice(0, c))
            await wait(38 + Math.random() * 40)
          }
          await wait(350)
          setTyped('')
          setPhase('working')
          if (i === 0) setStep(0)
          await wait(1300)
          setStep(i + 1)
          setPhase('done')
          await wait(i === 0 ? 3000 : 3400)
        }
        if (!alive) break
        setPressed(true)
        await wait(260)
        setPressed(false)
        setStep(5)
        await wait(4200)
        first = true
        setStep(0)
        setAsk(0)
        setPhase('typing')
        await wait(500)
      }
    }
    run()
    return () => { alive = false; io.disconnect(); timers.forEach(clearTimeout) }
  }, [])

  const s = STEPS[ask]
  const dark = step >= 2
  return (
    <div ref={root} className="bdd" aria-hidden="true" data-step={step} data-dark={dark ? '' : undefined}>
      <div className="bdd-tool">
        <span className="bdd-who"><i />Sofie<em>· Olivo</em></span>
        <span className="bdd-actions"><span>Undo</span><b className={pressed ? 'is-pressed' : ''}>Publish</b></span>
      </div>

      <div className="bdd-browser">
        <div className="bdd-bar"><i /><i /><i /><span>{step >= 5 ? '🔒 ' : ''}olivo.saysites.com</span></div>
        <div className="bdd-site">
          {step === 0 && <div className="bdd-skel"><i /><i /><i /><i /></div>}
          <nav className="bdd-nav bdd-in">
            <b>Olivo<small>wood-fired kitchen</small></b>
            <span>Menu</span><span>Visit</span>
            <em className={step >= 4 ? 'is-on bdd-flash' : ''}>Reserve</em>
          </nav>
          <header className={`bdd-hero bdd-in${step === 2 ? ' bdd-flash' : ''}${step >= 3 ? ' is-photo' : ''}`}>
            <img className="bdd-hero-photo" {...HERO} alt="" width={1100} height={629} />
            <div className="bdd-hero-text">
              <small>East Austin · Open nightly</small>
              <strong>Neapolitan pizza, fired at 900°.</strong>
              <span className="bdd-btn">See the menu</span>
            </div>
            <img className="bdd-hero-side" {...SIDE} alt="" width={480} height={480} />
          </header>
          <div className={`bdd-hours${step >= 4 ? ' is-on bdd-flash' : ''}`}>Sunday brunch 10:00–2:00</div>
          <div className="bdd-cards bdd-in">
            {CARDS.map((c) => (
              <div key={c.name} className="bdd-card">
                <img {...c.img} alt="" width={320} height={213} loading="lazy" />
                <b>{c.name}</b>
                <span>{c.note}</span>
              </div>
            ))}
          </div>
          <div className={`bdd-live${step >= 5 ? ' is-on' : ''}`}><i>✓</i>Live at olivo.saysites.com</div>
        </div>
      </div>

      <div className="bdd-chat">
        {step >= 5 ? (
          <>
            <p className="bdd-sofie">Published. It’s live, and every page passed its checks.</p>
            <ul className="bdd-checks"><li>Speed 100</li><li>Title fits Google</li><li>One main heading</li><li>Sitemap</li></ul>
          </>
        ) : (
          <>
            {phase === 'typing' ? (
              ask > 0 && <p className="bdd-sofie is-old">{STEPS[ask - 1].reply}</p>
            ) : (
              <>
                <p className="bdd-you" key={`q${ask}`}>{s.ask}</p>
                {phase === 'working' && <p className="bdd-sofie bdd-dots"><i /><i /><i /></p>}
                {phase === 'done' && (
                  <div key={`a${ask}`} className="bdd-reply">
                    <p className="bdd-sofie">{s.reply}</p>
                    <ul className="bdd-changes">{s.changes.map((c) => <li key={c}>{c}</li>)}</ul>
                  </div>
                )}
              </>
            )}
          </>
        )}
        <div className="bdd-input">
          <span>{phase === 'typing' && typed ? typed : <em>Ask Sofie to change anything…</em>}</span>
          {phase === 'typing' && <i className="bdd-caret" />}
        </div>
      </div>
    </div>
  )
}
