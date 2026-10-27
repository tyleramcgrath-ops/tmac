// Checks tylermcgrath.com in a real browser after a deploy:
//   node scripts/verify-tylermcgrath.cjs <expected build ID> [screenshot dir]
// Fails unless both the bare domain and www serve the expected build, the
// doors open into the studio, narration starts, the Voice control shows, the
// four main cards are there, the Compass responds and Selected Work loads.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const expected = process.argv[2];
const dir = process.argv[3] || 'shots';
// VERIFY_URLS (comma-separated) checks another copy, e.g. a local build.
const urls = (process.env.VERIFY_URLS || 'https://tylermcgrath.com/,https://www.tylermcgrath.com/').split(',');
const cards = ['About Tyler', 'Marketing & SEO', 'Selected Work', 'Let’s Connect'];

async function check(browser, url, tag) {
  const failures = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  // Record what the site tries to say; headless Chromium has no voices.
  await page.addInitScript(() => {
    window.__spoken = [];
    const s = window.speechSynthesis;
    if (s) s.speak = (u) => window.__spoken.push(u.text);
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));

  await page.goto(`${url}?verify=${Date.now()}`, { waitUntil: 'networkidle' });
  await page.goto(url, { waitUntil: 'networkidle' });
  const build = await page.evaluate(() => (document.documentElement.innerHTML.match(/\\"b\\":\\"([^\\"]+)/) || [])[1]);
  if (expected && build !== expected) failures.push(`serves build ${build}, expected ${expected}`);
  await page.screenshot({ path: path.join(dir, `${tag}-1-doors.png`) });

  await page.getByRole('button', { name: /enter the studio/i }).click();
  await page.waitForTimeout(5000);
  const spoken = () => page.evaluate(() => window.__spoken);
  if (!(await spoken()).some((t) => t.startsWith('Welcome to Tyler McGrath’s portfolio') || t.startsWith("Welcome to Tyler McGrath's portfolio")))
    failures.push('no welcome narration');
  if (!(await page.locator('button:has-text("Voice")').isVisible())) failures.push('Voice control not visible');

  const awaken = page.getByRole('button', { name: /awaken/i });
  if (await awaken.isVisible().catch(() => false)) await awaken.click();
  await page.waitForTimeout(2500);
  for (const c of cards)
    if (!(await page.getByText(c, { exact: true }).first().isVisible().catch(() => false))) failures.push(`card missing: ${c}`);
  await page.screenshot({ path: path.join(dir, `${tag}-2-studio.png`) });

  const before = (await spoken()).length;
  await page.locator('.compass-mount').click({ force: true });
  await page.waitForTimeout(1500);
  if ((await spoken()).length === before) failures.push('Compass click did nothing');

  // The card may be on the far side of its orbit, behind the Compass.
  await page.locator('button', { hasText: 'Selected Work' }).first().dispatchEvent('click');
  await page.waitForTimeout(3000);
  const shots = await page.locator('img[src*="/projects/"]').evaluateAll((els) => els.filter((e) => e.complete && e.naturalWidth > 0).length);
  if (shots === 0) failures.push('Selected Work shows no websites');
  await page.screenshot({ path: path.join(dir, `${tag}-3-work.png`) });

  if (errors.length) failures.push(...errors.map((e) => `error: ${e}`));
  await page.close();
  return failures;
}

(async () => {
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  let failed = false;
  for (const [i, url] of urls.entries()) {
    const failures = await check(browser, url, ['apex', 'www'][i] ?? `site-${i}`);
    console.log(failures.length ? `FAIL ${url}\n  ${failures.join('\n  ')}` : `OK   ${url}`);
    failed ||= failures.length > 0;
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
