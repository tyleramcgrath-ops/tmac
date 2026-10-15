// A free homepage mockup for a business that asked for one: their site
// today next to the same business redesigned on SaySites (the fresh design
// from lib/restyle, built from their own words and photos), as one PNG to
// email back. Runs on a machine with Chromium (the team's or Claude's cloud
// session), never on the SaySites host.
//
//   npx tsx scripts/mockup.ts https://example-law.com [out-dir] [--name "Firm, P.A."]
//     [--type lawyer] [--city "Boca Raton"] [--region FL] [--phone "(561) 555-0100"]
//     [--services "Estate planning, Probate, Trusts"] [--no-today]
//
// The redesign is one of SaySites' own premium starter designs, filled in
// with the business's real name, phone, town and services (read from their
// site; anything missing or wrong can be given on the command line). Never
// invented facts: services and details come from their site or from you.
//
// Writes <out-dir>/<host>-mockup.png (the picture to send), plus
// <host>-redesign.html and the two screenshots it was made from.

import { execFile } from 'child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { createRequire } from 'module'
import { tmpdir } from 'os'
import { join, resolve } from 'path'
import { promisify } from 'util'
import { buildPreview } from '../lib/redesign'
import { renderPage } from '../lib/render'
import { BUSINESS_TYPES, buildStarterSite, type BusinessTypeKey } from '../lib/starter'

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : undefined
}
// "::::Welcome to Smith & Co., P.A." -> "Smith & Co., P.A."
const cleanName = (s: string) => s.replace(/^[^A-Za-z0-9]+/, '').replace(/^welcome to (the )?/i, '').replace(/,(?=\S)/g, ', ').trim()

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? '/opt/node22/lib/node_modules/playwright')
const CHROME = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium'

const run = promisify(execFile)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
type Route = { request(): { url(): string; method(): string }; fulfill(o: object): Promise<void>; continue(): Promise<void>; abort(): Promise<void> }

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

