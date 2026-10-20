'use client'

import { useEffect, useRef } from 'react'

/** Real numbers that roll into place like an odometer when scrolled into view. */
export function Odometer({ items }: { items: { n: number; label: string }[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !document.documentElement.classList.contains('fx')) { el?.classList.add('in'); return }
    el.classList.add('odo-on')
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      el.classList.add('in')
      el.querySelectorAll<HTMLElement>('.odo-strip').forEach((st) => { st.style.transform = `translate3d(0,${(-Number(st.dataset.to) * 100) / 30}%,0)` })
    }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div className="odo-grid" ref={ref}>
      {items.map((it, bi) => {
        const s = it.n.toLocaleString()
        return (
          <div className="odo-num" key={it.label}>
            <b aria-label={s}>
              <span className="odo-plain">{s}</span>
              <span className="odo-roll" aria-hidden="true">
                {s.split('').map((ch, ci) =>
                  /\d/.test(ch) ? (
                    <span className="odo-col" key={ci}>
                      <span className="odo-strip" data-to={(ci === s.length - 1 ? 2 : 1) * 10 + Number(ch)} style={{ transitionDelay: `${bi * 0.12 + ci * 0.08}s` }}>
                        {Array.from({ length: 30 }, (_, k) => <i key={k}>{k % 10}</i>)}
                      </span>
                    </span>
                  ) : <span key={ci}>{ch}</span>,
                )}
              </span>
            </b>
            <span>{it.label}</span>
            <i className="odo-tick" style={{ ['--td' as string]: `${bi * 0.12}s` }} />
          </div>
        )
      })}
    </div>
  )
}
