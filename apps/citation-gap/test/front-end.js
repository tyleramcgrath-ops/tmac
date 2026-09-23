// The front end's layout promises, checked in a real browser at real widths.
//
// Every one of these failed silently before it was fixed — the page still loaded, still scored,
// still looked fine on the one screen it was built on:
//
//   the report landed under the sticky bar   Only after a *real* scan, and only at the moment
//                                            the customer finally looks at what they paid for.
//                                            The demo path scrolls differently, so no existing
//                                            test went near it.
//   the nav vanished on a phone              Below 900px the links were display:none with no
//                                            replacement, and below 520px so was Sign in. A
//                                            returning customer on a phone had no way back in
//                                            and nobody had a route to Pricing.
//   the bar clipped its own call to action   Adding the menu button squeezed "Run a scan" off
//                                            the right edge at 390px and narrower.
//   the head promised a card that 404'd      twitter:card said summary_large_image with no
//                                            image behind it, so every share rendered bare.
//
// So each is asserted at the widths people actually hold, rather than eyeballed once.
const http = require('http'), fs = require('fs'), path = require('path');
const { execSync } = require('child_process');
const { serveStatic, serveAccount } = require('./enter-app.js');

const ROOT = path.join(__dirname, '..');
const WIDTHS = [320, 360, 390, 430, 519, 560, 768, 900, 1280];

let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); } };

