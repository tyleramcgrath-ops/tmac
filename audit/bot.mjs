import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
const errs = [];
p.on('pageerror', e => errs.push(String(e)));
await p.goto('http://127.0.0.1:8899/', { waitUntil: 'networkidle' });
await p.evaluate(() => window.scrollTo(0, 400)); await p.waitForTimeout(400);
await p.screenshot({ path: '/tmp/shots/bot-closed.png' });

await p.click('[data-assistant-toggle]');
await p.waitForTimeout(500);
await p.screenshot({ path: '/tmp/shots/bot-open.png' });

// Ask a few real questions
for (const q of ['do I need to know how to swim', 'fishing charter', 'what month should I come', 'do you sell helicopter rides']) {
  await p.fill('[data-assistant-input]', q);
  await p.press('[data-assistant-input]', 'Enter');
  await p.waitForTimeout(350);
}
await p.screenshot({ path: '/tmp/shots/bot-chat.png' });
const txt = await p.locator('[data-assistant-log]').innerText();
console.log('--- transcript ---');
console.log(txt.slice(-1400));
console.log('--- wa link ---', await p.locator('.assistant__action--wa').first().getAttribute('href'));
console.log('ERRORS:', errs.length ? errs.join(' | ') : 'none');
await b.close();
