// Spoken form of the executive brief.
//
// The brief is written to be read on a screen, and screen-prose read aloud is
// bad in specific, fixable ways: a URL becomes forty seconds of "h t t p s
// colon slash slash", "+12%" becomes "plus twelve percent" (which is not how
// anyone says it), "CTR" becomes "see tee arr", and markdown asterisks get
// pronounced. This turns the same real content into something a person can
// listen to. It invents no content — every sentence traces to a field on the
// ExecutiveBrief.
//
// Deliberately returns a SCRIPT, not audio. The neural-voice route
// (/api/compass/speak) talks to an unofficial Edge endpoint that has been
// observed 403-ing from datacenter IPs. If this route synthesized audio
// itself, that 403 would take the whole feature down. Returning text lets the
// client try neural speech and fall back to the browser's speechSynthesis
// with the same script — degraded voice, complete briefing.

import type { ExecutiveBrief } from './engine'

// Read as words, not letters. Only entries where the letter-reading is
// genuinely wrong — "SEO" and "AI" are fine as letters and are left alone.
const EXPANSIONS: [RegExp, string][] = [
  [/\bCTR\b/g, 'click-through rate'],
  [/\bGSC\b/g, 'Search Console'],
  [/\bGA4\b/g, 'Analytics'],
  [/\bJSON-LD\b/gi, 'JSON linked data'],
  [/\bschema\.org\b/gi, 'schema dot org'],
  [/\bWP\b/g, 'WordPress'],
  [/\bQ&A\b/gi, 'questions and answers'],
  [/\bvs\.?\b/gi, 'versus'],
  [/\be\.g\.\s*/gi, 'for example '],
  [/\bi\.e\.\s*/gi, 'that is '],
]

// A URL read literally is unlistenable. The path carries the meaning, so it
// becomes a short phrase: /pricing/enterprise -> "the pricing enterprise page".
export function speakableUrl(raw: string): string {
  let path: string
  if (raw.startsWith('/')) {
    path = raw
  } else {
    try {
      path = new URL(raw).pathname
    } catch {
      // Protocol-relative or bare "host/path". Parsing it with a protocol
      // attached is what separates the host from the path — without this the
      // domain gets spoken as if it were part of the page name.
      try {
        path = new URL(`https://${raw}`).pathname
      } catch {
        path = raw.replace(/^[^/]*/, '')
      }
    }
  }
  const words = path
    .replace(/\.(html?|php|aspx?)$/i, '')
    .split('/')
    .filter(Boolean)
    .join(' ')
    .replace(/[-_]+/g, ' ')
    .trim()
  return words ? `the ${words} page` : 'the homepage'
}

// Turns written deltas into spoken ones. "+12%" is read "up 12 percent"
// because that is what a person says, and because a leading "+" is otherwise
// silently dropped by most engines — turning a gain into a bare number.
export function speakableDelta(raw: string): string {
  return raw
    .replace(/^\+(\d)/, 'up $1')
    .replace(/^-(\d)/, 'down $1')
    .replace(/(\d)%/g, '$1 percent')
    .trim()
}

