// A free homepage mockup for a business that asked for one: their site
// today next to the same business redesigned on SaySites (one of SaySites'
// premium starter designs, filled with their real details), as one PNG to
// email back. Runs on a machine with Chromium (the team's or Claude's cloud
// session), never on the SaySites host.
//
//   npx tsx scripts/mockup.ts https://example-law.com [out-dir] [--name "Firm, P.A."]
//     [--type lawyer] [--city "Boca Raton"] [--region FL] [--phone "(561) 555-0100"]
//     [--services "Estate planning, Probate, Trusts"] [--no-today]
//     [--style counsel|classic|modern] [--palette noir] [--hero <unsplash id> --hero-alt "..."]
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
import { LAW_STYLES, type LawStyle } from '../lib/law-designs'
import { photosFor, unsplash } from '../lib/photos'
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
      palette: (flag('palette') ?? d.palette) as typeof d.palette,
      // A design and a lead photo picked for this business, so the picture
      // looks its best (e.g. --style counsel --hero 1564013799919-ab600027ffc6).
      ...(LAW_STYLES.includes(flag('style') as LawStyle) ? { lawStyle: flag('style') as LawStyle } : {}),
      ...(flag('hero') ? { photos: { ...photosFor(type), hero: unsplash(flag('hero')!, flag('hero-alt') ?? `${name}`, 2000, 1333) } } : {}),
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
    // Some sandboxes (Claude's cloud sessions) only reach the web through
    // curl's proxy settings, so every page request goes through curl there.
    const viaCurl = async (page: { route(re: RegExp, fn: (r: Route) => Promise<void>): Promise<void> }) => {
      if (process.env.MOCKUP_CURL === '0') return
      await page.route(/^https?:\/\//, async (route: Route) => {
        const req = route.request()
        if (req.method() !== 'GET') return route.continue()
        const file = join(tmp, String(n++))
        try {
          const { stdout } = await run('curl', ['-sSL', '--compressed', '--max-time', '25', '-A', UA, '-o', file, '-w', '%{http_code}\n%{content_type}', req.url()])
          const [status, type] = stdout.split('\n')
          await route.fulfill({ status: Number(status) || 200, contentType: type || undefined, body: readFileSync(file) })
        } catch {
          await route.abort().catch(() => {})
        }
      })
    }
    const shot = async (url: string, width: number, height: number, file: string) => {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 })
      await viaCurl(page)
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
    // The picture: the redesign large on a dark, warm stage; their site
    // today small, faded and tilted behind it; the phone in front.
    const board = `<!doctype html><meta charset="utf-8">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Manrope:wght@500;600;700&display=swap">
    <style>
      *{box-sizing:border-box}
      body{margin:0;width:2400px;height:1500px;position:relative;overflow:hidden;font-family:Manrope,system-ui,sans-serif;color:#f4efe6;
        background:radial-gradient(1200px 800px at 68% 42%,#3a3227 0%,rgba(58,50,39,0) 70%),radial-gradient(900px 700px at 8% 100%,#1d2430 0%,rgba(29,36,48,0) 70%),#100e0c}
      body:after{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.035) 1px,transparent 1px);background-size:4px 4px;pointer-events:none}
      .head{position:absolute;left:96px;top:78px;max-width:1500px}
      .eyebrow{margin:0;font-size:22px;letter-spacing:.32em;text-transform:uppercase;color:#c9a46c;font-weight:700}
      h1{margin:16px 0 0;font-family:Fraunces,Georgia,serif;font-weight:400;font-size:${name.length > 34 ? 62 : 76}px;line-height:1.05;letter-spacing:-.02em}
      .sub{margin:14px 0 0;font-size:26px;color:#b9b0a3}
      .win{position:absolute;border-radius:16px;overflow:hidden;background:#fff}
      .bar{height:40px;background:#1c1a17;display:flex;align-items:center;gap:8px;padding:0 16px}.bar i{width:12px;height:12px;border-radius:50%;background:#3b3731}.bar span{margin-left:12px;font-size:16px;color:#8c8478}
      .win img{display:block;width:100%}
      .after{left:${today ? 600 : 380}px;top:330px;width:1320px;z-index:2;box-shadow:0 0 0 1px rgba(255,255,255,.08),0 60px 140px rgba(0,0,0,.65),0 0 160px rgba(201,164,108,.18)}
      .before{left:70px;top:860px;width:620px;z-index:1;transform:rotate(-5deg);filter:grayscale(.55) brightness(.8);opacity:.85;box-shadow:0 30px 80px rgba(0,0,0,.6)}
      .tag{position:absolute;z-index:3;font-size:18px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;padding:9px 16px;border-radius:999px}
      .t1{left:90px;top:800px;background:rgba(255,255,255,.08);color:#b9b0a3;transform:rotate(-5deg)}
      .t2{left:${today ? 600 : 380}px;top:282px;background:#c9a46c;color:#16130f}
      .phone{position:absolute;z-index:3;right:${today ? 110 : 250}px;top:600px;width:330px;border-radius:50px;background:#0b0a09;padding:13px;box-shadow:0 0 0 2px #3b3329,0 50px 120px rgba(0,0,0,.7)}.phone img{display:block;width:100%;border-radius:38px}
      .foot{position:absolute;left:96px;bottom:54px;font-size:22px;color:#8c8478;z-index:3}.foot b{color:#f4efe6;font-weight:700;margin-right:14px}
    </style>
    <div class="head"><p class="eyebrow">A free redesign for</p><h1>${esc(name)}</h1><p class="sub">${type === 'lawyer' ? 'Same firm, same practice areas.' : 'Same business, same services.'} Faster, clearer and built for phones.</p></div>
    ${today ? `<span class="tag t1">Today</span><div class="win before"><div class="bar"><i></i><i></i><i></i><span>${esc(host)}</span></div><img src="file://${before}"></div>` : ''}
    <span class="tag t2">Redesigned</span><div class="win after"><div class="bar"><i></i><i></i><i></i><span>${esc(host)}</span></div><img src="file://${after}"></div>
    <div class="phone"><img src="file://${phone}"></div>
    <div class="foot"><b>SaySites</b>Change anything on your site just by saying it · saysites.com</div>`
    const boardPath = join(out, `${host}-board.html`)
    writeFileSync(boardPath, board)
    const page = await browser.newPage({ viewport: { width: 2400, height: 1500 } })
    await viaCurl(page)
    await page.goto(`file://${boardPath}`, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready).catch(() => {})
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
