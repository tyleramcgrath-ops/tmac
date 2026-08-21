import { describe, expect, it } from 'vitest'
import {
  createInvisibleStripper,
  hasInvisible,
  stripInvisible,
  stripInvisibleDeep,
} from '@/lib/strip-invisible'
// Plain JS helper, shipped with the skill so it stays portable.
import { stripInvisible as stripViaSkill } from '@/skills/remove-ai-marks/scripts/scan.mjs'

const TAG = (s: string) => Array.from(s, (c) => String.fromCodePoint(0xe0000 + (c.codePointAt(0) as number))).join('')

describe('stripInvisible', () => {
  it('leaves clean text untouched', () => {
    const text = 'Cut your page load time in half. No plugin required.'
    expect(stripInvisible(text)).toEqual({ text, removed: 0 })
  })

  it('removes zero-width and format characters', () => {
    const dirty = 'Fast​load‌times‍.⁠ Really﻿.'
    expect(stripInvisible(dirty).text).toBe('Fastloadtimes. Really.')
  })

  it('removes a payload hidden in the unicode tags block', () => {
    const dirty = `Best running shoes 2026${TAG('claude')}`
    const { text, removed } = stripInvisible(dirty)
    expect(text).toBe('Best running shoes 2026')
    expect(removed).toBe(6)
  })

  it('turns no-break spaces into ordinary spaces', () => {
    expect(stripInvisible('10 km dash').text).toBe('10 km dash')
  })

  it('drops soft hyphens and bidi controls', () => {
    expect(stripInvisible('op­timize‭now‬').text).toBe('optimizenow')
  })

  it('keeps the joiner inside an emoji sequence', () => {
    const family = '\u{1f468}‍\u{1f469}‍\u{1f467}'
    expect(stripInvisible(`Team ${family} ships`)).toEqual({ text: `Team ${family} ships`, removed: 0 })
  })

  it('keeps a variation selector that selects emoji presentation', () => {
    expect(stripInvisible('Warning ⚠️ here').text).toBe('Warning ⚠️ here')
  })

  it('drops a variation selector that follows ordinary text', () => {
    expect(stripInvisible('plain️text').text).toBe('plaintext')
  })

  it('drops a joiner that is not holding emoji together', () => {
    expect(stripInvisible('plain‍text').text).toBe('plaintext')
  })

  it('handles text longer than the argument-spread limit', () => {
    const long = 'a​'.repeat(200_000)
    const { text, removed } = stripInvisible(long)
    expect(text).toBe('a'.repeat(200_000))
    expect(removed).toBe(200_000)
  })
})

describe('hasInvisible', () => {
  it('distinguishes clean from marked text', () => {
    expect(hasInvisible('clean copy')).toBe(false)
    expect(hasInvisible(`clean​ copy`)).toBe(true)
  })
})

describe('stripInvisibleDeep', () => {
  it('cleans every string in a structured result', () => {
    const out = stripInvisibleDeep({
      seoTitle: 'Fast​Shoes',
      nested: { list: ['a﻿b', 42, null] },
      count: 7,
    })
    expect(out).toEqual({ seoTitle: 'FastShoes', nested: { list: ['ab', 42, null] }, count: 7 })
  })
})

async function pipe(chunks: string[]): Promise<string> {
  const stream = new ReadableStream<string>({
    start(c) {
      for (const chunk of chunks) c.enqueue(chunk)
      c.close()
    },
  }).pipeThrough(createInvisibleStripper())

  let out = ''
  for await (const chunk of stream as unknown as AsyncIterable<string>) out += chunk
  return out
}

describe('createInvisibleStripper', () => {
  it('strips across a stream', async () => {
    expect(await pipe(['Fast​', 'load ', 'times﻿.'])).toBe('Fastload times.')
  })

  it('survives a tags-block payload split across a surrogate pair boundary', async () => {
    const payload = TAG('hi')
    const dirty = `Shoes${payload}!`
    const mid = Math.floor(dirty.length / 2)
    expect(await pipe([dirty.slice(0, mid), dirty.slice(mid)])).toBe('Shoes!')
  })

  it('keeps an emoji sequence split across chunks intact', async () => {
    const family = '\u{1f468}‍\u{1f469}‍\u{1f467}'
    const text = `Team ${family} ships`
    for (let i = 1; i < text.length; i++) {
      expect(await pipe([text.slice(0, i), text.slice(i)])).toBe(text)
    }
  })

  it('emits trailing held-back characters on flush', async () => {
    expect(await pipe(['done \u{1f680}'])).toBe('done \u{1f680}')
  })
})

// The skill's scanner is standalone by design, so it carries its own copy of the
// character set. This is the guard against the two drifting apart.
describe('scan.mjs and lib/strip-invisible agree', () => {
  const fixtures = [
    'plain copy with nothing to remove',
    'zero\u200Bwidth\u200Cand\u200Djoiners',
    `tags ${String.fromCodePoint(0xe0041, 0xe0042)} block`,
    'no\u00A0break\u202Fspaces',
    'soft\u00ADhyphen and \u2060word joiner',
    'bidi \u202Aembed\u202C and \u200Emark',
    'variation\uFE0Fselector on text',
    'emoji \u{1F468}\u200D\u{1F469}\u200D\u{1F467} family',
    'warning \u26A0\uFE0F sign',
    `mixed ${String.fromCodePoint(0xe0001)} \u200B \u{1F680}\uFE0F end`,
  ]

  for (const fixture of fixtures) {
    it(`matches on ${JSON.stringify(fixture).slice(0, 44)}`, () => {
      const mine = stripInvisible(fixture)
      const theirs = stripViaSkill(fixture) as { text: string; removed: number }
      expect(theirs.text).toBe(mine.text)
      expect(theirs.removed).toBe(mine.removed)
    })
  }
})
