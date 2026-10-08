import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
const p = await ctx.newPage();

async function state(label) {
  const html = await p.evaluate(() => document.documentElement.lang);
  const cur  = await p.locator('.lang-switch__item.is-current span[aria-hidden]').innerText();
  const nav  = await p.locator('.nav__item a, .site-header a').first().innerText().catch(()=>'');
  console.log(`${label.padEnd(22)} url=${p.url().replace('http://127.0.0.1:8899','')}  html.lang=${html}  active=${cur}`);
}

await p.goto('http://127.0.0.1:8899/experiences/', { waitUntil: 'domcontentloaded' });
await state('start');

await p.click('.lang-switch__item[hreflang="es"]');
await p.waitForLoadState('domcontentloaded');
await state('clicked ES');

await p.click('.lang-switch__item[hreflang="en"]');
await p.waitForLoadState('domcontentloaded');
await state('clicked EN');

// Does English stick on the next page?
await p.goto('http://127.0.0.1:8899/about/', { waitUntil: 'domcontentloaded' });
await state('navigated (EN?)');

// And does Spanish stick?
await p.click('.lang-switch__item[hreflang="es"]');
await p.waitForLoadState('domcontentloaded');
await p.goto('http://127.0.0.1:8899/gallery/', { waitUntil: 'domcontentloaded' });
await state('navigated (ES?)');

await p.click('.lang-switch__item[hreflang="en"]');
await p.waitForLoadState('domcontentloaded');
await p.goto('http://127.0.0.1:8899/contact/', { waitUntil: 'domcontentloaded' });
await state('back to EN, next pg');

await b.close();