export function speakable(text: string): string {
  let out = text
  // URLs first — later rules would otherwise mangle them into nonsense.
  // Sentence punctuation that trails a URL belongs to the sentence, not the
  // URL — swallowing it runs the next sentence together with no pause.
  out = out.replace(/https?:\/\/\S+/gi, (m) => {
    const trail = /[.,;:)!?]+$/.exec(m)?.[0] ?? ''
    return speakableUrl(m.slice(0, m.length - trail.length)) + trail
  })
  out = out.replace(/[*_`#]+/g, '')
  // Curly quotes and dashes read as literal symbols on some engines.
  out = out.replace(/[""]/g, '').replace(/['']/g, "'").replace(/\s*[—–]\s*/g, ', ')
  for (const [re, to] of EXPANSIONS) out = out.replace(re, to)
  out = out.replace(/(^|\s)\+(\d)/g, '$1up $2').replace(/(\d)%/g, '$1 percent')
  // Thousands separators are read as "one comma two three four" by some engines.
  out = out.replace(/\b(\d{1,3}),(\d{3})\b/g, '$1$2')
  return out.replace(/\s+/g, ' ').trim()
}

export interface SpokenSection {
  heading: string
  text: string
}

export interface SpokenBrief {
  script: string
  sections: SpokenSection[]
  charCount: number
  // True when the character budget forced items out. The script says so aloud
  // too — a listener cannot see that the text was cut, so silent truncation
  // would present a partial briefing as a complete one.
  truncated: boolean
  omittedItems: number
}

// Matches the cap in /api/compass/speak so a script built here always fits in
// one synthesis call.
export const MAX_SCRIPT_CHARS = 4000

function sentence(s: string): string {
  const t = speakable(s)
  if (!t) return ''
  return /[.!?]$/.test(t) ? t : `${t}.`
}

export function buildSpokenBrief(brief: ExecutiveBrief, maxChars = MAX_SCRIPT_CHARS): SpokenBrief {
  const sections: SpokenSection[] = []
  let used = 0
  let omitted = 0
  let truncated = false

  // Reserve room for the truncation notice so admitting the cut can never
  // itself be the thing that gets cut.
  const NOTICE = 'That is as much as fits in one briefing. '
  const budget = maxChars - NOTICE.length - 40

  const add = (heading: string, parts: string[], countable = 0): void => {
    const text = parts.filter(Boolean).join(' ')
    if (!text) return
    if (used + text.length > budget) {
      truncated = true
      omitted += countable || 1
      return
    }
    sections.push({ heading, text })
    used += text.length + 1
  }

  add('Summary', [sentence(brief.executiveSummary)])

  if (brief.attentionRequired.length > 0) {
    // Blockers lead. A listener who stops after thirty seconds should have
    // heard the thing that is on fire, not the metrics.
    const items = brief.attentionRequired.slice(0, 3)
    add(
      'Needs attention',
      [
        `${brief.attentionRequired.length} item${brief.attentionRequired.length === 1 ? '' : 's'} need${brief.attentionRequired.length === 1 ? 's' : ''} your attention.`,
        ...items.map((i) => sentence(i.text)),
      ],
      brief.attentionRequired.length
    )
    if (brief.attentionRequired.length > items.length) {
      omitted += brief.attentionRequired.length - items.length
      truncated = true
    }
  }

  if (brief.priorities.length > 0) {
    const items = brief.priorities.slice(0, 3)
    add('Priorities', [items.length === 1 ? 'Top priority.' : `Top ${items.length} priorities.`, ...items.map((i) => sentence(i.text))])
    if (brief.priorities.length > items.length) {
      omitted += brief.priorities.length - items.length
      truncated = true
    }
  }

  const metrics = brief.performance.metrics.slice(0, 4)
  if (metrics.length > 0) {
    add('Performance', [
      'Performance.',
      ...metrics.map((m) => {
        const delta = m.deltaLabel ? `, ${speakableDelta(m.deltaLabel)}` : ''
        return sentence(`${m.label} ${m.value}${delta}`)
      }),
    ])
  } else if (brief.performance.note) {
    add('Performance', [sentence(brief.performance.note)])
  }

  if (brief.recentProgress.length > 0) {
    const items = brief.recentProgress.slice(0, 2)
    add('Progress', ['Recent progress.', ...items.map((i) => sentence(i.text))])
  }

  if (brief.recommendation) {
    add('Recommendation', [sentence(brief.recommendation.text), sentence(brief.recommendation.reasoning)])
  }

  // Unavailable sources are spoken, not silently omitted. A listener has no
  // way to notice a missing section, so "we have no Search Console data" has
  // to be said out loud or the briefing implies coverage it does not have.
  const down = brief.dataSources.filter((d) => !d.available)
  if (down.length > 0) {
    add('Gaps', [
      sentence(
        `Not included, because ${down.length === 1 ? 'this source is' : 'these sources are'} unavailable: ${down
          .map((d) => d.name)
          .join(', ')}`
      ),
    ])
  }

  let script = sections.map((s) => s.text).join(' ')
  if (truncated) script = `${script} ${NOTICE}`.trim()

  return { script: script.trim(), sections, charCount: script.trim().length, truncated, omittedItems: omitted }
}
