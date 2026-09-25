'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { celebrate } from './Moment'
import { markSeen, readSeen } from './milestone-seen'
import { discardDraft, getStudioState, publishDraft, sendToSofie, undoSofie, type StudioState } from '@/app/dashboard/sites/[id]/sofie/actions'
import type { ChatTurn } from '@/lib/sofie'
import { LogoMark } from './Logo'

const IDEAS = [
  'Make the photo at the top darker so the words stand out',
  'Add our opening hours: Monday to Friday 8 to 5, Saturday 9 to 1',
  'Rewrite the home page headline to sound friendlier',
  'Add a short “About us” section with a photo',
  'Change the colors to a deep green',
]

export function SofieStudio(props: {
  siteId: string
  siteName: string
  initial: StudioState
  ready: boolean
  // A Talk & Design prompt to send as soon as the studio opens.
  autostart?: string
}) {
  const [state, setState] = useState<StudioState>(props.initial)
  const [pending, setPending] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [page, setPage] = useState('')
  const [device, setDevice] = useState<'desktop' | 'phone'>('desktop')
  const [version, setVersion] = useState(0)
  const [busy, startTransition] = useTransition()
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [state.chat.length, pending, state.working])

  // Sofie works in the background; check back until she is done.
  useEffect(() => {
    if (!state.working) return
    const timer = setTimeout(async () => {
      try {
        const next = await getStudioState(props.siteId)
        setState(next)
        if (!next.working) setVersion((v) => v + 1)
      } catch {
        // A missed check is fine; the next render tries again.
        setState((s) => ({ ...s }))
      }
    }, 2500)
    return () => clearTimeout(timer)
  }, [state, props.siteId])

  const started = useRef(false)
  useEffect(() => {
    if (started.current || !props.autostart || !props.ready) return
    started.current = true
    window.history.replaceState(null, '', window.location.pathname)
    send(props.autostart)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function run(action: () => Promise<StudioState>, message?: string) {
    if (message) setPending(message)
    startTransition(async () => {
      try {
        const next = await action()
        setState(next)
        if (!next.working) setVersion((v) => v + 1)
      } catch {
        // The connection dropped; the server may still have the message.
        try {
          setState(await getStudioState(props.siteId))
        } catch {
          setState((s) => ({ ...s, error: 'Lost the connection. Check your internet and try again.' }))
        }
      }
      setPending(null)
    })
  }

  function send(text: string) {
    const t = text.trim()
    if (!t || busy || state.working) return
    setInput('')
    run(() => sendToSofie(props.siteId, t), t)
  }

  const src = `/dashboard/sites/${props.siteId}/draft${page ? `/${page}` : ''}?v=${version}`

  return (
    <div className="studio">
      <section className="studio-chat" aria-label="Chat with Sofie">
        <header className="studio-chat-head">
          <span className="studio-avatar"><LogoMark size={18} /></span>
          <div>
            <strong>Sofie</strong>
            <span>Changes {props.siteName} when you ask</span>
          </div>
        </header>

        <div className="studio-log" ref={logRef} aria-live="polite">
          {state.chat.length === 0 && !pending && !state.working && (
            <div className="studio-empty">
              <p>Hi! Tell me what you’d like to change, in your own words. I’ll show you the result on the right before anything goes live.</p>
              <div className="studio-ideas">
                {IDEAS.map((i) => (
                  <button key={i} type="button" onClick={() => send(i)} disabled={busy || state.working || !props.ready}>{i}</button>
                ))}
              </div>
            </div>
          )}
          {state.chat.map((t, n) => <Turn key={n} turn={t} />)}
          {pending && <div className="msg msg-owner">{pending}</div>}
          {(pending || state.working) && <div className="msg msg-sofie msg-typing" aria-label="Sofie is working"><i /><i /><i /></div>}
        </div>

        {state.error && <p className="studio-error" role="alert">{state.error}</p>}
        {!props.ready && !state.error && (
          <p className="studio-error">Sofie isn’t switched on yet: this server needs an Anthropic API key (ANTHROPIC_API_KEY in the Vercel project settings).</p>
        )}

        <form
          className="studio-input"
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
        >
          <label htmlFor="sofie-msg" className="visually-hidden">Message Sofie</label>
          <textarea
            id="sofie-msg"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            placeholder="Ask Sofie to change anything…"
            rows={2}
            maxLength={2000}
            disabled={!props.ready}
          />
          <button className="btn btn-primary" type="submit" disabled={busy || state.working || !input.trim() || !props.ready}>Send</button>
        </form>
      </section>

      <section className="studio-view" aria-label="Preview">
        <div className="studio-bar">
          <div className="studio-tabs" role="tablist" aria-label="Pages">
            {state.pages.map((p) => (
              <button key={p.slug} type="button" role="tab" aria-selected={page === p.slug} onClick={() => setPage(p.slug)}>{p.name}</button>
            ))}
          </div>
          <div className="studio-device" role="group" aria-label="Screen size">
            <button type="button" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')}>Computer</button>
            <button type="button" aria-pressed={device === 'phone'} onClick={() => setDevice('phone')}>Phone</button>
          </div>
          <div className="studio-actions">
            {state.hasDraft ? <span className="pill warn">Not live yet</span> : <span className="pill ok">Live</span>}
            <button className="btn btn-ghost btn-sm" type="button" disabled={busy || state.working || !state.canUndo} onClick={() => run(() => undoSofie(props.siteId))}>Undo</button>
            <button className="btn btn-ghost btn-sm" type="button" disabled={busy || state.working || !state.hasDraft} onClick={() => confirm('Throw away all unpublished changes?') && run(() => discardDraft(props.siteId))}>Discard</button>
            <button className="btn btn-primary btn-sm" type="button" disabled={busy || state.working || !state.hasDraft} onClick={() => run(async () => {
              const next = await publishDraft(props.siteId)
              // The first publish from Sofie gets its moment, once.
              if (!next.hasDraft && !(readSeen(props.siteId) ?? []).includes('sofie')) {
                markSeen(props.siteId, 'sofie')
                celebrate({ title: props.siteName, caption: 'just changed with a sentence.' })
              }
              return next
            })}>Publish</button>
          </div>
        </div>
        <div className={`studio-frame studio-${device}`}>
          <iframe key={src} src={src} title={`Preview of ${props.siteName}`} />
        </div>
      </section>
    </div>
  )
}

function Turn({ turn }: { turn: ChatTurn }) {
  if (turn.role === 'owner') return <div className="msg msg-owner">{turn.text}</div>
  return (
    <div className="msg msg-sofie">
      <p>{turn.text}</p>
      {turn.changes && turn.changes.length > 0 && (
        <ul className="msg-changes">{turn.changes.map((c, i) => <li key={i}>{c}</li>)}</ul>
      )}
    </div>
  )
}