async function main() {
  const input = process.argv[2]
  if (!input) throw new Error('Give the website address, e.g. npx tsx scripts/mockup.ts https://example.com')
  const out = resolve(process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 'mockups')
  mkdirSync(out, { recursive: true })

  const preview = await buildPreview(input)
  const host = new URL(preview.url).hostname.replace(/^www\./, '')
  const d = preview.detected
  const type = (flag('type') ?? d.type) as BusinessTypeKey
  const name = cleanName(flag('name') ?? d.name)
  // Their own menu names their services when we're not told them.
  const fromMenu = preview.pages.filter((p) => p.slug && !/^(about|contact|home|links?|blog|news|privacy|terms|attorneys?|team|staff|faq|testimonials?|reviews?|location)/i.test(p.slug)).map((p) => p.name).slice(0, 6)
  const services = (flag('services')?.split(',').map((x) => x.trim()).filter(Boolean) ?? fromMenu)
  if (!services.length) throw new Error('No services found on their site; pass --services "A, B, C".')
  const built = buildStarterSite(
    {
      name,
      type: BUSINESS_TYPES[type] ? type : 'other',
      city: flag('city') ?? d.city ?? 'Palm Beach',
      region: flag('region') ?? d.region ?? 'FL',
      ...((flag('phone') ?? d.phone) ? { phone: flag('phone') ?? d.phone } : {}),
      services,
      palette: d.palette,
    },
    'mockup',
    host.replace(/[^a-z0-9]+/g, '-'),
  )
  const home = built.pages.find((p) => p.slug === '') ?? built.pages[0]
  const html = renderPage(built.site, home, built.pages).html
  const htmlPath = join(out, `${host}-redesign.html`)
  writeFileSync(htmlPath, html)

  const browser = await chromium.launch({ executablePath: CHROME })
  const tmp = mkdtempSync(join(tmpdir(), 'mockup-'))
  let n = 0
  try {
    const shot = async (url: string, width: number, height: number, file: string) => {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 })
      // Some sandboxes (Claude's cloud sessions) only reach the web through
      // curl's proxy settings, so every page request goes through curl there.
      if (process.env.MOCKUP_CURL !== '0')
        await page.route(/^https?:\/\//, async (route: Route) => {
          const req = route.request()
          if (req.method() !== 'GET') return route.continue()
          const out = join(tmp, String(n++))
          try {
            const { stdout } = await run('curl', ['-sSL', '--compressed', '--max-time', '25', '-A', UA, '-o', out, '-w', '%{http_code}\n%{content_type}', req.url()])
            const [status, type] = stdout.split('\n')
            await route.fulfill({ status: Number(status) || 200, contentType: type || undefined, body: readFileSync(out) })
          } catch {
            await route.abort().catch(() => {})
          }
        })
      await page.goto(url, { waitUntil: 'load', timeout: 45_000 }).catch(() => {})
      // Show everything as it looks at rest: no entrance animations.
      await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' }).catch(() => {})
      await page.evaluate(async () => {
        for (let y = 0; y < Math.min(document.body.scrollHeight, 4000); y += 500) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 120))
        }
        window.scrollTo(0, 0)
      }).catch(() => {})
      await page.waitForTimeout(1500)
      await page.screenshot({ path: file, clip: { x: 0, y: 0, width, height } })
      await page.close()
      return file
    }
    // --no-today leaves their current site out (e.g. it sits behind a bot check).
    const today = !process.argv.includes('--no-today')
    const before = today ? await shot(preview.url, 1440, 1000, join(out, `${host}-before.png`)) : ''
    const after = await shot(`file://${htmlPath}`, 1440, 1000, join(out, `${host}-after.png`))
    const phone = await shot(`file://${htmlPath}`, 390, 844, join(out, `${host}-phone.png`))

    // The picture: before and after in browser frames, the phone in front.
    const board = `<!doctype html><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{margin:0;width:2400px;height:1500px;background:#ecebe6;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#121316;position:relative;overflow:hidden}
      .head{position:absolute;left:96px;top:70px}.head p{margin:0;font-size:26px;letter-spacing:.14em;text-transform:uppercase;color:#6a6c71;font-weight:600}.head h1{margin:10px 0 0;font-size:64px;letter-spacing:-.02em}
      .win{position:absolute;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(18,19,22,.18),0 4px 14px rgba(18,19,22,.08)}
      .bar{height:44px;background:#f4f3ef;display:flex;align-items:center;gap:9px;padding:0 18px;border-bottom:1px solid #e3e1dc}.bar i{width:13px;height:13px;border-radius:50%;background:#d8d6d0}.bar span{margin-left:14px;font-size:17px;color:#6a6c71}
      .win img{display:block;width:100%}
      .before{left:96px;top:250px;width:900px;opacity:.96}.after{left:${today ? 860 : 300}px;top:${today ? 330 : 280}px;width:${today ? 1180 : 1500}px}
      .tag{position:absolute;font-size:22px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:10px 18px;border-radius:999px}
      .t1{left:96px;top:200px;background:#fff;color:#6a6c71}.t2{left:${today ? 860 : 300}px;top:${today ? 280 : 230}px;background:#121316;color:#fff}
      .phone{position:absolute;right:110px;top:420px;width:330px;border-radius:46px;background:#121316;padding:14px;box-shadow:0 30px 80px rgba(18,19,22,.3)}.phone img{display:block;width:100%;border-radius:34px}
      .foot{position:absolute;left:96px;bottom:60px;font-size:24px;color:#3d3f44}.foot b{color:#121316}
    </style>
    <div class="head"><p>Free homepage mockup</p><h1>${esc(name)}, redesigned</h1></div>
    ${today ? `<span class="tag t1">Today</span><div class="win before"><div class="bar"><i></i><i></i><i></i><span>${esc(host)}</span></div><img src="file://${before}"></div>` : ''}
    <span class="tag t2">Redesigned</span><div class="win after"><div class="bar"><i></i><i></i><i></i><span>${esc(host)}</span></div><img src="file://${after}"></div>
    <div class="phone"><img src="file://${phone}"></div>
    <div class="foot">Your business on a fast, mobile-first SaySites design. Change anything just by saying it. <b>SaySites</b> · saysites.com</div>`
    const boardPath = join(out, `${host}-board.html`)
    writeFileSync(boardPath, board)
    const page = await browser.newPage({ viewport: { width: 2400, height: 1500 } })
    await page.goto(`file://${boardPath}`, { waitUntil: 'load' })
    await page.waitForTimeout(500)
    const png = join(out, `${host}-mockup.png`)
    await page.screenshot({ path: png, type: 'png' })
    // A small copy to host at saysites.com/mockups/ and show inside an email.
    await page.screenshot({ path: png.replace(/\.png$/, '.jpg'), type: 'jpeg', quality: 80 })
    console.log(png)
  } finally {
    await browser.close()
    rmSync(tmp, { recursive: true, force: true })
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
