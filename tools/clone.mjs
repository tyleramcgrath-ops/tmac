import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { createHash } from 'node:crypto'

const START_URL = process.argv[2] || process.env.TARGET_URL || 'https://truepointsystems.com/'
const OUT_DIR = join(import.meta.dirname, process.env.OUTPUT_DIR || 'theme')
const MAX_PAGES = Number(process.env.MAX_PAGES || 25)
const REQUEST_DELAY_MS = Number(process.env.REQUEST_DELAY_MS || 300)

const origin = new URL(START_URL).origin

/** Resources already downloaded this run, keyed by absolute URL. */
const assetMap = new Map()
/** Pages already queued/visited, keyed by normalized pathname. */
const pageMap = new Map()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function shortHash(input) {
  return createHash('sha1').update(input).digest('hex').slice(0, 8)
}

/** Root-relative href + on-disk path for an HTML page, given its absolute URL. */
function pagePaths(absUrl) {
  const u = new URL(absUrl)
  let pathname = u.pathname
  if (!pathname.endsWith('/') && !pathname.split('/').pop().includes('.')) {
    pathname += '/'
  }
  if (pathname === '') pathname = '/'
  const href = pathname
  const file = pathname === '/' ? 'index.html' : `${pathname.replace(/^\/|\/$/g, '')}/index.html`
  return { key: pathname, href, file: join(OUT_DIR, file) }
}

/** Root-relative href + on-disk path for a downloadable asset (css/js/img/font/etc). */
function assetPaths(absUrl) {
  const u = new URL(absUrl)
  const sameOrigin = u.origin === origin
  let relPath = sameOrigin ? u.pathname.replace(/^\//, '') : `_external/${u.hostname}${u.pathname}`
  if (!relPath || relPath.endsWith('/')) relPath += 'index'
  if (u.search) {
    const dot = relPath.lastIndexOf('.')
    const hash = shortHash(u.search)
    relPath = dot === -1 ? `${relPath}-${hash}` : `${relPath.slice(0, dot)}-${hash}${relPath.slice(dot)}`
  }
  const href = `/assets/${relPath}`
  const file = join(OUT_DIR, 'assets', relPath)
  return { href, file }
}

async function download(absUrl) {
  if (assetMap.has(absUrl)) return assetMap.get(absUrl)
  if (absUrl.startsWith('data:') || absUrl.startsWith('blob:')) return null
  const { href, file } = assetPaths(absUrl)
  assetMap.set(absUrl, href)
  try {
    const res = await fetch(absUrl)
    if (!res.ok) {
      console.warn(`  ! ${res.status} ${absUrl}`)
      return href
    }
    const buf = Buffer.from(await res.arrayBuffer())
    await mkdir(dirname(file), { recursive: true })
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('text/css')) {
      const rewritten = await rewriteCss(buf.toString('utf8'), absUrl)
      await writeFile(file, rewritten)
    } else {
      await writeFile(file, buf)
    }
    console.log(`  + ${href}`)
  } catch (err) {
    console.warn(`  ! failed ${absUrl}: ${err.message}`)
  }
  return href
}

/** Find url(...) / @import references in CSS, download them, rewrite to local paths. */
async function rewriteCss(cssText, cssUrl) {
  const urlPattern = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g
  const refs = new Set()
  for (const match of cssText.matchAll(urlPattern)) {
    const ref = match[2]
    if (!ref.startsWith('data:')) refs.add(ref)
  }
  let out = cssText
  for (const ref of refs) {
    try {
      const abs = new URL(ref, cssUrl).href
      const local = await download(abs)
      if (local) out = out.split(ref).join(local)
    } catch {
      // ignore malformed url() references
    }
  }
  return out
}

function isCrawlableSameOriginLink(href) {
  try {
    const u = new URL(href)
    if (u.origin !== origin) return false
    if (/\.(pdf|jpg|jpeg|png|gif|svg|webp|zip|mp4|mp3|doc|docx|xls|xlsx)$/i.test(u.pathname)) return false
    return true
  } catch {
    return false
  }
}

