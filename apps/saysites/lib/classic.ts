// "Your site, as it is": a page of the owner's current website kept exactly
// as it looks, served by SaySites. Their own markup and stylesheets, so the
// layout, fonts, colours and photos are theirs, not a rebuild. What changes:
// no scripts run (safer and faster; a Content-Security-Policy enforces it),
// the stylesheets are inlined and trimmed to the rules the page uses,
// lazy-loaded photos and "fade in on scroll" content show at once, links go
// to the pages' SaySites addresses, and forms send to SaySites.
//
// Some sites draw themselves with JavaScript (site builders that render in
// the browser, script-driven sliders as the first thing on the page). Those
// can't be copied faithfully without running their code, so `faithful` is
// false and the preview offers only the redesign rather than a copy that
// doesn't look like theirs.

import { findAll, isEl, parseHtml, textOf, type El } from './dom'
import { decode, type Fetcher } from './importer'

export interface ClassicResult {
  html: string
  faithful: boolean
  // Why not, in plain words (for the team's view and the tests).
  reasons: string[]
}

export type SheetCache = Map<string, Promise<string | null>>

const MAX_SHEETS = 40
const MAX_CSS = 3_000_000

// Fetches one stylesheet, its @imports inlined, its url()s made absolute.
async function sheet(href: string, get: Fetcher, cache: SheetCache, depth = 0): Promise<string | null> {
  const hit = cache.get(href)
  if (hit) return hit
  const job = (async () => {
    const r = await get(href).catch(() => null)
    if (!r || r.status !== 200 || /^\s*<(!doctype|html)/i.test(r.body.slice(0, 200))) return null
    let css = absoluteUrls(r.body, r.url || href)
    if (depth < 2) {
      const imports = [...css.matchAll(/@import\s+(?:url\()?\s*["']?([^"')\s;]+)["']?\s*\)?\s*([^;]*);/gi)]
      for (const m of imports) {
        let u: string
        try {
          u = new URL(m[1], r.url || href).href
        } catch {
          continue
        }
        const inner = await sheet(u, get, cache, depth + 1)
        const media = m[2].trim()
        css = css.replace(m[0], inner ? (media ? `@media ${media}{${inner}}` : inner) : '')
      }
    }
    return css
  })()
  cache.set(href, job)
  return job
}

