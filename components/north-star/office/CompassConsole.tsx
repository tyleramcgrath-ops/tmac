'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import type { PreviewScenario } from '@/lib/north-star-preview-data'

/**
 * Compass IS the emblem burning on the desk — a presence, not a panel. This
 * component is only its words: counsel engraved in light at the desk's foot.
 * No scrim, no chrome — the desk face is dark stone; words are light.
 *
 * Visual/interaction treatment ported verbatim from the confirmed North Star
 * Executive Office baseline (north-star-station @ 546fb87, CompassConsole.tsx):
 * the same "counsel" rotation → "ask" → "thinking" → "answer" state machine,
 * the same engraved-light desk foot, the same long-answer overlay. The
 * content source is adapted from that baseline's real `Business`/backend
 * counsel engine to this preview's `PreviewScenario` (no fabricated data —
 * every line below is read directly from the scenario already driving the
 * rest of the office). Voice narration and the "convene the team" board
 * mode from the baseline are out of scope for this restoration and are not
 * ported.
 */

type Counsel = { headline: string; sub: string }
type Mode = 'counsel' | 'ask' | 'thinking' | 'answer'

function insightsFor(scenario: PreviewScenario): Counsel[] {
  const understood = scenario.digitalDna.filter((a) => a.understanding === 'well-understood').length
  const insights: Counsel[] = []
  insights.push(
    scenario.opportunity
      ? { headline: scenario.opportunity.headline, sub: scenario.opportunity.businessReason }
      : { headline: `${scenario.business.name} is holding steady`, sub: 'Nothing requires your attention. I am keeping watch.' }
  )
  insights.push(
    scenario.pendingApproval
      ? { headline: scenario.pendingApproval.title, sub: scenario.pendingApproval.whyRecommended }
      : { headline: 'Nothing is waiting on your approval', sub: "I'll bring anything I prepare straight to this desk." }
  )
  insights.push({
    headline: `${understood} of ${scenario.digitalDna.length} areas of your Digital DNA are well understood`,
    sub: `Built from ${scenario.pagesChecked} page${scenario.pagesChecked === 1 ? '' : 's'} checked.`,
  })
  return insights
}

function counselFor(scenario: PreviewScenario, question: string): Counsel {
  const q = question.toLowerCase()
  if (/approv|pending|waiting|review/.test(q)) {
    return scenario.pendingApproval
      ? { headline: scenario.pendingApproval.title, sub: scenario.pendingApproval.whyRecommended }
      : { headline: 'Nothing is waiting on your approval', sub: "I'll bring anything I prepare straight to this desk." }
  }
  if (/opportunit|grow|improve|find|found/.test(q)) {
    return scenario.opportunity
      ? { headline: scenario.opportunity.headline, sub: scenario.opportunity.businessReason }
      : { headline: `${scenario.business.name} is holding steady`, sub: 'Nothing requires your attention. I am keeping watch.' }
  }
  if (/dna|understand|know|evidence|page/.test(q)) {
    const understood = scenario.digitalDna.filter((a) => a.understanding === 'well-understood').length
    return {
      headline: `${understood} of ${scenario.digitalDna.length} areas are well understood`,
      sub: `Built from ${scenario.pagesChecked} page${scenario.pagesChecked === 1 ? '' : 's'} checked. Ask me to check again for the rest.`,
    }
  }
  return { headline: scenario.briefing.headline, sub: scenario.briefing.subline }
}

