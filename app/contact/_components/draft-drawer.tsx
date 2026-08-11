'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Check,
  Copy,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  TriangleAlert,
  X,
  Linkedin,
  Coffee,
} from 'lucide-react'
import { daysSince } from '../_lib/format'
import { newId, useStore } from '../_lib/store'
import {
  CHANNEL_LABEL,
  TONE_LABEL,
  type Channel,
  type Person,
  type Pick,
  type Tone,
} from '../_lib/types'
import { Avatar, Spinner } from './primitives'

export interface DraftTarget {
  person: Person
  angle?: Pick
  intent: string
}

const CHANNEL_ICON: Record<Channel, typeof Mail> = {
  email: Mail,
  text: MessageSquare,
  call: Phone,
  linkedin: Linkedin,
  'in-person': Coffee,
}

const CHANNELS: Channel[] = ['email', 'text', 'call', 'linkedin', 'in-person']
const TONES: Tone[] = ['warm', 'direct', 'playful', 'formal']

export function DraftDrawer({
  target,
  onClose,
}: {
  target: DraftTarget
  onClose: () => void
}) {
  const { account, saveDraft, markDraftSent } = useStore()
  const { person, angle, intent } = target

  const [tone, setTone] = useState<Tone>('warm')
  const [channel, setChannel] = useState<Channel>(angle?.channel ?? person.channel)
  const [instruction, setInstruction] = useState('')
  const [text, setText] = useState('')
  const [state, setState] = useState<'idle' | 'writing' | 'done' | 'error'>('idle')
  const [error, setError] = useState<{ error: string; detail?: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [sentId, setSentId] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Escape closes; focus moves into the panel on open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      abortRef.current?.abort()
    }
  }, [onClose])

  const write = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState('writing')
    setError(null)
    setText('')
    setSentId(null)
    // On a short viewport the sheet sits below the fold — bring the writing
    // into view rather than letting it happen off-screen.
    sheetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    try {
      const response = await fetch('/api/contact/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          intent,
          tone,
          channel,
          instruction,
          user: { name: account?.name ?? '', role: account?.role ?? '' },
          person: {
            name: person.name,
            role: person.role,
            company: person.company,
            context: person.context,
            notes: person.notes,
            lastContact: person.lastContact,
            daysSince: daysSince(person.lastContact),
          },
          angle: angle
            ? {
                headline: angle.headline,
                reason: angle.reason,
                talkingPoints: angle.talkingPoints,
              }
            : undefined,
        }),
      })

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null)
        setError(
          payload ?? { error: 'The draft could not be written.', detail: `HTTP ${response.status}` }
        )
        setState('error')
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        setText(buffer)
        outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight })
      }
      setState('done')
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError({
        error: 'The connection dropped mid-draft.',
        detail: (err as Error).message,
      })
      setState('error')
    }
  }, [account, angle, channel, instruction, intent, person, tone])

  function onSave() {
    const id = newId('d')
    saveDraft({
      id,
      personId: person.id,
      personName: person.name,
      channel,
      tone,
      intent,
      body: text,
      createdAt: Date.now(),
    })
    setSentId(id)
  }

  function onSend() {
    const id = sentId ?? newId('d')
    if (!sentId) {
      saveDraft({
        id,
        personId: person.id,
        personName: person.name,
        channel,
        tone,
        intent,
        body: text,
        createdAt: Date.now(),
      })
    }
    markDraftSent(id)
    setSentId(id)
    onClose()
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  const Icon = CHANNEL_ICON[channel]

  return (
    <div className="ctc-drawer-root" role="dialog" aria-modal="true" aria-labelledby="ctc-drawer-title">
      <button type="button" className="ctc-drawer-scrim" onClick={onClose} aria-label="Close draft" />

      <div className="ctc-drawer" ref={panelRef} tabIndex={-1}>
        <header className="ctc-drawer-head">
          <div className="ctc-row ctc-g3 ctc-grow" style={{ minWidth: 0 }}>
            <Avatar name={person.name} size="lg" />
            <div className="ctc-stack ctc-grow" style={{ gap: 1, minWidth: 0 }}>
              <h2 id="ctc-drawer-title" className="ctc-truncate" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-lg)' }}>
                {person.name}
              </h2>
              <span className="ctc-faint ctc-truncate" style={{ fontSize: 'var(--t-xs)' }}>
                {person.role}
                {person.company ? ` · ${person.company}` : ''}
              </span>
            </div>
          </div>
          <button type="button" className="ctc-icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="ctc-drawer-body">
          {angle ? (
            <div className="ctc-well" style={{ padding: 'var(--s-3) var(--s-4)' }}>
              <span className="ctc-eyebrow">Why now</span>
              <p style={{ fontSize: 'var(--t-sm)', marginTop: 4, color: 'var(--ink-soft)' }}>
                {angle.reason}
              </p>
            </div>
          ) : (
            <div className="ctc-well" style={{ padding: 'var(--s-3) var(--s-4)' }}>
              <span className="ctc-eyebrow">What Contact remembers</span>
              <p style={{ fontSize: 'var(--t-sm)', marginTop: 4, color: 'var(--ink-soft)' }}>
                {person.notes || person.context}
              </p>
            </div>
          )}

          <fieldset className="ctc-fieldset">
            <legend className="ctc-label">Channel</legend>
            <div className="ctc-row ctc-g2 ctc-wrapflex">
              {CHANNELS.map((option) => {
                const OptionIcon = CHANNEL_ICON[option]
                return (
                  <button
                    key={option}
                    type="button"
                    className="ctc-toggle"
                    aria-pressed={channel === option}
                    onClick={() => setChannel(option)}
                  >
                    <OptionIcon size={12} aria-hidden="true" />
                    {CHANNEL_LABEL[option]}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="ctc-fieldset">
            <legend className="ctc-label">Tone</legend>
            <div className="ctc-row ctc-g2 ctc-wrapflex">
              {TONES.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="ctc-toggle"
                  aria-pressed={tone === option}
                  onClick={() => setTone(option)}
                >
                  {TONE_LABEL[option]}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="ctc-field">
            <label className="ctc-label" htmlFor="ctc-instruction">
              Anything to add? (optional)
            </label>
            <input
              id="ctc-instruction"
              className="ctc-input"
              value={instruction}
              placeholder="Mention I'll be in Berlin in September"
              onChange={(event) => setInstruction(event.target.value)}
            />
          </div>

          {/* ---- The sheet ---- */}
          <div className="ctc-sheet" ref={sheetRef}>
            <div className="ctc-sheet-head">
              <span className="ctc-row ctc-g2 ctc-eyebrow">
                <Icon size={12} aria-hidden="true" />
                {CHANNEL_LABEL[channel]} draft
              </span>
              {state === 'writing' ? (
                <span className="ctc-row ctc-g2 ctc-faint" style={{ fontSize: 'var(--t-2xs)' }}>
                  <Spinner size={11} /> writing
                </span>
              ) : null}
            </div>

            <div className="ctc-sheet-body" ref={outputRef} aria-live="polite" aria-busy={state === 'writing'}>
              {state === 'idle' && !text ? (
                <p className="ctc-faint" style={{ fontSize: 'var(--t-sm)' }}>
                  Pick a channel and a tone, then write the draft. It is generated from what you
                  know about {person.name.split(' ')[0]} — nothing is pulled from a template.
                </p>
              ) : null}

              {state === 'error' && error ? (
                <div className="ctc-stack ctc-g2">
                  <span className="ctc-row ctc-g2" style={{ color: 'var(--rust)', fontSize: 'var(--t-sm)', fontWeight: 600 }}>
                    <TriangleAlert size={14} aria-hidden="true" />
                    {error.error}
                  </span>
                  {error.detail ? (
                    <p className="ctc-muted" style={{ fontSize: 'var(--t-xs)' }}>{error.detail}</p>
                  ) : null}
                </div>
              ) : null}

              {text ? (
                <p className="ctc-sheet-text">
                  {text}
                  {state === 'writing' ? <span className="ctc-caret" aria-hidden="true" /> : null}
                </p>
              ) : state === 'writing' ? (
                <div className="ctc-stack ctc-g2">
                  <span className="ctc-skeleton" style={{ height: 11, width: '38%' }} />
                  <span className="ctc-skeleton" style={{ height: 11, width: '92%' }} />
                  <span className="ctc-skeleton" style={{ height: 11, width: '84%' }} />
                  <span className="ctc-skeleton" style={{ height: 11, width: '60%' }} />
                </div>
              ) : null}
            </div>
          </div>

          <p className="ctc-faint" style={{ fontSize: 'var(--t-2xs)', lineHeight: 1.5 }}>
            Drafted by Claude from your notes. Read it before you send it — Contact never sends
            anything on your behalf.
          </p>
        </div>

        <footer className="ctc-drawer-foot">
          <button
            type="button"
            className={`ctc-btn ${text ? 'ctc-btn-quiet' : 'ctc-btn-ember'}`}
            onClick={write}
            disabled={state === 'writing'}
          >
            {state === 'writing' ? (
              <>
                <Spinner /> Writing
              </>
            ) : text ? (
              <>
                <RefreshCw size={14} aria-hidden="true" /> Rewrite
              </>
            ) : (
              'Write the draft'
            )}
          </button>

          <div className="ctc-row ctc-g2">
            <button
              type="button"
              className="ctc-btn ctc-btn-quiet"
              onClick={onCopy}
              disabled={!text || state === 'writing'}
            >
              {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              className="ctc-btn ctc-btn-quiet"
              onClick={onSave}
              disabled={!text || state === 'writing'}
            >
              Save
            </button>
            <button
              type="button"
              className="ctc-btn ctc-btn-primary"
              onClick={onSend}
              disabled={!text || state === 'writing'}
            >
              <Send size={14} aria-hidden="true" /> Mark sent
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
