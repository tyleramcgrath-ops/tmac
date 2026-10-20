'use client'

import { useEffect, useRef, type ReactNode } from 'react'

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const eOut = (t: number) => 1 - Math.pow(1 - t, 3)
const eInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * "The Reveal": the page opens on JUSTICE, its letters filled with the
 * courthouse photo. Scrolling zooms through the T until the photo fills the
 * screen, then the headline and search card (server-rendered `children`)
 * rise in. Without JS or with reduced motion, the finished hero shows as is.
 * The `fx` class on <html> is set before paint by the script in the layout.
 */
export function JusticeReveal({ photo, caption, children }: { photo: string; caption: string; children: ReactNode }) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const html = document.documentElement
    const sec = root.current
    if (!sec || !html.classList.contains('fx')) return
    html.classList.add('jr-live')
    const q = <T extends HTMLElement>(sel: string) => sec.querySelector(sel) as T
    const stage = q<HTMLDivElement>('.jr-stage'), mask = q<HTMLDivElement>('.jr-mask'), word = q<HTMLDivElement>('.jr-word')
    const tee = q<HTMLSpanElement>('.jr-tee'), base = q<HTMLElement>('.jr-base'), phIn = q<HTMLDivElement>('.jr-ph')
    const veil = q<HTMLDivElement>('.jr-veil'), cap = q<HTMLDivElement>('.jr-caption'), intro = q<HTMLDivElement>('.jr-intro')
    const lines = [...sec.querySelectorAll<HTMLElement>('.jr-line > span')]
    const side = q<HTMLDivElement>('.jr-side'), card = q<HTMLDivElement>('.jr-card')
    const lifts = [...sec.querySelectorAll<HTMLElement>('.jr-lift')]
    const mobile = () => innerWidth <= 820
    const origin = { x: 0, y: 0 }
    let sEnd = 60, pS = -1, pT = 0, raf = 0

    // Find the T's vertical stem by drawing it, so the zoom lands inside it.
    const stemOf = () => {
      const cs = getComputedStyle(word), fs = parseFloat(cs.fontSize)
      const c = document.createElement('canvas'), W = Math.ceil(fs * 1.2), H = Math.ceil(fs * 1.4)
      c.width = W; c.height = H
      const g = c.getContext('2d')!
      g.font = `900 ${fs}px ${cs.fontFamily}`; g.textBaseline = 'alphabetic'; g.fillText('T', 0, fs)
      const d = g.getImageData(0, 0, W, H).data
      const col = (x: number, y0: number, y1: number) => { let n = 0; for (let y = y0; y < y1; y++) if (d[(y * W + x) * 4 + 3] > 128) n++; return n }
      const y0 = Math.round(fs * 0.55), y1 = Math.round(fs)
      let best = -1, bx = 0
      for (let x = 0; x < W; x++) { const n = col(x, y0, y1); if (n > best) { best = n; bx = x } }
      let l = bx, r = bx
      while (l > 0 && col(l - 1, y0, y1) >= best * 0.9) l--
      while (r < W - 1 && col(r + 1, y0, y1) >= best * 0.9) r++
      let top = H, bot = 0
      const mx = Math.round((l + r) / 2)
      for (let y = 0; y < H; y++) if (d[(y * W + mx) * 4 + 3] > 128) { if (y < top) top = y; if (y > bot) bot = y }
      return { cx: (l + r) / 2, w: Math.max(2, r - l + 1), cy: (top + bot) / 2 - fs, h: bot - top }
    }
    const layout = () => {
      mask.style.transform = 'none'
      word.style.fontSize = '100px'
      const ratio = word.getBoundingClientRect().width / 100
      const fs = Math.min((innerWidth * (mobile() ? 0.9 : 0.84)) / ratio, (innerHeight - 90) * 0.5)
      word.style.fontSize = `${fs}px`
      stage.style.setProperty('--wh', `${fs * 0.78}px`)
      const sr = stage.getBoundingClientRect(), tr = tee.getBoundingClientRect(), br = base.getBoundingClientRect(), st = stemOf()
      origin.x = tr.left - sr.left + st.cx
      origin.y = br.top - sr.top + st.cy
      mask.style.transformOrigin = `${origin.x}px ${origin.y}px`
      sEnd = Math.max(innerWidth / st.w, innerHeight / st.h) * 2.2
      pS = -1
    }
    const target = () => { const r = sec.getBoundingClientRect(); return clamp(-r.top / (sec.offsetHeight - innerHeight)) }
    const render = (p: number) => {
      const ki = clamp(p / 0.12)
      lifts.forEach((el, i) => { el.style.opacity = (1 - ki).toFixed(3); el.style.transform = `translate3d(0,${(-ki * (30 + i * 10)).toFixed(1)}px,0)` })
      intro.style.visibility = ki >= 1 ? 'hidden' : 'visible'
      const z = eInOut(clamp((p - 0.03) / 0.5)), sc = Math.exp(Math.log(sEnd) * z)
      mask.style.transform = `scale(${sc.toFixed(4)})`
      const mo = 1 - clamp((p - 0.44) / 0.08)
      mask.style.opacity = mo.toFixed(3); mask.style.visibility = mo <= 0 ? 'hidden' : 'visible'
      phIn.style.transform = `scale(${(1.32 - 0.32 * eOut(clamp(p / 0.62))).toFixed(4)})`
      veil.style.opacity = eOut(clamp((p - 0.5) / 0.14)).toFixed(3)
      cap.style.opacity = eOut(clamp((p - 0.6) / 0.12)).toFixed(3)
      lines.forEach((el, i) => { const k = eOut(clamp((p - 0.52 - i * 0.045) / 0.14)); el.style.opacity = k.toFixed(3); el.style.transform = `translate3d(0,${((1 - k) * 70).toFixed(1)}px,0)` })
      const ks = eOut(clamp((p - 0.64) / 0.13)); side.style.opacity = ks.toFixed(3); side.style.transform = `translate3d(0,${((1 - ks) * 40).toFixed(1)}px,0)`
      const kc = eOut(clamp((p - 0.68) / 0.16)); card.style.opacity = kc.toFixed(3); card.style.transform = `translate3d(0,${((1 - kc) * 90).toFixed(1)}px,0)`
      card.style.pointerEvents = kc > 0.5 ? 'auto' : 'none'
    }
    const tick = () => {
      const t = target()
      pT += (t - pT) * 0.11
      if (Math.abs(t - pT) < 0.0002) pT = t
      if (pT !== pS) { pS = pT; render(pT) }
      raf = requestAnimationFrame(tick)
    }
    // Keyboard users who tab into the search jump straight to the finished hero.
    const onFocus = () => { if (target() < 0.85) scrollTo({ top: sec.offsetTop + (sec.offsetHeight - innerHeight) * 0.9, behavior: 'auto' }) }
    card.addEventListener('focusin', onFocus)
    let rz = 0
    const onResize = () => { clearTimeout(rz); rz = window.setTimeout(layout, 120) }
    let started = false
    const go = () => {
      if (started) return
      started = true
      layout(); pT = target()
      raf = requestAnimationFrame(tick)
      requestAnimationFrame(() => requestAnimationFrame(() => html.classList.add('jr-loaded')))
    }
    document.fonts?.ready.then(go)
    const fallback = window.setTimeout(go, 2500)
    addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf); clearTimeout(fallback); clearTimeout(rz)
      removeEventListener('resize', onResize); card.removeEventListener('focusin', onFocus)
      html.classList.remove('jr-live', 'jr-loaded')
    }
  }, [])

  return (
    <section className="jr" ref={root}>
      <div className="jr-stage">
        <div className="jr-photo"><div className="jr-ph" style={{ backgroundImage: `url(${photo})` }}><div className="jr-drift" /></div></div>
        <div className="jr-veil" />
        <div className="jr-mask" aria-hidden="true">
          <div className="jr-word">
            <span>J</span><span>U</span><span>S</span><span className="jr-tee">T</span><span>I</span><span>C</span><span>E</span>
            <i className="jr-base" />
          </div>
        </div>
        <div className="jr-intro" aria-hidden="true">
          <div className="jr-i-top jr-lift"><div className="eyebrow jr-fade">A free directory of US attorneys</div></div>
          <div className="jr-i-sub jr-lift"><div className="jr-fade">Equal justice starts with <b>the right lawyer.</b></div></div>
          <div className="jr-cue jr-lift"><div className="jr-fade"><span>Scroll</span><i /></div></div>
        </div>
        <div className="jr-caption"><i />{caption}</div>
        <div className="jr-final">
          <div className="wrap" style={{ width: '100%' }}>{children}</div>
        </div>
      </div>
    </section>
  )
}
