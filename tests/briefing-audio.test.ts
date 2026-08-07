// Tests for the spoken executive brief.
//
// Two failure modes matter here and neither is a crash. First, text that is
// unlistenable — a URL read character by character, a "+12%" whose sign
// vanishes so a gain sounds like a bare number. Second, and worse, a briefing
// that sounds complete but isn't: a listener cannot see that items were cut,
// so any truncation has to be spoken aloud.

import { describe, expect, it } from 'vitest'
import {
  buildSpokenBrief,
  speakable,
  speakableDelta,
  speakableUrl,
  MAX_SCRIPT_CHARS,
} from '../apps/north-star-hq/lib/foundation/briefing/audio'
import type { ExecutiveBrief } from '../apps/north-star-hq/lib/foundation/briefing/engine'

function brief(over: Partial<ExecutiveBrief> = {}): ExecutiveBrief {
  return {
    generatedAt: '2026-08-07T00:00:00Z',
    project: { id: 'p1', name: 'Acme' },
    executiveSummary: 'Acme has 3 missions tracked.',
    priorities: [],
    recentProgress: [],
    attentionRequired: [],
    performance: { metrics: [], note: null },
    recommendation: null,
    dataSources: [{ name: 'Mission Queue', available: true, reason: null }],
    ...over,
  }
}

const item = (text: string) => ({ text, why: null, evidence: [] })

describe('speakableUrl', () => {
  it('turns a path into a spoken phrase', () => {
    expect(speakableUrl('https://a.test/pricing/enterprise')).toBe('the pricing enterprise page')
  })

  it('names the root as the homepage', () => {
    expect(speakableUrl('https://a.test/')).toBe('the homepage')
    expect(speakableUrl('https://a.test')).toBe('the homepage')
  })

  it('drops file extensions and splits hyphens into words', () => {
    expect(speakableUrl('https://a.test/about-us/our-team.html')).toBe('the about us our team page')
  })

  it('handles a malformed URL without throwing', () => {
    expect(speakableUrl('a.test/thing')).toBe('the thing page')
  })
})

describe('speakable', () => {
  it('replaces URLs rather than reading them aloud', () => {
    const out = speakable('Fix https://a.test/pricing now.')
    expect(out).toBe('Fix the pricing page now.')
    expect(out).not.toContain('http')
  })

  it('keeps trailing punctuation outside the URL phrase', () => {
    expect(speakable('See https://a.test/pricing.')).toBe('See the pricing page.')
  })

  it('speaks a leading plus as "up" so a gain is not silently flattened', () => {
    expect(speakable('Clicks +12% this week')).toBe('Clicks up 12 percent this week')
  })

  it('expands abbreviations that are wrong read as letters', () => {
    expect(speakable('CTR fell and GSC is down')).toBe('click-through rate fell and Search Console is down')
  })

  it('leaves abbreviations that read fine as letters alone', () => {
    expect(speakable('AI and SEO')).toBe('AI and SEO')
  })

  it('strips markdown so asterisks are not pronounced', () => {
    expect(speakable('**Approve** the `fix`')).toBe('Approve the fix')
  })

  it('removes thousands separators that get read as the word comma', () => {
    expect(speakable('1,234 clicks')).toBe('1234 clicks')
  })

  it('turns em dashes into a spoken pause', () => {
    expect(speakable('Do this — then that')).toBe('Do this, then that')
  })
})

describe('speakableDelta', () => {
  it('speaks direction words instead of signs', () => {
    expect(speakableDelta('+12% vs prior period')).toBe('up 12 percent vs prior period')
    expect(speakableDelta('-3')).toBe('down 3')
  })
})

