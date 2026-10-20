'use client'

import { useEffect, useRef } from 'react'

/** Thin sky-blue bar under the header showing how far through the article you are. */
export function ReadingProgress({ target = 'article' }: { target?: string }) {
  const bar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(target)
    if (!el || !bar.current) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, (innerHeight * 0.3 - r.top) / Math.max(1, r.height - innerHeight * 0.4)))
      bar.current!.style.transform = `scaleX(${p.toFixed(4)})`
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); cancelAnimationFrame(raf) }
  }, [target])
  return <div className="read-progress" aria-hidden="true"><div ref={bar} /></div>
}
