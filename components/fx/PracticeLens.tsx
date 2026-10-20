'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export type LensItem = { href: string; name: string; sub: string; img: string }

/** Practice-area rows; on desktop a photo preview follows the cursor over them. */
export function PracticeLens({ items }: { items: LensItem[] }) {
  const lens = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const [layers, setLayers] = useState<[string, string]>(['', ''])
  const [front, setFront] = useState(0)

  useEffect(() => {
    const el = lens.current
    if (!el || !matchMedia('(hover: hover) and (min-width: 821px)').matches || !document.documentElement.classList.contains('fx')) return
    let lx = -400, ly = -400, tx = -400, ty = -400, rot = 0, raf = 0
    const onMove = (e: MouseEvent) => { tx = e.clientX + 34; ty = e.clientY - 105 }
    const loop = () => {
      const dx = (tx - lx) * 0.12
      lx += dx; ly += (ty - ly) * 0.12
      rot += (Math.max(-9, Math.min(9, dx * 0.35)) - rot) * 0.15
      el.style.transform = `translate3d(${lx.toFixed(1)}px,${ly.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg)`
      raf = requestAnimationFrame(loop)
    }
    addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(loop)
    return () => { removeEventListener('mousemove', onMove); cancelAnimationFrame(raf) }
  }, [])

  const enter = (i: number) => {
    setHover(i); setShow(true)
    const img = items[i].img
    if (layers[front] !== img) {
      const next = front ^ 1
      setLayers((l) => { const c: [string, string] = [...l] as [string, string]; c[next] = img; return c })
      setFront(next)
    }
  }

  return (
    <div className="pl-wrap">
      <div className={`pl-list${hover !== null ? ' hov' : ''}`} onMouseLeave={() => { setShow(false); setHover(null) }}>
        {items.map((p, i) => (
          <Link key={p.href} href={p.href} className="pl-row reveal" onMouseEnter={() => enter(i)} style={{ transitionDelay: `${(i % 2) * 0.08 + Math.floor(i / 2) * 0.05}s` }}>
            <span className="pl-i">{String(i + 1).padStart(2, '0')}</span>
            <span className="pl-nm">{p.name}<small>{p.sub}</small></span>
            <span className="pl-go">Find →</span>
          </Link>
        ))}
      </div>
      <div className={`pl-lens${show ? ' show' : ''}`} ref={lens} aria-hidden="true">
        <div className="pl-card">
          {layers.map((src, i) => <div key={i} className={`pl-im${i === front && src ? ' on' : ''}`} style={src ? { backgroundImage: `url(${src})` } : undefined} />)}
          <span className="pl-tag">{hover !== null ? items[hover].name : ''}</span>
        </div>
      </div>
    </div>
  )
}