(async () => {
  let chromium;
  try {
    chromium = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')).chromium;
  } catch (e) {
    console.log('\nno playwright on this machine — skipping the front-end tests');
    process.exit(0);
  }

  const srv = http.createServer((req, res) => {
    const p = require('url').parse(req.url).pathname;
    if (serveAccount(p, res)) return;
    if (serveStatic(p, res, ROOT)) return;
    res.setHeader('content-type', 'text/html');
    res.end(fs.readFileSync(path.join(ROOT, 'index.html')));
  });
  await new Promise((r) => srv.listen(0, r));
  const port = srv.address().port;
  const url = 'http://127.0.0.1:' + port + '/';
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });

  try {
    console.log('\n1. What the head promises, the server actually serves');
    {
      const head = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').split('</head>')[0];
      const card = (head.match(/property="og:image" content="([^"]+)"/) || [])[1];
      ok(!!card, 'a social card is declared', card);
      ok(/og:image:width" content="1200"/.test(head) && /og:image:height" content="630"/.test(head),
         'with the dimensions crawlers need to render it large rather than cropped');
      ok(/og:image:alt/.test(head), 'and alt text, because the card is content too');

      // Status alone is not evidence: a server that falls through to index.html answers 200
      // with the wrong bytes, and the first version of this test passed on exactly that. So each
      // one is checked by what came back, not by the code that came with it.
      const page = await browser.newPage();
      const want = { '/og.png': ['image/png', '89504e47'], '/apple-touch-icon.png': ['image/png', '89504e47'],
                     '/icon.svg': ['image/svg+xml', null], '/score.js': ['javascript', null] };
      for (const f of Object.keys(want)) {
        const r = await page.goto(url.replace(/\/$/, '') + f);
        const type = (r.headers()['content-type'] || '');
        const body = await r.body();
        const magic = body.slice(0, 4).toString('hex');
        const typeOk = type.indexOf(want[f][0]) !== -1;
        const bytesOk = want[f][1] ? magic === want[f][1]
                                   : !/^\s*<!doctype html/i.test(body.slice(0, 40).toString());
        ok(r.status() === 200 && typeOk && bytesOk,
           f + ' answers with the file itself, not the page',
           'status ' + r.status() + ' type ' + type + ' magic ' + magic);
      }
      await page.close();
    }

    console.log('\n2. The report clears the sticky bar it is scrolled beneath');
    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(url);
      await page.waitForSelector('#report.on');
      await page.click('.mkt-nav .mkt-btn.primary');
      await page.waitForTimeout(600);
      // exactly what the scanner does when a real scan finishes
      await page.evaluate(() => document.querySelector('#report').scrollIntoView({ block: 'start' }));
      await page.waitForTimeout(500);
      const t = await page.evaluate(() => ({
        report: Math.round(document.querySelector('#report').getBoundingClientRect().top),
        bar: Math.round(document.querySelector('.topbar').getBoundingClientRect().bottom)
      }));
      ok(t.report >= t.bar, 'the top of the report is not hidden behind the bar', JSON.stringify(t));
      await page.close();
    }

    console.log('\n3. Pricing and Sign in are reachable at every width');
    for (const w of WIDTHS) {
      const page = await browser.newPage({ viewport: { width: w, height: 820 } });
      await page.goto(url);
      await page.waitForTimeout(350);
      const seen = async () => page.evaluate(() => {
        const shown = (e) => { if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        const link = (root) => [].slice.call(document.querySelectorAll(root + ' a')).some((a) => /pricing/i.test(a.textContent) && shown(a));
        return {
          pricing: link('.mkt-navlinks') || link('#mktMenu'),
          signin: shown(document.querySelector('.mkt-navcta .mkt-btn.ghost'))
                  || [].slice.call(document.querySelectorAll('#mktMenu .mkt-signin')).some(shown)
        };
      });
      let s = await seen();
      if (!s.pricing || !s.signin) {
        const burger = await page.$('.mkt-burger');
        const visible = burger && await burger.isVisible();
        if (visible) { await burger.click(); await page.waitForTimeout(300); s = await seen(); }
      }
      ok(s.pricing && s.signin, w + 'px — both reachable, opening the menu if that is where they live',
         JSON.stringify(s));
      await page.close();
    }

    console.log('\n4. The bar never clips its own call to action');
    for (const w of WIDTHS) {
      const page = await browser.newPage({ viewport: { width: w, height: 800 } });
      await page.goto(url);
      await page.waitForTimeout(350);
      const r = await page.evaluate(() => ({
        right: Math.round(document.querySelector('.mkt-navcta .mkt-btn.primary').getBoundingClientRect().right),
        vw: window.innerWidth,
        overflow: document.documentElement.scrollWidth > window.innerWidth
      }));
      ok(r.right <= r.vw && !r.overflow, w + 'px — "Run a scan" fits and the page does not scroll sideways',
         JSON.stringify(r));
      await page.close();
    }

    console.log('\n5. The menu closes every way a person would expect it to');
    {
      const page = await browser.newPage({ viewport: { width: 500, height: 820 } });
      await page.goto(url);
      await page.waitForTimeout(350);
      const open = () => page.evaluate(() => !document.querySelector('#mktMenu').hidden);
      const aria = () => page.evaluate(() => document.querySelector('#mktMenuBtn').getAttribute('aria-expanded'));

      await page.click('.mkt-burger'); await page.waitForTimeout(200);
      ok(await open() && (await aria()) === 'true', 'it opens, and aria-expanded says so');

      await page.keyboard.press('Escape'); await page.waitForTimeout(200);
      ok(!(await open()) && (await aria()) === 'false', 'Escape closes it and resets the state');

      await page.click('.mkt-burger'); await page.waitForTimeout(200);
      await page.mouse.click(250, 700); await page.waitForTimeout(250);
      ok(!(await open()), 'clicking away closes it');

      await page.click('.mkt-burger'); await page.waitForTimeout(200);
      await page.click('#mktMenu a[href="#mkt-pricing"]'); await page.waitForTimeout(350);
      ok(!(await open()), 'choosing a link closes it, so the section it jumped to is visible');

      await page.click('.mkt-burger'); await page.waitForTimeout(200);
      await page.setViewportSize({ width: 1100, height: 820 }); await page.waitForTimeout(350);
      ok(!(await open()), 'and widening past the breakpoint closes it rather than stranding it open');

      // Entering the app must not leave the panel hanging over the scanner.
      await page.setViewportSize({ width: 500, height: 820 }); await page.waitForTimeout(250);
      await page.click('.mkt-burger'); await page.waitForTimeout(200);
      await page.click('.mkt-navcta .mkt-btn.primary'); await page.waitForTimeout(350);
      ok(!(await open()), 'and launching the app closes it on the way through');
      await page.close();
    }
  } finally {
    await browser.close();
    srv.close();
  }

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
