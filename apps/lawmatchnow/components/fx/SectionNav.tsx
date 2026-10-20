'use client'

import { useEffect, useState } from 'react'

/** Sticky in-page navigation that highlights the section being read. */
export function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id)
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-140px 0px -55% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [items])
  return (
    <nav className="secnav" aria-label="On this page">
      <div className="wrap secnav-inner">
        {items.map((i) => (
          <a key={i.id} href={`#${i.id}`} className={i.id === active ? 'on' : undefined} aria-current={i.id === active ? 'true' : undefined}>{i.label}</a>
        ))}
      </div>
    </nav>
  )
}
