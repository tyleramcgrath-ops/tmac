// Removes the characters that carry an invisible fingerprint through generated
// text: zero-width and format controls, variation selectors, and the Unicode
// Tags block (U+E0000-E007F), which encodes arbitrary hidden payloads.
//
// Two characters in that set do real work and are kept where they belong:
// ZERO WIDTH JOINER holds emoji sequences together, and the variation selectors
// choose an emoji's presentation. Both are preserved when adjacent to a
// pictographic character and dropped everywhere else.
//
// This handles watermarks that live in the bytes. It does nothing about
// statistical watermarks embedded in word choice — no text transform can, and
// nothing here should be read as a claim otherwise.

// Invisible but meaning-bearing as spacing: replaced rather than deleted.
const SPACE_LIKE = new Set([
  0x00a0, // NO-BREAK SPACE
  0x202f, // NARROW NO-BREAK SPACE
])

// Deleted outright, subject to the emoji exceptions below.
function isRemovable(cp: number): boolean {
  return (
    cp === 0x00ad || // SOFT HYPHEN
    (cp >= 0x200b && cp <= 0x200f) || // ZWSP, ZWNJ, ZWJ, LRM, RLM
    (cp >= 0x202a && cp <= 0x202e) || // bidi embedding and override
    (cp >= 0x2060 && cp <= 0x2064) || // word joiner, invisible operators
    (cp >= 0x2066 && cp <= 0x2069) || // bidi isolates
    (cp >= 0x206a && cp <= 0x206f) || // deprecated format controls
    cp === 0xfeff || // BOM / ZWNBSP
    (cp >= 0xfe00 && cp <= 0xfe0f) || // variation selectors
    (cp >= 0xe0100 && cp <= 0xe01ef) || // variation selectors supplement
    (cp >= 0xe0000 && cp <= 0xe007f) // tags block — the hidden-payload channel
  )
}

const PICTOGRAPHIC = /\p{Extended_Pictographic}/u

function isPictographic(cp: number | undefined): boolean {
  return cp !== undefined && PICTOGRAPHIC.test(String.fromCodePoint(cp))
}

export interface StripResult {
  text: string
  /** Count of characters removed or replaced. */
  removed: number
}

export function stripInvisible(input: string): StripResult {
  const cps = Array.from(input, (c) => c.codePointAt(0) as number)
  // Built as pieces rather than one spread call, which would overflow the
  // argument limit on a long article.
  const out: string[] = []
  let removed = 0

  for (let i = 0; i < cps.length; i++) {
    const cp = cps[i]

    if (SPACE_LIKE.has(cp)) {
      out.push(' ')
      removed++
      continue
    }

    if (!isRemovable(cp)) {
      out.push(String.fromCodePoint(cp))
      continue
    }

    // ZWJ between two pictographs is holding an emoji sequence together.
    if (cp === 0x200d && isPictographic(cps[i - 1]) && isPictographic(cps[i + 1])) {
      out.push(String.fromCodePoint(cp))
      continue
    }

    // A variation selector after a pictograph is choosing its presentation.
    if ((cp === 0xfe0e || cp === 0xfe0f) && isPictographic(cps[i - 1])) {
      out.push(String.fromCodePoint(cp))
      continue
    }

    removed++
  }

  return { text: out.join(''), removed }
}

/** True when the text carries no invisible characters. */
export function hasInvisible(input: string): boolean {
  return stripInvisible(input).removed > 0
}

/** Strips every string value in an object tree, leaving other types alone. */
export function stripInvisibleDeep<T>(value: T): T {
  if (typeof value === 'string') return stripInvisible(value).text as unknown as T
  if (Array.isArray(value)) return value.map(stripInvisibleDeep) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) out[k] = stripInvisibleDeep(v)
    return out as T
  }
  return value
}

// A chunk can end mid-surrogate-pair or mid-emoji-sequence, either of which
// would make the wrong call about a trailing ZWJ or variation selector. Hold
// back the trailing run that could still be extended by the next chunk.
const MAX_CARRY = 16

function safeSplit(buf: string): number {
  let i = buf.length
  let held = 0
  while (i > 0 && held < MAX_CARRY) {
    const cp = buf.codePointAt(i - 1) as number
    const isLowSurrogate = cp >= 0xdc00 && cp <= 0xdfff
    const prev = isLowSurrogate ? (buf.codePointAt(i - 2) ?? cp) : cp
    if (
      (cp >= 0xd800 && cp <= 0xdbff) || // lone high surrogate
      prev === 0x200d ||
      prev === 0xfe0e ||
      prev === 0xfe0f ||
      isPictographic(prev)
    ) {
      const step = isLowSurrogate ? 2 : 1
      i -= step
      held += step
      continue
    }
    break
  }
  return i
}

/**
 * Streaming form of `stripInvisible`, for a model response piped to the client.
 * Buffers only the trailing characters whose classification depends on what
 * comes next.
 */
export function createInvisibleStripper(): TransformStream<string, string> {
  let carry = ''
  return new TransformStream({
    transform(chunk, controller) {
      const buf = carry + chunk
      const at = safeSplit(buf)
      carry = buf.slice(at)
      const emit = stripInvisible(buf.slice(0, at)).text
      if (emit) controller.enqueue(emit)
    },
    flush(controller) {
      if (carry) {
        const emit = stripInvisible(carry).text
        if (emit) controller.enqueue(emit)
      }
    },
  })
}
