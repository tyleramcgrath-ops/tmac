import { chromium } from 'playwright';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const c = await b.newContext({ userAgent: UA, viewport:{width:1440,height:900} });
const p = await c.newPage();

// Ladder step 5: waitUntil 'load' + explicit selector wait, 30s.
try {
  await p.goto('https://palmtreesurf.com/', { waitUntil: 'load', timeout: 30000 });
  await p.waitForSelector('main, section, img', { timeout: 30000 });
  const html = await p.content();
  console.log('STEP5 OK len=' + html.length);
  console.log(html.slice(0, 500));
} catch (e) {
  console.log('STEP5 FAIL :: ' + e.message.split('\n')[0]);
}

// Ladder step 6: did we get ANY dom back (bot wall) or nothing (pre-response block)?
try {
  const dom = await p.evaluate(() => document.documentElement.outerHTML);
  console.log('DOM AFTER FAIL len=' + dom.length + ' :: ' + dom.slice(0,200).replace(/\s+/g,' '));
} catch (e) { console.log('DOM read failed :: ' + e.message.split('\n')[0]); }

// Control: does Chromium reach an allowed host at all?
for (const url of ['https://github.com/', 'https://registry.npmjs.org/']) {
  try {
    const r = await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log(`CONTROL ${url} -> HTTP ${r.status()}`);
  } catch (e) {
    console.log(`CONTROL ${url} -> FAIL :: ${e.message.split('\n')[0]}`);
  }
}
await b.close();
