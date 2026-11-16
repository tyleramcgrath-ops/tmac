// Checks every built page: node test.mjs [site-dir]
//  - every local link and image points at a file that exists
//  - in Chromium at 1280px and 390px: the page loads with no console errors,
//    has one H1 and a title, never scrolls sideways, and every local image renders
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

// Playwright may be installed globally rather than next to this file.
const require = createRequire(import.meta.url);
const pwPath = require.resolve('playwright', { paths: [process.cwd(), dirname(new URL(import.meta.url).pathname), '/opt/node-tools', process.env.HOME || '/'] });
const pw = await import(pathToFileURL(pwPath).href);
const chromium = (pw.default || pw).chromium;

const dir = resolve(process.argv[2] || join(dirname(new URL(import.meta.url).pathname), 'site'));
const pages = readdirSync(dir).filter(f => f.endsWith('.html')).sort();
const problems = [];
const note = (page, what) => problems.push(`${page}: ${what}`);

// 1. Static: links and images resolve.
let links = 0, imgs = 0;
for (const page of pages) {
  const html = readFileSync(join(dir, page), 'utf8');
  for (const m of html.matchAll(/\b(?:href|src)="([^"#]+)(#[^"]*)?"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|tel:|sms:|data:)/.test(url)) continue;
    const target = join(dir, url.split('?')[0]);
    if (url.endsWith('.html')) links++; else imgs++;
    if (!existsSync(target)) note(page, `missing target ${url}`);
  }
  if (!/<title>[^<]+<\/title>/.test(html)) note(page, 'no title');
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) note(page, 'not exactly one h1');
}

// 1b. Head tags and schema on every page.
for (const page of pages) {
  const html = readFileSync(join(dir, page), 'utf8');
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (!desc) note(page, 'no meta description');
  else if (desc.length < 50 || desc.length > 165) note(page, `description length ${desc.length}`);
  if (!/<link rel="canonical" href="https:\/\/suncoastclean\.com\//.test(html)) note(page, 'no canonical');
  if (!/<meta property="og:title"/.test(html)) note(page, 'no og:title');
  if (!/<meta name="robots"/.test(html)) note(page, 'no robots meta');
  if ((html.match(/<title>/g) || []).length !== 1) note(page, 'title count');
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { note(page, 'invalid JSON-LD'); }
  }
  if (!/<nav class="crumbs"/.test(html) && page !== 'index.html') note(page, 'no breadcrumbs');
}

// 1c. Every address the live site has (its sitemap) and every old .aspx link lands on a file.
const slugFile = s => (s === '' ? 'index.html' : s === 'news' ? 'news.html' : s + '.html');
const liveUrls = readFileSync(join(dirname(new URL(import.meta.url).pathname), 'content', 'live-urls.txt'), 'utf8').split('\n').filter(Boolean);
let mapped = 0;
for (const u of liveUrls) {
  const slug = u.replace('https://suncoastclean.com/', '').replace(/\/$/, '');
  if (!existsSync(join(dir, slugFile(slug)))) note('live-url', `${u} has no page`); else mapped++;
}
for (const f of ['404.html', 'sitemap.xml', 'robots.txt', '_redirects', 'vercel.json', '.htaccess']) {
  if (!existsSync(join(dir, f))) note('hosting', `missing ${f}`);
}
const sitemap = readFileSync(join(dir, 'sitemap.xml'), 'utf8');
let smCount = 0;
for (const m of sitemap.matchAll(/<loc>https:\/\/suncoastclean\.com\/([^<]*)<\/loc>/g)) {
  smCount++;
  const slug = m[1].replace(/\/$/, '');
  if (!existsSync(join(dir, slugFile(slug)))) note('sitemap', `${m[1]} has no page`);
}
for (const line of readFileSync(join(dir, '_redirects'), 'utf8').split('\n')) {
  const m = line.match(/^(\S+)\s+(\S+)\s+(\d+)/);
  if (!m || m[2].includes(':') || m[1].startsWith('/*')) continue;
  const target = m[2].split('#')[0].replace(/^\//, '').replace(/\/$/, '');
  if (!existsSync(join(dir, slugFile(target)))) note('redirects', `${m[1]} -> ${m[2]} has no page`);
}
console.log(`${mapped}/${liveUrls.length} live addresses map to a page; ${smCount} sitemap entries checked`);

// 2. Browser.
const browser = await chromium.launch();
const results = { pages: 0, loads: 0 };
for (const [w, h] of [[1280, 900], [390, 844]]) {
  const context = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(String(err)));
  page.on('requestfailed', req => {
    const u = req.url();
    if (u.startsWith('file:')) errors.push(`request failed ${u}`);
  });
  for (const name of pages) {
    errors.length = 0;
    await page.goto(pathToFileURL(join(dir, name)).href, { waitUntil: 'load' });
    const r = await page.evaluate(async () => {
      for (const i of document.images) i.loading = 'eager';
      await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
      const bad = [...document.images].filter(i => !i.src.startsWith('http') && !(i.complete && i.naturalWidth > 0)).map(i => i.getAttribute('src'));
      return {
        sw: document.documentElement.scrollWidth, iw: window.innerWidth,
        title: document.title, badImgs: bad,
        h1: document.querySelectorAll('h1').length,
        empty: !document.querySelector('main')?.textContent.trim(),
      };
    });
    results.loads++;
    if (r.sw > r.iw) note(name, `horizontal scroll at ${w}px (${r.sw} > ${r.iw})`);
    if (!r.title) note(name, `no document.title at ${w}px`);
    if (r.empty) note(name, 'empty main');
    for (const b of r.badImgs) note(name, `image did not render: ${b}`);
    for (const e of errors) note(name, `console at ${w}px: ${e}`);
  }
  await context.close();
}
await browser.close();
results.pages = pages.length;

console.log(`${results.pages} pages, ${results.loads} browser loads, ${links} internal links and ${imgs} local assets checked`);
if (problems.length) {
  console.log(`${problems.length} problems:`);
  for (const p of problems.slice(0, 80)) console.log('  ' + p);
  if (problems.length > 80) console.log(`  ...and ${problems.length - 80} more`);
  process.exit(1);
}
console.log('all clear');