export function absoluteUrls(css: string, base: string): string {
  return css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (m, _q: string, raw: string) => {
    const v = raw.trim()
    if (/^(data:|#|about:)/i.test(v)) return m
    try {
      const u = new URL(v, base)
      if (u.protocol === 'http:') u.protocol = 'https:'
      return `url("${u.href.replace(/"/g, '%22')}")`
    } catch {
      return m
    }
  })
}

// ---------------------------------------------------------------------------
// Trimming the CSS to what the page uses
// ---------------------------------------------------------------------------

// The page's classes, ids and tags; a rule stays when every class, id and
// tag it names appears on the page (states like :hover and ::before are
// kept with their element).
export function usedTokens(html: string): Set<string> {
  const used = new Set<string>()
  for (const m of html.matchAll(/<([a-zA-Z][\w-]*)/g)) used.add(m[1].toLowerCase())
  for (const m of html.matchAll(/\sclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) for (const c of (m[1] ?? m[2] ?? m[3] ?? '').split(/\s+/)) if (c) used.add(`.${c}`)
  for (const m of html.matchAll(/\sid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) used.add(`#${(m[1] ?? m[2] ?? m[3] ?? '').trim()}`)
  return used
}

function selectorUsed(sel: string, used: Set<string>): boolean {
  // Attribute and pseudo-class arguments ([type=x], :not(.a), :is(...))
  // aren't required to exist.
  const bare = sel.replace(/\[[^\]]*\]/g, '').replace(/::?[\w-]+\([^()]*(?:\([^()]*\)[^()]*)*\)/g, '').replace(/::?[\w-]+/g, '')
  for (const m of bare.matchAll(/([.#])((?:\\.|[\w-])+)/g)) if (!used.has(m[1] + m[2].replace(/\\(.)/g, '$1'))) return false
  for (const m of bare.matchAll(/(?:^|[\s>+~(,])([a-zA-Z][\w-]*)/g)) {
    const tag = m[1].toLowerCase()
    if (!used.has(tag) && !/^(html|body)$/.test(tag)) return false
  }
  return true
}

// Splits CSS into top-level blocks: [prelude, body] pairs, comments dropped.
function blocks(css: string): { pre: string; body: string | null }[] {
  const out: { pre: string; body: string | null }[] = []
  let i = 0
  let start = 0
  const n = css.length
  while (i < n) {
    const c = css[i]
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      const stop = end < 0 ? n : end + 2
      if (start === i) start = stop
      else css = css.slice(0, i) + ' '.repeat(stop - i) + css.slice(stop)
      i = stop
      continue
    }
    if (c === '"' || c === "'") {
      const q = c
      i++
      while (i < n && css[i] !== q) i += css[i] === '\\' ? 2 : 1
      i++
      continue
    }
    if (c === ';' && start <= i) {
      // A statement at the top level (@charset, @import, a stray one).
      out.push({ pre: css.slice(start, i).trim(), body: null })
      start = i + 1
      i++
      continue
    }
    if (c === '{') {
      let depth = 1
      let j = i + 1
      while (j < n && depth) {
        const d = css[j]
        if (d === '"' || d === "'") {
          const q = d
          j++
          while (j < n && css[j] !== q) j += css[j] === '\\' ? 2 : 1
        } else if (d === '/' && css[j + 1] === '*') {
          const e = css.indexOf('*/', j + 2)
          j = e < 0 ? n : e + 1
        } else if (d === '{') depth++
        else if (d === '}') depth--
        j++
      }
      out.push({ pre: css.slice(start, i).trim(), body: css.slice(i + 1, j - 1) })
      i = j
      start = j
      continue
    }
    if (c === '}') {
      // An unbalanced close: skip it.
      start = i + 1
    }
    i++
  }
  return out
}

export function pruneCss(css: string, used: Set<string>): string {
  let out = ''
  for (const b of blocks(css)) {
    if (b.body === null) {
      if (/^@(charset|import|namespace)/i.test(b.pre) || !b.pre) continue
      continue
    }
    const pre = b.pre
    if (pre.startsWith('@')) {
      const at = pre.match(/^@(-[\w]+-)?([\w-]+)/)?.[2]?.toLowerCase() ?? ''
      if (at === 'media' || at === 'supports' || at === 'layer' || at === 'container' || at === 'document') {
        if (/^@media\s+print\b/i.test(pre)) continue
        const inner = pruneCss(b.body, used)
        if (inner) out += `${pre}{${inner}}`
      } else if (at === 'font-face' || at === 'keyframes' || at === 'page' || at === 'property' || at === 'counter-style' || at === 'font-feature-values') {
        out += `${pre}{${b.body.trim()}}`
      }
      continue
    }
    const sels = splitSelectors(pre).filter((s) => selectorUsed(s, used))
    if (sels.length) out += `${sels.join(',')}{${b.body.trim()}}`
  }
  return out
}

function splitSelectors(pre: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of pre) {
    if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    if (ch === ',' && depth === 0) {
      if (cur.trim()) out.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

// Fonts the page's CSS still asks for, and nothing else: @font-face rules
// for families no rule uses are dropped.
export function dropUnusedFonts(css: string): string {
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/gi)]
  if (!faces.length) return css
  const rest = css.replace(/@font-face\s*\{[^}]*\}/gi, '')
  const usedFamilies = new Set<string>()
  for (const m of rest.matchAll(/font(?:-family)?\s*:([^;}]*)/gi)) for (const f of m[1].split(',')) usedFamilies.add(f.trim().replace(/^["']|["']$/g, '').toLowerCase())
  for (const m of rest.matchAll(/--[\w-]+\s*:([^;}]*)/g)) for (const f of m[1].split(',')) usedFamilies.add(f.trim().replace(/^["']|["']$/g, '').toLowerCase())
  return css.replace(/@font-face\s*\{([^}]*)\}/gi, (m, body: string) => {
    const fam = body.match(/font-family\s*:\s*([^;]+)/i)?.[1]?.trim().replace(/^["']|["']$/g, '').toLowerCase()
    return !fam || usedFamilies.has(fam) ? m : ''
  })
}

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

// Content that themes hide until a script reveals it (scroll animations,
// lazy-loaded photos and backgrounds), shown from the start.
export const REVEAL_CSS = [
  '.elementor-invisible{visibility:visible!important}',
  // Scroll-reveal effects that wait for a script to add a class.
  ':is([class*="animat"],[class*="reveal"],[class*="fade-in"],[class*="fadeIn"],[class*="fade_in"],.et_animated,.sal-animate,[data-sal]):not([class*="menu"],[class*="dropdown"],[class*="popup"],[class*="modal"],[class*="drawer"],[class*="hamburger"],[class*="mobile"],[class*="hidden"],[class*="tooltip"],[class*="overlay"]){opacity:1!important;visibility:visible!important}',
  '.tf_lazy:before,.tf_lazy:after{display:none!important}',
  '[data-aos]{opacity:1!important;transform:none!important}',
  '.wow{visibility:visible!important;animation:none!important}',
  '.fl-animation{opacity:1!important;transform:none!important}',
  '.et-waypoint:not(.et_pb_counters),.et_pb_animation_off,[class*="et_pb_animation_"]{opacity:1!important;transform:none!important}',
  '.av-animated-generic,.avia_animate_when_visible,.av-animated-when-visible,.av_font_icon.avia_animate_when_visible{opacity:1!important;transform:none!important;visibility:visible!important}',
  '.fusion-animated{visibility:visible!important}',
  '.lazyload,.lazyloading,.lazy,[data-ll-status]{opacity:1!important}',
  '.vc_custom_heading.wpb_animate_when_almost_visible,.wpb_animate_when_almost_visible{opacity:1!important}',
  '.sqs-block-image .image-block-wrapper img,.sqs-image img{opacity:1!important}',
  '[data-animation],[data-animate]{opacity:1!important}',
  // Sliders show their first slide, as they do before anyone clicks.
  '.flexslider .slides>li:first-child{display:block!important}.flexslider.loading{background-image:none!important}',
  '.owl-carousel{display:block!important}.owl-carousel:not(.owl-loaded)>:not(:first-child){display:none!important}',
  '.slick-slider:not(.slick-initialized)>:not(:first-child){display:none!important}',
  '.tf_swiper-slide:first-child,.swiper-slide:first-child,.avia-slideshow-slide:first-child,.carousel-item:first-child{opacity:1!important;visibility:visible!important}',
  '.carousel-item:first-child{display:block!important}',
  '.preloader,#preloader,.loader-wrap,#loader,.page-loader,.site-preloader{display:none!important}',
].join('')

// Class names that only mark a state a script would change: not loaded
// yet, or waiting to animate in. Menus, pop-ups and the like keep theirs.
const STATE_CLASS = /lazy|animat|^wow$|^aos|reveal|^fade-?in|fadein|^slide-?in-|^zoom-?in|^elementor-invisible$|^et_pb_animation|^sal-|^scroll-?anim|^js-anim|^will-animate|^not-visible$|^invisible-until/i
const KEEP_CLASS = /lazy-?loaded|menu|dropdown|nav|hamburger|popup|modal|drawer|tooltip|mobile|toggle|accordion|tab/i

// Lazy-loading attributes, in the order loaders use them.
const LAZY_SRC = ['data-lazy-src', 'data-src', 'data-original', 'data-lazy', 'data-orig-src', 'data-src-fg', 'data-image']
const LAZY_SET = ['data-lazy-srcset', 'data-srcset']

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  return m ? decode(m[1] ?? m[2] ?? m[3] ?? '') : undefined
}
function setAttr(tag: string, name: string, value: string): string {
  const v = value.replace(/"/g, '&quot;')
  const re = new RegExp(`\\s${name}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+)`, 'i')
  if (re.test(tag)) return tag.replace(re, ` ${name}="${v}"`)
  return tag.replace(/\s*(\/?)>$/, ` ${name}="${v}"$1>`)
}
function dropAttr(tag: string, name: string): string {
  return tag.replace(new RegExp(`\\s${name}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+)`, 'gi'), '')
}

const placeholder = (v: string | undefined) => !v || /^data:/i.test(v) || /blank|placeholder|spacer|lazy|transparent|1x1|pixel|loading/i.test(v)

export interface ClassicOptions {
  // Old address (absolute) → the page's address on SaySites, or undefined
  // to leave the link pointing at the old site.
  link: (href: string) => string | undefined
  // Where forms send on SaySites ("" in a preview, which never sends).
  formAction?: string
}

export async function classicPage(html: string, pageUrl: string, get: Fetcher, cache: SheetCache, opts: ClassicOptions): Promise<ClassicResult> {
  const reasons = jsOnly(html)
  const abs = (v: string): string => {
    try {
      const u = new URL(v.trim(), pageUrl)
      if (u.protocol === 'http:' && u.hostname !== 'localhost') u.protocol = 'https:'
      return u.href
    } catch {
      return v
    }
  }
  const absSet = (v: string) =>
    v
      .split(',')
      .map((part) => {
        const [u, ...rest] = part.trim().split(/\s+/)
        return u ? [abs(u), ...rest].join(' ') : ''
      })
      .filter(Boolean)
      .join(', ')

  let doc = html
    .replace(/^\uFEFF/, '')
    // Stylesheets loaded late by a script are part of the look: "media=print"
    // swapped to "all" on load, or preloaded and switched on.
    .replace(/<link\b[^>]*>/gi, (l) => {
      let out = l
      const onload = out.match(/\sonload\s*=\s*("[^"]*"|'[^']*')/i)?.[1] ?? ''
      if (/\bmedia\s*=\s*["']?print/i.test(out) && /media/i.test(onload)) out = out.replace(/\bmedia\s*=\s*(["']?)print\1/i, 'media="all"')
      if (/\brel\s*=\s*["']?preload/i.test(out) && /\bas\s*=\s*["']?style/i.test(out) && /stylesheet/i.test(onload)) out = out.replace(/\brel\s*=\s*(["']?)preload\1/i, 'rel="stylesheet"')
      return out
    })
    // Comments: "everyone but old IE" markers keep what they wrap; old-IE
    // blocks go; then ordinary comments.
    .replace(/<!--\[if[^\]]*\]>\s*<!-->/gi, '')
    .replace(/<!--\s*<!\[endif\]\s*-->/gi, '')
    .replace(/<!--\[if[^\]]*\]>[\s\S]*?<!\[endif\]\s*-->/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Scripts never run here; JSON-LD is data and stays.
    .replace(/<script\b([^>]*)>[\s\S]*?<\/script\s*>/gi, (m, a: string) => (/application\/ld\+json/i.test(a) ? m : ''))
    .replace(/<script\b[^>]*\/>/gi, '')
    .replace(/<(object|embed|applet|portal)\b[\s\S]*?(<\/\1\s*>|\/>)/gi, '')
    .replace(/<template\b[\s\S]*?<\/template\s*>/gi, '')
    .replace(/<meta\b[^>]*http-equiv\s*=\s*["']?(refresh|content-security-policy|set-cookie)[^>]*>/gi, '')
    .replace(/<base\b[^>]*>/gi, '')
    // Hints for scripts that no longer load.
    .replace(/<link\b[^>]*rel\s*=\s*["']?(?:modulepreload|preload|prefetch|prerender)["']?[^>]*>/gi, (m) => (/\bas\s*=\s*["']?(font|style|image)/i.test(m) ? m : ''))
    // No-script styles hide lazy photos that we show; the rest of a
    // <noscript> (often the real photo) is what a visitor without scripts
    // sees, which is now everyone.
    .replace(/<noscript\b[^>]*>([\s\S]*?)<\/noscript\s*>/gi, (_m, inner: string) => {
      if (/^\s*<style/i.test(inner)) return ''
      if (/^\s*<img\b[^>]*>\s*$/i.test(inner)) return '' // the lazy copy beside it is fixed instead
      if (/<(iframe|img)\b[^>]*(googletagmanager|facebook\.com\/tr|analytics|pixel)/i.test(inner)) return ''
      if (/javascript|enable (scripts|js)/i.test(inner.replace(/<[^>]+>/g, ' ')) && inner.replace(/<[^>]+>/g, '').trim().length < 300) return ''
      return inner
    })

  // Every opening tag: no event handlers or script URLs; absolute sources;
  // lazy photos made ordinary; links moved to their SaySites addresses.
  doc = doc.replace(/<([a-zA-Z][\w:-]*)(\s(?:[^>"']|"[^"]*"|'[^']*')*)?>/g, (tag, name: string) => {
    const t = name.toLowerCase()
    if (t === 'html' || t === '!doctype') return tag
    let out = tag.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    out = out.replace(/\s(href|src|action|formaction|xlink:href|poster|data)\s*=\s*(["']?)\s*(?:javascript|vbscript):[^"'>]*\2/gi, '')
    if (t === 'img' || t === 'source' || t === 'iframe' || t === 'video') {
      const lazy = LAZY_SRC.map((a) => attr(out, a)).find((v) => v && !/^data:/i.test(v))
      if (lazy && placeholder(attr(out, 'src'))) out = setAttr(out, 'src', lazy)
      const lazySet = LAZY_SET.map((a) => attr(out, a)).find(Boolean)
      if (lazySet) out = setAttr(out, 'srcset', lazySet)
      const sizes = attr(out, 'data-sizes')
      if (sizes && sizes !== 'auto') out = setAttr(out, 'sizes', sizes)
      else if (sizes === 'auto' && lazySet) out = setAttr(out, 'sizes', '100vw')
      for (const a of [...LAZY_SRC, ...LAZY_SET, 'data-sizes', 'data-ll-status']) out = dropAttr(out, a)
      if (t === 'img' && /\bsrc\s*=/.test(out)) out = out.replace(/\sclass\s*=\s*(["'])([^"']*)\1/i, (_m, q: string, c: string) => ` class=${q}${c.replace(/(^|\s)(lazyload|lazyloading|lazy|lazy-hidden|jetpack-lazy-image)(?=\s|$)/g, '$1lazyloaded')}${q}`)
      const src = attr(out, 'src')
      if (src) out = setAttr(out, 'src', abs(src))
      const set = attr(out, 'srcset')
      if (set) out = setAttr(out, 'srcset', absSet(set))
      if (t === 'iframe') {
        const s = attr(out, 'src') ?? ''
        if (!/^https:\/\//i.test(s)) return ''
        out = setAttr(dropAttr(out, 'sandbox'), 'sandbox', 'allow-scripts allow-same-origin allow-popups allow-presentation')
        out = setAttr(out, 'loading', 'lazy')
      }
    } else if (/\sdata-lazy\s*=/i.test(out)) out = dropAttr(out, 'data-lazy')
    // Classes that only mean "not loaded yet" (they hide photos and
    // backgrounds until a script swaps them): loaded is the state we show.
    // So are scroll-animation hooks (the theme's static look is what's
    // under them).
    out = out.replace(/\sclass\s*=\s*(["'])([^"']*)\1/i, (_m, q: string, c: string) => ` class=${q}${c.split(/\s+/).filter((k) => !STATE_CLASS.test(k) || KEEP_CLASS.test(k)).join(' ')}${q}`)
    for (const a of ['data-aos', 'data-aos-delay', 'data-aos-duration', 'data-aos-offset', 'data-aos-easing', 'data-sal', 'data-sal-delay', 'data-sal-duration', 'data-animate', 'data-animation', 'data-wow-delay', 'data-wow-duration', 'data-settings-animation']) out = dropAttr(out, a)
    // A photo waiting in data-src on a box (UIkit, some themes) is its background.
    if (t !== 'img' && t !== 'source' && t !== 'iframe' && t !== 'video' && t !== 'script') {
      const ds = attr(out, 'data-src')
      if (ds && /\.(jpe?g|png|webp|avif|gif)(\?|$)/i.test(ds) && !/background(-image)?\s*:[^;]*url\(/i.test(attr(out, 'style') ?? '')) {
        const style = attr(out, 'style') ?? ''
        out = setAttr(dropAttr(out, 'data-src'), 'style', `${style ? style.replace(/;?\s*$/, ';') : ''}background-image:url('${abs(ds)}')`)
      }
    }
    // Lazy backgrounds.
    const bg = attr(out, 'data-bg') ?? attr(out, 'data-background-image') ?? attr(out, 'data-bg-image') ?? attr(out, 'data-background') ?? attr(out, 'data-lazy-background') ?? attr(out, 'data-bgset')
    if (bg && !/^data:/i.test(bg) && !/url\(\s*["']?data:/i.test(bg)) {
      const url = bg.replace(/^url\(\s*["']?|["']?\s*\)$/g, '').split(/\s*,\s*|\s+\d+w/)[0]
      const style = attr(out, 'style') ?? ''
      if (url && !/background(-image)?\s*:[^;]*url\(/i.test(style)) out = setAttr(out, 'style', `${style ? style.replace(/;?\s*$/, ';') : ''}background-image:url('${abs(url)}')`)
    }
    for (const a of ['href', 'poster']) {
      const v = attr(out, a)
      if (v === undefined) continue
      if (a === 'href' && t === 'a') {
        const to = /^(#|mailto:|tel:|sms:)/i.test(v.trim()) ? v : opts.link(abs(v)) ?? abs(v)
        out = setAttr(out, 'href', to)
      } else if (a === 'href' && t === 'link') out = setAttr(out, 'href', abs(v))
      else if (a === 'poster') out = setAttr(out, 'poster', abs(v))
    }
    const style = attr(out, 'style')
    if (style && /url\(/i.test(style)) out = setAttr(out, 'style', absoluteUrls(style.replace(/&quot;/g, '"'), pageUrl).replace(/"/g, "'"))
    if (t === 'form') {
      out = dropAttr(dropAttr(dropAttr(out, 'action'), 'target'), 'enctype')
      out = setAttr(setAttr(out, 'method', 'post'), 'action', opts.formAction ?? '')
      // SaySites reads the form's own fields (lib/serve classicFields).
      return `${out}<input type="hidden" name="form" value="classic">`
    }
    if (t === 'a' && attr(out, 'target') === '_blank') out = setAttr(out, 'rel', 'noopener')
    return out
  })

  // Their stylesheets, inlined where each was linked, so the order (and so
  // the look) stays theirs.
  const seenSheet = new Set<string>()
  const links = [...doc.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).filter((l) => /\brel\s*=\s*["']?[^"'>]*stylesheet/i.test(l) && !/\balternate\b/i.test(attr(l, 'rel') ?? '')).slice(0, MAX_SHEETS)
  // The same file linked twice loads once.
  const firstOf = links.map((l) => {
    const h = attr(l, 'href')
    const k = h ? abs(h) : l
    if (seenSheet.has(k)) return false
    seenSheet.add(k)
    return true
  })
  const loaded = await Promise.all(
    links.map(async (l, i) => {
      const href = attr(l, 'href')
      if (!href || !firstOf[i]) return null
      const media = attr(l, 'media')
      if (media && /^\s*print\s*$/i.test(media)) return null
      const css = await sheet(abs(href), get, cache)
      return css === null ? null : { css, media: media && !/^\s*(all|screen)\s*$/i.test(media) ? media : undefined }
    })
  )
  // Inline <style> blocks get absolute urls too.
  doc = doc.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi, (_m, a: string, css: string, b: string) => `${a}${absoluteUrls(css, pageUrl)}${b}`)

  // Trim to what this page uses, then put each sheet in place.
  const body = doc.match(/<body\b[\s\S]*$/i)?.[0] ?? doc
  const used = usedTokens(body)
  const scripted = scriptedCarousels([...loaded.map((x) => x?.css ?? ''), ...[...doc.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)].map((m) => m[1])].join('\n'), used)
  if (scripted.length) reasons.push(`A carousel (${scripted.slice(0, 3).join(', ')}) is laid out by a script.`)
  // Classes their scripts would add, kept so the matching rules apply.
  for (const c of ['.lazyloaded', '.e-lazyloaded', '.loaded', '.is-loaded', '.js']) used.add(c)
  let total = 0
  links.forEach((l, i) => {
    const s = loaded[i]
    let css = s ? pruneCss(s.css, used) : ''
    if (total + css.length > MAX_CSS) css = ''
    total += css.length
    const block = css ? `<style${s?.media ? ` media="${s.media.replace(/"/g, '')}"` : ''}>${css}</style>` : ''
    doc = doc.replace(l, () => block)
  })
  // Inline <style> blocks trimmed the same way (themes print a lot of CSS
  // into the page).
  doc = doc.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi, (_m, a: string, css: string, b: string) => {
    const pruned = css.length > 4000 ? pruneCss(css, used) : css
    return `${a}${pruned}${b}`
  })
  // Fonts nothing uses any more.
  doc = doc.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi, (_m, a: string, css: string, b: string) => `${a}${dropUnusedFonts(css)}${b}`)
  // Remaining links to stylesheets we couldn't read: leave none behind
  // (they'd still load from their old server).
  for (const l of links) doc = doc.replace(l, '')

  // The page is shown with everything visible, and a script-free page
  // never waits on scripts: html.no-js stays as their theme expects.
  const fix = `<style id="ss-classic">${REVEAL_CSS}</style>`
  doc = /<\/head\s*>/i.test(doc) ? doc.replace(/<\/head\s*>/i, `${fix}</head>`) : fix + doc
  if (!/<meta\b[^>]*name\s*=\s*["']?viewport/i.test(doc)) doc = doc.replace(/<head\b[^>]*>/i, (h) => `${h}<meta name="viewport" content="width=device-width,initial-scale=1">`)
  if (!/^\s*<!doctype/i.test(doc)) doc = `<!doctype html>${doc}`
  return { html: doc, faithful: reasons.length === 0, reasons }
}

// Carousels whose look comes from classes their script adds (slick, Owl,
// FlexSlider, Splide, Glide, Tiny Slider): the stylesheet styles "#reviews .slick-slide"
// and the page has #reviews. Without the script they'd show as a plain list,
// so the copy wouldn't match. Swiper lays out close enough without its script.
const SCRIPTED = /\.(slick-(?:slide|track|list|initialized|dots)|owl-(?:item|stage|stage-outer|loaded)|flex-(?:viewport|active-slide|control-nav)|splide__(?:slide|track|list)|glide__(?:slide|track|slides)|tns-(?:item|outer|inner|ovh|slider))\b/
export function scriptedCarousels(css: string, used: Set<string>): string[] {
  const out = new Set<string>()
  for (const m of css.matchAll(/([^{}@;]+)\{/g)) {
    if (!SCRIPTED.test(m[1])) continue
    for (const sel of m[1].split(',')) {
      const i = sel.search(SCRIPTED)
      if (i <= 0) continue
      const anchor = sel.slice(0, i).trim().split(/[\s>+~]+/).pop()?.match(/[#.][\w-]+/g)?.pop()
      if (!anchor || /slick|owl|flex|splide|glide|^\.(container|loading|row|wrapper|inner)$/i.test(anchor)) continue
      // The script's own class already in the page means it was drawn on
      // the server, which is fine.
      const token = sel.slice(i).match(SCRIPTED)![0]
      if (used.has(anchor) && !used.has(token)) out.add(anchor)
    }
  }
  return [...out]
}

// Sites that draw their content with JavaScript: copying the markup alone
// wouldn't look like them.
export function jsOnly(html: string): string[] {
  const out: string[] = []
  const body = html.match(/<body\b[\s\S]*$/i)?.[0] ?? html
  const text = body
    .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length < 200) out.push('The page draws its words with JavaScript.')
  if (/static\.parastorage\.com|wix-thunderbolt|_wixCssImports/i.test(html)) out.push('Wix builds the page in the browser.')
  if (/<div\s+id=["'](root|app|__next|___gatsby)["'][^>]*>\s*<\/div>/i.test(body)) out.push('The page is an app that draws itself in the browser.')
  // Slideshows and carousels: a script shows one slide at a time (often
  // starting at random); without it the slides stack up. Bundled scripts
  // hide which library runs them, so any box of two or more slides counts.
  const root = parseHtml(body)
  const SHOW = /(^|[\s_-])(slider|carousel|swiper|slick|owl-carousel|flexslider|flickity|splide|glide|slideshow|slides|bxslider|cycle-slideshow|rotator|marquee)([\s_-]|$)/i
  const real = (e: El) => textOf(e).trim().length > 2 || !!findAll(e, (d) => d.tag === 'img').length
  const shows = findAll(root, (e) => SHOW.test(e.attrs.class ?? '') && !/(^|[\s_-])(menu|nav|navbar)([\s_-]|$)/i.test(e.attrs.class ?? '') && e.children.filter(isEl).filter((c) => !/^(script|style|button|nav|ol|ul)$/.test(c.tag) && real(c)).length >= 2)
  const list = findAll(root, (e) => (e.tag === 'ul' || e.tag === 'ol') && SHOW.test(e.attrs.class ?? '') && e.children.filter(isEl).filter((c) => c.tag === 'li' && real(c) && !!findAll(c, (d) => d.tag === 'img').length).length >= 2)
  if (shows.length || list.length) out.push('A slideshow or carousel is run by a script.')
  // Page builders that lay pages out (backgrounds, columns) with scripts,
  // and pages whose scripts were rewritten to run later (mod_pagespeed).
  if (/themify-builder|\btb_[a-z0-9]{7}\b|themify_builder/i.test(html)) out.push('Themify draws parts of the page with a script.')
  if (/type=["']text\/psajs["']|data-pagespeed-orig-type/i.test(html)) out.push('The page’s scripts are rewritten to run after it loads.')
  // Menus that fold extra links into "More" with a script look different
  // on phones without it.
  if (/data-overflow-menu-label|\bpriority-nav\b|class=["'][^"']*\bpriority_\d+\b/i.test(body)) out.push('The menu rearranges itself with a script.')
  // A script-driven slider at the top of the page lays its words out
  // with JavaScript.
  const top = body.slice(0, Math.max(20000, Math.floor(body.length * 0.25)))
  if (/<rs-module\b|class=["'][^"']*\brev_slider\b|class=["'][^"']*\bls-wp-container\b|class=["'][^"']*\bn2-section-smartslider\b|class=["'][^"']*\bmetaslider\b|class=["'][^"']*\bsoliloquy\b/i.test(top)) out.push('The opening slideshow is drawn by a script.')
  return out
}

// ---------------------------------------------------------------------------
// Words on a kept page
// ---------------------------------------------------------------------------

const CODE = /(<(script|style|template|svg)\b[\s\S]*?<\/\2\s*>|<[^>]*>)/gi

// The page's readable words (for Sofie and search), without its code.
export function keptText(html: string): string {
  const body = html.match(/<body\b[\s\S]*$/i)?.[0] ?? html
  return decode(body.replace(CODE, ' ')).replace(/\s+/g, ' ').trim()
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Replaces words in the page's text only: never in tags, attributes,
// scripts or styles. The words match as written, with or without the
// page's own &amp;-style escapes.
export function replaceKeptWords(html: string, find: string, replace: string): { html: string; count: number } {
  const target = find.trim()
  if (!target) return { html, count: 0 }
  const forms = [...new Set([target, esc(target), target.replace(/'/g, '&#8217;'), target.replace(/'/g, '’')])]
  let count = 0
  const swap = (text: string) => {
    let t = text
    for (const f of forms) {
      const n = t.split(f).length - 1
      if (n) {
        count += n
        t = t.split(f).join(esc(replace))
      }
    }
    return t
  }
  let out = ''
  let at = 0
  for (const m of html.matchAll(CODE)) {
    out += swap(html.slice(at, m.index)) + m[0]
    at = m.index! + m[0].length
  }
  out += swap(html.slice(at))
  // A phone number: its call links change with it.
  const was = target.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '')
  const now = replace.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '')
  if (was.length === 10 && now.length === 10) {
    out = out.replace(/href\s*=\s*(["'])tel:([^"']*)\1/gi, (m, q: string, n: string) => {
      if (n.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '') !== was) return m
      count++
      return `href=${q}tel:+1${now}${q}`
    })
  }
  return { html: out, count }
}

// The page's Google title and description, as set in SaySites (the SEO tab
// and Sofie change them), in place of the old ones.
export function withSeo(html: string, seo: { title: string; description: string; noindex?: boolean }): string {
  let out = html
  if (seo.noindex) out = out.replace(/<meta\b[^>]*name\s*=\s*["']?robots["']?[^>]*>/gi, '').replace(/<head\b[^>]*>/i, (h) => `${h}<meta name="robots" content="noindex">`)
  const title = `<title>${esc(seo.title)}</title>`
  out = /<title\b[^>]*>[\s\S]*?<\/title\s*>/i.test(out) ? out.replace(/<title\b[^>]*>[\s\S]*?<\/title\s*>/i, () => title) : out.replace(/<head\b[^>]*>/i, (h) => h + title)
  const meta = `<meta name="description" content="${esc(seo.description).replace(/"/g, '&quot;')}">`
  out = /<meta\b[^>]*name\s*=\s*["']?description["']?[^>]*>/i.test(out) ? out.replace(/<meta\b[^>]*name\s*=\s*["']?description["']?[^>]*>/i, () => meta) : out.replace(/<\/title\s*>/i, (t) => t + meta)
  return out
}
