// Checks a free redesign preview against the real site before anyone relies
// on it: screenshots their site, "your site, as it is" and the redesign, on
// a computer and a phone, and scores how much of the copy matches their site
// pixel for pixel. Runs on a machine with Chromium (the team's or Claude's
// cloud session), never on the SaySites host.
//
//   npx tsx scripts/compare-preview.ts https://example-law.com [out-dir]
//     Builds a preview here and compares (for tuning lib/classic).
//   npx tsx scripts/compare-preview.ts https://example-law.com [out-dir] --preview <id>
//     Compares their site with the copy SaySites serves for preview <id>
//     (SAYSITES_URL, default https://saysites.com) and, with
//     PREVIEW_CHECK_TOKEN set, records the result: the copy is offered on
//     the preview only once both scores reach COPY_PASS (lib/redesign).
//
// Writes <out-dir>/<host>-{site,copy,redesign}-{desktop,phone}.png and prints
// the scores. Pop-ups (cookie banners, chat) on their site count as
// differences, so a copy can fail on them: the check errs on the side of
// not offering a copy.

import { execFile } from 'child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { createRequire } from 'module'
import { tmpdir } from 'os'
import { join, resolve } from 'path'
import { promisify } from 'util'
import type { Fetcher } from '../lib/importer'
import { buildPreview, COPY_PASS } from '../lib/redesign'
import { renderPage } from '../lib/render'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? '/opt/node22/lib/node_modules/playwright')
const CHROME = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const run = promisify(execFile)
type Route = { request(): { url(): string; method(): string }; fulfill(o: object): Promise<void>; continue(): Promise<void>; abort(): Promise<void> }

