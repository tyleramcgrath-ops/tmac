import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://127.0.0.1:8899/gallery/', { waitUntil: 'networkidle' });
await p.locator('.gallery__grid').scrollIntoViewIfNeeded();
await p.waitForTimeout(700);
await p.screenshot({ path: '/tmp/shots/gallery.png' });
// open the lightbox
await p.locator('.gallery__trigger').first().click();
await p.waitForTimeout(900);
await p.screenshot({ path: '/tmp/shots/lightbox.png' });
await b.close();
console.log('ok');
