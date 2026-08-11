'use client'

import { useState } from 'react'
import {
  ArrowRight,
  Clock3,
  Coffee,
  Linkedin,
  Mail,
  MessageSquare,
  PenLine,
  Phone,
  RotateCcw,
  Sparkles,
  TriangleAlert,
  Undo2,
  X,
} from 'lucide-react'
import { daysSince, sinceLabel, timeAgoFromMs, warmthWord } from '../_lib/format'
import { INTENT_SUGGESTIONS } from '../_lib/seed'
import { newId, useStore } from '../_lib/store'
import {
  CHANNEL_LABEL,
  URGENCY_LABEL,
  type Brief,
  type Channel,
  type Person,
  type Pick,
} from '../_lib/types'
import { Avatar, Spinner, Warmth } from './primitives'
import type { DraftTarget } from './draft-drawer'

const CHANNEL_ICON: Record<Channel, typeof Mail> = {
  email: Mail,
  text: MessageSquare,
  call: Phone,
  linkedin: Linkedin,
  'in-person': Coffee,
}

interface ApiError {
  code?: string
  error: string
  detail?: string
}

export function BriefView({ onDraft }: { onDraft: (target: DraftTarget) => void }) {
  const { people, briefs, dismissed, account, addBrief, dismiss, undismissAll } = useStore()
  const [intent, setIntent] = useState('')
  const [count, setCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const brief = briefs[0]
  const active = brief?.picks.filter((pick) => !dismissed.includes(pick.personId)) ?? []
  const byId = new Map(people.map((person) => [person.id, person]))

  async function run() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/contact/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: intent.trim(),
          count,
          user: { name: account?.name ?? '', role: account?.role ?? '' },
          people: people.map((person) => ({
            id: person.id,
            name: person.name,
            role: person.role,
            company: person.company,
            context: person.context,
            notes: person.notes,
            tags: person.tags,
            lastContact: person.lastContact,
            channel: person.channel,
            circle: person.circle,
            location: person.location,
            daysSince: daysSince(person.lastContact),
          })),
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        setError(payload as ApiError)
        return
      }

      const next: Brief = {
        id: newId('b'),
        createdAt: Date.now(),
        intent: intent.trim(),
        summary: payload.summary,
        passedOver: payload.passedOver,
        picks: payload.picks as Pick[],
        model: payload.model,
      }
      addBrief(next)
      undismissAll()
    } catch (err) {
      setError({
        error: 'Could not reach the brief.',
        detail: (err as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ctc-stack ctc-g6">
      {/* ---------------------------------------------------- Composer */}
      <section className="ctc-composer" aria-labelledby="composer-title">
        <div className="ctc-composer-inner">
          <div className="ctc-stack ctc-g2">
            <span className="ctc-eyebrow ctc-eyebrow-ember">The weekly brief</span>
            <h1 id="composer-title" className="ctc-h2" style={{ fontSize: 'var(--t-2xl)' }}>
              What are you working on?
            </h1>
            <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)', maxWidth: '52ch' }}>
              Contact reads all {people.length} people in your network against this, and comes back
              with who to reach and why. Leave it empty to find who is quietly slipping away.
            </p>
          </div>

          <div className="ctc-stack ctc-g3" style={{ marginTop: 'var(--s-4)' }}>
            <label className="ctc-sr" htmlFor="ctc-intent">
              Your intent
            </label>
            <textarea
              id="ctc-intent"
              className="ctc-textarea"
              value={intent}
              maxLength={400}
              rows={2}
              placeholder="I want to hire a founding designer in the next six weeks…"
              onChange={(event) => setIntent(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) run()
              }}
              disabled={loading}
            />

            <div className="ctc-row ctc-g2 ctc-wrapflex">
              {INTENT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="ctc-suggestion"
                  onClick={() => setIntent(suggestion)}
                  disabled={loading}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="ctc-between ctc-wrapflex ctc-g3" style={{ marginTop: 'var(--s-2)' }}>
              <div className="ctc-row ctc-g2">
                <span className="ctc-label" id="ctc-count-label">
                  Names
                </span>
                <div className="ctc-segment" role="group" aria-labelledby="ctc-count-label">
                  {[3, 5, 8].map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="ctc-segment-btn ctc-num"
                      aria-pressed={count === option}
                      onClick={() => setCount(option)}
                      disabled={loading}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" className="ctc-btn ctc-btn-ember ctc-btn-lg" onClick={run} disabled={loading}>
                {loading ? (
                  <>
                    <Spinner /> Reading your network
                  </>
                ) : (
                  <>
                    <Sparkles size={16} aria-hidden="true" />
                    {brief ? 'Run it again' : 'Run the brief'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ Results */}
      {loading ? <BriefSkeleton count={count} /> : null}

      {!loading && error ? <BriefError error={error} onRetry={run} /> : null}

      {!loading && !error && !brief ? <BriefEmpty /> : null}

      {!loading && brief ? (
        <section className="ctc-stack ctc-g5" aria-label="Your brief">
          <div className="ctc-summary">
            <div className="ctc-between ctc-wrapflex ctc-g3" style={{ marginBottom: 'var(--s-3)' }}>
              <span className="ctc-eyebrow">
                {brief.intent ? 'Brief' : 'Decay watch'} · {timeAgoFromMs(brief.createdAt)}
              </span>
              <div className="ctc-row ctc-g2">
                {brief.model ? (
                  <span className="ctc-chip ctc-chip-mono">{brief.model}</span>
                ) : null}
                <span className="ctc-chip ctc-chip-mono">
                  {brief.picks.length} of {people.length}
                </span>
              </div>
            </div>

            {brief.intent ? (
              <p className="ctc-serif-italic ctc-muted" style={{ fontSize: 'var(--t-sm)', marginBottom: 6 }}>
                “{brief.intent}”
              </p>
            ) : null}

            <p className="ctc-summary-text">{brief.summary}</p>

            {brief.passedOver ? (
              <p className="ctc-faint" style={{ fontSize: 'var(--t-xs)', marginTop: 'var(--s-3)' }}>
                <span className="ctc-eyebrow">Passed over · </span>
                {brief.passedOver}
              </p>
            ) : null}
          </div>

          {active.length === 0 ? (
            <div className="ctc-card" style={{ padding: 'var(--s-6)', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-lg)' }}>
                That is the whole list handled.
              </p>
              <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)', marginTop: 6 }}>
                Every name has been drafted or set aside.
              </p>
              <button
                type="button"
                className="ctc-btn ctc-btn-quiet"
                style={{ marginTop: 'var(--s-4)' }}
                onClick={undismissAll}
              >
                <Undo2 size={14} aria-hidden="true" /> Bring them back
              </button>
            </div>
          ) : (
            <ul className="ctc-stack ctc-g4" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {active.map((pick, index) => {
                const person = byId.get(pick.personId)
                if (!person) return null
                return (
                  <PickCard
                    key={pick.personId}
                    pick={pick}
                    person={person}
                    index={index}
                    intent={brief.intent}
                    onDraft={onDraft}
                    onDismiss={() => dismiss(pick.personId)}
                  />
                )
              })}
            </ul>
          )}

          <p className="ctc-faint" style={{ fontSize: 'var(--t-2xs)', textAlign: 'center' }}>
            Reasoning and drafts are generated by Claude from the notes you keep. Judgement stays
            yours — read everything before you send it.
          </p>
        </section>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------- Card */

function PickCard({
  pick,
  person,
  index,
  intent,
  onDraft,
  onDismiss,
}: {
  pick: Pick
  person: Person
  index: number
  intent: string
  onDraft: (target: DraftTarget) => void
  onDismiss: () => void
}) {
  const Icon = CHANNEL_ICON[pick.channel] ?? Mail
  const urgencyClass =
    pick.urgency === 'now' ? 'ctc-chip-ember' : pick.urgency === 'this-week' ? 'ctc-chip-gold' : ''

  return (
    <li
      className="ctc-pick"
      style={{ animation: 'ctc-pop var(--d-3) var(--e-spring) both', animationDelay: `${index * 70}ms` }}
    >
      <div className="ctc-pick-rail">
        <span className="ctc-num ctc-pick-rank">{String(pick.rank).padStart(2, '0')}</span>
        <Avatar name={person.name} size="lg" />
        <span className="ctc-stack ctc-g1 ctc-pick-warmth">
          <Warmth value={pick.warmth} height={18} label={false} />
          <span className="ctc-faint ctc-num" style={{ fontSize: 'var(--t-2xs)', textAlign: 'center' }}>
            {pick.warmth} · {warmthWord(pick.warmth)}
          </span>
        </span>
      </div>

      <div className="ctc-pick-main">
        <div className="ctc-between ctc-wrapflex ctc-g3" style={{ alignItems: 'flex-start' }}>
          <div className="ctc-stack" style={{ gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 'var(--t-md)', fontWeight: 600, letterSpacing: '-0.015em' }}>
              {person.name}
            </span>
            <span className="ctc-faint" style={{ fontSize: 'var(--t-xs)' }}>
              {person.role}
              {person.company ? ` · ${person.company}` : ''} · last spoke{' '}
              {sinceLabel(person.lastContact)}
            </span>
          </div>
          <div className="ctc-row ctc-g2 ctc-wrapflex">
            <span className={`ctc-chip ${urgencyClass}`}>
              <Clock3 size={11} aria-hidden="true" />
              {URGENCY_LABEL[pick.urgency]}
            </span>
            <span className="ctc-chip">
              <Icon size={11} aria-hidden="true" />
              {CHANNEL_LABEL[pick.channel]}
            </span>
          </div>
        </div>

        <h3 className="ctc-pick-headline">{pick.headline}</h3>

        <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)', lineHeight: 1.6 }}>
          {pick.reason}
        </p>

        {pick.talkingPoints.length ? (
          <ul className="ctc-points">
            {pick.talkingPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        ) : null}

        <div className="ctc-opener">
          <span className="ctc-eyebrow">Opening line</span>
          <p>{pick.opener}</p>
        </div>

        <div className="ctc-row ctc-g2 ctc-wrapflex" style={{ marginTop: 'var(--s-1)' }}>
          <button
            type="button"
            className="ctc-btn ctc-btn-primary ctc-btn-sm"
            onClick={() => onDraft({ person, angle: pick, intent })}
          >
            <PenLine size={13} aria-hidden="true" /> Write the message
          </button>
          <button type="button" className="ctc-btn ctc-btn-ghost ctc-btn-sm" onClick={onDismiss}>
            <X size={13} aria-hidden="true" /> Not now
          </button>
        </div>
      </div>
    </li>
  )
}

/* ------------------------------------------------------------ States */

function BriefSkeleton({ count }: { count: number }) {
  return (
    <section className="ctc-stack ctc-g4" aria-label="Building your brief" aria-busy="true">
      <div className="ctc-summary">
        <div className="ctc-stack ctc-g2">
          <span className="ctc-skeleton" style={{ height: 10, width: 130 }} />
          <span className="ctc-skeleton" style={{ height: 14, width: '86%' }} />
          <span className="ctc-skeleton" style={{ height: 14, width: '62%' }} />
        </div>
      </div>
      {Array.from({ length: Math.min(count, 4) }, (_, i) => (
        <div key={i} className="ctc-pick" style={{ opacity: 1 - i * 0.16 }}>
          <div className="ctc-pick-rail">
            <span className="ctc-skeleton" style={{ height: 10, width: 18 }} />
            <span className="ctc-skeleton" style={{ height: 54, width: 54, borderRadius: '50%' }} />
          </div>
          <div className="ctc-pick-main ctc-stack ctc-g3">
            <span className="ctc-skeleton" style={{ height: 13, width: '32%' }} />
            <span className="ctc-skeleton" style={{ height: 20, width: '68%' }} />
            <span className="ctc-skeleton" style={{ height: 11, width: '94%' }} />
            <span className="ctc-skeleton" style={{ height: 11, width: '78%' }} />
            <span className="ctc-skeleton" style={{ height: 58, width: '100%', borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </section>
  )
}

function BriefError({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  const isConfig = error.code === 'no_key' || error.code === 'auth'
  return (
    <section className="ctc-card ctc-pop" style={{ padding: 'var(--s-5)', borderColor: 'var(--rust)' }} role="alert">
      <div className="ctc-row ctc-g3" style={{ alignItems: 'flex-start' }}>
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--rust-wash)',
            color: 'var(--rust)',
            flex: 'none',
          }}
        >
          <TriangleAlert size={16} aria-hidden="true" />
        </span>
        <div className="ctc-stack ctc-g2 ctc-grow">
          <span style={{ fontWeight: 600 }}>{error.error}</span>
          {error.detail ? (
            <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)' }}>
              {error.detail}
            </p>
          ) : null}
          {isConfig ? (
            <p className="ctc-faint" style={{ fontSize: 'var(--t-xs)' }}>
              The rest of the workspace — your people, notes and saved drafts — keeps working
              without a model connected.
            </p>
          ) : null}
          <div className="ctc-row ctc-g2" style={{ marginTop: 'var(--s-2)' }}>
            <button type="button" className="ctc-btn ctc-btn-quiet ctc-btn-sm" onClick={onRetry}>
              <RotateCcw size={13} aria-hidden="true" /> Try again
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function BriefEmpty() {
  return (
    <section className="ctc-card ctc-empty">
      <div className="ctc-empty-mark" aria-hidden="true">
        <svg width="120" height="72" viewBox="0 0 120 72" fill="none">
          {[
            [16, 52],
            [44, 20],
            [76, 44],
            [104, 16],
          ].map(([x, y], i) => (
            <g key={i}>
              {i > 0 ? (
                <line
                  x1={[16, 44, 76][i - 1]}
                  y1={[52, 20, 44][i - 1]}
                  x2={x}
                  y2={y}
                  stroke="var(--line-strong)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              ) : null}
              <circle cx={x} cy={y} r={i === 1 ? 8 : 6} fill={i === 1 ? 'var(--ember)' : 'var(--paper-sunk)'} stroke="var(--line-strong)" />
            </g>
          ))}
        </svg>
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-xl)' }}>
        Nothing briefed yet.
      </h2>
      <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)', maxWidth: '44ch', margin: '0 auto' }}>
        Say what you are working on — or say nothing at all — and Contact will read your whole
        network and come back with the five people who matter this week.
      </p>
      <span className="ctc-row ctc-g2 ctc-faint" style={{ fontSize: 'var(--t-xs)', justifyContent: 'center', marginTop: 'var(--s-3)' }}>
        Start above <ArrowRight size={13} aria-hidden="true" />
      </span>
    </section>
  )
}
