// Logos Sofie draws are SVG. SVG can carry scripts, links and remote files,
// so it is parsed here and rebuilt from an allowlist: plain shapes, text,
// gradients and clip paths. Anything else is an error Sofie can fix.

export class SvgError extends Error {}

const ELEMENTS = new Set([
  'svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'text', 'tspan',
  'defs', 'lineargradient', 'radialgradient', 'stop', 'clippath', 'title', 'desc',
])
const ATTRS = new Set([
  'xmlns', 'viewbox', 'width', 'height', 'preserveaspectratio', 'role', 'aria-label', 'id',
  'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'dx', 'dy', 'points', 'transform',
  'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'opacity', 'clip-path', 'clip-rule',
  'font-family', 'font-size', 'font-weight', 'font-style', 'letter-spacing', 'text-anchor', 'dominant-baseline', 'textlength', 'lengthadjust',
  'offset', 'stop-color', 'stop-opacity', 'gradientunits', 'gradienttransform', 'fx', 'fy', 'spreadmethod', 'clippathunits',
])
const MAX_BYTES = 20_000

export interface CleanSvg {
  svg: string
  width: number
  height: number
}

export function sanitizeSvg(input: string): CleanSvg {
  const src = input.trim().replace(/^<\?xml[^>]*\?>\s*/i, '')
  if (src.length > MAX_BYTES) throw new SvgError(`The SVG is too big (${src.length} bytes); keep it under ${MAX_BYTES}.`)
  if (/<!|<\?/.test(src)) throw new SvgError('No DOCTYPE, CDATA, comments or processing instructions.')

  const out: string[] = []
  const stack: string[] = []
  let viewBox: number[] | null = null
  const token = /<\/?([a-zA-Z][\w-]*)((?:\s+[a-zA-Z_:][\w:.-]*\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/gy
  let pos = 0
  while (pos < src.length) {
    token.lastIndex = pos
    const m = token.exec(src)
    if (!m) throw new SvgError(`Could not read the SVG near: ${src.slice(pos, pos + 40)}`)
    pos = token.lastIndex
    const [whole, rawName, rawAttrs, selfClose, text] = m
    if (text !== undefined) {
      if (!stack.length) {
        if (text.trim()) throw new SvgError('Text outside the <svg> element.')
        continue
      }
      if (/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(text)) throw new SvgError('Only basic &amp; style entities are allowed in text.')
      out.push(text)
      continue
    }
    const name = rawName.toLowerCase()
    if (!ELEMENTS.has(name)) throw new SvgError(`<${rawName}> is not allowed in a logo. Use plain shapes, paths, text and gradients.`)
    if (whole.startsWith('</')) {
      if (stack.pop() !== name) throw new SvgError(`</${rawName}> does not match an open element.`)
      out.push(`</${rawName}>`)
      continue
    }
    if (!stack.length && name !== 'svg') throw new SvgError('The logo must be one <svg> element.')
    if (stack.length === 0 && out.length) throw new SvgError('The logo must be one <svg> element.')
    const attrs: string[] = []
    for (const a of rawAttrs.matchAll(/([a-zA-Z_:][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
      const key = a[1]
      const value = a[3] ?? a[4] ?? ''
      if (!ATTRS.has(key.toLowerCase())) throw new SvgError(`The attribute ${key}="…" is not allowed (no styles, links, events or images).`)
      if (/[<>]|javascript:|data:|expression\(/i.test(value)) throw new SvgError(`The value of ${key} is not allowed.`)
      if (/url\(/i.test(value) && !/^url\(#[\w-]+\)$/.test(value.trim())) throw new SvgError('url() may only point at a gradient or clip path in the same SVG, like url(#g1).')
      if (key === 'xmlns' && value !== 'http://www.w3.org/2000/svg') throw new SvgError('xmlns must be http://www.w3.org/2000/svg.')
      if (name === 'svg' && key.toLowerCase() === 'viewbox' && !stack.length) viewBox = value.trim().split(/[\s,]+/).map(Number)
      attrs.push(` ${key}="${value.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/gi, '&amp;')}"`)
    }
    if (name === 'svg' && !stack.length && !attrs.some((a) => a.startsWith(' xmlns='))) attrs.unshift(' xmlns="http://www.w3.org/2000/svg"')
    out.push(`<${rawName}${attrs.join('')}${selfClose ? '/' : ''}>`)
    if (!selfClose) stack.push(name)
    else if (!stack.length) throw new SvgError('The <svg> element is empty.')
  }
  if (stack.length) throw new SvgError(`<${stack[stack.length - 1]}> is never closed.`)
  if (!viewBox || viewBox.length !== 4 || viewBox.some((n) => !Number.isFinite(n)) || viewBox[2] <= 0 || viewBox[3] <= 0)
    throw new SvgError('The <svg> needs a viewBox like "0 0 320 80".')
  const [, , w, h] = viewBox
  return { svg: out.join(''), width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)) }
}
