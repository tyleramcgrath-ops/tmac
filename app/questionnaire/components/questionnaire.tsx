'use client'

import '../questionnaire.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  CornerDownLeft,
  ShieldCheck,
  BadgeCheck,
  Cpu,
  Clock,
  Send,
} from 'lucide-react'
import {
  questions,
  intro,
  outro,
  type Question,
} from '../questions'

type Answer = string | string[] | number
type Answers = Record<string, Answer>

type Phase = 'intro' | number | 'review'

const LETTERS = 'ABCDEFGHIJ'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* ------------------------------------------------------------------ */
/* Root                                                                */
/* ------------------------------------------------------------------ */

export function Questionnaire() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [answers, setAnswers] = useState<Answers>({})
  const [dir, setDir] = useState<'up' | 'down'>('up')
  const [submitted, setSubmitted] = useState(false)

  const total = questions.length
  const activeIndex = typeof phase === 'number' ? phase : null

  const progress = useMemo(() => {
    if (phase === 'intro') return 0
    if (phase === 'review') return 100
    return Math.round(((phase + 0.5) / total) * 100)
  }, [phase, total])

  const go = useCallback(
    (next: Phase, direction: 'up' | 'down' = 'up') => {
      setDir(direction)
      setPhase(next)
    },
    []
  )

  const setAnswer = useCallback((id: string, value: Answer) => {
    setAnswers((a) => ({ ...a, [id]: value }))
  }, [])

  const isValid = useCallback(
    (q: Question): boolean => {
      const v = answers[q.id]
      if (!q.required) return true
      if (q.kind === 'multi') return Array.isArray(v) && v.length > 0
      if (q.kind === 'email') return typeof v === 'string' && EMAIL_RE.test(v)
      if (q.kind === 'short' || q.kind === 'long')
        return typeof v === 'string' && v.trim().length > 0
      if (q.kind === 'scale') return typeof v === 'number'
      return v !== undefined && v !== ''
    },
    [answers]
  )

  // Advance without re-validating — used after a fresh, inherently-valid
  // selection (single/scale). Kept free of `answers` so it never captures a
  // stale validity snapshot inside an auto-advance timeout.
  const goNext = useCallback(() => {
    if (activeIndex === null) return
    if (activeIndex + 1 < total) go(activeIndex + 1, 'up')
    else go('review', 'up')
  }, [activeIndex, go, total])

  const next = useCallback(() => {
    if (activeIndex === null) return
    if (!isValid(questions[activeIndex])) return
    goNext()
  }, [activeIndex, goNext, isValid])

  const back = useCallback(() => {
    if (phase === 'review') return go(total - 1, 'down')
    if (activeIndex === null) return
    if (activeIndex === 0) return go('intro', 'down')
    go(activeIndex - 1, 'down')
  }, [activeIndex, go, phase, total])

  const submit = useCallback(() => {
    // Swap this for a real POST when the endpoint is ready.
    // eslint-disable-next-line no-console
    console.log('Questionnaire submission →', answers)
    setSubmitted(true)
  }, [answers])

  return (
    <div className="tp-root">
      <div className="tp-dots" />
      <div className="tp-progress">
        <div className="tp-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <TopBar
        showCount={typeof phase === 'number'}
        current={typeof phase === 'number' ? phase + 1 : 0}
        total={total}
      />

      <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col justify-center px-5 py-24 sm:px-8">
        {phase === 'intro' && <Intro onStart={() => go(0, 'up')} />}

        {typeof phase === 'number' && (
          <QuestionScreen
            key={phase}
            dir={dir}
            index={phase}
            total={total}
            question={questions[phase]}
            value={answers[questions[phase].id]}
            onChange={(v) => setAnswer(questions[phase].id, v)}
            onNext={next}
            onBack={back}
            valid={isValid(questions[phase])}
            autoAdvance={() => {
              // small delay so the selection is visible before moving on
              window.setTimeout(() => goNext(), 260)
            }}
          />
        )}

        {phase === 'review' && (
          <Outro
            dir={dir}
            submitted={submitted}
            onSubmit={submit}
            onBack={back}
          />
        )}
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Chrome                                                              */
/* ------------------------------------------------------------------ */

function TopBar({
  showCount,
  current,
  total,
}: {
  showCount: boolean
  current: number
  total: number
}) {
  return (
    <div className="fixed inset-x-0 top-0 z-30 mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-5 sm:px-8">
      <span className="tp-brand">
        <span className="tp-brand-dot">TP</span>
        TruePoint<span className="tp-brand-sub">&nbsp;Systems</span>
      </span>
      {showCount && (
        <span
          className="tp-index"
          style={{ color: 'var(--tp-muted)' }}
          aria-live="polite"
        >
          {current} <span style={{ opacity: 0.5 }}>/ {total}</span>
        </span>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Intro                                                               */
/* ------------------------------------------------------------------ */

const TRUST_ICONS = [BadgeCheck, ShieldCheck, Clock, Cpu]

function Intro({ onStart }: { onStart: () => void }) {
  useEnterKey(onStart)
  return (
    <div className="tp-anim-up relative">
      <div
        className="tp-orb"
        style={{
          top: '-8rem',
          right: '-6rem',
          height: '22rem',
          width: '22rem',
          background: 'rgba(48, 110, 60, 0.5)',
        }}
      />
      <div
        className="tp-orb"
        style={{
          bottom: '-10rem',
          left: '-8rem',
          height: '18rem',
          width: '18rem',
          background: 'rgba(212, 175, 87, 0.22)',
          animationDelay: '1.4s',
        }}
      />
      <div className="tp-stagger relative flex flex-col items-start gap-6">
        <span className="tp-pill">
          <ShieldCheck className="h-3.5 w-3.5" />
          {intro.eyebrow}
        </span>
        <h1 className="tp-display">
          <span className="text-[var(--tp-ink)]">{intro.titleLead} </span>
          <span className="tp-gradient">{intro.titleGold}</span>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-[var(--tp-ink-soft)]">
          {intro.subtitle}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-4">
          <button className="tp-btn tp-btn-primary" onClick={onStart}>
            {intro.cta}
            <ArrowRight className="h-4 w-4" />
          </button>
          <span className="tp-hint">
            Press <span className="tp-kbd">Enter ↵</span> {intro.meta}
          </span>
        </div>
        <div className="tp-trust mt-4 border-t border-[var(--tp-line)] pt-6">
          {intro.trust.map((t, i) => {
            const Icon = TRUST_ICONS[i % TRUST_ICONS.length]
            return (
              <span key={t} className="tp-trust-item">
                <Icon className="h-4 w-4" strokeWidth={2} />
                {t}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Question screen                                                     */
/* ------------------------------------------------------------------ */

function QuestionScreen({
  dir,
  index,
  total,
  question,
  value,
  onChange,
  onNext,
  onBack,
  valid,
  autoAdvance,
}: {
  dir: 'up' | 'down'
  index: number
  total: number
  question: Question
  value: Answer | undefined
  onChange: (v: Answer) => void
  onNext: () => void
  onBack: () => void
  valid: boolean
  autoAdvance: () => void
}) {
  const anim = dir === 'up' ? 'tp-anim-up' : 'tp-anim-down'
  const isLast = index + 1 === total

  return (
    <div className={`${anim} flex flex-col gap-7`}>
      <header className="flex flex-col gap-3">
        {question.section && (
          <span className="tp-eyebrow">{question.section}</span>
        )}
        <span className="tp-index">
          <ArrowRight />
          Question {index + 1}
        </span>
        <h2 className="tp-question text-[var(--tp-ink)]">{question.title}</h2>
        {question.help && (
          <p className="text-[15px] leading-relaxed text-[var(--tp-muted)]">
            {question.help}
          </p>
        )}
      </header>

      <Field
        question={question}
        value={value}
        onChange={onChange}
        onNext={onNext}
        autoAdvance={autoAdvance}
      />

      <footer className="mt-2 flex items-center gap-3">
        <button className="tp-btn tp-btn-primary" onClick={onNext} disabled={!valid}>
          {isLast ? 'Review' : 'OK'}
          <CornerDownLeft className="h-4 w-4" />
        </button>
        <button className="tp-btn tp-btn-ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        {question.kind !== 'long' && (
          <span className="tp-hint ml-auto hidden sm:inline-flex">
            press <span className="tp-kbd">Enter ↵</span>
          </span>
        )}
      </footer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Field renderers                                                     */
/* ------------------------------------------------------------------ */

function Field({
  question,
  value,
  onChange,
  onNext,
  autoAdvance,
}: {
  question: Question
  value: Answer | undefined
  onChange: (v: Answer) => void
  onNext: () => void
  autoAdvance: () => void
}) {
  switch (question.kind) {
    case 'single':
      return (
        <SingleField
          question={question}
          value={value as string | undefined}
          onChange={onChange}
          autoAdvance={autoAdvance}
        />
      )
    case 'multi':
      return (
        <MultiField
          question={question}
          value={(value as string[]) ?? []}
          onChange={onChange}
          onNext={onNext}
        />
      )
    case 'scale':
      return (
        <ScaleField
          question={question}
          value={value as number | undefined}
          onChange={onChange}
          autoAdvance={autoAdvance}
        />
      )
    default:
      return (
        <TextField
          question={question}
          value={(value as string) ?? ''}
          onChange={onChange}
          onNext={onNext}
        />
      )
  }
}

function SingleField({
  question,
  value,
  onChange,
  autoAdvance,
}: {
  question: Extract<Question, { kind: 'single' }>
  value: string | undefined
  onChange: (v: string) => void
  autoAdvance: () => void
}) {
  // number/letter key selection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase()
      const i = LETTERS.indexOf(k)
      if (i >= 0 && i < question.options.length) {
        e.preventDefault()
        onChange(question.options[i].value)
        autoAdvance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [question.options, onChange, autoAdvance])

  return (
    <div className="tp-stagger flex flex-col gap-3">
      {question.options.map((opt, i) => (
        <button
          key={opt.value}
          className="tp-option"
          data-selected={value === opt.value}
          onClick={() => {
            onChange(opt.value)
            autoAdvance()
          }}
        >
          <span className="tp-key">{LETTERS[i]}</span>
          <span>
            <span className="tp-option-label">{opt.label}</span>
            {opt.description && (
              <span className="tp-option-desc block">{opt.description}</span>
            )}
          </span>
          <Check className="tp-check h-5 w-5" strokeWidth={2.5} />
        </button>
      ))}
    </div>
  )
}

function MultiField({
  question,
  value,
  onChange,
  onNext,
}: {
  question: Extract<Question, { kind: 'multi' }>
  value: string[]
  onChange: (v: string[]) => void
  onNext: () => void
}) {
  const toggle = useCallback(
    (val: string) => {
      const set = new Set(value)
      if (set.has(val)) set.delete(val)
      else set.add(val)
      onChange(Array.from(set))
    },
    [value, onChange]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') return // handled globally by onNext
      const k = e.key.toUpperCase()
      const i = LETTERS.indexOf(k)
      if (i >= 0 && i < question.options.length) {
        e.preventDefault()
        toggle(question.options[i].value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [question.options, toggle])

  useEnterKey(onNext)

  return (
    <div className="tp-stagger flex flex-col gap-3">
      {question.options.map((opt, i) => (
        <button
          key={opt.value}
          className="tp-option"
          data-selected={value.includes(opt.value)}
          onClick={() => toggle(opt.value)}
        >
          <span className="tp-key">{LETTERS[i]}</span>
          <span>
            <span className="tp-option-label">{opt.label}</span>
            {opt.description && (
              <span className="tp-option-desc block">{opt.description}</span>
            )}
          </span>
          <Check className="tp-check h-5 w-5" strokeWidth={2.5} />
        </button>
      ))}
    </div>
  )
}

function ScaleField({
  question,
  value,
  onChange,
  autoAdvance,
}: {
  question: Extract<Question, { kind: 'scale' }>
  value: number | undefined
  onChange: (v: number) => void
  autoAdvance: () => void
}) {
  const steps = useMemo(() => {
    const out: number[] = []
    for (let n = question.min; n <= question.max; n++) out.push(n)
    return out
  }, [question.min, question.max])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (!Number.isNaN(n) && n >= question.min && n <= question.max) {
        e.preventDefault()
        onChange(n)
        autoAdvance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [question.min, question.max, onChange, autoAdvance])

  return (
    <div className="tp-anim-up">
      <div className="tp-scale">
        {steps.map((n) => (
          <button
            key={n}
            className="tp-scale-btn"
            data-selected={value === n}
            onClick={() => {
              onChange(n)
              autoAdvance()
            }}
          >
            {n}
          </button>
        ))}
      </div>
      {(question.minLabel || question.maxLabel) && (
        <div className="tp-scale-labels">
          <span>{question.minLabel}</span>
          <span>{question.maxLabel}</span>
        </div>
      )}
    </div>
  )
}

function TextField({
  question,
  value,
  onChange,
  onNext,
}: {
  question: Extract<Question, { kind: 'short' | 'long' | 'email' }>
  value: string
  onChange: (v: string) => void
  onNext: () => void
}) {
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  useEffect(() => {
    const t = window.setTimeout(() => ref.current?.focus(), 350)
    return () => window.clearTimeout(t)
  }, [])

  if (question.kind === 'long') {
    return (
      <textarea
        ref={ref as React.RefObject<HTMLTextAreaElement>}
        className="tp-textarea tp-anim-up"
        rows={4}
        placeholder={question.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            onNext()
          }
        }}
      />
    )
  }

  return (
    <input
      ref={ref as React.RefObject<HTMLInputElement>}
      className="tp-input tp-anim-up"
      type={question.kind === 'email' ? 'email' : 'text'}
      inputMode={question.kind === 'email' ? 'email' : 'text'}
      placeholder={question.placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onNext()
        }
      }}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Outro / review                                                      */
/* ------------------------------------------------------------------ */

function Outro({
  dir,
  submitted,
  onSubmit,
  onBack,
}: {
  dir: 'up' | 'down'
  submitted: boolean
  onSubmit: () => void
  onBack: () => void
}) {
  useEnterKey(submitted ? () => {} : onSubmit)
  const anim = dir === 'up' ? 'tp-anim-up' : 'tp-anim-down'

  if (submitted) {
    return (
      <div className={`${anim} relative flex flex-col items-start gap-6`}>
        <div
          className="tp-orb"
          style={{
            top: '-6rem',
            right: '-4rem',
            height: '18rem',
            width: '18rem',
            background: 'rgba(48, 110, 60, 0.45)',
          }}
        />
        <span className="tp-pop grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[var(--tp-green-bright)] to-[var(--tp-green)] text-white shadow-[0_18px_40px_-16px_rgba(48,110,60,0.9)]">
          <Check className="h-8 w-8" strokeWidth={3} />
        </span>
        <h2 className="tp-display tp-gradient">{outro.doneTitle}</h2>
        <p className="max-w-lg text-lg leading-relaxed text-[var(--tp-ink-soft)]">
          {outro.doneSubtitle}
        </p>
      </div>
    )
  }

  return (
    <div className={`${anim} relative flex flex-col items-start gap-6`}>
      <div
        className="tp-orb"
        style={{
          top: '-8rem',
          left: '-6rem',
          height: '18rem',
          width: '18rem',
          background: 'rgba(212, 175, 87, 0.2)',
        }}
      />
      <span className="tp-eyebrow">{outro.eyebrow}</span>
      <h2 className="tp-display tp-gradient">{outro.title}</h2>
      <p className="max-w-lg text-lg leading-relaxed text-[var(--tp-ink-soft)]">
        {outro.subtitle}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <button className="tp-btn tp-btn-primary" onClick={onSubmit}>
          {outro.cta}
          <Send className="h-4 w-4" />
        </button>
        <button className="tp-btn tp-btn-ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

function useEnterKey(handler: () => void) {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const tag = el?.tagName
      // let text inputs manage their own Enter
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'Enter') {
        e.preventDefault()
        ref.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