async function main() {
  const input = process.argv[2]
  if (!input) throw new Error('Give the website address, e.g. npx tsx scripts/compare-preview.ts https://example.com')
  const flag = (k: string) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : undefined }
  const previewId = flag('preview')
  const out = resolve(process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 'previews')
  mkdirSync(out, { recursive: true })
  const tmp = mkdtempSync(join(tmpdir(), 'compare-'))
  let n = 0
  // Some sandboxes (Claude's cloud sessions) only reach the web through
  // curl's proxy settings, so every request goes through curl there.
  const viaCurl = !!process.env.HTTPS_PROXY && process.env.PREVIEW_CURL !== '0'
  const curl = async (url: string) => {
    const file = join(tmp, String(n++))
    const { stdout } = await run('curl', ['-sSL', '--compressed', '--max-time', '25', '-A', UA, '-o', file, '-w', '%{http_code}\n%{content_type}\n%{url_effective}', url])
    const [status, type, effective] = stdout.split('\n')
    return { status: Number(status) || 0, type: type || '', url: effective || url, body: readFileSync(file) }
  }
  const get: Fetcher | undefined = viaCurl
    ? async (url) => {
        const r = await curl(url).catch(() => null)
        return r ? { url: r.url, status: r.status, type: r.type, body: r.body.toString('utf8') } : null
      }
    : undefined

  const files: Record<string, string> = {}
  let siteUrl = input
  let host = new URL(/^https?:\/\//.test(input) ? input : `https://${input}`).hostname.replace(/^www\./, '')
  let asIsReasons: string[] = []
  if (previewId) {
    if (!/^[a-f0-9]{16}$/.test(previewId)) throw new Error('A preview id is 16 letters and numbers, from its address /redesign/<id>.')
    files.copy = `${(process.env.SAYSITES_URL ?? 'https://saysites.com').replace(/\/$/, '')}/redesign/${previewId}/site`
    siteUrl = /^https?:\/\//.test(input) ? input : `https://${input}`
  } else {
    const p = await buildPreview(input, get)
    siteUrl = p.url
    host = new URL(p.url).hostname.replace(/^www\./, '')
    const home = p.pages.find((x) => x.slug === '')
    const redesign = p.fresh!.pages.find((x) => x.slug === '')!
    files.redesign = join(out, `${host}-redesign.html`)
    writeFileSync(files.redesign, redesign.classic?.html ?? renderPage(p.fresh!.site, redesign, p.fresh!.pages).html)
    if (p.asIs !== false && home?.classic) writeFileSync((files.copy = join(out, `${host}-copy.html`)), home.classic.html)
    asIsReasons = p.asIsReasons ?? []
    console.log(`${p.url}: ${p.pages.length} pages read`)
  }
  const scores: Record<string, number> = {}

  const browser = await chromium.launch({ executablePath: CHROME })
  try {
    const shot = async (url: string, width: number, file: string, still = false) => {
      const page = await browser.newPage({ viewport: { width, height: 900 }, userAgent: UA, reducedMotion: still ? 'reduce' : 'no-preference' })
      await page.addInitScript('window.__name = (f) => f')
      if (viaCurl)
        await page.route(/^https?:\/\//, async (route: Route) => {
          if (route.request().method() !== 'GET') return route.continue()
          try {
            const r = await curl(route.request().url())
            await route.fulfill({ status: r.status || 200, contentType: r.type || undefined, body: r.body })
          } catch {
            await route.abort().catch(() => {})
          }
        })
      await page.goto(url, { waitUntil: 'load', timeout: 60_000 }).catch(() => {})
      // Scroll through once so lazy photos load, then wait for animations.
      await page.evaluate(async () => {
        for (let y = 0; y < Math.min(document.body.scrollHeight, 5000); y += 400) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 150))
        }
        window.scrollTo(0, 0)
      }).catch(() => {})
      await page.waitForTimeout(3500)
      const height = await page.evaluate(() => document.documentElement.scrollHeight).catch(() => 900)
      await page.screenshot({ path: file, fullPage: true, clip: { x: 0, y: 0, width, height: Math.min(height, 4000) } })
      await page.close()
      return file
    }
    // The share of the two pictures (scaled to the same width) that matches.
    const same = async (a: string, b: string) => {
      const page = await browser.newPage()
      // tsx names functions with a helper the page doesn't have.
      await page.addInitScript('window.__name = (f) => f')
      await page.goto('about:blank')
      const score = await page.evaluate(
        async ([x, y]: string[]) => {
          const load = (src: string) => new Promise<HTMLImageElement>((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src })
          const [ia, ib] = await Promise.all([load(x), load(y)])
          const w = 360
          const h = Math.round(Math.min(ia.height * (w / ia.width), ib.height * (w / ib.width)))
          const px = (img: HTMLImageElement) => {
            const c = document.createElement('canvas')
            c.width = w
            c.height = h
            const ctx = c.getContext('2d')!
            ctx.drawImage(img, 0, 0, w, img.height * (w / img.width))
            return ctx.getImageData(0, 0, w, h).data
          }
          const da = px(ia), db = px(ib)
          let ok = 0
          for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) < 120) ok++
          return ok / (da.length / 4)
        },
        [a, b].map((f) => `data:image/png;base64,${readFileSync(f).toString('base64')}`)
      )
      await page.close()
      return Math.round(score * 1000) / 10
    }
    const at = (f: string) => (/^https?:/.test(f) ? f : `file://${f}`)
    for (const [label, width] of [['desktop', 1440], ['phone', 390]] as const) {
      const site = await shot(siteUrl, width, join(out, `${host}-site-${label}.png`))
      if (files.redesign) await shot(at(files.redesign), width, join(out, `${host}-redesign-${label}.png`), true)
      if (files.copy) {
        const copy = await shot(at(files.copy), width, join(out, `${host}-copy-${label}.png`))
        scores[label] = await same(site, copy)
        console.log(`  As it is, ${label}: ${scores[label]}% the same as their site (needs ${COPY_PASS}%)`)
      }
    }
    if (!files.copy) console.log(`  As it is: not offered. ${asIsReasons.join(' ')}`)
    console.log(`  Pictures in ${out}`)
    // Report the check, so the preview offers the copy only if it passed.
    if (previewId && process.env.PREVIEW_CHECK_TOKEN) {
      const res = await fetch(`${(process.env.SAYSITES_URL ?? 'https://saysites.com').replace(/\/$/, '')}/api/redesign/${previewId}/check`, {
        method: 'POST',
        headers: { authorization: `Bearer ${process.env.PREVIEW_CHECK_TOKEN}`, 'content-type': 'application/json' },
        body: JSON.stringify({ desktop: scores.desktop ?? 0, phone: scores.phone ?? 0 }),
      })
      console.log(`  Recorded: ${res.status} ${await res.text()}`)
    }
  } finally {
    await browser.close()
    rmSync(tmp, { recursive: true, force: true })
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
