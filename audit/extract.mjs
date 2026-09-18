/**
 * Renders palmtreesurf.com in headless Chromium and dumps the post-hydration
 * DOM, text, computed design tokens and screenshots. See VISUAL-SPEC.md §1.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const START = process.argv[2] || 'https://palmtreesurf.com/';

function slugFor(url) {
  const p = new URL(url).pathname.replace(/\/+$/, '');
  return p === '' ? 'home' : p.replace(/^\//, '').replace(/\//g, '-');
}

async function settle(page) {
  // Late hydration.
  await page.waitForTimeout(2000);
  // Scroll in 400px steps so lazy sections mount, then return to top.
  await page.evaluate(async () => {
    const step = 400;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}

async function extract(page, url) {
  const slug = slugFor(url);
  const dir = `./${slug}`;
  await mkdir(dir, { recursive: true });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await settle(page);

  const dom = await page.evaluate(() => document.documentElement.outerHTML);
  const text = await page.evaluate(() => document.body.innerText);
  await writeFile(`${dir}/dom.html`, dom);
  await writeFile(`${dir}/text.txt`, text);

  const computed = await page.evaluate(() => {
    const colors = {}, type = {}, radius = {}, shadow = {};
    const bump = (o, k) => { if (k && k !== 'none' && k !== 'rgba(0, 0, 0, 0)') o[k] = (o[k] || 0) + 1; };
    for (const el of document.querySelectorAll('*')) {
      const s = getComputedStyle(el);
      bump(colors, s.color); bump(colors, s.backgroundColor); bump(colors, s.borderColor);
      bump(radius, s.borderRadius); bump(shadow, s.boxShadow);
      if (el.textContent && el.children.length === 0) {
        bump(type, [s.fontFamily, s.fontSize, s.fontWeight, s.lineHeight, s.letterSpacing, s.textTransform].join(' | '));
      }
    }
    const rank = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 40);
    return { colors: rank(colors), type: rank(type), radius: rank(radius), shadow: rank(shadow) };
  });
  await writeFile(`${dir}/computed.json`, JSON.stringify(computed, null, 2));

  const images = await page.evaluate(() =>
    [...document.querySelectorAll('img')].map((i) => ({
      src: i.currentSrc || i.src,
      natural: [i.naturalWidth, i.naturalHeight],
      rendered: [i.width, i.height],
      alt: i.alt,
    }))
  );
  await writeFile(`${dir}/images.json`, JSON.stringify(images, null, 2));

  for (const w of [1440, 768, 375]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${dir}/shot-${w}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: `${dir}/shot-hero.png` });

  const links = await page.evaluate(() =>
    [...document.querySelectorAll('a[href]')].map((a) => a.href)
  );

  const meta = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || '',
    h1: document.querySelector('h1')?.innerText || '',
  }));

  return { slug, url, links, meta, domLength: dom.length, textLength: text.length };
}

const browser = await chromium.launch({
  executablePath: process.env.PT_CHROME || '/opt/pw-browsers/chromium',
});
const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const seen = new Set();
const queue = [START];
const sitemap = [];

while (queue.length && sitemap.length < 25) {
  const url = queue.shift();
  const clean = url.split('#')[0].split('?')[0];
  if (seen.has(clean)) continue;
  seen.add(clean);

  try {
    const r = await extract(page, clean);
    sitemap.push({ url: clean, ...r.meta, domLength: r.domLength });
    console.log(`OK ${clean} dom=${r.domLength} text=${r.textLength}`);
    for (const l of r.links) {
      const c = l.split('#')[0].split('?')[0];
      if (c.startsWith(new URL(START).origin) && !seen.has(c)) queue.push(c);
    }
  } catch (e) {
    console.log(`FAIL ${clean} :: ${e.message}`);
    sitemap.push({ url: clean, error: e.message });
  }
}

await writeFile('./sitemap.json', JSON.stringify(sitemap, null, 2));
await browser.close();
console.log(`\nDone. ${sitemap.length} pages.`);
