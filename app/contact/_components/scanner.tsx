'use client'

import { useCallback, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronRight,
  RotateCcw,
  Search,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react'
import { ordinal, probeTone } from '../_lib/format'
import { EXAMPLE_SCANS } from '../_lib/seed'
import { newId, useStore } from '../_lib/store'
import {
  INTENT_LABEL,
  SENTIMENT_LABEL,
  scoreBand,
  scoreScan,
  shareOfVoice,
  type Plan,
  type Probe,
  type Scan,
  type ScanInput,
} from '../_lib/types'
import { Reveal, ScoreDial, Spinner, VoiceBar } from './primitives'

interface ApiError {
  code?: string
  error: string
  detail?: string
}

/** How many buyer questions a scan runs. Enough signal, bounded cost. */
const PROMPT_COUNT = 6
/** Probes run concurrently, but not all at once — the API has limits too. */
const CONCURRENCY = 3

export function Scanner({ onOpenProbe }: { onOpenProbe: (probe: Probe, brand: string) => void }) {
  const { saveScan } = useStore()

  const [input, setInput] = useState<ScanInput>({
    brand: '',
    domain: '',
    category: '',
    competitors: [],
    market: 'United States',
  })
  const [competitorText, setCompetitorText] = useState('')
  const [scan, setScan] = useState<Scan | null>(null)
  const [phase, setPhase] = useState<'idle' | 'prompts' | 'probing' | 'plan' | 'done'>('idle')
  const [error, setError] = useState<ApiError | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  const running = phase === 'prompts' || phase === 'probing' || phase === 'plan'

  const applyExample = (example: (typeof EXAMPLE_SCANS)[number]) => {
    setInput({
      brand: example.brand,
      domain: example.domain,
      category: example.category,
      competitors: example.competitors,
      market: example.market,
    })
    setCompetitorText(example.competitors.join(', '))
    setFieldError(null)
  }

  const run = useCallback(async () => {
    const brand = input.brand.trim()
    const category = input.category.trim()
    if (brand.length < 2) {
      setFieldError('Which brand are we measuring?')
      return
    }
    if (category.length < 8) {
      setFieldError('Describe what they sell — the scan is only as good as this.')
      return
    }

    setFieldError(null)
    setError(null)
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const signal = controller.signal

    const competitors = competitorText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8)

    const scanInput: ScanInput = { ...input, brand, category, competitors }
    setInput(scanInput)

    // ---- 1. What would a buyer actually ask? --------------------------
    setPhase('prompts')
    setScan(null)

    let prompts: { prompt: string; intent: Probe['intent']; why: string }[]
    try {
      const response = await fetch('/api/contact/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          brand,
          category,
          market: scanInput.market,
          competitors,
          count: PROMPT_COUNT,
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        setError(payload as ApiError)
        setPhase('idle')
        return
      }
      prompts = payload.prompts
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError({ error: 'Could not reach the scanner.', detail: (err as Error).message })
      setPhase('idle')
      return
    }

    const initial: Scan = {
      id: newId('s'),
      createdAt: Date.now(),
      input: scanInput,
      probes: prompts.map((item) => ({
        id: newId('p'),
        prompt: item.prompt,
        intent: item.intent,
        why: item.why,
        status: 'pending' as const,
      })),
    }
    setScan(initial)
    setPhase('probing')
    reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

    // ---- 2. Ask each question for real, then read the answer ----------
    const probes = [...initial.probes]
    let cursor = 0

    const worker = async () => {
      for (;;) {
        const index = cursor++
        if (index >= probes.length || signal.aborted) return

        probes[index] = { ...probes[index], status: 'running' }
        setScan((prev) => (prev ? { ...prev, probes: [...probes] } : prev))

        try {
          const response = await fetch('/api/contact/probe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal,
            body: JSON.stringify({
              prompt: probes[index].prompt,
              brand,
              domain: scanInput.domain,
              market: scanInput.market,
            }),
          })
          const payload = await response.json()
          probes[index] = response.ok
            ? { ...probes[index], status: 'done', ...payload }
            : { ...probes[index], status: 'error', error: (payload as ApiError).error }
        } catch (err) {
          if ((err as Error).name === 'AbortError') return
          probes[index] = {
            ...probes[index],
            status: 'error',
            error: (err as Error).message,
          }
        }
        setScan((prev) => (prev ? { ...prev, probes: [...probes] } : prev))
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, worker))
    if (signal.aborted) return

    const answered = probes.filter((probe) => probe.status === 'done')
    if (answered.length === 0) {
      setError({
        error: 'Every question failed.',
        detail: 'Nothing came back from the model. Try again in a moment.',
      })
      setPhase('idle')
      return
    }

    // ---- 3. What to do about it ---------------------------------------
    setPhase('plan')
    const score = scoreScan(probes)
    let plan: Plan | undefined
    try {
      const response = await fetch('/api/contact/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          brand,
          category,
          score,
          results: answered.map((probe) => ({
            prompt: probe.prompt,
            intent: probe.intent,
            mentioned: !!probe.mentioned,
            position: probe.position ?? null,
            sentiment: probe.sentiment ?? 'absent',
            brandsNamed: probe.brandsNamed ?? [],
            note: probe.note ?? '',
          })),
        }),
      })
      if (response.ok) plan = await response.json()
    } catch {
      // A missing plan is survivable — the measurement still stands.
    }

    if (signal.aborted) return
    const finished: Scan = { ...initial, probes, plan }
    setScan(finished)
    saveScan(finished)
    setPhase('done')
  }, [competitorText, input, saveScan])

  const stop = () => {
    abortRef.current?.abort()
    setPhase(scan ? 'done' : 'idle')
  }

  return (
    <div className="ctc-stack ctc-g6">
      {/* -------------------------------------------------------- Form */}
      <section className="ctc-scanform" aria-labelledby="scan-title">
        <div className="ctc-scanform-inner">
          <div className="ctc-stack ctc-g2" style={{ marginBottom: 'var(--s-5)' }}>
            <span className="ctc-eyebrow ctc-eyebrow-ember">LLM visibility scan</span>
            <h1 id="scan-title" className="ctc-h2" style={{ fontSize: 'var(--t-2xl)' }}>
              See how your brand ranks inside the answer.
            </h1>
            <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)', maxWidth: '58ch' }}>
              We write the questions your buyers actually ask, put them to the model cold, and
              measure who it recommends. No guessing — the answers below are generated live.
            </p>
          </div>

          <div className="ctc-scan-grid">
            <div className="ctc-field">
              <label className="ctc-label" htmlFor="scan-brand">
                Brand
              </label>
              <input
                id="scan-brand"
                className="ctc-input"
                placeholder="Botany Farms"
                value={input.brand}
                disabled={running}
                aria-invalid={fieldError && input.brand.trim().length < 2 ? 'true' : undefined}
                onChange={(event) => setInput({ ...input, brand: event.target.value })}
              />
            </div>
            <div className="ctc-field">
              <label className="ctc-label" htmlFor="scan-domain">
                Website <span className="ctc-faint">(optional)</span>
              </label>
              <input
                id="scan-domain"
                className="ctc-input"
                placeholder="botanyfarms.com"
                value={input.domain}
                disabled={running}
                onChange={(event) => setInput({ ...input, domain: event.target.value })}
              />
            </div>
          </div>

          <div className="ctc-field" style={{ marginTop: 'var(--s-4)' }}>
            <label className="ctc-label" htmlFor="scan-category">
              What do they sell?
            </label>
            <textarea
              id="scan-category"
              className="ctc-textarea"
              rows={2}
              maxLength={200}
              placeholder="hemp-derived CBD gummies and pre-rolls sold direct to consumer"
              value={input.category}
              disabled={running}
              onChange={(event) => setInput({ ...input, category: event.target.value })}
            />
            <span className="ctc-hint">
              Be specific. This is what the buyer questions get built from.
            </span>
          </div>

          <div className="ctc-scan-grid" style={{ marginTop: 'var(--s-4)' }}>
            <div className="ctc-field">
              <label className="ctc-label" htmlFor="scan-competitors">
                Competitors <span className="ctc-faint">(optional)</span>
              </label>
              <input
                id="scan-competitors"
                className="ctc-input"
                placeholder="Delta Munchies, FOCL"
                value={competitorText}
                disabled={running}
                onChange={(event) => setCompetitorText(event.target.value)}
              />
            </div>
            <div className="ctc-field">
              <label className="ctc-label" htmlFor="scan-market">
                Market
              </label>
              <input
                id="scan-market"
                className="ctc-input"
                placeholder="United States"
                value={input.market}
                disabled={running}
                onChange={(event) => setInput({ ...input, market: event.target.value })}
              />
            </div>
          </div>

          <div className="ctc-row ctc-g2 ctc-wrapflex" style={{ marginTop: 'var(--s-4)' }}>
            <span className="ctc-label" style={{ alignSelf: 'center' }}>
              Try one
            </span>
            {EXAMPLE_SCANS.map((example) => (
              <button
                key={example.label}
                type="button"
                className="ctc-suggestion"
                disabled={running}
                onClick={() => applyExample(example)}
              >
                {example.label}
              </button>
            ))}
          </div>

          {fieldError ? (
            <span className="ctc-error-text" role="alert" style={{ marginTop: 'var(--s-3)' }}>
              <TriangleAlert size={12} aria-hidden="true" />
              {fieldError}
            </span>
          ) : null}

          <div
            className="ctc-between ctc-wrapflex ctc-g3"
            style={{ marginTop: 'var(--s-5)' }}
          >
            <span className="ctc-faint" style={{ fontSize: 'var(--t-xs)' }}>
              {PROMPT_COUNT} buyer questions · answered live · about a minute
            </span>
            <div className="ctc-row ctc-g2">
              {running ? (
                <button type="button" className="ctc-btn ctc-btn-quiet" onClick={stop}>
                  <X size={14} aria-hidden="true" /> Stop
                </button>
              ) : null}
              <button
                type="button"
                className="ctc-btn ctc-btn-ember ctc-btn-lg"
                onClick={run}
                disabled={running}
              >
                {running ? (
                  <>
                    <Spinner /> {phase === 'prompts' ? 'Writing the questions' : phase === 'plan' ? 'Building the plan' : 'Asking the model'}
                  </>
                ) : (
                  <>
                    <Search size={16} aria-hidden="true" /> {scan ? 'Run it again' : 'Run the scan'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div ref={reportRef} />

      {/* ------------------------------------------------------ States */}
      {error ? <ScanError error={error} onRetry={run} /> : null}

      {!error && !scan && phase === 'idle' ? <ScannerEmpty /> : null}

      {phase === 'prompts' ? <PromptsSkeleton /> : null}

      {scan ? (
        <Report scan={scan} phase={phase} onOpenProbe={(probe) => onOpenProbe(probe, scan.input.brand)} />
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------- Report */

function Report({
  scan,
  phase,
  onOpenProbe,
}: {
  scan: Scan
  phase: string
  onOpenProbe: (probe: Probe) => void
}) {
  const done = scan.probes.filter((probe) => probe.status === 'done')
  const score = scoreScan(scan.probes)
  const band = scoreBand(score)
  const mentions = done.filter((probe) => probe.mentioned).length
  const voices = shareOfVoice(done, scan.input.brand)
  const maxVoice = voices[0]?.count ?? 1
  const bestPosition = done
    .filter((probe) => probe.mentioned && probe.position)
    .map((probe) => probe.position as number)
    .sort((a, b) => a - b)[0]
  const complete = done.length === scan.probes.length

  return (
    <section className="ctc-stack ctc-g5" aria-label="Visibility report">
      {/* Headline numbers */}
      <div className="ctc-report-head">
        <div className="ctc-report-dial">
          <ScoreDial value={score} tone={band.tone} label={band.label} animate={complete} />
        </div>

        <div className="ctc-stack ctc-g4 ctc-grow">
          <div className="ctc-between ctc-wrapflex ctc-g3">
            <div className="ctc-stack" style={{ gap: 2 }}>
              <span className="ctc-eyebrow">Visibility score · {scan.input.brand}</span>
              <h2 className="ctc-h3">
                {complete ? band.label : 'Scanning'} in{' '}
                <span className="ctc-serif-italic">{scan.input.market || 'the model'}</span>
              </h2>
            </div>
            {scan.model || phase === 'done' ? (
              <span className="ctc-chip ctc-chip-mono">
                {done[0] && 'model' in done[0] ? String((done[0] as never)['model']) : 'claude'}
              </span>
            ) : null}
          </div>

          <div className="ctc-metrics">
            <Metric
              value={`${mentions}/${scan.probes.length}`}
              label="Answers naming you"
              tone={mentions === 0 ? 'miss' : mentions >= scan.probes.length / 2 ? 'win' : 'warn'}
            />
            <Metric
              value={bestPosition ? ordinal(bestPosition) : '—'}
              label="Best placement"
              tone={bestPosition && bestPosition <= 2 ? 'win' : bestPosition ? 'warn' : 'miss'}
            />
            <Metric
              value={String(voices.filter((voice) => !voice.isBrand).length)}
              label="Rival brands named"
              tone="neutral"
            />
          </div>
        </div>
      </div>

      {/* Verdict + plan */}
      {scan.plan ? (
        <div className="ctc-verdict ctc-pop">
          <span className="ctc-eyebrow ctc-eyebrow-ember">The verdict</span>
          <p className="ctc-verdict-text">{scan.plan.verdict}</p>
          <ul className="ctc-actions">
            {scan.plan.actions.map((action, index) => (
              <li key={action.title} className="ctc-action">
                <span className="ctc-num ctc-action-rank">{String(index + 1).padStart(2, '0')}</span>
                <div className="ctc-stack ctc-g1 ctc-grow">
                  <span className="ctc-action-title">{action.title}</span>
                  <span className="ctc-muted" style={{ fontSize: 'var(--t-sm)' }}>
                    {action.why}
                  </span>
                </div>
                <div className="ctc-row ctc-g1 ctc-action-meta">
                  <span className={`ctc-chip ${action.impact === 'high' ? 'ctc-chip-win' : ''}`}>
                    {action.impact} impact
                  </span>
                  <span className="ctc-chip">{action.effort} effort</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : phase === 'plan' ? (
        <div className="ctc-verdict">
          <span className="ctc-eyebrow ctc-eyebrow-ember">The verdict</span>
          <div className="ctc-stack ctc-g2" style={{ marginTop: 'var(--s-3)' }}>
            <span className="ctc-skeleton" style={{ height: 18, width: '88%' }} />
            <span className="ctc-skeleton" style={{ height: 18, width: '64%' }} />
            <span className="ctc-skeleton" style={{ height: 54, width: '100%', marginTop: 8 }} />
          </div>
        </div>
      ) : null}

      {/* Share of voice */}
      {voices.length > 0 ? (
        <div className="ctc-card ctc-panel">
          <div className="ctc-between" style={{ marginBottom: 'var(--s-4)' }}>
            <span className="ctc-eyebrow">Who the model recommends</span>
            <span className="ctc-faint" style={{ fontSize: 'var(--t-2xs)' }}>
              mentions across {done.length} answers
            </span>
          </div>
          <div className="ctc-stack ctc-g2">
            {voices.map((voice) => (
              <VoiceBar key={voice.name} {...voice} max={maxVoice} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Per-question results */}
      <div className="ctc-stack ctc-g3">
        <div className="ctc-between ctc-wrapflex ctc-g2">
          <span className="ctc-eyebrow">The questions we asked</span>
          <span className="ctc-faint" style={{ fontSize: 'var(--t-2xs)' }}>
            open one to read the model&rsquo;s full answer
          </span>
        </div>
        <ul className="ctc-stack ctc-g3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {scan.probes.map((probe, index) => (
            <ProbeRow key={probe.id} probe={probe} index={index} onOpen={() => onOpenProbe(probe)} />
          ))}
        </ul>
      </div>

      <p className="ctc-faint" style={{ fontSize: 'var(--t-2xs)', textAlign: 'center', maxWidth: '62ch', margin: '0 auto' }}>
        Every answer here was generated live by Claude and read back by a second, separate call.
        Model answers vary between runs — treat a scan as a sample of how the model behaves, not a
        fixed ranking.
      </p>
    </section>
  )
}

function Metric({
  value,
  label,
  tone,
}: {
  value: string
  label: string
  tone: 'win' | 'warn' | 'miss' | 'neutral'
}) {
  const color = tone === 'neutral' ? 'var(--text)' : `var(--${tone})`
  return (
    <div className="ctc-metric">
      <span className="ctc-stat" style={{ fontSize: 'var(--t-xl)', color }}>
        {value}
      </span>
      <span className="ctc-eyebrow">{label}</span>
    </div>
  )
}

function ProbeRow({
  probe,
  index,
  onOpen,
}: {
  probe: Probe
  index: number
  onOpen: () => void
}) {
  if (probe.status === 'pending' || probe.status === 'running') {
    return (
      <li className="ctc-probe ctc-probe-waiting" aria-busy="true">
        <span className="ctc-probe-state">
          {probe.status === 'running' ? <Spinner size={13} /> : <span className="ctc-probe-queue" />}
        </span>
        <div className="ctc-stack ctc-g2 ctc-grow">
          <span className="ctc-probe-prompt ctc-truncate">{probe.prompt}</span>
          <span className="ctc-skeleton" style={{ height: 10, width: index % 2 ? '52%' : '68%' }} />
        </div>
        <span className="ctc-faint ctc-probe-status">
          {probe.status === 'running' ? 'asking' : 'queued'}
        </span>
      </li>
    )
  }

  if (probe.status === 'error') {
    return (
      <li className="ctc-probe ctc-probe-error">
        <span className="ctc-probe-state" style={{ color: 'var(--miss)' }}>
          <TriangleAlert size={14} aria-hidden="true" />
        </span>
        <div className="ctc-stack ctc-g1 ctc-grow">
          <span className="ctc-probe-prompt">{probe.prompt}</span>
          <span className="ctc-faint" style={{ fontSize: 'var(--t-xs)' }}>
            {probe.error ?? 'This question failed.'}
          </span>
        </div>
      </li>
    )
  }

  const tone = probeTone(probe)
  return (
    <li>
      <button type="button" className={`ctc-probe ctc-probe-${tone}`} onClick={onOpen}>
        <span className="ctc-probe-state">
          {probe.mentioned ? (
            <Check size={14} aria-hidden="true" style={{ color: `var(--${tone})` }} />
          ) : (
            <X size={14} aria-hidden="true" style={{ color: 'var(--miss)' }} />
          )}
        </span>

        <div className="ctc-stack ctc-g2 ctc-grow">
          <span className="ctc-probe-prompt">{probe.prompt}</span>
          <div className="ctc-row ctc-g2 ctc-wrapflex">
            <span className="ctc-chip ctc-chip-mono">{INTENT_LABEL[probe.intent]}</span>
            <span
              className={`ctc-chip ${probe.mentioned ? (tone === 'win' ? 'ctc-chip-win' : 'ctc-chip-warn') : 'ctc-chip-miss'}`}
            >
              <span className="ctc-dot" />
              {probe.mentioned
                ? `${SENTIMENT_LABEL[probe.sentiment ?? 'neutral']}${probe.position ? ` · ${ordinal(probe.position)}` : ''}`
                : 'Not mentioned'}
            </span>
            {(probe.brandsNamed?.length ?? 0) > 0 ? (
              <span className="ctc-faint ctc-truncate" style={{ fontSize: 'var(--t-xs)', maxWidth: '32ch' }}>
                named: {probe.brandsNamed?.slice(0, 3).join(', ')}
              </span>
            ) : null}
          </div>
          {probe.note ? (
            <span className="ctc-muted" style={{ fontSize: 'var(--t-sm)' }}>
              {probe.note}
            </span>
          ) : null}
        </div>

        <ChevronRight size={16} aria-hidden="true" className="ctc-probe-chevron" />
      </button>
    </li>
  )
}

/* ------------------------------------------------------------- States */

function PromptsSkeleton() {
  return (
    <section className="ctc-stack ctc-g3" aria-busy="true" aria-label="Writing the buyer questions">
      <span className="ctc-eyebrow">Writing the questions your buyers ask</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="ctc-probe ctc-probe-waiting" style={{ opacity: 1 - i * 0.18 }}>
          <span className="ctc-probe-state">
            <span className="ctc-probe-queue" />
          </span>
          <div className="ctc-stack ctc-g2 ctc-grow">
            <span className="ctc-skeleton" style={{ height: 14, width: `${72 - i * 9}%` }} />
            <span className="ctc-skeleton" style={{ height: 10, width: '34%' }} />
          </div>
        </div>
      ))}
    </section>
  )
}

function ScanError({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  const isConfig = error.code === 'no_key' || error.code === 'auth'
  return (
    <section className="ctc-card ctc-pop" style={{ padding: 'var(--s-5)', borderColor: 'var(--miss)' }} role="alert">
      <div className="ctc-row ctc-g3" style={{ alignItems: 'flex-start' }}>
        <span className="ctc-error-mark">
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
              Saved scans and the rest of the workspace keep working without a model connected.
            </p>
          ) : null}
          <div className="ctc-row ctc-g2" style={{ marginTop: 'var(--s-2)' }}>
            <button type="button" className="ctc-btn ctc-btn-quiet ctc-btn-sm" onClick={onRetry}>
              <RotateCcw size={13} aria-hidden="true" /> Run it again
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function ScannerEmpty() {
  return (
    <Reveal>
      <section className="ctc-card ctc-empty">
        <div className="ctc-empty-mark" aria-hidden="true">
          <svg width="150" height="82" viewBox="0 0 150 82" fill="none">
            {[0, 1, 2, 3, 4].map((i) => (
              <rect
                key={i}
                x={10 + i * 28}
                y={70 - [18, 40, 60, 28, 12][i]}
                width="17"
                height={[18, 40, 60, 28, 12][i]}
                rx="3"
                fill={i === 2 ? 'var(--ember)' : 'var(--surface-hi)'}
              />
            ))}
            <line x1="4" y1="70.5" x2="146" y2="70.5" stroke="var(--line-strong)" />
          </svg>
        </div>
        <h2 className="ctc-h3">Nothing scanned yet.</h2>
        <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)', maxWidth: '48ch', margin: '0 auto' }}>
          Name a brand and what it sells. We will write the questions its buyers ask, put them to
          the model, and show you exactly who gets recommended instead.
        </p>
        <span
          className="ctc-row ctc-g2 ctc-faint"
          style={{ fontSize: 'var(--t-xs)', justifyContent: 'center', marginTop: 'var(--s-3)' }}
        >
          Start above <ArrowRight size={13} aria-hidden="true" />
        </span>
      </section>
    </Reveal>
  )
}

export { Sparkles }
