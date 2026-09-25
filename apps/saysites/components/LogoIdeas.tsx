'use client'

import { useEffect, useState, useTransition } from 'react'
import type { LogoIdeasView } from '@/app/dashboard/sites/[id]/manage-actions'

interface Props {
  siteName: string
  current: { logo?: string; icon?: string }
  initial: LogoIdeasView
  request: (ask: string) => Promise<LogoIdeasView>
  poll: () => Promise<LogoIdeasView>
  choose: (index: number) => Promise<void>
}

// Ask Sofie for three logo directions, watch them arrive, pick one.
export function LogoIdeas({ siteName, current, initial, request, poll, choose }: Props) {
  const [view, setView] = useState(initial)
  const [ask, setAsk] = useState(initial.brief)
  const [using, setUsing] = useState(current.logo)
  const [pending, start] = useTransition()

  useEffect(() => {
    if (!view.working) return
    const t = setInterval(() => poll().then(setView).catch(() => {}), 3000)
    return () => clearInterval(t)
  }, [view.working, poll])

  const busy = view.working || pending
  return (
    <div className="logo-ideas">
      <form
        className="logo-ask"
        onSubmit={(e) => {
          e.preventDefault()
          start(async () => setView(await request(ask)))
        }}
      >
        <label className="field">
          <span>What should it feel like? <em className="muted">(optional)</em></span>
          <input className="input" value={ask} onChange={(e) => setAsk(e.target.value)} maxLength={500} placeholder="Warm and a little old-fashioned, with a loaf of bread" disabled={busy} />
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {view.working ? 'Sofie is sketching…' : view.ideas.length ? 'Sketch 3 new ideas' : 'Get 3 logo ideas'}
        </button>
      </form>
      {view.error && <p className="error" role="alert">{view.error}</p>}
      {view.working && (
        <div className="logo-sketching" role="status">
          <span className="dots" aria-hidden="true"><i /><i /><i /></span>
          Sofie is drawing three directions for {siteName}. This takes about a minute; you can leave this page and come back.
        </div>
      )}
      {view.ideas.length > 0 && (
        <div className={`logo-grid${view.working ? ' dim' : ''}`}>
          {view.ideas.map((idea, i) => {
            const chosen = using === idea.logo
            return (
              <figure key={idea.logo} className={`card logo-idea${chosen ? ' chosen' : ''}`}>
                <div className="logo-stage">
                  <div className="logo-header" aria-hidden="true">
                    <img src={idea.logo} alt="" />
                    <span className="logo-nav"><i /><i /><i /></span>
                  </div>
                  <div className="logo-tab" aria-hidden="true">
                    <img src={idea.icon} alt="" width={16} height={16} />
                    <span>{siteName}</span>
                  </div>
                </div>
                <figcaption>
                  <strong>{idea.name}</strong>
                  {idea.note && <span className="muted small">{idea.note}</span>}
                  <button
                    className={`btn btn-sm ${chosen ? 'btn-ghost' : 'btn-primary'}`}
                    type="button"
                    disabled={chosen || pending}
                    onClick={() =>
                      start(async () => {
                        await choose(i)
                        setUsing(idea.logo)
                      })
                    }
                  >
                    {chosen ? '✓ Your logo' : 'Use this logo'}
                  </button>
                </figcaption>
              </figure>
            )
          })}
        </div>
      )}
    </div>
  )
}
