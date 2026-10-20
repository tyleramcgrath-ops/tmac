'use client'

import { useEffect, useState } from 'react'

/** Table of contents that highlights the section you're reading. */
export function TocSpy({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id)
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (vis[0]) setActive(vis[0].target.id)
      },
      { rootMargin: '-120px 0px -60% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [items])
  return (
    <nav className="toc5" aria-label="On this page">
      <div className="toc5-head">On this page</div>
      <ol>
        {items.map((i, n) => (
          <li key={i.id} className={i.id === active ? 'on' : undefined}>
            <a href={`#${i.id}`}><span>{String(n + 1).padStart(2, '0')}</span>{i.label}</a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
