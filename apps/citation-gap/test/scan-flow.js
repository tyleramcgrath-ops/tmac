// Drives a full "real" scan in Chromium against a local stand-in for the three API routes.
// /api/serp is faked; /api/page and /api/render are the real handlers run against local fixtures.
const { chromium } = require(require('path').join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'));
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
process.env.CHROME_PATH = '/opt/pw-browsers/chromium';
const pageHandler = require('../api/page.js'), renderHandler = require('../api/render.js');

(async () => {
  const root = path.join(__dirname, '..');
  let port = 0;
  // Competitor fixtures are padded past the 300-word content floor; /comp/thin is served as-is
  // (72 words) to exercise the EXCLUDED — UNREADABLE path.
  const PAD = '<p>' + 'Fleet telematics prose about GPS tracking, ELD compliance and driver safety for this competitor page. '.repeat(30) + '</p>';
  const fixtures = { '/site/': 'fixture-render.html', '/comp/a': 'fixture-envue.html', '/comp/b': 'fixture-envue.html', '/comp/c': 'fixture-envue.html', '/comp/thin': 'fixture-render.html' };
  // A script-built competitor: the served HTML is a shell, the content arrives by JavaScript.
  const JSPAGE = '<!doctype html><html><head><title>JS built</title></head><body><main id="m"><h1>Loading</h1></main><script>document.getElementById("m").innerHTML="<h1>Fleet telematics platform</h1><h2>Why fleets choose us</h2><p>"+"Fleet telematics prose about GPS tracking and ELD compliance for this competitor page. ".repeat(40)+"</p>";</script></body></html>';
  const serveFixture = (name, pad) => { let h = fs.readFileSync(path.join(__dirname, name), 'utf8'); if (pad) h = h.includes('</main>') ? h.replace('</main>', PAD + '</main>') : h.replace('</body>', PAD + '</body>'); return h; };
  let serpHits = 0, widgetHits = 0;
  const srv = http.createServer(async (req, res) => {
    const u = url.parse(req.url, true);
    const send = (o) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(o)); };
    if (u.pathname === '/') { res.setHeader('content-type', 'text/html'); return res.end(fs.readFileSync(path.join(root, 'index.html'))); }
    // A third-party chat widget (served from a different host: localhost vs 127.0.0.1) whose
    // status line is present on odd loads only — the P16 volatile case.
    if (u.pathname === '/widget.js') { widgetHits++; res.setHeader('content-type', 'text/javascript');
      return res.end("var d=document.createElement('div');d.id='crisp-chatbox';d.innerHTML='<p>Chat with EnVue Telematics</p>'+(" + widgetHits + " % 2 === 1 ? '<p>We are online</p>' : '');document.body.appendChild(d);"); }
    if (u.pathname === '/site/') { res.setHeader('content-type', 'text/html'); return res.end(serveFixture('fixture-render.html', false).replace('</body>', '<script src="http://localhost:' + port + '/widget.js"></script></body>')); }
    if (u.pathname === '/comp/js') { res.setHeader('content-type', 'text/html'); return res.end(JSPAGE); }
    if (fixtures[u.pathname]) { res.setHeader('content-type', 'text/html'); return res.end(serveFixture(fixtures[u.pathname], /^\/comp\/[abc]$/.test(u.pathname))); }
    if (u.pathname === '/api/serp') { serpHits++;
      const base = 'http://127.0.0.1:' + port;
      return send({ organic: [{ position: 1, url: base + '/comp/a', domain: 'geotab.com' }, { position: 2, url: base + '/comp/b', domain: 'samsara.com' }, { position: 3, url: base + '/comp/c', domain: 'gomotive.com' }, { position: 4, url: base + '/comp/thin', domain: 'thin.com' }, { position: 5, url: base + '/comp/js', domain: 'jsbuilt.com' }, { position: 6, url: base + '/nope', domain: 'blocked.com' }],
        aiOverview: { text: 'Telematics is...', sources: [{ domain: 'geotab.com' }] }, paa: ['what is telematics'] });
    }
    const fake = { setHeader() {}, status() { return fake; }, json(o) { send(o); return fake; } };
    if (u.pathname === '/api/page') return pageHandler({ query: u.query }, fake);
    if (u.pathname === '/api/render') return renderHandler({ query: u.query }, fake);
    res.statusCode = 404; res.end('nope');
  });
  await new Promise((r) => srv.listen(0, r)); port = srv.address().port;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await browser.newPage();
  const errors = []; pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  pg.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  await pg.goto('http://127.0.0.1:' + port + '/');
  await pg.waitForSelector('#report.on');
  await pg.evaluate(() => { localStorage.setItem('cg.key', 'x'); localStorage.removeItem('cg.hist'); });
  await pg.reload(); await pg.waitForSelector('#report.on');
  const run = async () => {
    await pg.fill('#url', 'http://127.0.0.1:' + port + '/site/');
    await pg.fill('#kw', 'telematics');
    await pg.evaluate(() => { document.querySelector('#apikey').value = 'fake-key'; document.querySelector('#nq').value = '0'; });
    await pg.click('#btnRun');
    await pg.waitForFunction(() => !S.running, null, { timeout: 90000 });
  };
  await run();
  const log1 = await pg.$eval('#log', (e) => e.innerText);
  const d1 = await pg.evaluate(() => ({ rescued: S.lastData.rescued, wordCheck: S.lastData.wordCheck, n: S.lastData.medians.total, basis: S.lastData.basis, volatile: S.lastData.volatile, sample: S.lastData.sample, gate: S.lastData.rendered && S.lastData.rendered.gate, rank: S.lastData.rankScore, answer: S.lastData.answerScore, fixes: S.lastData.fixes.map((f) => f.key), rendered: !!S.lastData.rendered, diff: S.lastData.diff && { hidden: S.lastData.diff.hiddenCount, inj: S.lastData.diff.visibleNotServedCount, imp: S.lastData.diff.important.length }, band: S.lastData.band, failed: S.lastData.failed, changes: S.lastData.changes }));
  console.log('--- scan 1 log ---\n' + log1);
  console.log('scan 1:', JSON.stringify(d1));
  const err1 = await pg.$eval('#err', (e) => e.textContent);
  // second scan of the unchanged page → history diff. Before it, doctor the stored history so
  // the previous scan appears to have carried two findings this scan will not produce: a
  // duplicate-heading task whose heading IS on the page once (its check comes back clean →
  // WITHDRAWN on an unchanged page, never RESOLVED) and a title task whose check finds the
  // title still lacking the term (→ STILL PRESENT, carried into the work order).
  await pg.evaluate(() => {
    const all = JSON.parse(localStorage.getItem('cg.hist') || '{}'); const k = Object.keys(all)[0]; const e = all[k][all[k].length - 1];
    e.version = '10.2';
    e.fixes = e.fixes.filter((f) => f.key !== 'kwInTitle').concat([
      { key: 'dupHeadings', title: 'Remove 1 duplicated heading (1 distinct text repeated)', items: ['Our Telematics Solutions Drive Results'], body: 'dup body', code: 'c', severity: 'HIGH', effort: '30 MIN', engine: 'RANK', pts: 6, hours: 0.5, extra: true, section: 'OUT-OF-SCORE' },
      { key: 'kwInTitle', title: 'Put the head term in the title tag', items: [], body: 'title body', code: 'now → Render fixture', severity: 'CRITICAL', effort: '15 MIN', engine: 'RANK', pts: 20, hours: 0.25, extra: false, section: 'IN-SCORE' }]);
    localStorage.setItem('cg.hist', JSON.stringify(all));
  });
  const serpBefore = serpHits;
  await run();
  const d2 = await pg.evaluate(() => ({ rank: S.lastData.rankScore, changes: S.lastData.changes, reused: S.lastData.reused, sample: S.lastData.sample, volatile: S.lastData.volatile, fixes: S.lastData.fixes.map((f) => f.key + (f._carried ? ':' + f._carried : '')) }));
  // P9: the page did not change, so the second scan reuses the stored SERP + competitors and spends no credits.
  const reusedOk = !!(d2.reused && d2.reused.ageHours === 0 && serpHits === serpBefore && d2.sample && d2.sample.unaccounted === 0);
  console.log('P9 reuse:', reusedOk ? 'OK' : 'PROBLEM', JSON.stringify(d2.reused), '| serp calls during scan 2:', serpHits - serpBefore, '| sample:', JSON.stringify(d2.sample));
  console.log('scan 2 changes:', JSON.stringify(d2.changes));
  console.log('scan 2 fixes:', d2.fixes.join(', '));
  const hasTitleTask = d1.fixes.indexOf('kwInTitle') !== -1;
  const carriedOk = d2.changes.withdrawn.length === 1 && d2.changes.withdrawn[0].key === 'dupHeadings' && /now ×1/.test(d2.changes.withdrawn[0].check)
    && d2.changes.versionChanged
    && (hasTitleTask ? d2.changes.carried >= 1 : (d2.changes.stillPresent.length === 1 && d2.changes.stillPresent[0].key === 'kwInTitle' && d2.fixes.indexOf('kwInTitle:STILL PRESENT') !== -1));
  console.log('carry-forward through the real scan path:', carriedOk ? 'OK' : 'PROBLEM', '| title task produced natively:', hasTitleTask);
  const master = await pg.evaluate(() => masterPrompt(S.lastData));
  fs.writeFileSync(path.join(__dirname, 'scan-work-order.txt'), master);
  // P13: the attribution lines sum to the score delta (zero lines when the score did not move).
  const at = d2.changes && d2.changes.attribution;
  const atOk = !!at && Math.round(at.lines.reduce((a, l) => a + l.delta, 0)) === (d2.changes.rank[1] - d2.changes.rank[0]) && (d2.changes.rank[1] === d2.changes.rank[0] || /scoring rule change/.test(master));
  console.log('P13 attribution:', atOk ? 'OK' : 'PROBLEM', JSON.stringify(at));
  // P16: the widget status line was present on scan 1 and absent on scan 2 — tracked as seen 1/2,
  // no WITHDRAWN entry for it, and the task list is the same set of keys.
  const v1 = (d1.volatile && d1.volatile.rows) || [], v2 = (d2.volatile && d2.volatile.rows) || [];
  const online1 = v1.find((r) => /we are online/i.test(r.text)), online2 = v2.find((r) => /we are online/i.test(r.text));
  const volOk = !!online1 && online1.present && online1.seen === 1 && online1.of === 1 && !!online2 && !online2.present && online2.seen === 1 && online2.of === 2
    && v2.some((r) => /chat with envue/i.test(r.text) && r.present && r.seen === 2 && r.of === 2)
    && d2.changes.withdrawn.every((w) => w.key !== 'volatile') && !/we are online/i.test(JSON.stringify(d2.changes.withdrawn))
    && /VOLATILE \(third-party widget/.test(master) && /“We are online”[ .]*seen 1\/2 scans — absent this scan/.test(master)
    && d2.fixes.map((k) => k.split(':')[0]).sort().join() === d1.fixes.slice().sort().join();
  console.log('P16 volatile:', volOk ? 'OK' : 'PROBLEM', JSON.stringify({ v1, v2 }));
  // P12: served basis on scans 1–2 (the script-built competitor is BASIS_MISMATCH, not averaged
  // in); a third scan with "Render every competitor" ticked uses the rendered basis for every
  // page, including the rescued one, and the assertion passes.
  const servedBasisOk = d1.basis && d1.basis.kind === 'served' && d1.n === 3 && d1.rescued.length === 1 && d1.rescued[0].used === false
    && d1.sample.dispositions.some((x) => x.code === 'BASIS_MISMATCH' && x.domain === 'jsbuilt.com') && d1.sample.unaccounted === 0
    && /BASIS_MISMATCH {8}jsbuilt\.com/.test(master) && /Measurement basis \.\. SERVED HTML for every page/.test(master) && !/UNRELIABLE/.test(master) && !/LOW CONFIDENCE/.test(master);
  console.log('P12 served basis:', servedBasisOk ? 'OK' : 'PROBLEM', JSON.stringify(d1.sample));
  await pg.evaluate(() => { document.querySelector('#renderAll').checked = true; document.querySelector('#force').checked = true; });
  await run();
  const d3 = await pg.evaluate(() => ({ n: S.lastData.medians.total, basis: S.lastData.basis, comps: S.lastData.competitors.map((c) => [c.domain, c.wordBasis, c.wordCount, c.wordCountServed]), page: [S.lastData.page.wordBasis, S.lastData.page.wordCount, S.lastData.page.wordCountServed], rescued: S.lastData.rescued, changes: S.lastData.changes }));
  const master3 = await pg.evaluate(() => masterPrompt(S.lastData));
  const err3 = await pg.$eval('#err', (e) => e.textContent);
  const renderedBasisOk = !err3 && d3.basis.kind === 'rendered' && d3.n === 4 && d3.comps.every((c) => c[1] === 'rendered') && d3.page[0] === 'rendered' && d3.rescued[0].used === true
    && /Measurement basis \.\. RENDERED \(painted \+ reachable\) for every page/.test(master3) && /RENDERED  jsbuilt\.com — served HTML gave \d+ words[^\n]*USED \(rendered basis\)/.test(master3)
    && d3.changes && d3.changes.attribution && /scoring rule change[^\n]*word basis/.test(master3 + (d3.changes.rank[0] === d3.changes.rank[1] ? 'scoring rule change word basis' : ''));
  console.log('P12 rendered basis:', renderedBasisOk ? 'OK' : 'PROBLEM', JSON.stringify(d3), err3);
  await pg.evaluate(() => { document.querySelector('#renderAll').checked = false; document.querySelector('#force').checked = false; });
  const sections = await pg.$$eval('#report section h2', (h) => h.map((x) => x.textContent.trim()));
  console.log('sections:', sections.join(' | '));
  console.log('err banner:', JSON.stringify(err1), '| JS errors:', errors.length); errors.forEach((e) => console.log('  ', e));
  await pg.screenshot({ path: path.join(__dirname, 'scan-shot.png'), fullPage: true });
  await browser.close(); srv.close();
  const excluded = (d1.failed || []).find((f) => f.domain === 'thin.com');
  console.log('rescued:', JSON.stringify(d1.rescued), '| wordCheck:', JSON.stringify(d1.wordCheck), '| competitors used:', d1.n);
  console.log('excluded competitor:', JSON.stringify(excluded), '| gate:', JSON.stringify(d1.gate), '| withdrawn:', JSON.stringify(d2.changes && d2.changes.withdrawn));
  const good = !err1 && errors.length === 0 && d1.rendered && d1.fixes[0] === 'hiddenContent' && d2.changes && !d2.changes.pageChanged
    && excluded && excluded.excluded && /floor/.test(excluded.reason) && d1.gate && d1.gate.state === 'partial' && Array.isArray(d2.changes.withdrawn)
    && /Gate self-check/.test(master) && /BELOW_MIN_CONTENT {5}thin\.com — 72 main-content words/.test(master) && /SECTION A — OUT-OF-SCORE/.test(master)
    && d1.rescued && d1.rescued.length === 1 && d1.rescued[0].domain === 'jsbuilt.com' && d1.rescued[0].renderedWords >= 300
    && /RENDERED  jsbuilt\.com — served HTML gave \d+ words/.test(master) && d1.wordCheck && typeof d1.wordCheck.diffPct === 'number' && /Word count check \.\.\. (BASIS DIFFERENCE|served )/.test(master) && reusedOk && /## NO CHANGE SINCE LAST SCAN/.test(master) && /arithmetic closes: used \+ dispositions = requested/.test(master)
    && atOk && volOk && servedBasisOk && renderedBasisOk && /Effort model: 1 day = 6 hours/.test(master) && !/\[CRITICAL[^\]]*\][\s\S]*SECTION B/.test(master.slice(master.indexOf('SECTION B')))
    && /1\/2 released, 1 still hidden \(“Get a Free Demo”\)/.test(master)
    && carriedOk && /Scanner rules \.\.\.\.\.\. CHANGED since that scan \(10\.2 → /.test(master) && /WITHDRAWN \.\.\.[\s\S]*Remove 1 duplicated heading[\s\S]*now ×1/.test(master);
  console.log(good ? 'SCAN FLOW OK' : 'SCAN FLOW PROBLEM');
  process.exit(good ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
