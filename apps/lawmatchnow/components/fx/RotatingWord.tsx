'use client'

import { useEffect, useState } from 'react'

/** Cycles through words with a soft vertical swap. The first word is server-rendered. */
export function RotatingWord({ words }: { words: string[] }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setI((v) => (v + 1) % words.length), 2400)
    return () => clearInterval(id)
  }, [words.length])
  return (
    <span className="rotator" aria-live="off">
      <span key={i} className="rotator-word">{words[i]}</span>
    </span>
  )
}