describe('buildSpokenBrief', () => {
  it('leads with what is on fire, not with metrics', () => {
    const b = brief({
      attentionRequired: [{ ...item('Deployment to the pricing page failed.'), severity: 'verification-failed' as const }],
      performance: { metrics: [{ label: 'Clicks', value: '100', deltaLabel: null, source: 'Search Console' }], note: null },
    })
    const spoken = buildSpokenBrief(b)
    const headings = spoken.sections.map((s) => s.heading)
    expect(headings.indexOf('Needs attention')).toBeLessThan(headings.indexOf('Performance'))
  })

  it('says out loud which sources are missing', () => {
    // A listener cannot see an absent section. Staying silent would imply
    // coverage the briefing does not have.
    const b = brief({
      dataSources: [
        { name: 'Mission Queue', available: true, reason: null },
        { name: 'Search Console', available: false, reason: 'Not connected.' },
        { name: 'Backlinks', available: false, reason: 'No provider.' },
      ],
    })
    const spoken = buildSpokenBrief(b)
    expect(spoken.script).toContain('Search Console, Backlinks')
    expect(spoken.script).toContain('unavailable')
  })

  it('admits when items were cut for length', () => {
    const b = brief({ priorities: Array.from({ length: 7 }, (_, i) => item(`Priority number ${i}.`)) })
    const spoken = buildSpokenBrief(b)
    expect(spoken.truncated).toBe(true)
    expect(spoken.omittedItems).toBe(4) // 7 priorities, 3 spoken
    expect(spoken.script).toContain('as much as fits')
  })

  it('is not truncated when everything fits', () => {
    const spoken = buildSpokenBrief(brief({ priorities: [item('One thing.')] }))
    expect(spoken.truncated).toBe(false)
    expect(spoken.omittedItems).toBe(0)
    expect(spoken.script).not.toContain('as much as fits')
  })

  it('stays inside the synthesis cap even with absurd input', () => {
    // The speak route hard-caps at MAX_SCRIPT_CHARS and silently slices past
    // it — a script over the cap would be cut mid-sentence with no notice.
    const long = 'x'.repeat(900)
    const spoken = buildSpokenBrief(
      brief({
        executiveSummary: long,
        priorities: Array.from({ length: 20 }, () => item(long)),
        recentProgress: Array.from({ length: 20 }, () => item(long)),
        attentionRequired: Array.from({ length: 20 }, () => ({ ...item(long), severity: 'blocked' as const })),
      })
    )
    expect(spoken.charCount).toBeLessThanOrEqual(MAX_SCRIPT_CHARS)
    expect(spoken.truncated).toBe(true)
  })

  it('reserves room for the truncation notice instead of overflowing on it', () => {
    // The subtle overflow: sections fill to just under the cap, truncation
    // fires, and appending "that is as much as fits" pushes the script past
    // MAX_SCRIPT_CHARS — where the speak route silently slices it, cutting off
    // the very sentence that admits the cut. Sized so the script only stays
    // inside the cap if the budget reserves headroom up front.
    const spoken = buildSpokenBrief(
      brief({
        executiveSummary: 'y'.repeat(3975),
        priorities: Array.from({ length: 5 }, (_, i) => item(`Priority ${i} ${'z'.repeat(190)}`)),
      })
    )
    expect(spoken.truncated).toBe(true)
    expect(spoken.charCount).toBeLessThanOrEqual(MAX_SCRIPT_CHARS)
    expect(spoken.script).toContain('as much as fits')
  })

  it('normalizes the brief text rather than passing it through raw', () => {
    const b = brief({ executiveSummary: 'Fix **https://a.test/pricing** for +12% CTR' })
    const spoken = buildSpokenBrief(b)
    expect(spoken.script).toContain('the pricing page')
    expect(spoken.script).toContain('up 12 percent')
    expect(spoken.script).toContain('click-through rate')
    expect(spoken.script).not.toContain('*')
  })

  it('ends sentences so the voice pauses instead of running on', () => {
    const spoken = buildSpokenBrief(brief({ executiveSummary: 'No missions yet' }))
    expect(spoken.script.startsWith('No missions yet.')).toBe(true)
  })

  it('speaks the performance note when there are no metrics', () => {
    const b = brief({ performance: { metrics: [], note: 'No meaningful metric movement to report.' } })
    expect(buildSpokenBrief(b).script).toContain('No meaningful metric movement')
  })

  it('speaks metric deltas as direction words', () => {
    const b = brief({
      performance: {
        metrics: [{ label: 'Search Console clicks', value: '1,234', deltaLabel: '+12% vs prior period', source: 'Search Console' }],
        note: null,
      },
    })
    expect(buildSpokenBrief(b).script).toContain('Search Console clicks 1234, up 12 percent')
  })
})
