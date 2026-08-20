#!/usr/bin/env node
// Line-numbered inventory of mechanical AI tells in a text file.
// Lexical and typographic marks only — structural tells (rule-of-three, symmetric
// bullets, heading restatement) need a reader. Usage: node scan.mjs <file>...
import { readFileSync } from 'node:fs'

// Regions the skill treats as verbatim: fenced code, inline code, block quotes.
const FENCE = /^\s*(```|~~~)/

const RULES = [
  {
    id: 'negation-flip',
    label: 'negation-flip parallelism ("not just X, it\'s Y")',
    re: /\b(?:it(?:'|’)?s not (?:just|only|about)|this is(?:n(?:'|’)?t| not) (?:just|only|about)|not merely)\b/gi,
  },
  {
    id: 'not-only-but-also',
    label: '"not only … but also"',
    re: /\bnot only\b[^.!?]{0,80}\bbut also\b/gi,
  },
  {
    id: 'empty-transition',
    label: 'empty transition',
    re: /(?:^|(?<=[.!?]\s)|(?<=^[-*+]\s))(?:moreover|furthermore|additionally|that said|in essence|importantly|notably|it(?:'|’)?s worth noting that|it is worth noting that|it(?:'|’)?s important to note that)\b/gim,
  },
  {
    id: 'set-piece-opener',
    label: 'set-piece opener',
    re: /\b(?:in today(?:'|’)?s (?:fast-paced|digital|modern)|in the (?:ever-)?(?:evolving|changing) (?:landscape|world)|let(?:'|’)?s dive in|here(?:'|’)?s the thing|buckle up)\b/gi,
  },
  {
    id: 'set-piece-closer',
    label: 'set-piece closer',
    re: /(?:^|(?<=[.!?]\s))(?:in conclusion|ultimately|at the end of the day|in summary|to sum up)\b/gim,
  },
  {
    id: 'llm-vocabulary',
    label: 'overrepresented vocabulary',
    re: /\b(?:delve|delves|delving|tapestry|testament|realm|landscape|navigate|navigating|leverage|leveraging|robust|seamless|seamlessly|harness|harnessing|unlock|unlocking|elevate|elevating|embark|crucial|pivotal|vibrant|myriad|foster|fostering|underscore|underscores|meticulous|meticulously|comprehensive|streamline|streamlining|empower|empowering|cutting-edge|game-changer|transformative|holistic|nuanced|intricate|bustling|utilize|utilizing|facilitate|facilitating)\b/gi,
  },
  {
    id: 'coaching-voice',
    label: 'second-person coaching',
    re: /\byou(?:'|’)?ll want to\b|\bmake sure (?:to|you)\b|\bsimply (?:run|add|set|use)\b/gi,
  },
  {
    id: 'emoji-heading',
    label: 'emoji in heading or bullet lead',
    re: /^\s*(?:#{1,6}\s|[-*+]\s)[^\n]{0,20}[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gmu,
  },
  {
    id: 'invisible-char',
    label: 'non-breaking space or zero-width character',
    re: /[ ​‌‍﻿]/g,
  },
  {
    id: 'bold-lead-bullet',
    label: 'templated "**Bold**:" bullet lead',
    re: /^\s*[-*+]\s+\*\*[^*\n]+\*\*\s*[:—-]/gm,
  },
]

// Reported by density rather than per-hit: a few are normal writing. Rates are unstable
// on short inputs, so density is only reported past this many words of prose.
const DENSITY_FLOOR = 150
const DENSITY = [
  { id: 'em-dash', label: 'em-dash', re: /—/g, per1k: 4 },
  { id: 'rule-of-three', label: 'three-item "X, Y, and Z" series', re: /\b\w+, \w+,? and \w+\b/g, per1k: 6 },
]

function proseLines(text) {
  // Returns [lineNumber, text] for lines outside code fences and block quotes,
  // with inline code spans blanked out.
  const out = []
  let inFence = false
  text.split('\n').forEach((line, i) => {
    if (FENCE.test(line)) {
      inFence = !inFence
      return
    }
    if (inFence || /^\s{4,}\S/.test(line) || /^\s*>/.test(line)) return
    out.push([i + 1, line.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length))])
  })
  return out
}

function scan(file) {
  const lines = proseLines(readFileSync(file, 'utf8'))
  const prose = lines.map(([, l]) => l).join('\n')
  const words = prose.split(/\s+/).filter(Boolean).length
  const findings = new Map()

  for (const rule of RULES) {
    for (const [n, line] of lines) {
      for (const m of line.matchAll(rule.re)) {
        const hits = findings.get(rule.id) ?? []
        hits.push({ n, text: m[0].trim() || JSON.stringify(m[0]), label: rule.label })
        findings.set(rule.id, hits)
      }
    }
  }

  const dense = []
  for (const rule of words >= DENSITY_FLOOR ? DENSITY : []) {
    const count = (prose.match(rule.re) ?? []).length
    const rate = words ? (count / words) * 1000 : 0
    if (rate > rule.per1k) dense.push({ ...rule, count, rate })
  }

  const total = [...findings.values()].reduce((a, h) => a + h.length, 0)
  console.log(`${file} — ${words} words of prose`)
  if (!total && !dense.length) {
    console.log('  no mechanical tells found (structural tells still need a read)')
    return 0
  }
  for (const hits of findings.values()) {
    console.log(`\n  ${hits[0].label} (${hits.length})`)
    for (const h of hits.slice(0, 12)) console.log(`    ${file}:${h.n}  ${h.text}`)
    if (hits.length > 12) console.log(`    … ${hits.length - 12} more`)
  }
  for (const d of dense) {
    console.log(`\n  ${d.label} density: ${d.count} in ${words} words (${d.rate.toFixed(1)}/1k, flags above ${d.per1k}/1k)`)
  }
  return total + dense.length
}

const files = process.argv.slice(2)
if (!files.length) {
  console.error('usage: node scan.mjs <file>...')
  process.exit(2)
}
let found = 0
for (const f of files) found += scan(f)
process.exit(found ? 1 : 0)
