// Just enough CSS to see a page the way a desktop visitor does: each
// element's background, text colour, alignment, font and size. Reads the
// site's own stylesheets and inline styles; ignores hover states, phone
// layouts and anything it doesn't understand.

import { classes, type El } from './dom'

export interface Look {
  color?: string
  background?: string
  backgroundImage?: string
  repeat?: boolean
  textAlign?: string
  fontFamily?: string
  fontSize?: number
  fontWeight?: number
  upper?: boolean
  // Hidden by an inline style, or by a stylesheet rule (often only until a
  // script shows it: sliders, tabs, animations).
  hidden?: 'inline' | 'sheet'
}

const INHERITED: (keyof Look)[] = ['color', 'textAlign', 'fontFamily', 'fontSize', 'fontWeight', 'upper']

interface Part {
  tag?: string
  id?: string
  cls: string[]
}
interface Rule {
  parts: Part[]
  spec: number
  order: number
  decls: [string, string, boolean][]
}

export class Styles {
  private byId = new Map<string, Rule[]>()
  private byClass = new Map<string, Rule[]>()
  private byTag = new Map<string, Rule[]>()
  private any: Rule[] = []
  private vars = new Map<string, string>()
  private memo = new WeakMap<El, Look>()
  private order = 0

  constructor(css: string, private base: string) {
    this.add(css)
  }

