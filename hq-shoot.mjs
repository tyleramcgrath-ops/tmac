import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
const EXE = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const OUT = 'docs/hq-screenshots'; mkdirSync(OUT, { recursive: true })
const shots = JSON.parse(process.env.SHOTS)
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] })
for (const s of shots) {
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1, reducedMotion: s.reduced ? 'reduce':'no-preference' })
  const p = await ctx.newPage()
  await p.goto('http://localhost:3131/hq' + s.q, { waitUntil: 'load' })
  await p.waitForSelector('canvas', { timeout: 20000 }).catch(()=>{})
  await p.waitForTimeout(4500)
  await p.screenshot({ path: `${OUT}/${s.n}.png` })
  console.log('captured', s.n); await ctx.close()
}
await b.close()
