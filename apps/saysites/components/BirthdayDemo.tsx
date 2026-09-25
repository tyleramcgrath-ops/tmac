'use client'

// The birthday page demo: a small copy of the Sofie editor. The owner types,
// Sofie answers, and the site changes the way it really does: the first
// build, a warmer look (colours, fonts, buttons), a new header photo, new
// hours and a Book button, then Publish with the page checks. Decorative
// only; with reduced motion it shows the finished site without playing.

import { useEffect, useRef, useState } from 'react'

const photo = (id: string, w: number, h: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=70&w=${w}&h=${h}`

const HERO = photo('1611173622933-91942d394b04', 1100, 620)
const SIDE = photo('1678153188688-0dc45722708a', 560, 520)
const CARDS = [
  { src: photo('1719464454959-9cf304ef4774', 360, 240), name: 'Full groom', note: 'Bath, cut and style' },
  { src: photo('1597595735781-6a57fb8e3e3d', 360, 240), name: 'Bath & brush', note: 'For in-between visits' },
  { src: photo('1581887936036-3f4f7f0b6679', 360, 240), name: 'Nails & ears', note: 'Ten minutes, no fuss' },
]

// Each step: what the owner types, then what Sofie says and what changed.
const STEPS = [
  { ask: 'A dog groomer in Austin, TX', reply: 'Built your site: Home, Services and Contact.', changes: ['3 pages', 'Photos', 'Google details'] },
  { ask: 'make it warmer and more fun', reply: 'Warmer colours, a friendlier font and rounder buttons.', changes: ['Colours', 'Fonts', 'Buttons'] },
  { ask: 'put a big photo of a happy dog up top', reply: 'Found a photo no other SaySites customer uses and made it your header.', changes: ['Header photo'] },
  { ask: 'add saturday 9 to 2 and a book button', reply: 'Added Saturday hours, and a Book button on every page.', changes: ['Hours', 'Book button'] },
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
  const warm = step >= 2
  return (
    <div ref={root} className="bdd" aria-hidden="true" data-step={step} data-warm={warm ? '' : undefined}>
      <div className="bdd-tool">
        <span className="bdd-who"><i />Sofie<em>· Paws &amp; Co.</em></span>
        <span className="bdd-actions"><span>Undo</span><b className={pressed ? 'is-pressed' : ''}>Publish</b></span>
      </div>

      <div className="bdd-browser">
        <div className="bdd-bar"><i /><i /><i /><span>{step >= 5 ? '🔒 ' : ''}pawsandco.saysites.com</span></div>
        <div className="bdd-site">
          {step === 0 && <div className="bdd-skel"><i /><i /><i /><i /></div>}
          <nav className="bdd-nav bdd-in">
            <b>Paws &amp; Co.</b>
            <span>Services</span><span>Contact</span>
            <em className={step >= 4 ? 'is-on bdd-flash' : ''}>Book a groom</em>
          </nav>
          <header className={`bdd-hero bdd-in${step === 2 ? ' bdd-flash' : ''}${step >= 3 ? ' is-photo' : ''}`}>
            <img className="bdd-hero-photo" src={HERO} alt="" width={1100} height={620} />
            <div className="bdd-hero-text">
              <small>Dog grooming · Austin, TX</small>
              <strong>Happy dogs, groomed gently.</strong>
              <span className="bdd-btn">Book a groom</span>
            </div>
            <img className="bdd-hero-side" src={SIDE} alt="" width={560} height={520} />
          </header>
          <div className={`bdd-hours${step >= 4 ? ' is-on bdd-flash' : ''}`}>Open Saturdays 9:00–2:00</div>
          <div className="bdd-cards bdd-in">
            {CARDS.map((c) => (
              <div key={c.name} className="bdd-card">
                <img src={c.src} alt="" width={360} height={240} loading="lazy" />
                <b>{c.name}</b>
                <span>{c.note}</span>
              </div>
            ))}
          </div>
          <div className={`bdd-live${step >= 5 ? ' is-on' : ''}`}><i>✓</i>Live at pawsandco.saysites.com</div>
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
