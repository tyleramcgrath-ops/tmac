'use client'

import { useState } from 'react'

export function CopyLink() {
  const [done, setDone] = useState(false)
  return (
    <button type="button" className="copy-link" onClick={() => { navigator.clipboard?.writeText(location.href).then(() => { setDone(true); setTimeout(() => setDone(false), 1800) }) }}>
      {done ? 'Link copied ✓' : 'Copy link'}
    </button>
  )
}
