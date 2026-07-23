'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Scroll-reveal wrapper. Adds the `rf-in` class when the element scrolls into
 * view so the CSS transition in rankforge.css fires once. Respects
 * prefers-reduced-motion via the stylesheet.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'li' | 'span'
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true)
            io.disconnect()
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Cast the polymorphic tag through `any` at the JSX site: the project pulls
  // in @react-three/fiber's global JSX augmentation (for the /hq scene), which
  // widens the intrinsic-element union so a bare `ElementType` intersects to
  // `never` here. The runtime tag is always a known DOM element.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp = Tag as any
  return (
    <Comp
      ref={ref as React.Ref<HTMLElement>}
      className={`rf-reveal ${shown ? 'rf-in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Comp>
  )
}
