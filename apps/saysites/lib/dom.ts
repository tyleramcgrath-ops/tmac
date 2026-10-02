// A small, forgiving HTML reader for the redesign preview: enough of a tree
// to walk a page's sections, columns and text in order. No scripts run and
// nothing is fetched; it only reads the markup.

import { decode } from './importer'

export interface El {
  tag: string
  attrs: Record<string, string>
  children: Node[]
  parent?: El
}
export type Node = El | string

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr', 'param'])
const RAW = new Set(['script', 'style', 'textarea', 'title', 'noscript', 'template'])
// Opening one of these closes an open <p>, as browsers do.
const CLOSES_P = new Set(['address', 'article', 'aside', 'blockquote', 'div', 'dl', 'fieldset', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul'])

export function parseHtml(html: string): El {
  const root: El = { tag: '#root', attrs: {}, children: [] }
  const stack: El[] = [root]
  const top = () => stack[stack.length - 1]
  const closeTo = (tag: string) => {
    for (let i = stack.length - 1; i > 0; i--) {
      if (stack[i].tag === tag) {
        stack.length = i
        return true
      }
    }
    return false
  }
  const re = /<!--[\s\S]*?-->|<![^>]*>|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g
  let at = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    if (m.index > at) top().children.push(html.slice(at, m.index))
    at = re.lastIndex
    if (m[1]) {
      closeTo(m[1].toLowerCase())
      continue
    }
    if (!m[2]) continue
    const tag = m[2].toLowerCase()
    const attrs: Record<string, string> = {}
    for (const a of (m[3] ?? '').matchAll(/([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      const k = a[1].toLowerCase()
      if (!(k in attrs)) attrs[k] = decode(a[2] ?? a[3] ?? a[4] ?? '')
    }
    if (CLOSES_P.has(tag) && stack.some((e) => e.tag === 'p')) closeTo('p')
    if (tag === 'li') {
      const open = stack.findLastIndex((e) => e.tag === 'li' || e.tag === 'ul' || e.tag === 'ol')
      if (open > 0 && stack[open].tag === 'li') stack.length = open
    }
    const el: El = { tag, attrs, children: [], parent: top() }
    top().children.push(el)
    if (VOID.has(tag) || m[4]) continue
    if (RAW.has(tag)) {
      const end = html.toLowerCase().indexOf(`</${tag}`, at)
      const stop = end < 0 ? html.length : end
      el.children.push(html.slice(at, stop))
      const close = html.indexOf('>', stop)
      at = close < 0 ? html.length : close + 1
      re.lastIndex = at
      continue
    }
    stack.push(el)
  }
  if (at < html.length) top().children.push(html.slice(at))
  return root
}

export const isEl = (n: Node): n is El => typeof n !== 'string'

export function classes(el: El): string[] {
  return (el.attrs.class ?? '').split(/\s+/).filter(Boolean)
}

export function* descendants(el: El): Generator<El> {
  for (const c of el.children) {
    if (!isEl(c)) continue
    yield c
    yield* descendants(c)
  }
}

export function find(el: El, test: (e: El) => boolean): El | undefined {
  for (const d of descendants(el)) if (test(d)) return d
  return undefined
}

export function findAll(el: El, test: (e: El) => boolean): El[] {
  return [...descendants(el)].filter(test)
}

export function ancestors(el: El): El[] {
  const out: El[] = []
  for (let p = el.parent; p; p = p.parent) out.push(p)
  return out
}

// The visible words in an element, with line breaks kept for <br>.
export function textOf(el: El | Node, skip: (e: El) => boolean = () => false): string {
  const parts: string[] = []
  const go = (n: Node) => {
    if (!isEl(n)) return void parts.push(decode(n))
    if (RAW.has(n.tag) || skip(n)) return
    if (n.tag === 'br') return void parts.push('\n')
    if (n.tag === 'img') return
    n.children.forEach(go)
    if (/^(p|div|li|h[1-6]|tr|section|article)$/.test(n.tag)) parts.push(' ')
  }
  go(el)
  return parts
    .join('')
    .replace(/[ \t\r\f\v ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
