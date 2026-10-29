'use client'

import { useEffect, useRef, type ReactNode } from 'react'

const NS = 'http://www.w3.org/2000/svg'

/**
 * A thin sky-blue line that draws itself down the page as you scroll,
 * weaving between the `[data-flow]` sections inside it, with a pen nib on
 * the end. Purely decorative; skipped without motion.
 */
export function PenFlow({ children }: { children: ReactNode }) {
  const flowRef = useRef<HTMLDivElement>(null)
  const penRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const flow = flowRef.current, pen = penRef.current
    if (!flow || !pen || !document.documentElement.classList.contains('fx')) return
    let path: SVGPathElement | null = null, nib: SVGGElement | null = null
    let samples: [number, number][] = [], plen = 0, drawn = -1, raf = 0
    const mobile = () => innerWidth <= 820

    const build = () => {
      const fr = flow.getBoundingClientRect()
      const secs = [...flow.querySelectorAll<HTMLElement>('[data-flow]')]
      if (!secs.length) return
      const first = (secs[0].querySelector('.wrap') ?? secs[0]).getBoundingClientRect()
      const W = fr.width, H = flow.offsetHeight, pad = mobile() ? 20 : 40
      const L = first.left - fr.left >= 64 ? first.left - fr.left - 28 : first.left - fr.left + pad * 0.4, R = W - L
      pen.setAttribute('viewBox', `0 0 ${W} ${H}`); pen.setAttribute('width', `${W}`); pen.setAttribute('height', `${H}`)
      const boxes = secs.map((s) => { const r = (s.querySelector('.wrap') ?? s).getBoundingClientRect(); return { t: r.top - fr.top, b: r.bottom - fr.top } })
      let side = 0, x = L, d = `M${x} ${boxes[0].t - 40}`
      for (let i = 0; i < boxes.length - 1; i++) {
        const g0 = boxes[i].b, g1 = boxes[i + 1].t, gap = g1 - g0, a = g0 + gap * 0.18, b = g1 - gap * 0.18, nx = side ? L : R
        d += ` L${x} ${a.toFixed(1)} C${x} ${((a + b) / 2).toFixed(1)} ${nx} ${((a + b) / 2).toFixed(1)} ${nx} ${b.toFixed(1)}`
        x = nx; side ^= 1
      }
      const last = boxes[boxes.length - 1].b
      d += ` L${x} ${(last - 10).toFixed(1)} C${x} ${(last + 40).toFixed(1)} ${W / 2} ${(last + 20).toFixed(1)} ${W / 2} ${(last + 70).toFixed(1)}`
      pen.innerHTML = ''
      const ghost = document.createElementNS(NS, 'path'); ghost.setAttribute('class', 'pen-ghost'); ghost.setAttribute('d', d); pen.appendChild(ghost)
      path = document.createElementNS(NS, 'path'); path.setAttribute('class', 'pen-line'); path.setAttribute('d', d); pen.appendChild(path)
      nib = document.createElementNS(NS, 'g') as SVGGElement
      nib.innerHTML = '<circle class="pen-nib" r="6"/><circle class="pen-nib-c" r="2.4"/>'
      pen.appendChild(nib)
      plen = path.getTotalLength()
      path.style.strokeDasharray = `${plen} ${plen}`
      samples = []
      // Every 48px of path is plenty: targetLen() interpolates between samples.
      for (let l = 0; l <= plen; l += 48) samples.push([l, path.getPointAtLength(l).y])
      samples.push([plen, path.getPointAtLength(plen).y])
      drawn = -1
    }
    const targetLen = () => {
      const yT = innerHeight * 0.62 - flow.getBoundingClientRect().top
      let best = 0
      for (let i = 0; i < samples.length; i++) {
        const [l, y] = samples[i]
        if (y > yT) {
          const [pl, py] = samples[i - 1] ?? [0, y]
          return y === py ? best : pl + ((yT - py) / (y - py)) * (l - pl)
        }
        best = l
      }
      return best
    }
    const tick = () => {
      if (path && nib) {
        const lt = targetLen()
        if (drawn < 0) drawn = lt
        drawn += (lt - drawn) * 0.12
        path.style.strokeDashoffset = (plen - drawn).toFixed(1)
        const pt = path.getPointAtLength(Math.max(0.1, drawn))
        nib.setAttribute('transform', `translate(${pt.x.toFixed(1)},${pt.y.toFixed(1)})`)
        nib.style.opacity = drawn > 2 && drawn < plen - 2 ? '1' : '0'
        // Stop once the line has caught up; scrolling starts it again.
        if (Math.abs(lt - drawn) < 0.5) { raf = 0; return }
      }
      raf = requestAnimationFrame(tick)
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick) }
    let rz = 0
    const rebuild = () => { build(); kick() }
    const onResize = () => { clearTimeout(rz); rz = window.setTimeout(rebuild, 150) }
    const ro = new ResizeObserver(onResize)
    ro.observe(flow)
    // Built once the page is idle (the ResizeObserver's first callback also
    // lands here), so it never competes with the first paint.
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: object) => number }).requestIdleCallback
    const first = idle ? idle(rebuild, { timeout: 2500 }) : window.setTimeout(rebuild, 400)
    document.fonts?.ready.then(onResize)
    addEventListener('resize', onResize)
    addEventListener('scroll', kick, { passive: true })
    return () => {
      cancelAnimationFrame(raf); clearTimeout(rz); clearTimeout(first); ro.disconnect()
      removeEventListener('resize', onResize); removeEventListener('scroll', kick)
    }
  }, [])

  return (
    <div className="pen-flow" ref={flowRef}>
      <svg className="pen" ref={penRef} aria-hidden="true" />
      {children}
    </div>
  )
}