async function capturePage(browser, absUrl) {
  const page = await browser.newPage()
  await page.goto(absUrl, { waitUntil: 'networkidle' })

  // `outerHTML` serializes attributes as written in the source (often relative),
  // not the resolved absolute URL a live DOM property returns — so each entry
  // pairs the raw attribute text (what we must find-and-replace in the HTML)
  // with the resolved absolute URL (what we actually fetch/crawl).
  const data = await page.evaluate(() => {
    const pairs = (selector, attr) =>
      [...document.querySelectorAll(selector)].map((el) => ({ raw: el.getAttribute(attr), abs: el[attr] }))
    const srcsetPairs = (selector) =>
      [...document.querySelectorAll(selector)].flatMap((el) => {
        const raw = el.getAttribute('srcset')
        if (!raw) return []
        return raw
          .split(',')
          .map((entry) => entry.trim().split(/\s+/)[0])
          .filter(Boolean)
          .map((token) => ({ raw: token, abs: new URL(token, location.href).href }))
      })
    return {
      html: document.documentElement.outerHTML,
      stylesheets: pairs('link[rel="stylesheet"][href]', 'href'),
      scripts: pairs('script[src]', 'src'),
      images: pairs('img[src]', 'src'),
      srcsetUrls: srcsetPairs('img[srcset], source[srcset]'),
      icons: pairs('link[rel~="icon"][href], link[rel="apple-touch-icon"][href]', 'href'),
      links: pairs('a[href]', 'href'),
    }
  })

  const shot = await page.screenshot({ fullPage: true })
  await page.close()

  const { file: pageFile, key: pageKey } = pagePaths(absUrl)
  await mkdir(dirname(pageFile), { recursive: true })
  await writeFile(join(dirname(pageFile), 'screenshot.png'), shot)

  const assetPairs = [...data.stylesheets, ...data.scripts, ...data.images, ...data.srcsetUrls, ...data.icons]
  const replacements = new Map()
  for (const { raw, abs } of assetPairs) {
    if (!raw) continue
    const local = await download(abs)
    if (local) replacements.set(raw, local)
    await sleep(REQUEST_DELAY_MS)
  }
  for (const { raw, abs } of data.links) {
    if (!raw || !isCrawlableSameOriginLink(abs)) continue
    const { href } = pagePaths(abs)
    replacements.set(raw, href)
  }

  let html = data.html
  for (const [raw, local] of [...replacements.entries()].sort((a, b) => b[0].length - a[0].length)) {
    html = html.split(raw).join(local)
  }
  html = `<!doctype html>\n${html}`
  await writeFile(pageFile, html)

  const nextLinks = data.links.map(({ abs }) => abs).filter(isCrawlableSameOriginLink)
  return { pageKey, nextLinks }
}

async function crawl() {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined })
  const queue = [START_URL]
  const { key: startKey } = pagePaths(START_URL)
  pageMap.set(startKey, START_URL)

  try {
    while (queue.length && pageMap.size <= MAX_PAGES) {
      const current = queue.shift()
      console.log(`\n> ${current}`)
      const { nextLinks } = await capturePage(browser, current)
      for (const link of nextLinks) {
        const { key } = pagePaths(link)
        if (!pageMap.has(key) && pageMap.size < MAX_PAGES) {
          pageMap.set(key, link)
          queue.push(link)
        }
      }
      await sleep(REQUEST_DELAY_MS)
    }
  } finally {
    await browser.close()
  }

  const manifest = {
    source: START_URL,
    capturedAt: new Date().toISOString(),
    pages: [...pageMap.entries()].map(([key, url]) => ({ path: key, url })),
    assetCount: assetMap.size,
  }
  await writeFile(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))

  console.log(`\nDone. ${pageMap.size} page(s), ${assetMap.size} asset(s) written to ${OUT_DIR}`)
  console.log(`Preview with: npx serve ${OUT_DIR}`)
}

crawl().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
