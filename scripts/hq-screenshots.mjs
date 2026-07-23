/**
 * Capture the North Star headquarters state gallery (WebGL scene).
 *
 * The Headquarters Blueprint (§19) requires a hero view, executive-desk view,
 * Core close-up, and day/dusk/night/storm/warning/success/reduced-motion
 * states before any Phase 2 work. This script regenerates that gallery
 * deterministically after any scene change.
 *
 * Usage:
 *   pnpm build && PORT=3131 pnpm start &     # serve the built app
 *   node scripts/hq-screenshots.mjs          # writes docs/hq-screenshots/*.png
 *
 * Env: HQ_BASE (default http://localhost:3131), HQ_OUT (default
 * docs/hq-screenshots), PW_CHROMIUM (Chromium executable), SETTLE_MS (per-shot
 * wait). Chromium is launched with SwiftShader flags so the scene renders in
 * headless/software environments.
 */
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const BASE = process.env.HQ_BASE || 'http://localhost:3131'
const OUT = process.env.HQ_OUT || 'docs/hq-screenshots'
const SETTLE = Number(process.env.SETTLE_MS || 5000)
mkdirSync(OUT, { recursive: true })

const SHOTS = [
  { n: '01-hero', q: '?time=dusk' },
  { n: '02-executive-desk', q: '?cam=executive&time=day' },
  { n: '03-core-closeup', q: '?cam=conversation&time=night' },
  { n: '04-day', q: '?time=day' },
  { n: '05-dusk', q: '?time=dusk&core=speaking' },
  { n: '06-night', q: '?time=night' },
  { n: '07-storm-warning', q: '?core=concern&env=warning&weather=storm&time=day' },
  { n: '08-success', q: '?core=completion&env=success&time=dawn' },
  { n: '09-reduced-motion', q: '?time=night&motion=reduced', reduced: true },
  { n: '10-atmospheric-dome', q: '?cam=atmospheric&time=night' },
  { n: '11-boardroom', q: '?cam=boardroom&time=dusk' },
  { n: '12-aurora', q: '?weather=aurora&time=night' },
]

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})

for (const s of SHOTS) {
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: s.reduced ? 'reduce' : 'no-preference',
  })
  const page = await ctx.newPage()
  await page.goto(BASE + '/hq' + s.q, { waitUntil: 'load' })
  await page.waitForSelector('canvas', { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(SETTLE) // let arrival, materials and states settle
  await page.screenshot({ path: `${OUT}/${s.n}.png` })
  console.log('captured', s.n)
  await ctx.close()
}

await browser.close()
console.log('done →', OUT)
