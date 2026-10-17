import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
for (const [n, u, sel] of [
  ['cta', 'http://127.0.0.1:8899/experiences/', '.cta-band'],
  ['location', 'http://127.0.0.1:8899/about/', '.location'],
]) {
  await p.goto(u, { waitUntil: 'networkidle' });
  const found = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.scrollIntoView({block:'center'}); return true; }, sel);
  await p.waitForTimeout(800);
  await p.screenshot({ path: `/tmp/shots/${n}.png` });
  console.log(n, 'found:', found);
}
await b.close();