export function CompassConsole({
  onFocusChange,
  scenario,
  investigating = false,
  statusText = null,
  discovering = false,
  onCheckNow,
  className = '',
  style,
}: {
  onFocusChange: (isFocused: boolean) => void
  scenario: PreviewScenario
  investigating?: boolean
  statusText?: string | null
  discovering?: boolean
  onCheckNow: () => void
  className?: string
  style?: CSSProperties
}) {
  const [index, setIndex] = useState(0)
  const [fading, setFading] = useState(false)
  const [mode, setMode] = useState<Mode>('counsel')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<Counsel | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const insights = useMemo(() => insightsFor(scenario), [scenario])

  // the watch rotation runs only while Compass is left to its own counsel,
  // and pauses while a check is actually running (the desk shows real
  // progress instead, below).
  useEffect(() => {
    if (mode !== 'counsel' || investigating) return
    let fadeTimer: ReturnType<typeof setTimeout>
    let focusTimer: ReturnType<typeof setTimeout>
    const interval = setInterval(() => {
      setFading(true)
      fadeTimer = setTimeout(() => {
        setIndex((current) => (current + 1) % insights.length)
        onFocusChange(true)
        setFading(false)
        focusTimer = setTimeout(() => onFocusChange(false), 900)
      }, 300)
    }, 6400)
    return () => {
      clearInterval(interval)
      clearTimeout(fadeTimer)
      clearTimeout(focusTimer)
      onFocusChange(false)
    }
  }, [onFocusChange, mode, investigating, insights.length])

  useEffect(() => {
    if (mode === 'ask' || mode === 'answer') inputRef.current?.focus()
  }, [mode])

  const consider = (asked: string) => {
    if (!asked.trim()) return
    setQuestion('')
    setMode('thinking')
    onFocusChange(true)
    setTimeout(() => {
      setAnswer(counselFor(scenario, asked.trim()))
      setMode('answer')
      onFocusChange(false)
    }, 1100)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    consider(question)
  }

  const insight = insights[index]
  const longAnswer = mode === 'answer' && answer && answer.sub.length > 220
  const shown: Counsel =
    investigating && statusText
      ? { headline: 'Considering what Scout is finding', sub: statusText }
      : mode === 'answer' && answer && !longAnswer
        ? answer
        : insight

  const dismissLongAnswer = () => {
    setMode('counsel')
    setAnswer(null)
  }

  useEffect(() => {
    if (!longAnswer) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismissLongAnswer()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [longAnswer])

  if (longAnswer && answer) {
    // a full report is a document of light over the room, not a desk line
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center px-6" onClick={dismissLongAnswer}>
        <div className="absolute inset-0 bg-[#02040a]/74 backdrop-blur-[2px]" />
        <div className="station-arrival relative w-[38rem] max-w-full" onClick={(event) => event.stopPropagation()}>
          <div className="arch-projected text-[10px] tracking-[0.44em] text-[#c8a86f]">COMPASS · FULL COUNSEL</div>
          <h2 className="arch-etch mt-4 text-[1.5rem] font-semibold tracking-tight">{answer.headline}</h2>
          <p className="mt-5 max-h-[46vh] overflow-y-auto pr-2 text-[14px] leading-7 text-[#c3b9a4]">{answer.sub}</p>
          <button
            type="button"
            onClick={dismissLongAnswer}
            className="group mt-7 inline-flex cursor-pointer flex-col items-start focus:outline-none"
          >
            <span className="arch-projected text-[11px] tracking-[0.26em] text-[#b9a986] transition-colors duration-300 group-hover:text-[#efe0c1]">
              RETURN TO THE ROOM
            </span>
            <span className="mt-2 h-px w-28 bg-[linear-gradient(90deg,rgba(200,180,138,0.5),transparent)]" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <aside id="compass" className={`relative ${className}`} style={style}>
      {/* no scrim, no chrome — the desk face is dark stone; words are light */}
      <div className={`hq-engraved relative mx-auto flex max-w-[26rem] flex-col items-center px-2 text-center [text-shadow:0_2px_14px_rgba(2,4,10,0.95),0_0_3px_rgba(2,4,10,0.85)]${discovering ? ' hq-discovering' : ''}`}>
        {/* the words rest on a projection of light — a soft holographic panel
            struck above the desk, so the counsel never floats on the marble */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute left-1/2 top-[2.4rem] -z-10 h-[8.5rem] w-[132%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(16,20,29,0.7),rgba(11,14,21,0.34)_54%,transparent_76%)] blur-[3px] transition-opacity duration-500 ${fading || mode === 'thinking' ? 'opacity-0' : 'opacity-100'}`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute left-1/2 top-[2.2rem] -z-10 h-px w-[62%] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(224,198,142,0.5),transparent)] transition-opacity duration-500 ${fading || mode === 'thinking' ? 'opacity-0' : 'opacity-70'}`}
        />
        <div
          className={`mt-3 min-h-[4.75rem] transition-[opacity,transform] duration-500 ease-out ${
            fading || mode === 'thinking' ? '-translate-y-1 opacity-0' : 'translate-y-0 opacity-100'
          }`}
          aria-live="polite"
        >
          <h2 className="text-[1.3rem] font-semibold leading-7 tracking-tight text-[#f6ecd4]">{shown.headline}</h2>
          <p className="mx-auto mt-1.5 max-w-[23rem] text-[13.5px] leading-6 text-[#ddd2b9]">{shown.sub}</p>
        </div>

        {mode === 'thinking' && (
          <div className="pointer-events-none absolute inset-x-0 top-8 text-[10.5px] tracking-[0.44em] text-[#d3bd8f]">
            CONSIDERING
          </div>
        )}
        {investigating && (
          <div className="pointer-events-none absolute inset-x-0 top-8 text-[10.5px] tracking-[0.44em] text-[#d3bd8f]">
            CHECKING
          </div>
        )}

        {mode === 'counsel' ? (
          // an etched glass command strip that belongs to the desk — the
          // controls are integrated into a lit surface, not loose labels
          <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-[#c8b48a]/25 bg-[linear-gradient(180deg,rgba(20,24,33,0.92),rgba(8,11,17,0.82))] px-1.5 py-1 backdrop-blur-md [box-shadow:inset_0_1px_0_rgba(224,198,142,0.24),0_12px_30px_-14px_rgba(0,0,0,0.85)]">
            <button
              type="button"
              onClick={() => setMode('ask')}
              disabled={investigating}
              className="cursor-pointer rounded-full px-3.5 py-1.5 text-[10.5px] font-medium tracking-[0.24em] text-[#e9dbba] transition-[color,background-color,transform] duration-150 hover:-translate-y-px hover:bg-white/[0.06] hover:text-[#fff8e8] active:translate-y-0 active:scale-[0.94] focus:outline-none disabled:opacity-50"
            >
              ASK COMPASS
            </button>
            <span aria-hidden="true" className="h-3.5 w-px bg-[#c8b48a]/18" />
            <button
              type="button"
              onClick={onCheckNow}
              disabled={investigating}
              className="cursor-pointer rounded-full px-3.5 py-1.5 text-[10.5px] font-medium tracking-[0.24em] text-[#e9dbba] transition-[color,background-color,transform] duration-150 hover:-translate-y-px hover:bg-white/[0.06] hover:text-[#fff8e8] active:translate-y-0 active:scale-[0.94] focus:outline-none disabled:opacity-50"
            >
              {investigating ? 'CHECKING…' : 'CHECK MY BUSINESS'}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-3 w-full max-w-[22rem]">
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setMode('counsel')
                  setAnswer(null)
                  setQuestion('')
                }
              }}
              placeholder={
                mode === 'answer'
                  ? 'Ask again — or Esc to resume the watch'
                  : `Ask about ${scenario.business.name}…`
              }
              disabled={mode === 'thinking'}
              className="w-full bg-transparent pb-1.5 text-center text-[13px] tracking-wide text-[#eadfc4] placeholder:text-[#6f685f] focus:outline-none"
            />
            <div className="mx-auto h-px w-full bg-[linear-gradient(90deg,transparent,rgba(200,180,138,0.5),transparent)]" />
          </form>
        )}
      </div>
    </aside>
  )
}
