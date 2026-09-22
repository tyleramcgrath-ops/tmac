// Projects → score movement over time. The retainer claim is "the work moved the number", so
// the chart has to be plotted from the same stored scans the reports were written from, and the
// table has to agree with the chart. Seeds cg.hist, opens the view, and checks both.
const { chromium } = require(require('path').join(require('child_process').execSync('npm root -g').toString().trim(),'playwright'));
const http = require('http'), fs = require('fs'), path = require('path');
const { enterApp, serveStatic } = require('./enter-app.js');

let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); } };

const SCANS = [[34, 46, 31, 14], [24, 58, 39, 11], [15, 63, 52, 9], [8, 71, 58, 7], [2, 82, 64, 5]];

(async () => {
  const root = path.join(__dirname, '..');
  const srv = http.createServer((q, r) => { if (serveStatic(require('url').parse(q.url).pathname, r, root)) return; r.setHeader('content-type', 'text/html'); r.end(fs.readFileSync(path.join(root, 'index.html'))); });
  await new Promise((r) => srv.listen(0, r));
  const port = srv.address().port;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  pg.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_CERT|net::/.test(m.text())) errors.push('console: ' + m.text()); });

  await pg.goto('http://127.0.0.1:' + port + '/');
  await pg.waitForSelector('#report.on');
  await pg.evaluate((rows) => {
    const mk = (d, rank, answer, n) => ({ url: 'https://envuetelematics.com/dash-cams/', kw: 'ai dash cam for fleets',
      stamp: new Date(Date.now() - d * 864e5).toDateString(), ts: Date.now() - d * 864e5, version: '10.5',
      rank, answer, n: 8, fixes: Array.from({ length: n }, (_, i) => ({ key: 'k' + i, pts: 6 })) });
    localStorage.setItem('cg.hist', JSON.stringify({
      'https://envuetelematics.com/dash-cams/|ai dash cam for fleets': rows.map((r) => mk.apply(null, r)),
      // deliberately older than the multi-scan project: the grid sorts newest first, so this
      // fixes which card is which rather than leaving the test's clicks to chance
      'https://example.com/pricing|fleet gps pricing': [{ url: 'https://example.com/pricing', kw: 'fleet gps pricing',
        stamp: new Date(Date.now() - 3 * 864e5).toDateString(), ts: Date.now() - 3 * 864e5, version: '10.5',
        rank: 55, answer: 41, n: 6, fixes: [{ key: 'a', pts: 5 }] }]
    }));
  }, SCANS);
  await pg.reload();
  await pg.waitForSelector('#report.on');
  await enterApp(pg);

  console.log('\n1. The grid lists a project per scanned page+keyword');
  await pg.click('#navProjects');
  await pg.waitForSelector('.proj-card');
  const order = await pg.$$eval('.proj-card .kw', (e) => e.map((n) => n.textContent));
  ok((await pg.$$('.proj-card')).length === 2, 'both seeded projects appear');
  ok(order[0] === 'ai dash cam for fleets', 'newest-scanned project sorts first', order.join(' | '));

  console.log('\n2. Opening one shows the movement chart, and hides the grid');
  await pg.click('.proj-card');
  await pg.waitForSelector('.pd-chart');
  const gridGone = await pg.evaluate(() => {
    const g = document.querySelector('#projGrid');
    return g.hidden && getComputedStyle(g).display === 'none';
  });
  ok(gridGone, 'the grid is hidden, not just flagged hidden');

  const plot = await pg.evaluate(() => {
    const svg = document.querySelector('.pd-chart');
    return {
      series: svg.querySelectorAll('polyline.ser').length,
      dots: svg.querySelectorAll('circle.dot').length,
      ends: [].map.call(svg.querySelectorAll('text.endlab'), (t) => t.textContent),
      axis: [].map.call(svg.querySelectorAll('text.axlab'), (t) => t.textContent),
      legend: document.querySelector('.pd-legend').textContent.replace(/\s+/g, ' ').trim()
    };
  });
  ok(plot.series === 2, 'two series are drawn');
  ok(plot.dots === SCANS.length * 2, 'a marker per scan per series (' + plot.dots + ')');
  ok(plot.ends.join(',') === '82,64', 'both series are direct-labelled at their last point, so identity is not colour-alone', plot.ends.join(','));
  ok(plot.axis.filter((t) => ['0', '25', '50', '75', '100'].indexOf(t) !== -1).length === 5,
    'one shared 0–100 axis — never a second scale for the second score');
  ok(/Rank \+36/.test(plot.legend) && /Answer \+33/.test(plot.legend),
    'the legend states each series and its net movement', plot.legend);

  console.log('\n3. The table is the chart\'s accessible twin and agrees with it');
  const table = await pg.evaluate(() => [].map.call(document.querySelectorAll('.pd-table tbody tr'),
    (tr) => [].map.call(tr.children, (td) => td.textContent.trim())));
  ok(table.length === SCANS.length, 'a row per scan');
  ok(table[0][1] === '82' && table[0][3] === '64', 'newest first, matching the chart\'s end labels');
  ok(table[0][2] === '+11' && table[0][4] === '+6', 'deltas are against the previous scan', JSON.stringify(table[0]));
  ok(table[table.length - 1][2] === '—' && table[table.length - 1][4] === '—', 'the first scan has no delta to show');
  ok(table[0][5] === '5' && table[0][6] === '30', 'open tasks and recoverable points come from the stored findings', JSON.stringify(table[0]));

  console.log('\n4. Hovering a scan gives a crosshair and its figures');
  const box = await (await pg.$('.pd-chart')).boundingBox();
  await pg.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await pg.waitForTimeout(250);
  const tip = await pg.evaluate(() => {
    const t = document.querySelector('.pd-tip');
    return { on: t.classList.contains('on'), text: t.textContent.replace(/\s+/g, ' ').trim(),
      cross: document.querySelector('.pd-chart').classList.contains('on') };
  });
  ok(tip.on && tip.cross, 'the tooltip and crosshair show on hover');
  ok(/Rank ?63/.test(tip.text.replace(/\s/g, ' ')) && /Answer ?52/.test(tip.text.replace(/\s/g, ' ')),
    'the tooltip reports that scan\'s own figures', tip.text);

  console.log('\n5. A single scan is reported as a reading, not drawn as a trend');
  await pg.click('.proj-back');
  await pg.waitForSelector('.proj-card');
  const cards = await pg.$$('.proj-card');
  await cards[1].click();
  await pg.waitForSelector('.pd-solo');
  ok(!(await pg.$('.pd-chart')), 'no line is drawn through one point');
  ok(/One scan so far/.test(await pg.$eval('.pd-card', (e) => e.textContent)), 'it says so plainly');

  await browser.close();
  srv.close();
  console.log('\npage errors:', errors.length);
  errors.forEach((e) => console.log('  ', e));
  console.log(pass + ' passed, ' + fail + ' failed');
  process.exit(fail || errors.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
