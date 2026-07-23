/**
 * Capture the North Star headquarters state gallery.
 *
 * The deck's Claude Handoff (slide 16) requires full-room, close-up,
 * speaking, warning and reduced-motion frames before any other workspace is
 * built. This script produces those plus a few supporting states, so the
 * gallery can be regenerated deterministically after any scene change.
 *
 * Usage:
 *   pnpm build && PORT=3131 pnpm start &   # serve the built app
 *   node scripts/hq-screenshots.mjs        # writes docs/hq-screenshots/*.png
 *
 * Env: HQ_BASE (default http://localhost:3131), HQ_OUT (default
 * docs/hq-screenshots), PW_CHROMIUM (Chromium executable path).
 */
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const BASE = process.env.HQ_BASE || 'http://localhost:3131'
const OUT = process.env.HQ_OUT || 'docs/hq-screenshots'
mkdirSync(OUT, { recursive: true })

const SHOTS = [
  { name: '01-full-room', q: '?time=night&env=confident' },
  { name: '02-core-closeup', q: '?shot=close&time=night&core=idle' },
  { name: '03-speaking', q: '?core=speaking&time=dusk' },
  { name: '04-warning-concern', q: '?core=concern&env=warning&time=day' },
  { name: '05-reduced-motion', q: '?core=speaking&env=confident&time=night&motion=reduced', reduced: true },
  { name: '06-thinking-analyzing', q: '?core=thinking&time=day' },
  { name: '07-opportunity-success', q: '?core=opportunity&env=success&time=dawn' },
  { name: '08-preview-console', q: '?console=1&core=thinking&time=night' },
]

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})

for (const shot of SHOTS) {
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: shot.reduced ? 'reduce' : 'no-preference',
  })
  const page = await ctx.newPage()
  await page.goto(BASE + '/hq' + shot.q, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2600) // let arrival settle and states land
  await page.screenshot({ path: `${OUT}/${shot.name}.png` })
  console.log('captured', shot.name)
  await ctx.close()
}

await browser.close()
console.log('done →', OUT)
