'use client'

import { useLayoutEffect, useRef } from 'react'
import { celebrate } from './Moment'
import { readSeen, writeSeen } from './milestone-seen'

interface Item {
  id: string
  done: boolean
  caption: string
}

// The order a newly earned milestone gets the big moment in, if several
// arrive at once; the rest just stamp into place.
const PRIORITY = ['live', 'domain', 'shop', 'message', 'visitor', 'logo', 'sofie', 'post', 'seo', 'photos']

export function MilestoneWatcher({ siteId, siteName, domain, isNew, items, children }: { siteId: string; siteName: string; domain?: string; isNew: boolean; items: Item[]; children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const done = items.filter((i) => i.done).map((i) => i.id)
    const stored = readSeen(siteId)
    // First visit on this browser to an existing site: remember what's there
    // quietly instead of replaying every past moment.
    const seen = stored ?? (isNew ? [] : done)
    const fresh = done.filter((id) => !seen.includes(id))
    writeSeen(siteId, done)
    if (!fresh.length) return
    const lead = [...fresh].sort((a, b) => PRIORITY.indexOf(a) - PRIORITY.indexOf(b))[0]
    const item = items.find((i) => i.id === lead)!
    const t = setTimeout(() => celebrate({ title: lead === 'domain' && domain ? domain : siteName, caption: item.caption }), 350)
    // The new marks stamp in as the moment folds away.
    for (const id of fresh) root.current?.querySelector(`[data-mark="${id}"]`)?.classList.add('fresh')
    return () => clearTimeout(t)
  }, [siteId, siteName, domain, isNew, items])
  return (
    <div ref={root} className="milestones-root">
      {children}
    </div>
  )
}
