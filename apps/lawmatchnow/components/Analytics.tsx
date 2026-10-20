'use client'

import { useEffect } from 'react'

// Google Analytics 4 for lawmatchnow.com. gtag.js is ~180 KB and costs a
// few hundred ms of main-thread time on phones, so it loads on the visitor's
// first scroll, tap or key press (or after 5 seconds), not during page load.
const GA_ID = 'G-BB1PLHVBT0'

export function Analytics() {
  useEffect(() => {
    const w = window as unknown as { dataLayer: unknown[]; gtag: (...a: unknown[]) => void; __ga?: boolean }
    if (w.__ga) return
    w.dataLayer = w.dataLayer || []
    w.gtag = function gtag() { w.dataLayer.push(arguments) } // eslint-disable-line prefer-rest-params
    w.gtag('js', new Date())
    w.gtag('config', GA_ID)
    const events = ['scroll', 'pointerdown', 'keydown', 'touchstart'] as const
    const load = () => {
      if (w.__ga) return
      w.__ga = true
      events.forEach((e) => removeEventListener(e, load))
      clearTimeout(timer)
      const s = document.createElement('script')
      s.async = true
      s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
      document.head.appendChild(s)
    }
    const timer = window.setTimeout(load, 5000)
    events.forEach((e) => addEventListener(e, load, { once: true, passive: true }))
    return () => { events.forEach((e) => removeEventListener(e, load)); clearTimeout(timer) }
  }, [])
  return null
}
