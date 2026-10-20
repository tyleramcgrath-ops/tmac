'use client'

import { useEffect } from 'react'

/** Fades `.reveal` elements in as they scroll into view. Content is visible without JS. */
export function RevealOnScroll() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal:not(.in)')
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('in'))
      return
    }
    // Anything already on screen shows at once, so nothing flickers on load.
    els.forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in') })
    document.documentElement.classList.add('js-reveal')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    els.forEach((el) => { if (!el.classList.contains('in')) io.observe(el) })
    return () => io.disconnect()
  }, [])
  return null
}