  add(css: string) {
    const flat = css.replace(/\/\*[\s\S]*?\*\//g, ' ')
    this.block(flat)
  }

  // Walks a stylesheet, keeping desktop rules and skipping the rest.
  private block(css: string) {
    let i = 0
    while (i < css.length) {
      const open = css.indexOf('{', i)
      if (open < 0) return
      // Statements like @charset or @import end in ';' and have no block.
      const raw = css.slice(i, open)
      const head = raw.slice(raw.lastIndexOf(';') + 1).trim()
      // Find the matching close brace.
      let depth = 1
      let j = open + 1
      while (j < css.length && depth) {
        if (css[j] === '{') depth++
        else if (css[j] === '}') depth--
        j++
      }
      const inner = css.slice(open + 1, j - 1)
      i = j
      const at = head.lastIndexOf('@')
      if (at >= 0) {
        const rule = head.slice(at)
        if (/^@media/i.test(rule)) {
          // Desktop: screens and min-width queries up to a laptop; never
          // phone (max-width) or print.
          const q = rule.toLowerCase()
          if (/print|max-width|orientation:\s*portrait|hover:\s*none/.test(q)) continue
          const min = q.match(/min-width:\s*(\d+)/)
          if (min && +min[1] > 1280) continue
          this.block(inner)
        } else if (/^@supports/i.test(rule)) this.block(inner)
        continue
      }
      this.rule(head, inner)
    }
  }

  private rule(selectors: string, body: string) {
    const decls: Rule['decls'] = []
    for (const d of body.split(';')) {
      const c = d.indexOf(':')
      if (c < 0) continue
      const prop = d.slice(0, c).trim().toLowerCase()
      let value = d.slice(c + 1).trim()
      const important = /!important\s*$/i.test(value)
      value = value.replace(/!important\s*$/i, '').trim()
      if (prop.startsWith('--')) {
        if (/(^|,)\s*(:root|html|body|\.elementor-kit-\d+|\*)\s*($|,)/.test(selectors)) this.vars.set(prop, value)
        continue
      }
      if (/^(color|background|background-color|background-image|background-repeat|text-align|font-family|font-size|font-weight|text-transform|display|visibility)$/.test(prop)) decls.push([prop, value, important])
    }
    if (!decls.length) return
    // Lazy-loading plugins blank backgrounds until a script swaps them in;
    // the real background is what visitors end up seeing.
    if (/lazy/i.test(selectors)) {
      const kept = decls.filter(([p, v]) => !(/^background(-image)?$/.test(p) && /^none/i.test(v)))
      if (!kept.length) return
      decls.splice(0, decls.length, ...kept)
    }
    for (const sel of selectors.split(',')) {
      const parts = parseSelector(sel.trim())
      if (!parts) continue
      const spec = parts.reduce((n, p) => n + (p.id ? 100 : 0) + p.cls.length * 10 + (p.tag ? 1 : 0), 0)
      const r: Rule = { parts, spec, order: this.order++, decls }
      const key = parts[parts.length - 1]
      if (key.id) push(this.byId, key.id, r)
      else if (key.cls.length) push(this.byClass, key.cls[0], r)
      else if (key.tag) push(this.byTag, key.tag, r)
      else this.any.push(r)
    }
  }

  look(el: El): Look {
    const hit = this.memo.get(el)
    if (hit) return hit
    const parent = el.parent && el.parent.tag !== '#root' ? this.look(el.parent) : {}
    const out: Look = {}
    for (const k of INHERITED) if (parent[k] !== undefined) (out as Record<string, unknown>)[k] = parent[k]
    const rules: Rule[] = [...this.any]
    if (el.attrs.id) rules.push(...(this.byId.get(el.attrs.id) ?? []))
    for (const c of classes(el)) rules.push(...(this.byClass.get(c) ?? []))
    rules.push(...(this.byTag.get(el.tag) ?? []))
    const matched = [...new Set(rules)].filter((r) => matches(el, r.parts))
    const decls: { prop: string; value: string; weight: number; inline?: boolean }[] = []
    for (const r of matched) for (const [prop, value, imp] of r.decls) decls.push({ prop, value, weight: (imp ? 1e7 : 0) + r.spec * 1e4 + r.order / 1e5 })
    // Inline styles beat stylesheet rules (but not !important ones).
    for (const d of (el.attrs.style ?? '').split(';')) {
      const c = d.indexOf(':')
      if (c < 0) continue
      const v = d.slice(c + 1).trim()
      const imp = /!important\s*$/i.test(v)
      decls.push({ prop: d.slice(0, c).trim().toLowerCase(), value: v.replace(/!important\s*$/i, '').trim(), weight: (imp ? 2e7 : 1e7 - 1), inline: true })
    }
    decls.sort((a, b) => a.weight - b.weight)
    for (const { prop, value: raw, inline } of decls) this.apply(out, prop, this.resolve(raw), parent, inline)
    this.memo.set(el, out)
    return out
  }

  private resolve(v: string): string {
    return v.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)/g, (_m, name: string, fb?: string) => this.vars.get(name) ?? fb ?? '')
  }

  private apply(out: Look, prop: string, v: string, parent: Look, inline = false) {
    const val = v.trim().toLowerCase()
    if (val === 'inherit') {
      const k = ({ color: 'color', 'text-align': 'textAlign', 'font-family': 'fontFamily' } as Record<string, keyof Look>)[prop]
      if (k) (out as Record<string, unknown>)[k] = parent[k]
      return
    }
    switch (prop) {
      case 'color': {
        const c = toHex(val)
        if (c) out.color = c
        break
      }
      case 'background':
      case 'background-color':
      case 'background-image': {
        if (prop !== 'background-image') {
          const c = toHex(val.replace(/url\([^)]*\)/g, ''))
          if (c) out.background = c
          else if (/^(none|transparent|initial|unset)$/.test(val)) out.background = undefined
        }
        if (prop !== 'background-color') {
          const url = v.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i)?.[1]
          if (url && !url.startsWith('data:')) {
            try {
              out.backgroundImage = new URL(url, this.base).href
            } catch {}
          } else if (/^none/.test(val) && prop === 'background-image') out.backgroundImage = undefined
          if (/\brepeat\b(?!-)/.test(val)) out.repeat = true
          if (/no-repeat/.test(val)) out.repeat = false
        }
        break
      }
      case 'background-repeat':
        out.repeat = !/no-repeat/.test(val)
        break
      case 'text-align':
        if (/^(left|center|right|start|justify)$/.test(val)) out.textAlign = val === 'start' || val === 'justify' ? 'left' : val
        break
      case 'font-family':
        out.fontFamily = v.split(',')[0].replace(/['"]/g, '').trim()
        break
      case 'font-size': {
        const px = val.match(/^([\d.]+)px$/)
        const em = val.match(/^([\d.]+)(em|rem)$/)
        if (px) out.fontSize = +px[1]
        else if (em) out.fontSize = +em[1] * (em[2] === 'rem' ? 16 : (parent.fontSize ?? 16))
        break
      }
      case 'font-weight': {
        const w = val === 'bold' ? 700 : val === 'normal' ? 400 : Number(val)
        if (w) out.fontWeight = w
        break
      }
      case 'text-transform':
        out.upper = val === 'uppercase'
        break
      case 'display':
        out.hidden = val === 'none' ? (inline ? 'inline' : 'sheet') : undefined
        break
      case 'visibility':
        if (val === 'hidden') out.hidden = inline ? 'inline' : 'sheet'
        break
    }
  }
}

