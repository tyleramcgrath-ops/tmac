// Cleans up the way bar records are typically written (ALL CAPS names,
// "LAST, FIRST" order, bare digit phone numbers) into how the site shows them.

const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v', 'esq'])
const UPPER = new Set(['ii', 'iii', 'iv', 'llp', 'llc', 'lllp', 'pllc', 'pa', 'pl', 'pc', 'plc', 'lp', 'usa', 'us', 'nw', 'ne', 'sw', 'se', 'po', 'cpa', 'aba', 'dui', 'apc', 'ltd'])
const LOWER = new Set(['of', 'and', 'the', 'at', 'for', 'in', 'on', 'de', 'la', 'del', 'van', 'von', 'y', 'du'])

const isShouty = (s) => /[A-Z]/.test(s) && s === s.toUpperCase()
const isQuiet = (s) => /[a-z]/.test(s) && s === s.toLowerCase()

function capWord(w, i) {
  const bare = w.toLowerCase().replace(/[.,]/g, '')
  if (UPPER.has(bare)) return w.toUpperCase()
  if (i > 0 && LOWER.has(w.toLowerCase())) return w.toLowerCase()
  if (/^\d/.test(w)) return w.toLowerCase() // 1ST -> 1st, 12TH -> 12th
  return w
    .toLowerCase()
    .replace(/(^|[-'’/(])(\p{L})/gu, (_, p, c) => p + c.toUpperCase())
    .replace(/(^|[-/])Mc(\p{L})/gu, (_, p, c) => `${p}Mc${c.toUpperCase()}`)
    .replace(/^O'(\p{L})/u, (_, c) => `O'${c.toUpperCase()}`)
}

/**
 * Title-cases text only when it arrives in ALL CAPS or all lowercase.
 * `mid` treats the text as continuing a phrase, so a leading particle stays
 * lowercase (the "de la" in "María de la Cruz").
 */
export function smartCase(s, mid = false) {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  if (!t || !(isShouty(t) || isQuiet(t))) return t
  return t.split(' ').map((w, i) => capWord(w, i + (mid ? 1 : 0))).join(' ')
}

/**
 * Builds a display name from either separate parts or a single "LAST, FIRST
 * MIDDLE SUFFIX" / "FIRST MIDDLE LAST" field.
 */
export function personName({ full = '', first = '', middle = '', last = '', suffix = '' }) {
  if (!first && !last && full) {
    const f = full.replace(/\s+/g, ' ').trim()
    if (f.includes(',')) {
      const [l, rest = ''] = f.split(/,(.*)/s).map((x) => x.trim())
      const parts = rest.replace(/,/g, ' ').split(' ').filter(Boolean)
      const suf = parts.length > 1 && SUFFIXES.has(parts.at(-1).toLowerCase().replace(/\./g, '')) ? parts.pop() : ''
      ;[first = '', ...middle] = parts
      return personName({ first, middle: middle.join(' '), last: l, suffix: suf })
    }
    return smartCase(f)
  }
  const mid = middle.trim()
  // Long middle names are shortened to an initial, as on most directories.
  const midShown = mid && mid.replace(/\./g, '').length > 1 && !/\s/.test(mid) ? `${mid[0].toUpperCase()}.` : mid.length === 1 ? `${mid.toUpperCase()}.` : smartCase(mid)
  let suf = suffix.replace(/\./g, '').trim()
  const sl = suf.toLowerCase()
  suf = sl === 'jr' || sl === 'sr' ? `${sl[0].toUpperCase()}${sl[1]}.` : sl === 'esq' ? '' : suf.toUpperCase()
  const base = [smartCase(first), midShown, smartCase(last, Boolean(first))].filter(Boolean).join(' ')
  return suf ? `${base}${/^(J|S)r\.$/.test(suf) ? ',' : ''} ${suf}` : base
}

/** "3055550123" / "305.555.0123" -> "(305) 555-0123"; anything else is kept as-is. */
export function formatPhone(s) {
  const raw = String(s ?? '').trim()
  const ext = raw.match(/(?:x|ext\.?)\s*(\d+)\s*$/i)?.[1]
  const d = raw.replace(/(?:x|ext\.?)\s*\d+\s*$/i, '').replace(/\D/g, '')
  const ten = d.length === 11 && d[0] === '1' ? d.slice(1) : d
  if (ten.length !== 10) return raw
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}${ext ? ` ext. ${ext}` : ''}`
}

export const zip5 = (s) => String(s ?? '').match(/\d{5}/)?.[0] ?? ''

export const slugify = (s) =>
  String(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)

export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