function push<K, V>(m: Map<K, V[]>, k: K, v: V) {
  const list = m.get(k)
  if (list) list.push(v)
  else m.set(k, [v])
}

// "div.hero > .title" → compounds, or null when it uses something we skip
// (hover and other states, attributes, sibling combinators).
function parseSelector(sel: string): Part[] | null {
  if (!sel || /[:[+~]/.test(sel.replace(/::?(before|after)/g, '\u0000'))) return null
  if (sel.includes('\u0000') || /::?(before|after)/.test(sel)) return null
  const parts: Part[] = []
  for (const tok of sel.replace(/\s*>\s*/g, ' ').split(/\s+/)) {
    if (!tok) continue
    const m = tok.match(/^([a-zA-Z][\w-]*|\*)?((?:[#.][\w-]+)*)$/)
    if (!m) return null
    const p: Part = { cls: [] }
    if (m[1] && m[1] !== '*') p.tag = m[1].toLowerCase()
    for (const x of m[2].match(/[#.][\w-]+/g) ?? []) x[0] === '#' ? (p.id = x.slice(1)) : p.cls.push(x.slice(1))
    parts.push(p)
  }
  return parts.length ? parts : null
}

function one(el: El, p: Part): boolean {
  if (p.tag && el.tag !== p.tag) return false
  if (p.id && el.attrs.id !== p.id) return false
  if (p.cls.length) {
    const c = classes(el)
    if (!p.cls.every((x) => c.includes(x))) return false
  }
  return true
}

function matches(el: El, parts: Part[]): boolean {
  if (!one(el, parts[parts.length - 1])) return false
  let i = parts.length - 2
  for (let a = el.parent; a && i >= 0; a = a.parent) if (a.tag !== '#root' && one(a, parts[i])) i--
  return i < 0
}

const NAMED: Record<string, string> = { white: '#ffffff', black: '#000000', red: '#ff0000', navy: '#000080', gray: '#808080', grey: '#808080', silver: '#c0c0c0', maroon: '#800000', gold: '#ffd700', orange: '#ffa500', green: '#008000', blue: '#0000ff', teal: '#008080' }

export function toHex(v: string): string | undefined {
  const s = v.trim().toLowerCase()
  const hex = s.match(/#([0-9a-f]{3,8})\b/)
  if (hex) {
    let h = hex[1]
    if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('')
    if (h.length === 8 && parseInt(h.slice(6), 16) < 128) return undefined
    return h.length >= 6 ? `#${h.slice(0, 6)}` : undefined
  }
  const rgb = s.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+%?))?/)
  if (rgb) {
    const a = rgb[4] === undefined ? 1 : rgb[4].endsWith('%') ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4])
    if (a < 0.5) return undefined
    return '#' + [rgb[1], rgb[2], rgb[3]].map((n) => Math.min(255, +n).toString(16).padStart(2, '0')).join('')
  }
  const word = s.match(/^[a-z]+$/)?.[0]
  return word ? NAMED[word] : undefined
}
