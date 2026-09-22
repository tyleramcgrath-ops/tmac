// Regression tests for the scanner (Part 5 of the operator spec). Run: node test/regression.js
const fs = require('fs'), path = require('path'), vm = require('vm'), http = require('http');
const page = require('../api/page.js');
process.env.CHROME_PATH = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const render = require('../api/render.js');
const { chromium } = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'));

let pass = 0, fail = 0;
const ok = (cond, name, extra) => { if (cond) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); } };
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');

// Load the browser-side scoring/prompt/buildFixes code into a sandbox, the same way and in the
// same order a browser does: score.js first as a classic external script, then the inline blocks
// from index.html. Running the real file rather than require()ing it is deliberate — it is the
// browser's path that these assertions are about, and a module wrapper would hide a name that
// only works because it is global.
function loadApp() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const scripts = []; const re = /<script>([\s\S]*?)<\/script>/g; let m;
  while ((m = re.exec(html))) scripts.push(m[1]);
  const ctx = { console, document: { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, addEventListener() {} },
    window: {}, localStorage: { getItem: () => null, setItem() {} }, performance: { now: () => 0 }, requestAnimationFrame() {}, navigator: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'score.js'), 'utf8'), ctx);  // scoring + history + prompts
  vm.runInContext(scripts[0], ctx);   // buildFixes + scan flow (no DOM calls at load)
  return ctx;
}

async function fakeHandler(handler, query) {
  const out = {}; const res = { setHeader() {}, status(c) { out.status = c; return res; }, json(o) { out.body = o; return res; } };
  await handler({ query }, res); return out.body;
}

(async () => {
  console.log('\n1. Scanning URL and URL?x=1 returns identical structured data, and the URL is fetched verbatim');
  {
    const html = read('fixture-envue.html');
    const a = page.parse(html, 'https://envuetelematics.com/', 'telematics');
    const b = page.parse(html, 'https://envuetelematics.com/?x=1', 'telematics');
    ok(JSON.stringify(a.schemaTopLevel) === JSON.stringify(b.schemaTopLevel) && JSON.stringify(a.schemaClaims) === JSON.stringify(b.schemaClaims), 'identical schema for URL vs URL?x=1');
    const seen = [];
    const realFetch = global.fetch;
    global.fetch = async (u, o) => { seen.push({ u, h: o.headers }); return { status: 200, url: u, text: async () => html }; };
    await fakeHandler(page, { url: 'https://envuetelematics.com/', keyword: 'telematics' });
    global.fetch = realFetch;
    ok(seen.length === 1 && seen[0].u === 'https://envuetelematics.com/', 'fetched exactly the URL given, no parameter appended', seen[0] && seen[0].u);
    ok(seen[0] && /no-cache/.test(seen[0].h['Cache-Control']), 'freshness via Cache-Control: no-cache header');
  }

  console.log('\n2. A value present in the served HTML is never reported as JavaScript-injected');
  {
    const p = page.parse(read('fixture-envue.html'), 'https://envuetelematics.com/', 'telematics');
    const c31 = p.counters.find((c) => c.value === '31'), c21 = p.counters.find((c) => c.value === '21'), c88 = p.counters.find((c) => c.value === '88');
    ok(c31 && c31.inServedText && c31.textIsValue && c31.fromValue === '31', 'counter with text "31" and from=to=31 is served, no zero state');
    ok(c21 && c21.inServedText && !c21.textIsValue, 'counter printing 0 whose caption carries 21% is still served');
    ok(c88 && !c88.inServedText, 'counter with empty text and no caption figure is the only JS-dependent one');
    ok(p.jsHiddenStatCount === 1 && /^88 /.test(p.jsHiddenStats[0]), 'jsHiddenStats lists exactly the JS-dependent counter');
  }

  console.log('\n3. No extracted label contains a substring drawn from an HTML attribute');
  {
    const LEAK = /\b(id|class|srcset|sizes|viewbox|clippath|clip-path|xmlns|href|src|width|height)\b|clip-abc|max-width/i;
    const p = page.parse(read('fixture-envue.html'), 'https://envuetelematics.com/', 'telematics');
    ok(p.counters.length === 3 && p.counters.every((c) => !LEAK.test(c.label)), 'no counter label leaks attribute text', JSON.stringify(p.counters.map((c) => c.label)));
    ok(p.counters[0].label === 'Annual Reportable Accidents Reduced By 31%', 'label is the real caption', p.counters[0].label);
    // adversarial: counter wedged between an <img sizes> and an SVG clipPath, no caption element
    const nasty = '<html><body><main><p>' + 'word '.repeat(120) + '</p><img sizes="(max-width: 600px) 100vw" srcset="a.jpg 1x"><span data-to-value="42"></span>'
      + '<svg><clipPath id="clip-zzz"><rect/></clipPath></svg><p>Sentence long enough to be a caption for this figure here.</p></main></body></html>';
    const q = page.parse(nasty, 'https://x.com/', 'x');
    ok(q.counters.length === 1 && !LEAK.test(q.counters[0].label), 'adversarial label reads the text node, not the attributes', JSON.stringify(q.counters));
  }

  console.log('\n4. Reported word count is reproducible from the emitted stripped text');
  {
    const p = page.parse(read('fixture-envue.html'), 'https://envuetelematics.com/', 'telematics', { full: true });
    ok(page.wordsOf(p.bodyText).length === p.wordCount, 'wordsOf(bodyText) === wordCount (' + p.wordCount + ')');
    ok(typeof p.wordRule === 'string' && p.wordRule.length > 100 && /alt text/.test(p.wordRule), 'tokenisation rule is published with the number');
    ok(/^[a-f0-9]{64}$/.test(p.textSha256), 'sha256 fingerprint emitted');
    const dashy = page.parse('<html><body><main><p>' + 'alpha beta — gamma | delta 5 six-seven '.repeat(40) + '</p></main></body></html>', 'https://x.com/', 'x');
    ok(dashy.wordCount === 40 * 6, 'a lone dash or pipe is not a word; hyphenated compound and numeral are one each (6 of 8 tokens)', String(dashy.wordCount));
  }

  console.log('\n5. Element counts are reported for both served HTML and rendered DOM when they differ');
  let rendered = null, servedRender = null;
  {
    const html = read('fixture-render.html');
    servedRender = page.parse(html, 'http://localhost/page', 'telematics', { full: true });
    ok(servedRender.animationGatedElements === 2 && servedRender.animationGatedCount === 2, 'served: raw marker count and outermost block count both reported', servedRender.animationGatedElements + '/' + servedRender.animationGatedCount);
    ok(typeof servedRender.blockRule === 'string' && /OUTERMOST/.test(servedRender.blockRule), 'block definition stated');
    const env = page.parse(read('fixture-envue.html'), 'https://envuetelematics.com/', 'telematics');
    ok(env.animationGatedElements === 5 && env.animationGatedCount === 3, 'nested gated elements counted inside their parent (5 elements, 3 blocks)', env.animationGatedElements + '/' + env.animationGatedCount);
    const srv = http.createServer((q, r) => { r.setHeader('content-type', 'text/html'); r.end(html); });
    await new Promise((r) => srv.listen(0, r));
    rendered = await fakeHandler(render, { url: 'http://127.0.0.1:' + srv.address().port + '/page', wait: '700', parse: '1', keyword: 'telematics' });
    srv.close();
    ok(rendered.ok, 'render succeeded', rendered.error);
    ok(rendered.gating.inDom === 1 && rendered.gating.stillHidden === 1, 'rendered: 1 wrapper left in DOM, 1 still hidden (served had 2)', JSON.stringify(rendered.gating));
    ok(rendered.gate && rendered.gate.atLoad.markers === 2 && rendered.gate.afterScroll.hidden === 1 && rendered.gate.state === 'partial' && rendered.scrollSteps > 0 && /wheel/.test(rendered.gate.interaction), 'gate self-check: 2 markers at first paint → 1 after wheel scroll = partial release, interaction recorded', JSON.stringify(rendered.gate));
    ok(rendered.counters[0] && rendered.counters[0].label === 'Annual Reportable Accidents Reduced By 31%', 'rendered counter labelled by its caption, not its value', JSON.stringify(rendered.counters));
    ok(rendered.hidden.some((h) => h.kind === 'call to action' && h.text === 'Get a Free Demo' && h.reason === 'visibility:hidden'), 'hidden CTA found by computed style with its reason');
    ok(rendered.hidden.some((h) => h.kind === 'screen-reader-only'), 'sr-only text classified separately, not as a defect');
    ok(!rendered.innerText.includes('Get a Free Demo') && rendered.domText.includes('Get a Free Demo'), 'innerText respects visibility; DOM text does not');
    const ctx = (t) => (rendered.hidden.find((h) => h.text.startsWith(t)) || {}).context;
    ok(ctx('Dash Cams') === 'navigation' && ctx('I would recommend') === 'carousel' && ctx('Book a demo from the popup') === 'dialog', 'menu items, carousel slides and popup links labelled hidden-by-design', JSON.stringify(rendered.hidden.map((h) => [h.text.slice(0, 20), h.context])));
    ok(ctx('Get a Free Demo') === 'content' && rendered.hiddenContentCount === 6 && rendered.hiddenByContext.navigation === 2 && rendered.hiddenByContext['screen-reader'] === 1, 'stuck CTA stays content; per-context counts reported', JSON.stringify([rendered.hiddenContentCount, rendered.hiddenByContext]));
  }

  console.log('\n6. Every schema type requiring visible support is string-matched against text');
  {
    const p = page.parse(read('fixture-envue.html'), 'https://envuetelematics.com/', 'telematics');
    const q1 = p.schemaClaims.find((c) => c.text === 'What is telematics?'), q2 = p.schemaClaims.find((c) => /insurance costs/.test(c.text));
    ok(q1 && q1.present === true, 'declared FAQ question present on page is PRESENT');
    ok(q2 && q2.present === false, 'declared FAQ question absent from page is ABSENT');
    ok(p.schemaClaims.some((c) => c.kind === 'Offer price' && c.present === false), 'Offer price checked too');
    ok(p.schemaTopLevel.length === 7 && p.schemaNested.length === 7 && !p.schemaTopLevel.includes('Question'), 'top-level (7) and nested (7) reported separately');
  }

  console.log('\n7. Two scans of an unchanged page score within the stated confidence band; diff and ranking behave');
  {
    const app = loadApp();
    const comp = (d, w, h2, h3, l, st, t, q, kt, kh, sc) => ({ domain: d, wordCount: w, h2Count: h2, h3Count: h3, listCount: l, statCount: st, tableCount: t, questionHeadingCount: q, kwInTitle: kt, kwInH1: kh, kwInMeta: true, hasFaqSchema: sc, hasProductSchema: sc, entities: ['GPS', 'ELD', 'Geotab', 'Internet of Things'] });
    const comps = [comp('a.com', 2100, 10, 8, 5, 3, 0, 3, true, true, true), comp('b.com', 1900, 9, 6, 4, 0, 0, 2, true, true, false), comp('c.com', 2400, 11, 9, 6, 1, 1, 4, true, true, false),
      comp('d.com', 1600, 8, 5, 3, 0, 0, 1, true, false, false), comp('e.com', 3300, 12, 12, 7, 5, 0, 5, true, true, true), comp('f.com', 2200, 10, 8, 5, 2, 0, 3, true, true, false), comp('g.com', 2000, 9, 7, 5, 1, 0, 2, false, true, false)];
    const mine = { httpTitle: 'Telematics | X', h1: ['Telematics'], metaDescription: '', wordCount: 990, h2Count: 10, h3Count: 19, listCount: 5, tableCount: 0, statCount: 5, questionHeadingCount: 1,
      kwInTitle: true, kwInH1: true, kwInMeta: false, hasFaqSchema: true, hasProductSchema: false, schemaTypes: ['FAQPage'], schemaTopLevel: ['FAQPage'], schemaClaims: [{ kind: 'FAQ question', text: 'x', present: false }], schemaClaimsAbsent: 1, stats: ['a 31%'], entities: ['GPS', 'IoT'], bodyText: 'gps iot', siteLinkText: 'geotab marketplace' };
    const cov = { queries: 6, questions: [], domains: [['a.com', 4]], mine: 1, peerMedian: 3 };
    const score = (cs) => { const m = app.medians(cs), cats = app.categoryEntities(cs, 'x.com'); return [app.scoreRank(mine, m)[0], app.scoreAnswer(mine, m, cov, cats)[0], m, cats]; };
    const [r7, a7, m7, cats7] = score(comps);
    const band = app.looBand(comps, mine, cov, 'x.com');
    const [r6, a6] = score(comps.slice(0, 6));
    ok(band && r6 >= band.rank[0] && r6 <= band.rank[1] && a6 >= band.answer[0] && a6 <= band.answer[1], 'scores with one competitor dropped fall inside the band', JSON.stringify({ r7, a7, r6, a6, band }));
    ok(m7.spread && m7.spread.wordCount.min === 1600 && m7.spread.wordCount.max === 3300, 'spread min/max reported with the median');
    ok(cats7.some((g) => g.canonical === 'Internet of Things' || g.canonical === 'IoT'), 'concept groups built');
    const rr = app.scoreRank(mine, m7)[1], an = app.scoreAnswer(mine, m7, cov, cats7), ar = an[1], missing = an[2];
    ok(missing.indexOf('IoT') === -1 && missing.indexOf('Internet of Things') === -1, 'IoT on the page satisfies the Internet of Things concept', JSON.stringify(missing));
    ok(app.classifyTerm('Geotab', ['geotab.com', 'a.com'], mine.siteLinkText, 'x.com') === 'OWN STACK', 'a brand named on the site is OWN STACK even when it also ranks');
    ok(app.classifyTerm('Motive', ['gomotive.com'], '', 'x.com') === 'COMPETITOR', 'Motive → gomotive.com is COMPETITOR');
    ok(app.classifyTerm('DVIR', ['a.com'], '', 'x.com') === 'VOCABULARY', 'plain term is VOCABULARY');
    const diff = app.renderDiff(servedRender, rendered);
    ok(diff && diff.important.some((h) => h.kind === 'call to action') && diff.visibleNotServedCount >= 1, 'renderDiff finds the hidden CTA and the injected line', JSON.stringify({ imp: diff && diff.important.length, inj: diff && diff.visibleNotServedCount }));
    ok(diff && !diff.important.some((h) => /Dash Cams|Book a demo from the popup/.test(h.text)) && diff.byDesignCount === 5 && diff.hiddenCount === 6, 'menu/popup/carousel items never become findings; counted as hidden by design', JSON.stringify({ imp: diff.important.map((h) => h.text), byDesign: diff.byDesignCount, hidden: diff.hiddenCount }));
    const fixes = app.buildFixes(mine, m7, rr, ar, 'telematics', cats7, missing, 'X', { diff, rendered, missingInfo: [] });
    ok(fixes[0].key === 'hiddenContent', 'hidden content is Task 1', fixes.map((f) => f.key).join(','));
    ok(fixes.some((f) => f.key === 'h3Fragmented') && fixes.some((f) => f.key === 'claimsAudit') && fixes.some((f) => f.key === 'schemaMismatch'), 'consolidation, claims audit and schema reconciliation tasks present');
    ok(!fixes.some((f) => f.key === 'animGate'), 'no verify-animation task when the render ran');
    ok(fixes.every((f) => typeof f._pts === 'number' && typeof f._hours === 'number'), 'effort math attached to every task');
    const noRender = app.buildFixes(servedRender, m7, rr, ar, 'telematics', cats7, missing, 'X', {});
    ok(noRender.some((f) => f.key === 'animGate'), 'without a render, animation wrappers become a verify task');
    // median 0 → demoted, explicit rationale
    const m0 = Object.assign({}, m7, { questionHeadingCount: 0 });
    const ar0 = app.scoreAnswer(mine, m0, cov, cats7)[1];
    const fx0 = app.buildFixes(mine, m0, rr, ar0, 'telematics', cats7, missing, 'X', { diff, rendered, missingInfo: [] });
    const qh = fx0.find((f) => f.key === 'questionHeadings');
    ok(qh && (qh.severity === 'MEDIUM' || qh.severity === 'LOW') && qh._pts < 20 && /optional/.test(qh.title) && /Not a parity task/.test(qh.body), 'median-0 question task is demoted (half points, label from pts/hr) with an explicit rationale', qh && qh.severity);
    // scan-to-scan diff — every disappeared finding is re-verified by its own check
    const snapPrev = app.snapshotOf(mine, rendered);
    const prev = { stamp: 'yesterday', version: '10.2', rank: r7, answer: a7, n: 7, medianWords: m7.wordCount, fingerprint: app.fingerprintOf(mine), snap: snapPrev,
      fixes: [{ key: 'jsStats', title: 'Render counters', body: 'b', code: 'c', severity: 'HIGH', effort: '1 HR', engine: 'ANSWER', pts: 6, hours: 1, extra: false, section: 'IN-SCORE' }, { key: 'hiddenContent', title: 'x' }] };
    const cur = { stamp: 'now', version: '10.3', rank: r6, answer: a6, n: 6, medianWords: 1900, fingerprint: app.fingerprintOf(mine), snap: app.snapshotOf(mine, rendered), fixes: fixes.map((f) => ({ key: f.key, title: f.title })), rendered: true };
    const pageClean = Object.assign({}, mine, { counters: (mine.counters || []).map((c) => Object.assign({}, c, { inServedText: true })), jsHiddenStatCount: 0 });
    const ch = app.diffScans(prev, cur, pageClean, { rendered, diff });
    ok(ch && !ch.pageChanged && ch.resolved.length === 0 && ch.withdrawn.length === 1 && ch.withdrawn[0].key === 'jsStats' && /unchanged/.test(ch.withdrawn[0].why) && /counter check re-run/.test(ch.withdrawn[0].check), 'finding gone on an UNCHANGED page, check clean, is WITHDRAWN as a false positive with the re-check stated', JSON.stringify(ch && { r: ch.resolved, w: ch.withdrawn, s: ch.stillPresent }));
    ok(ch.versionChanged && ch.prevVersion === '10.2' && ch.curVersion === '10.3', 'a scanner version change between scans is detected');
    const chChanged = app.diffScans(Object.assign({}, prev, { fingerprint: 'other', snap: Object.assign({}, snapPrev, { wordCount: 500, wordCountServed: 500, title: 'Old title' }) }), cur, pageClean, { rendered, diff });
    ok(chChanged.pageChanged && chChanged.resolved.length === 1 && chChanged.withdrawn.length === 0 && /counter check re-run: every counter value now appears/.test(chChanged.resolved[0].why), 'finding gone on a CHANGED page is RESOLVED only because its own check re-ran clean', JSON.stringify(chChanged.resolved));
    ok(chChanged.changedLines && chChanged.changedLines.some((l) => /^title: /.test(l)) && chChanged.changedLines.some((l) => /^word count \(served\): 500 → /.test(l)), 'what changed is itemised (title, served word count)', JSON.stringify(chChanged.changedLines));
    // Round 6: the false RESOLVED. Duplicate headings still on the page, fingerprint moved by an
    // unrelated edit, the task fell off the list → STILL PRESENT, carried forward, never RESOLVED.
    const dupPage = Object.assign({}, mine, { outline: [{ level: 2, text: 'Recent Articles' }, { level: 3, text: 'Fleet Distracted Driving: How Telematics Helps Managers Identify Risk Before a Crash', kind: 'template' }, { level: 3, text: 'Fleet Distracted Driving: How Telematics Helps Managers Identify Risk Before a Crash', kind: 'template', hidden: true }, { level: 3, text: 'Fleet Fuel Theft: How Telematics Helps', kind: 'template' }, { level: 3, text: 'Fleet Fuel Theft: How Telematics Helps', kind: 'template' }], headingDuplicateCount: 2 });
    const prevDup = Object.assign({}, prev, { fingerprint: 'before-the-button-edit', snap: Object.assign({}, snapPrev, { animMarkers: 39 }), fixes: [{ key: 'dupHeadings', title: 'Remove 3 duplicated headings (3 distinct texts repeated)', items: ['Fleet Distracted Driving: How Telematics Helps Managers Identify Risk B', 'Fleet Fuel Theft: How Telematics Helps'], body: 'The same heading text appears more than once.', code: 'repeated → …', severity: 'HIGH', effort: '30 MIN', engine: 'RANK', pts: 6, hours: 0.5, extra: true, section: 'OUT-OF-SCORE' }] });
    const curDup = Object.assign({}, cur, { snap: Object.assign({}, snapPrev, { animMarkers: 36 }), fixes: fixes.filter((f) => f.key !== 'dupHeadings').map((f) => ({ key: f.key, title: f.title })) });
    const chDup = app.diffScans(prevDup, curDup, dupPage, { rendered, diff });
    ok(chDup.pageChanged && chDup.resolved.length === 0 && chDup.stillPresent.length === 1 && chDup.stillPresent[0].key === 'dupHeadings' && /still ×2/.test(chDup.stillPresent[0].check) && /STILL ON THE PAGE/.test(chDup.stillPresent[0].why) && /rules changed/.test(chDup.stillPresent[0].why), 'round 6: duplicate headings still on a changed page are STILL PRESENT, never RESOLVED; the re-run check is quoted', JSON.stringify(chDup.stillPresent));
    ok(chDup.changedLines.length === 1 && /entrance-animation markers: 39 → 36/.test(chDup.changedLines[0]), 'what changed names the one thing that moved (the animation marker count)', JSON.stringify(chDup.changedLines));
    const carried = app.carryForward(fixes.filter((f) => f.key !== 'dupHeadings'), chDup);
    const cf = carried.find((f) => f.key === 'dupHeadings');
    ok(cf && cf._carried === 'STILL PRESENT' && /RE-VERIFIED ON THIS SCAN: still on the page/.test(cf.body) && cf._section === 'OUT-OF-SCORE' && carried.indexOf(cf) < carried.findIndex((f) => f._section === 'IN-SCORE'), 'a STILL PRESENT task is put back into the work order, in its section, marked CARRIED', cf && JSON.stringify({ c: cf._carried, s: cf._section }));
    // and when the duplicates really are gone, the specific check says so and RESOLVED is earned
    const fixedPage = Object.assign({}, mine, { outline: [{ level: 3, text: 'Fleet Distracted Driving: How Telematics Helps Managers Identify Risk Before a Crash' }, { level: 3, text: 'Fleet Fuel Theft: How Telematics Helps' }], headingDuplicateCount: 0 });
    const chFixed = app.diffScans(prevDup, Object.assign({}, curDup, { snap: Object.assign({}, snapPrev, { h3Count: 16, dupCount: 0 }) }), fixedPage, { rendered, diff });
    ok(chFixed.resolved.length === 1 && chFixed.stillPresent.length === 0 && /now ×1/.test(chFixed.resolved[0].check) && /H3 count: \d+ → 16/.test(chFixed.resolved[0].why), 'duplicates actually removed → RESOLVED with the re-run check and the page change named', JSON.stringify(chFixed.resolved));
    // no render this scan → hidden-content finding is UNVERIFIED and carried, not closed
    const chNoRender = app.diffScans(Object.assign({}, prev, { fingerprint: 'other', fixes: [{ key: 'hiddenContent', title: 'Make 3 pieces of hidden content visible', body: 'b', code: '', severity: 'CRITICAL', effort: '30 MIN', engine: 'HUMAN VISITORS', pts: 45, hours: 0.5, extra: true, section: 'OUT-OF-SCORE' }] }), Object.assign({}, cur, { fixes: [] }), mine, { rendered: null, diff: null });
    ok(chNoRender.unverified.length === 1 && chNoRender.resolved.length === 0 && /no browser render/.test(chNoRender.unverified[0].why), 'hidden content cannot be RESOLVED without a render — UNVERIFIED and carried');
    // master prompt renders with everything
    const mp = app.masterPrompt({ url: 'https://x.com/', keyword: 'telematics', brand: 'X', gl: 'us', hl: 'en', page: Object.assign({}, mine, { outline: [{ level: 1, text: 'Telematics' }] }), medians: m7, missing, missingInfo: [{ term: 'Geotab', variants: [], df: 5, bucket: 'OWN STACK' }],
      rendered, diff, band, failed: [{ domain: 'z.com', reason: 'HTTP 403' }, { domain: 'thin.com', reason: '82 words, 0 headings', excluded: true }], depthRequested: 10, changes: ch, fixes, stamp: 'now', rankScore: r7, answerScore: a7 });
    ok(/## METHODOLOGY/.test(mp) && /## RENDERED-VS-SERVED DIFF/.test(mp) && /## ROLLBACK SNAPSHOT/.test(mp) && /## CHANGES SINCE THE LAST SCAN/.test(mp) && /OWN STACK/.test(mp) && /pts\/hr/.test(mp), 'work order carries methodology, diff, rollback, changes, buckets and effort math');
    ok(/Score confidence \.\.\. Rank \d+–\d+/.test(mp) && /SPREAD \(MIN–MAX\)/.test(mp), 'confidence band and spread printed');
    ok(/Gate self-check \.\.\.\. /.test(mp) && /EXCLUDED — UNREADABLE  thin\.com/.test(mp) && /MEDIAN RANGE \(leave-one-out\)/.test(mp) && /SECTION A — OUT-OF-SCORE/.test(mp) && /SECTION B — IN-SCORE/.test(mp) && /WITHDRAWN \.\.\./.test(mp), 'v10: gate self-check, unreadable exclusions, median ranges, two task sections and WITHDRAWN printed');
    const mpDup = app.masterPrompt({ url: 'https://x.com/', keyword: 'telematics', brand: 'X', gl: 'us', hl: 'en', page: Object.assign({}, dupPage, { hiddenContainers: [{ tag: 'div', cls: 'elementor-element-abc', reason: 'inline display:none', words: 40, headings: 3, headingTexts: ['H3 Fleet Distracted Driving'] }] }), medians: m7, missing, missingInfo: [],
      rendered, diff, band, failed: [], depthRequested: 10, changes: chDup, fixes: carried, stamp: 'now', rankScore: r7, answerScore: a7 });
    ok(/STILL PRESENT \(re-verified\)[\s\S]*Remove 3 duplicated headings[\s\S]*still ×2/.test(mpDup) && /RESOLVED SINCE LAST SCAN \.\.\. none/.test(mpDup) && /what changed: entrance-animation markers: 39 → 36/.test(mpDup) && /Scanner rules \.\.\.\.\.\. CHANGED since that scan \(10\.2 → 10\.3\)/.test(mpDup) && /Hidden containers \.\. 1 element/.test(mpDup) && /RE-VERIFIED ON THIS SCAN/.test(mpDup), 'work order prints STILL PRESENT with the re-run check, no RESOLVED, what changed, the rule-change note and the hidden containers', mpDup.slice(mpDup.indexOf('## CHANGES'), mpDup.indexOf('## CHANGES') + 900));
    ok(/never leaves the DOM/.test(mp) && !/still in the DOM after render/.test(mp), 'wording: marker class removed, element never leaves the DOM');
  }

  console.log('\n8. v10 — the render self-check, median bands, three-state vocabulary, heading classes');
  {
    const app = loadApp();
    // A stuck gate: markers present, nothing dropped after scroll → hidden gated items are UNVERIFIED, not findings.
    const stuck = Object.assign({}, rendered, { gate: { atLoad: { markers: 2, hidden: 2 }, afterScroll: { markers: 2, hidden: 2 }, released: 0, state: 'stuck', interaction: 'x' } });
    const dS = app.renderDiff(servedRender, stuck);
    ok(dS.gateStuck && dS.unverified.length >= 2 && !dS.hidden.some((h) => h.gated) && dS.important.every((h) => !h.gated), 'stuck gate: gated elements become UNVERIFIED and leave the findings', JSON.stringify({ unv: dS.unverified.length, hidden: dS.hidden.map((h) => h.text) }));
    const comp = (d, w, h2, h3, l, st, t, q, kt, kh, sc) => ({ domain: d, wordCount: w, h2Count: h2, h3Count: h3, listCount: l, statCount: st, tableCount: t, questionHeadingCount: q, kwInTitle: kt, kwInH1: kh, kwInMeta: true, hasFaqSchema: sc, hasProductSchema: sc, entities: ['GPS', 'ELD', 'Geotab', 'Internet of Things'] });
    const comps = [comp('a.com', 2100, 10, 8, 5, 3, 0, 3, true, true, true), comp('b.com', 1900, 9, 6, 4, 0, 0, 0, true, true, false), comp('c.com', 2400, 11, 9, 6, 1, 1, 4, true, true, false), comp('d.com', 1600, 8, 5, 3, 0, 0, 0, true, false, false), comp('e.com', 3300, 12, 12, 7, 5, 0, 5, true, true, true)];
    const mine = { httpTitle: 'Telematics | X', h1: ['Telematics'], metaDescription: '', wordCount: 990, h2Count: 10, h3Count: 19, h3Editorial: 16, h3Template: 3, h3Unique: 16, headingDuplicates: [{ text: 'Fleet Fuel Theft', level: 3, count: 2, near: false, inTemplate: true }], headingDuplicateCount: 3, listCount: 5, tableCount: 0, statCount: 5, questionHeadingCount: 1, animationGatedCount: 2, animationGatedElements: 3, animationGated: [{ carries: 'call to action', sample: 'Get a Free Demo', framework: 'Elementor entrance animation' }],
      kwInTitle: true, kwInH1: true, kwInMeta: false, hasFaqSchema: false, hasProductSchema: false, schemaTypes: [], schemaTopLevel: [], schemaClaims: [], schemaClaimsAbsent: 0, stats: ['a 31%'], entities: ['GPS', 'ELD'], bodyText: 'gps eld geotab', siteLinkText: '' };
    const cov = { queries: 6, questions: [], domains: [['a.com', 4]], mine: 1, peerMedian: 3 };
    const m = app.medians(comps), cats = app.categoryEntities(comps, 'x.com');
    const rr = app.scoreRank(mine, m)[1];
    const vis = { text: 'GPS tracking and ELD compliance', reliable: true };
    const an = app.scoreAnswer(mine, m, cov, cats, vis);
    const geo = an[3].find((s) => s.canonical === 'Geotab');
    ok(geo && geo.state === 'PRESENT BUT HIDDEN' && an[2].indexOf('Geotab') !== -1, 'a term in served text but not in visible text is PRESENT BUT HIDDEN and counted as missing', JSON.stringify(an[3]));
    const anU = app.scoreAnswer(mine, m, cov, cats, { text: 'GPS tracking and ELD compliance', reliable: false });
    ok(anU[3].find((s) => s.canonical === 'Geotab').state === 'PRESENT (visibility unverified)', 'with an unreliable render the served text decides and the state says unverified');
    const band = app.looBand(comps, mine, cov, 'x.com', vis);
    ok(band && band.medians && band.medians.questionHeadingCount[0] < band.medians.questionHeadingCount[1] && band.medians.wordCount[0] <= m.wordCount && band.medians.wordCount[1] >= m.wordCount, 'every median carries a leave-one-out range', JSON.stringify(band.medians));
    const fixes = app.buildFixes(mine, m, rr, an[1], 'telematics', cats, an[2], 'X', { diff: dS, rendered: stuck, missingInfo: [{ term: 'Geotab', variants: [], df: 4, state: 'PRESENT BUT HIDDEN', bucket: 'VOCABULARY' }], band });
    const soft = fixes.filter((f) => f._soft).map((f) => f.key);
    ok(soft.indexOf('questionHeadings') !== -1 && fixes.find((f) => f.key === 'questionHeadings').code.indexOf('SOFT TARGET') !== -1, 'a task whose median moves under leave-one-out is marked SOFT TARGET', JSON.stringify(soft));
    ok(fixes.some((f) => f.key === 'animGate' && /did NOT release/.test(f.code)) && !fixes.some((f) => f.key === 'hiddenContent' && /Get a Free Demo/.test(f.code)), 'stuck gate → verify task, never a hidden-content assertion for gated items');
    ok(fixes.some((f) => f.key === 'dupHeadings' && /3 duplicated/.test(f.title)), 'duplicate headings get their own task');
    const h3f = fixes.find((f) => f.key === 'h3Fragmented');
    ok(h3f && /editorial/.test(h3f.title) && /3 template\/feed/.test(h3f.title) && /16 mergeable editorial H3s/.test(h3f.body), 'consolidation target is set against editorial headings, stating template and duplicate counts', h3f && h3f.title);
    const ent = fixes.find((f) => f.key === 'entities');
    ok(ent && /hidden from visitors/.test(ent.title) && /present but hidden → Geotab/.test(ent.code), 'entities task leads with PRESENT BUT HIDDEN terms');
    const secs = fixes.map((f) => f._section);
    ok(secs.indexOf('IN-SCORE') > secs.lastIndexOf('OUT-OF-SCORE') && fixes.filter((f) => f._section === 'OUT-OF-SCORE').every((f) => f._extra) && fixes.filter((f) => f._section === 'IN-SCORE').every((f) => !f._extra), 'tasks split into OUT-OF-SCORE then IN-SCORE, each ranked within its own unit', secs.join(','));
    // parser: counter count parity, template/duplicate headings, boilerplate + locale filtered
    const html = '<html><body><main><h1>Telematics</h1><h2>Key Takeaways</h2><p>Geotab and Samsara offer GPS Tracking for the Internet of Things (IoT) to fleets everywhere.</p><ul><li>English</li><li>French</li></ul>'
      + '<h3>Fleet Fuel Theft: How Telematics Helps</h3><p>Prose about fuel theft long enough to count as a sentence for this.</p>'
      + '<div class="elementor-widget-posts"><article><h3 class="elementor-post__title">Fleet Fuel Theft: How Telematics Helps</h3></article><article><h3 class="elementor-post__title">Preventive Maintenance Scheduling</h3></article></div>'
      + '<h3>Preventive maintenance scheduling!</h3>'
      + '<span data-to-value="31">31</span><span data-to-value="21">21</span><span data-to-value="7">7</span><span data-to-value="6">6</span><div class="elementor-counter-title">Annual Reportable Accidents Reduced By 31%</div></main></body></html>';
    const p = page.parse(html, 'https://x.com/', 'telematics');
    ok(p.counterCount === 4, 'four counter attributes → four counters, captioned or not', String(p.counterCount));
    ok(p.h3Count === 4 && p.h3Template === 2 && p.h3Editorial === 2 && p.h3Unique === 2 && p.headingDuplicateCount === 2 && p.headingDuplicates.every((d) => d.inTemplate), 'headings: template vs editorial, unique vs total, duplicates flagged', JSON.stringify([p.h3Count, p.h3Template, p.h3Editorial, p.h3Unique, p.headingDuplicateCount]));
    ok(p.entities.indexOf('Takeaways') === -1 && p.entities.indexOf('French') === -1 && p.entities.indexOf('English') === -1 && p.entities.indexOf('GPS Tracking') !== -1, 'section-header boilerplate and language labels are not vocabulary', JSON.stringify(p.entities));
    ok(!p.entities.some((e) => /Theft Telematics/.test(e)), 'a stop word splits a run instead of fusing two fragments', JSON.stringify(p.entities));
  }

  console.log('\n9. v10.1 — exact gate residual by identity; word count from the attached DOM with a sanity bound');
  {
    const app = loadApp();
    // Bug A: the residual is reported exactly, by identity, with the CTA named.
    ok(rendered.gate.tracked === 2 && rendered.gate.releasedCount === 1 && rendered.gate.residualCount === 1 && rendered.gate.residual[0].ctaText === 'Get a Free Demo' && rendered.gate.residual[0].stillMarked === true, 'residual lists the exact element still hidden, with its CTA text and marker state', JSON.stringify(rendered.gate.residual));
    ok(/1\/2 released, 1 still hidden \(“Get a Free Demo”\)/.test(rendered.gate.summary) && /by identity/.test(rendered.gate.method) && /then back up/.test(rendered.gate.interaction), 'summary is an exact count with the residual named; method and reverse pass recorded', rendered.gate.summary);
    ok(app.gateLine(rendered.gate) === rendered.gate.summary && /PARTIALLY RELEASED/.test(app.gateVerdict(rendered.gate)), 'front end prints the exact-count line and the partial verdict');
    const released = { atLoad: { markers: 36, hidden: 36 }, afterScroll: { markers: 0, hidden: 0, tracked: 36 }, tracked: 36, releasedCount: 36, residualCount: 0, released: 36, state: 'released', residual: [] };
    const oneLeft = Object.assign({}, released, { afterScroll: { markers: 1, hidden: 1, tracked: 36 }, releasedCount: 35, residualCount: 1, released: 35, state: 'partial', residual: [{ text: 'More Info', ctaText: 'More Info', cta: true, reason: 'visibility:hidden', stillMarked: true, tag: 'div', cls: 'elementor-invisible' }] });
    ok(/36\/36 released, 0 still hidden/.test(app.gateLine(released)) && /35\/36 released, 1 still hidden \(“More Info”\)/.test(app.gateLine(oneLeft)), '"0 still hidden" only when literally 0; a 1-of-36 residual reads 35/36 and names the element', app.gateLine(oneLeft));
    const dOne = app.renderDiff(servedRender, Object.assign({}, rendered, { gate: oneLeft }));
    ok(!dOne.gateStuck && dOne.residual.length === 1 && dOne.hidden.some((h) => h.gated), 'a partial release keeps the residual as a real finding, never as unverified');
    // Bug B: word counts from the attached DOM, and the sanity bound.
    ok(rendered.renderedWords && rendered.renderedWords.main > 0 && rendered.renderedWords.page >= rendered.renderedWords.main && /attached, rendered DOM/.test(rendered.renderedWords.rule), 'render reports attached-DOM word counts for the page and the main region with the rule stated', JSON.stringify(rendered.renderedWords));
    ok(rendered.renderedHeadings && rendered.renderedHeadings.h2 === 1 && rendered.renderedHeadings.h2Total === 1, 'render reports visible heading counts');
    const agree = app.wordCheck({ wordCount: 1000, wordRegion: '<main>' }, { ok: true, renderedWords: { main: 1100, page: 1300, mainRegion: '<main>' } });
    const clash = app.wordCheck({ wordCount: 985, wordRegion: '<main>' }, { ok: true, renderedWords: { main: 1356, page: 1481, mainRegion: '<main>' }, parsed: { wordCount: 1200 } });
    ok(agree && !agree.basisDifference && agree.diffPct === 9 && clash && clash.basisDifference && clash.diffPct === 27 && clash.renderedDomRule === 1200, 'served-vs-rendered disagreement over 20% is a BASIS DIFFERENCE', JSON.stringify([agree, clash]));
    // P3: the check is independent (served regex parser vs painted rendered text), never says
    // "agree", prints both numbers, and scores the RENDERED figure when they disagree by >20%.
    ok(/BASIS DIFFERENCE 27% — served 985 · rendered 1,356/.test(app.wordCheckText(clash)) && /Scored figure: served \(985\)/.test(app.wordCheckText(clash)) && clash.scored === 'served' && clash.scoredWords === 985 && !/UNRELIABLE|LOW CONFIDENCE/.test(app.wordCheckText(clash)) && /script-mounted/.test(clash.explain), 'a >20% disagreement is a named BASIS DIFFERENCE; the shared (served) basis is scored; never UNRELIABLE (P12/P14)', app.wordCheckText(clash));
    const clashR = app.wordCheck({ wordCount: 985, wordRegion: '<main>' }, { ok: true, renderedWords: { main: 1356, page: 1481, mainRegion: '<main>' } }, 'rendered');
    ok(clashR.scored === 'rendered' && clashR.scoredWords === 1356 && /Scored figure: rendered \(1,356\)/.test(app.wordCheckText(clashR)), 'under the rendered basis the rendered figure is scored', app.wordCheckText(clashR));
    ok(/counts consistent/.test(app.wordCheckText(agree)) && !/agree\b/.test(app.wordCheckText(agree)) && agree.scored === 'served', 'a consistent pair prints both numbers and never the word "agree"', app.wordCheckText(agree));
    // P1: the rendered count is painted text — the off-page slide and its clone are not counted,
    // and innerText / textContent are reported beside it for comparison only.
    ok(rendered.renderedWords.page === 51 && rendered.renderedWords.main === 44 && rendered.renderedWords.innerTextPage === 70 && rendered.renderedWords.textContentPage === 132 && /painted text/.test(rendered.renderedWords.rule), 'rendered word count is painted text, with innerText and textContent printed for comparison', JSON.stringify(rendered.renderedWords));
    ok(Array.isArray(rendered.renderedWords.carousels) && rendered.renderedWords.carousels.some((c) => c.selector === '.swiper-slide-duplicate' && c.count === 1), 'carousel diagnostics list each known selector with painted / innerText / textContent words', JSON.stringify(rendered.renderedWords.carousels));
    ok(Array.isArray(rendered.headingList) && rendered.headingList.length >= 1 && rendered.headingList.every((h) => typeof h.painted === 'boolean' && typeof h.top === 'number'), 'render lists every heading with a painted flag and its y position');
    // P2: the served clone log names the selector that caught each drop.
    const cl = app.wordCheck({ wordCount: 985, wordRegion: '<main>', carouselCloneCount: 30, carouselCloneWords: 374, carouselClones: [{ selector: '.owl-item.cloned', kind: 'specific', count: 30, words: 374 }] }, { ok: true, renderedWords: { main: 582, page: 643, mainRegion: '<main>' } });
    ok(cl.clones === 30 && /30 by \.owl-item\.cloned/.test(app.wordCheckText(cl)) && /BASIS DIFFERENCE/.test(app.wordCheckText(cl)), 'word check text attributes served clone drops to their selector', app.wordCheckText(cl));
    const clLines = app.cloneLines({ carouselClones: [{ selector: '.owl-item.cloned', kind: 'specific', count: 30, words: 374 }] }, null);
    ok(clLines[0] === '30 matched by `.owl-item.cloned` (374 words) in served HTML' && clLines[1] === '0 matched by generic fallback', 'clone lines: 30 by .owl-item.cloned, 0 by the generic fallback', JSON.stringify(clLines));
    const clonesHtml = '<html><body><main><p>' + 'real word '.repeat(300) + '</p><div class="swiper-wrapper"><div class="swiper-slide"><p>' + 'slide word '.repeat(20) + '</p></div><div class="swiper-slide swiper-slide-duplicate" data-swiper-slide-index="0"><p>' + 'slide word '.repeat(20) + '</p></div><div class="slick-slide slick-cloned"><p>' + 'slick word '.repeat(20) + '</p></div></div></main></body></html>';
    const clParsed = page.parse(clonesHtml, 'https://x.test/', 'word', { full: true });
    ok(clParsed.wordCount === 640 && /Carousel clone slides/.test(clParsed.wordRule), 'served-HTML parser drops carousel clone slides (600 + 40, not 680) and the rule says so', String(clParsed.wordCount));
    // Served-HTML parser drops declared-hidden and template content; the rule says where the boundary is.
    const html = '<html><body><main><h1>T</h1><p>' + 'visible word '.repeat(100) + '</p><div hidden><p>' + 'ghost word '.repeat(50) + '</p></div><div style="display:none">secret menu items</div><template><p>tpl words</p></template><ul style="visibility: hidden"><li>Dash Cams</li></ul></main></body></html>';
    const p = page.parse(html, 'https://x.com/', 'x', { full: true });
    ok(p.wordCount === 201 && !/ghost|secret|Dash Cams|tpl/.test(p.bodyText), 'hidden attribute, inline display:none / visibility:hidden and <template> are dropped with their contents', String(p.wordCount));
    ok(/no JavaScript run, no DOMParser innerText/.test(p.wordRule) && /Section boundary/.test(p.wordRule), 'the word rule states the source and the section boundary explicitly');
    ok(p.hiddenContainerCount === 3 && p.hiddenContainers[0].reason === 'hidden attribute' && p.hiddenContainers[1].reason === 'inline display:none' && p.hiddenContainers[0].words === 100, 'declared-hidden containers are listed with reason and what they carry', JSON.stringify(p.hiddenContainers));
    // Round 6: the heading census counts EVERY served heading (what a person counts in the source);
    // one inside a hidden container is labelled, not dropped — so a hidden duplicate is still a duplicate.
    const hidDup = '<html><body><main><h2>Recent Articles</h2><div class="elementor-widget-posts"><h3 class="elementor-post__title">Fleet Fuel Theft: How Telematics Helps</h3><h3 class="elementor-post__title">Fleet Fuel Management</h3></div>'
      + '<div class="elementor-element-e1 elementor-widget-posts" style="display:none"><h3 class="elementor-post__title">Fleet Fuel Theft: How Telematics Helps</h3><p>' + 'hidden word '.repeat(30) + '</p></div><p>' + 'body word '.repeat(300) + '</p></main></body></html>';
    const hd = page.parse(hidDup, 'https://x.com/', 'fleet', { full: true });
    ok(hd.h3Count === 3 && hd.h3Unique === 2 && hd.h3Hidden === 1 && hd.headingDuplicateCount === 1 && hd.headingDuplicates[0].hiddenCopies === 1 && hd.outline.some((h) => h.hidden && /display:none on \.elementor-element-e1/.test(h.hiddenBy)), 'a duplicate H3 inside a display:none container is counted, labelled HIDDEN and still a duplicate', JSON.stringify({ c: hd.h3Count, u: hd.h3Unique, h: hd.h3Hidden, d: hd.headingDuplicates }));
    ok(hd.wordCount === 600 + 2 + 6 + 3 && /labelled HIDDEN, never dropped/.test(hd.headingRule), 'the hidden container is still excluded from the word count and the heading rule says so', String(hd.wordCount));
    // Rendered-DOM parse (competitor rescue path) uses the same rules on the rendered document.
    ok(rendered.parsed && rendered.parsed.source && /rendered DOM/.test(rendered.parsed.source) && typeof rendered.parsed.wordCount === 'number' && Array.isArray(rendered.parsed.entities), 'parse=1 returns the rendered DOM measured with the served-HTML rules', JSON.stringify(rendered.parsed && { wc: rendered.parsed.wordCount, src: rendered.parsed.source }));
    const mp = app.masterPrompt({ url: 'https://x.com/', keyword: 'telematics', brand: 'X', gl: 'us', hl: 'en', page: Object.assign({}, servedRender, { outline: [] }), medians: app.medians([{ wordCount: 2000, h2Count: 9, h3Count: 8, listCount: 5, statCount: 3, tableCount: 0, questionHeadingCount: 3, kwInTitle: true, kwInH1: true, kwInMeta: true, hasFaqSchema: false, hasProductSchema: false, entities: [] }, { wordCount: 2200, h2Count: 9, h3Count: 8, listCount: 5, statCount: 3, tableCount: 0, questionHeadingCount: 3, kwInTitle: true, kwInH1: true, kwInMeta: true, hasFaqSchema: false, hasProductSchema: false, entities: [] }]), missing: [], missingInfo: [],
      rendered: Object.assign({}, rendered, { gate: oneLeft }), diff: dOne, band: null, failed: [], rescued: [{ domain: 'samsara.com', position: 2, servedWords: 82, renderedWords: 899, renderedMain: 899, headings: 8 }], depthRequested: 10, changes: null, fixes: [], stamp: 'now', rankScore: 50, answerScore: 40, wordCheck: clash });
    ok(/Gate self-check \.\.\.\. 36 markers at first paint → 35\/36 released, 1 still hidden \(“More Info”\)/.test(mp) && /still hidden: \[call to action\] “More Info”/.test(mp), 'work order prints the exact residual and names the element');
    ok(/Word count check \.\.\. BASIS DIFFERENCE 27% — served 985 · rendered 1,356/.test(mp) && /SCORED FIGURE: served \(985\)/.test(mp) && /whole page \(served HTML\) [\d,]+ · whole page \(rendered, painted\) 1,481/.test(mp) && /RENDERED  samsara\.com — served HTML gave 82 words[^\n]*NOT USED on the served basis \(BASIS_MISMATCH\)/.test(mp) && /Measurement basis \.\. SERVED HTML for every page/.test(mp) && !/measurements agree/.test(mp) && !/UNRELIABLE|LOW CONFIDENCE/.test(mp), 'work order prints the BASIS DIFFERENCE verdict, the served scored figure, one labelled whole-page pair, the basis line and the BASIS_MISMATCH rescue', mp.slice(mp.indexOf('Measurement basis'), mp.indexOf('Measurement basis') + 900));
  }

  console.log('\n10. Patch spec v1 — P4 relocation, P5 sample arithmetic, P7 template duplicates, P8 refs and do-text, P9 no-change report');
  {
    const app = loadApp();
    const m7 = app.medians([1, 2, 3, 4, 5, 6, 7].map((i) => ({ wordCount: 1900 + i * 20, h2Count: 9, h3Count: 8, listCount: 5, statCount: 3, tableCount: 0, questionHeadingCount: 0, kwInTitle: true, kwInH1: true, kwInMeta: true, hasFaqSchema: false, hasProductSchema: false, entities: [] })));
    // P4: the three served-hidden headings are painted elsewhere after render → RELOCATED_VISIBLE; the wrapper is empty → CONTAINER RELOCATED.
    const dupText = ['Fleet Distracted Driving: How Telematics Helps', 'Fleet Preventive Maintenance Scheduling', 'Fleet Fuel Theft: How Telematics Helps'];
    const pageEnvue = { url: 'https://envuetelematics.com/', httpTitle: 'T telematics', h1: ['H telematics'], metaDescription: 'telematics', kwInTitle: true, kwInH1: true, kwInMeta: true, wordCount: 985, pageWordCount: 1079, wordRegion: '<main>', h2Count: 9, h3Count: 19, h3Unique: 16, h3Hidden: 3, h3Editorial: 10, h3Template: 9, listCount: 13, tableCount: 0, statCount: 5, questionHeadingCount: 0, schemaClaims: [], schemaTopLevel: [], schemaTypes: [], hasFaqSchema: false, counters: [], entities: [], animationGated: [], animationGatedCount: 0,
      headingDuplicates: dupText.map((t) => ({ text: t, level: 3, count: 2, near: false, inTemplate: true, hiddenCopies: 1 })), headingDuplicateCount: 3,
      outline: dupText.map((t) => ({ level: 3, text: t, kind: 'template', hidden: true, hiddenBy: 'inline display:none on .uc-template-wrapper' })).concat(dupText.map((t) => ({ level: 3, text: t, kind: 'template' }))),
      hiddenContainers: [{ tag: 'div', cls: 'uc-template-wrapper', reason: 'inline display:none', words: 181, headings: 3, headingTexts: dupText.map((t) => 'H3 ' + t) }], hiddenContainerCount: 1 };
    const renderedEnvue = { ok: true, innerText: '', domText: '', hidden: [], hiddenByContext: {}, hiddenContentCount: 0, gate: { state: 'released', atLoad: { markers: 35, hidden: 35 }, afterScroll: { markers: 0, hidden: 0, tracked: 35 }, tracked: 35, releasedCount: 35, residualCount: 0, residual: [], summary: '35 markers at first paint → 35/35 released, 0 still hidden', late: { count: 3, hidden: 3, residual: [{ text: dupText[0], reason: 'visibility:hidden', top: 419 }] }, lateSummary: '3 markers inserted after first paint (a widget mounted them) → 0/3 released, 3 still hidden after a targeted scroll — reported as LATE / UNVERIFIED, not as hidden content' },
      renderedWords: { main: 566, page: 643, mainRegion: '<main>', innerTextMain: 1359, textContentMain: 2937, carousels: [] },
      headingList: dupText.map((t) => ({ level: 3, text: t, painted: false, why: 'visibility:hidden', late: true, top: 419 })).concat(dupText.map((t) => ({ level: 3, text: t, painted: true, why: '', top: 6621 }))),
      hiddenNow: [{ tag: 'div', cls: 'uc-template-wrapper', headings: 0, words: 0, display: 'none' }] };
    const rc = app.reconcileHidden(pageEnvue, renderedEnvue);
    ok(rc && rc.relocatedVisible === 3 && rc.stillHidden === 0 && rc.relocated.length === 1 && rc.relocated[0].renderedHeadings === 0 && rc.relocated[0].servedHeadings === 3 && dupText.every((t) => rc.headingStates[app.foldT(t)] === 'RELOCATED_VISIBLE'), 'all three served-hidden H3s classify RELOCATED_VISIBLE and the wrapper fires CONTAINER RELOCATED', JSON.stringify(rc));
    const rl = app.relocationLines(rc);
    ok(/^CONTAINER RELOCATED — <div class="uc-template-wrapper"> is inline display:none in served HTML but holds 0 of its 3 served headings after render/.test(rl[0]) && /are WRONG for this page/.test(rl[0]), 'the CONTAINER RELOCATED warning reads as specified', rl[0]);
    // P7: TEMPLATE duplicates get the widget task — LOW, 15 min, weight 3, widget instruction, no "remove" wording, and no "a visitor never sees them".
    const rr = app.scoreRank(pageEnvue, m7)[1], ar = app.scoreAnswer(pageEnvue, m7, { queries: 0, questions: [], domains: [], mine: 0, peerMedian: 1 }, [], null)[1];
    const fx = app.buildFixes(pageEnvue, m7, rr, ar, 'telematics', [], [], 'EnVue', { diff: app.renderDiff(pageEnvue, renderedEnvue), rendered: renderedEnvue, missingInfo: [], band: null, wordCheck: app.wordCheck(pageEnvue, renderedEnvue), reconcile: rc });
    const dt = fx.find((f) => f.key === 'dupHeadings');
    ok(dt && dt._template && dt.severity === 'LOW' && dt.effort === '15 MIN' && dt._pts === 3 && /produced by a loop\/feed widget/.test(dt.title) && /query offset/.test(dt.code) && !/Remove/.test(dt.title) && !/never sees them/.test(dt.body) && /every copy is painted/.test(dt.body), 'TEMPLATE duplicates: widget task at LOW / 15 min / weight 3, with the widget fix and no invisible-copies claim', dt && JSON.stringify({ t: dt.title, s: dt.severity, e: dt.effort, p: dt._pts, body: dt.body.slice(0, 200) }));
    const doT = app.taskLine(dt, { medians: m7, page: pageEnvue, keyword: 'telematics', brand: 'X' });
    ok(/SECOND feed/.test(doT) && /Do not delete the posts/.test(doT), 'the TEMPLATE variant carries the widget "Do this" instruction', doT);
    // P8: the questionHeadings cross-reference is dropped when no consolidation task exists, and rendered with the task number when it does.
    const qh = fx.find((f) => f.key === 'questionHeadings');
    ok(qh && !/consolidation task/.test(qh.body) && !/\{\{/.test(qh.body), 'a cross-reference to an absent task is dropped whole', qh && qh.body);
    const fragPage = Object.assign({}, pageEnvue, { h3Count: 40, h3Editorial: 36, h3Template: 4, h3Unique: 40, headingDuplicates: [], headingDuplicateCount: 0, h3Hidden: 0, outline: [], hiddenContainers: [], hiddenContainerCount: 0 });
    const fx2 = app.buildFixes(fragPage, m7, app.scoreRank(fragPage, m7)[1], ar, 'telematics', [], [], 'EnVue', { missingInfo: [] });
    const frag = fx2.find((f) => f.key === 'h3Fragmented'), qh2 = fx2.find((f) => f.key === 'questionHeadings');
    ok(frag && qh2 && new RegExp('do Task ' + frag.number + ' \\(the consolidation task\\) first').test(qh2.body), 'a cross-reference to a present task is rendered with its final number', qh2 && qh2.body);
    // P8 build assertions: no task's "Do this" equals its title; no task references a task number absent from the list.
    const ctxT = { medians: m7, page: pageEnvue, keyword: 'telematics', brand: 'X' };
    const allFx = fx.concat(fx2);
    ok(allFx.every((f) => app.foldT(app.taskLine(f, ctxT)) !== app.foldT(f.title)), 'no emitted task has a "Do this" identical to its title', JSON.stringify(allFx.filter((f) => app.foldT(app.taskLine(f, ctxT)) === app.foldT(f.title)).map((f) => f.key)));
    ok(allFx.every((f) => !/\{\{ref/.test(f.body) && !/\{\{ref/.test(f.code)), 'no unresolved reference placeholder survives into a task');
    const refNums = []; allFx.forEach((f) => { const mm = String(f.body).match(/Task (\d+)/g) || []; mm.forEach((x) => refNums.push([f, +x.replace('Task ', '')])); });
    ok(refNums.every(([f, n]) => (f === fx.find((y) => y === f) ? fx : fx2).some((y) => y.number === n)), 'every "Task N" reference points at a task in its own list');
    // P5: sample arithmetic closes in the work order and the UNACCOUNTED line prints when it does not.
    const sampleOk = { requested: 10, used: 6, dispositions: [{ code: 'FAILED', domain: 'forbes.com', count: 1, reason: 'HTTP 403' }, { code: 'NOT_A_COMPETITOR', domain: 'envuetelematics.com', count: 1, reason: 'your own domain, position #4' }, { code: 'DEDUPED', domain: 'samsara.com', count: 1, reason: 'same domain as an earlier result (samsara.com/fleet)' }, { code: 'SERP_SHORT', domain: '(google)', count: 1, reason: 'Google returned only 9 organic results for this query; 1 requested slot had no page to fill' }], unaccounted: 0 };
    const mpS = app.masterPrompt({ url: 'https://x.com/', keyword: 'telematics', brand: 'X', gl: 'us', hl: 'en', page: pageEnvue, medians: m7, missing: [], missingInfo: [], rendered: renderedEnvue, diff: app.renderDiff(pageEnvue, renderedEnvue), band: null, failed: [{ domain: 'forbes.com', reason: 'HTTP 403' }], rescued: [], depthRequested: 10, changes: null, fixes: fx, stamp: 'now', rankScore: 88, answerScore: 49, wordCheck: app.wordCheck(pageEnvue, renderedEnvue), sample: sampleOk, reconcile: rc, reused: { stamp: 'September 4, 2026 at 10:46 AM EDT', ageHours: 6, tasks: fx.length } });
    ok(/Competitor sample \.\. 10 requested → 6 used, 4 not used:/.test(mpS) && /FAILED {16}forbes\.com — HTTP 403/.test(mpS) && /SERP_SHORT {12}\(google\)/.test(mpS) && /arithmetic closes: used \+ dispositions = requested/.test(mpS), 'every non-used slot prints a disposition line and the arithmetic closes', mpS.slice(mpS.indexOf('Competitor sample'), mpS.indexOf('Competitor sample') + 600));
    const mpBad = app.masterPrompt({ url: 'https://x.com/', keyword: 'telematics', brand: 'X', gl: 'us', hl: 'en', page: pageEnvue, medians: m7, missing: [], missingInfo: [], rendered: null, diff: null, band: null, failed: [], rescued: [], depthRequested: 10, changes: null, fixes: fx2, stamp: 'now', rankScore: 88, answerScore: 49, wordCheck: null, sample: { requested: 10, used: 6, dispositions: [{ code: 'FAILED', domain: 'forbes.com', count: 1, reason: 'HTTP 403' }, { code: 'UNACCOUNTED', domain: '?', count: 3, reason: 'requested slots with no recorded disposition — a scanner bookkeeping gap, not a page fact' }], unaccounted: 3 } });
    ok(/UNACCOUNTED 3 — the arithmetic does not close; treat every median as provisional/.test(mpBad), 'a remainder is printed as UNACCOUNTED, never swallowed');
    // P9 / P4 / late markers in the work order.
    ok(/^# SEO AND AI-VISIBILITY WORK ORDER\n\n## NO CHANGE SINCE LAST SCAN \(September 4, 2026 at 10:46 AM EDT\)\nPage fingerprint identical/.test(mpS) && /No SERP credits spent/.test(mpS) && /Run a full rescan: tick/.test(mpS), 'an unchanged page gets the NO CHANGE header with fingerprint, reuse age, task count and the force instruction');
    ok(/CONTAINER RELOCATED — <div class="uc-template-wrapper">/.test(mpS) && /H3 “Fleet Distracted Driving: How Telematics Helps” — served inside a hidden container \(inline display:none on \.uc-template-wrapper\) → RELOCATED_VISIBLE \(painted at y=6621\)/.test(mpS), 'the work order prints the relocation warning and each heading\'s verdict with its painted position');
    ok(/Late markers \.\.\.\.\.\.\. 3 markers inserted after first paint/.test(mpS) && /LATE \/ UNVERIFIED \(inserted after first paint\) 3 of 3/.test(mpS), 'late-inserted markers are reported as LATE / UNVERIFIED, not as hidden content');
    const dfE = app.renderDiff(pageEnvue, Object.assign({}, renderedEnvue, { hidden: [{ text: dupText[0], tag: 'h3', reason: 'visibility:hidden', kind: 'heading', context: 'content', gated: true, late: true }], hiddenContentCount: 1, hiddenByContext: { content: 1 } }));
    ok(dfE.hiddenCount === 0 && dfE.unverified.length === 1 && dfE.unverified[0].late, 'a hidden element inside a late marker is unverified, never a hidden-content finding', JSON.stringify({ h: dfE.hiddenCount, u: dfE.unverified.length }));
    // P6: one whole-page figure per source, labelled, in both places.
    const bothLabels = (mpS.match(/whole page \(served HTML\) 1,079/g) || []).length >= 2 && (mpS.match(/whole page \(rendered, painted\) 643/g) || []).length >= 2;
    ok(bothLabels && !/whole page here/.test(mpS) && !/whole rendered page:/.test(mpS), 'the whole-page figure is printed once per source, labelled identically in METHODOLOGY and the baseline', JSON.stringify((mpS.match(/whole page \([^)]+\) [\d,]+/g) || [])));
  }

  console.log('\n11. Frozen EnVue fixture (served HTML + rendered DOM snapshot, 4 Sep 2026) — P1–P4 cannot silently regress');
  {
    const app = loadApp();
    const served = fs.readFileSync(path.join(__dirname, 'fixtures', 'envue-home.served.html'), 'utf8');
    const renderedHtml = fs.readFileSync(path.join(__dirname, 'fixtures', 'envue-home.rendered.html'), 'utf8');
    const rj = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'envue-home.render.json'), 'utf8'));
    const ps = page.parse(served, 'https://envuetelematics.com/', 'telematics', { full: true });
    const dupTexts = ['Fleet Distracted Driving: How Telematics Helps Managers Identify Risk Before a Crash', 'Fleet Preventive Maintenance Scheduling: How Telematics Helps You Know What Needs Service and When', 'Fleet Fuel Theft: How Telematics Helps Detect Fuel Card Fraud and Unauthorized Fuel Use'];
    ok(ps.textSha256.slice(0, 8) === '3de55d96' && ps.wordCount === 985 && ps.pageWordCount === 1079, 'served: fingerprint 3de55d96…, main 985 words, whole page 1,079', ps.textSha256.slice(0, 8) + ' ' + ps.wordCount + ' ' + ps.pageWordCount);
    ok(ps.h3Count === 19 && ps.h3Unique === 16 && ps.h3Hidden === 3 && ps.headingDuplicateCount === 3 && ps.headingDuplicates.map((d) => d.text).join('|') === dupTexts.join('|') && ps.headingDuplicates.every((d) => d.inTemplate && d.hiddenCopies === 1), 'served: 19 H3 / 16 unique / 3 hidden / 3 TEMPLATE duplicates, one hidden copy each', JSON.stringify({ c: ps.h3Count, u: ps.h3Unique, h: ps.h3Hidden, d: ps.headingDuplicates.map((d) => [d.text.slice(0, 30), d.inTemplate, d.hiddenCopies]) }));
    ok(ps.hiddenContainerCount === 1 && ps.hiddenContainers[0].cls === 'uc-template-wrapper' && ps.hiddenContainers[0].headings === 3 && ps.hiddenContainers[0].reason === 'inline display:none', 'served: uc-template-wrapper is display:none and holds 3 headings', JSON.stringify(ps.hiddenContainers));
    ok(ps.tableCount === 0 && ps.schemaClaims.filter((c) => c.kind === 'FAQ question').length === 6 && ps.schemaClaims.filter((c) => /^FAQ/.test(c.kind) && c.present).length === 0, 'served: 0 tables; FAQPage declares 6 Q&As, 0 present in body text (the real finding)', JSON.stringify({ t: ps.tableCount, q: ps.schemaClaims.filter((c) => c.kind === 'FAQ question').length }));
    // P2 on the served side: Owl builds its 30 clones at runtime, so the served HTML carries none;
    // the only served clone-class match is the Unlimited Elements placeholder (22, 0 words), by a
    // specific selector — the generic fallback fires on nothing.
    ok(ps.carouselClones.length === 0 && ps.carouselCloneCount === 0 && /0 matched in served HTML/.test(app.cloneLines(ps, null)[0]) && !/uc_classic_carousel_placeholder/.test(ps.cloneRule), 'served clone log (P17): nothing matches in served HTML — Owl builds its clones at runtime and the placeholder selector is gone from the list', JSON.stringify(ps.carouselClones) + ' ' + app.cloneLines(ps, null)[0]);
    // Rendered DOM snapshot: structural counts a real browser produced.
    const cnt = (re) => (renderedHtml.match(re) || []).length;
    ok(cnt(/class="[^"]*\bowl-item\b/g) === 60 && cnt(/class="[^"]*\bowl-item\b[^"]*\bcloned\b/g) === 30 && cnt(/class="[^"]*\bue-carousel-item\b/g) === 44 && cnt(/class="[^"]*\belementor-loop-container\b/g) === 2, 'rendered: owl-item 60 / 30 cloned, 44 ue-carousel-item, 2 elementor-loop-container', [cnt(/class="[^"]*\bowl-item\b/g), cnt(/class="[^"]*\bowl-item\b[^"]*\bcloned\b/g), cnt(/class="[^"]*\bue-carousel-item\b/g), cnt(/class="[^"]*\belementor-loop-container\b/g)].join('/'));
    const wrap = renderedHtml.match(/<div[^>]*class="[^"]*uc-template-wrapper[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    ok(wrap && (wrap[1].match(/<h[1-6]/g) || []).length === 0 && rj.hiddenNow.some((x) => /uc-template-wrapper/.test(x.cls) && x.headings === 0), 'rendered: uc-template-wrapper holds 0 headings after render (served 3)');
    // P1 figures the paint test produced on the live page, frozen: main 566 (real Chrome innerText 582), page 643;
    // innerText 1,359 and textContent 2,937 for comparison; Owl 616/374 textContent/innerText with 0 clone words painted; UE 308/0.
    const rw = rj.renderedWords, owlC = rw.carousels.find((c) => c.selector === '.owl-item.cloned'), owlR = rw.carousels.find((c) => c.selector === '.owl-item:not(.cloned)'), ue = rw.carousels.find((c) => c.selector === '.ue-carousel-item');
    ok(rw.main === 566 && Math.abs(rw.main - 582) <= 20 && rw.page === 643 && rw.innerTextMain === 1359 && rw.textContentMain === 2937, 'rendered: painted main 566 (within 20 of real Chrome 582), page 643; innerText 1,359 / textContent 2,937 beside it', JSON.stringify({ main: rw.main, page: rw.page, it: rw.innerTextMain, tc: rw.textContentMain }));
    ok(owlC && owlC.count === 30 && owlC.textContentWords === 616 && owlC.innerTextWords === 374 && owlC.paintedWords === 0 && owlR && owlR.count === 30 && ue && ue.count === 44 && ue.textContentWords === 308 && ue.innerTextWords === 0 && ue.paintedWords === 0, 'rendered carousels: Owl 30 clones 616/374 words with 0 painted; UE 44 items 308/0 words, none painted', JSON.stringify(rw.carousels));
    // P3 on the fixture pair: served 985 vs painted 566 → LOW CONFIDENCE, rendered scored, gap ~1,385 against a 1,967 median.
    const wcF = app.wordCheck(ps, rj);
    ok(wcF.basisDifference && wcF.diffPct === 43 && wcF.scored === 'served' && wcF.scoredWords === 985 && wcF.reachable === 0, 'fixture pair (10.4 render.json, no reachable bucket): 43% BASIS DIFFERENCE, served figure scored on the shared basis', JSON.stringify({ d: wcF.diffPct, s: wcF.scored }));
    const pScored = Object.assign({}, ps, { wordCountServed: ps.wordCount, wordRendered: wcF.rendered, wordScored: 'served' });
    const mF = app.medians([1, 2, 3, 4, 5, 6].map((i) => ({ wordCount: [1500, 1800, 1967, 1967, 2300, 2800][i - 1], h2Count: 9, h3Count: 8, listCount: 5, statCount: 3, tableCount: 0, questionHeadingCount: 0, kwInTitle: true, kwInH1: true, kwInMeta: true, hasFaqSchema: false, hasProductSchema: false, entities: [] })));
    const fxF = app.buildFixes(pScored, mF, app.scoreRank(pScored, mF)[1], app.scoreAnswer(pScored, mF, { queries: 0, questions: [], domains: [], mine: 0, peerMedian: 1 }, [], null)[1], 'telematics', [], [], 'EnVue', { missingInfo: [], wordCheck: wcF, reconcile: app.reconcileHidden(ps, rj) });
    const wt = fxF.find((f) => f.key === 'wordCount');
    ok(wt && /gap → 982/.test(wt.code) && /985 served \(scored\) · 566 rendered/.test(wt.code) && /basis difference → 43%/.test(wt.code) && /capped at HIGH/.test(wt.code) && wt.severity !== 'CRITICAL' && wt._basisCap && wt._basisCap.pct === 43, 'the word-gap task measures from the shared served basis (1,967 − 985 = 982), names the 43% basis difference and is capped below CRITICAL (P14)', wt && JSON.stringify({ code: wt.code, sev: wt.severity }));
    // P4 on the fixture pair: every served-hidden H3 is painted elsewhere → RELOCATED_VISIBLE; CONTAINER RELOCATED fires.
    const rcF = app.reconcileHidden(ps, rj);
    ok(rcF.relocatedVisible === 3 && rcF.relocated.length === 1 && rcF.relocated[0].renderedHeadings === 0 && /never sees them/.test(fxF.find((f) => f.key === 'dupHeadings').body) === false, 'fixture pair: 3 × RELOCATED_VISIBLE, CONTAINER RELOCATED, and the duplicate task no longer says the copies are invisible', JSON.stringify(rcF.details.map((d) => d.state)));
  }

  console.log('\n12. Patch spec v2 — P10 one pass / buckets, P11 REACHABLE, P13 attribution, P15 labels, P16 volatile, P17 accounting');
  {
    const app = loadApp();
    // P10 / P11 / P17 on a synthetic page: an Owl-style loop (2 clones + 4 real + 2 clones, one
    // real slide in the stage), a Swiper (2 duplicates, one of two real slides in view), two tab
    // panels (one open), a loop grid, and a cross-host chat widget.
    const chtml = read('fixture-carousel.html');
    let widgetHits = 0;
    const csrv = http.createServer((q, r) => {
      if (q.url === '/widget.js') { widgetHits++; r.setHeader('content-type', 'text/javascript'); return r.end("var d=document.createElement('div');d.id='crisp-chatbox';d.innerHTML='<p>We are online</p><p>Chat with EnVue Telematics</p>';document.body.appendChild(d);"); }
      r.setHeader('content-type', 'text/html'); r.end(chtml.replace('__WIDGET__', 'http://localhost:' + csrv.address().port + '/widget.js'));
    });
    await new Promise((r) => csrv.listen(0, r));
    const cr = await fakeHandler(render, { url: 'http://127.0.0.1:' + csrv.address().port + '/c', wait: '600' });
    csrv.close();
    const rw = cr.renderedWords || {}, acc = rw.carouselAccounting || {}, ct = acc.totals || {};
    ok(cr.ok && rw.main === 101 && rw.buckets && rw.buckets.body === 55 && rw.buckets.carousel === 20 && rw.buckets.feed === 26 && rw.buckets.other === 0 && (rw.buckets.body + rw.buckets.carousel + rw.buckets.feed + rw.buckets.other) === rw.main, 'P10: painted main 101 = 55 body + 20 carousel + 26 feed + 0 other, buckets sum to the total', JSON.stringify({ main: rw.main, b: rw.buckets, err: cr.error }));
    ok(rw.pageBuckets && rw.pageBuckets.other === 10 && rw.pageBuckets.body === 69 && rw.page === 125, 'P10: whole page adds 10 words of nav/footer as "other" and 14 injected body words (widget + first-party line)', JSON.stringify(rw.pageBuckets) + ' ' + rw.page);
    ok(rw.measuredAt && rw.measuredAt.stage === 'settled' && acc.measuredAt && Math.abs(acc.measuredAt - rw.measuredAt.msSinceNavigation) < 200 && (rw.carousels || []).every((c) => c.measuredAt === rw.measuredAt.msSinceNavigation), 'P10: the count, the carousel accounting and every per-selector diagnostic carry the same measuredAt', JSON.stringify({ at: rw.measuredAt, acc: acc.measuredAt, sels: (rw.carousels || []).map((c) => c.measuredAt) }));
    ok(rw.firstPaint && !rw.firstPaint.error && rw.firstPaint.measuredAt.stage === 'first-paint' && rw.firstPaint.measuredAt.msSinceNavigation < rw.measuredAt.msSinceNavigation && typeof rw.firstPaint.innerTextMain === 'number', 'P10: a first-paint snapshot (before any input) is recorded beside the settled one, with its own clock', JSON.stringify(rw.firstPaint && rw.firstPaint.measuredAt));
    const owl = (acc.containers || []).find((c) => /owl/.test(c.container)), sw = (acc.containers || []).find((c) => /swiper/.test(c.container));
    ok(owl && owl.items === 8 && owl.clones === 4 && owl.painted === 1 && owl.reachable === 3 && owl.excluded === 0 && owl.paintedWords === 10 && owl.reachableWords === 30 && owl.cloneWords === 40, 'P17: Owl container 8 items = 4 clones + 1 painted + 3 reachable + 0 excluded, words per bucket', JSON.stringify(owl));
    ok(sw && sw.items === 4 && sw.clones === 2 && sw.painted === 1 && sw.reachable === 1 && sw.excluded === 0, 'P17: Swiper container 4 items = 2 clones + 1 painted + 1 reachable', JSON.stringify(sw));
    ok(ct.items === 12 && (ct.clones + ct.painted + ct.reachable + ct.excluded) === ct.items && /exactly one of clone \/ painted \/ reachable \/ excluded/.test(acc.rule), 'P17: every carousel item lands in exactly one bucket and the buckets sum to the item count', JSON.stringify(ct));
    ok(rw.reachable && rw.reachable.main === 48 && rw.reachable.carouselItems === 4 && rw.reachable.panels === 1 && rw.scored === 149, 'P11: REACHABLE = 30 (Owl) + 10 (Swiper) + 8 (closed tab panel) = 48; rendered figure 101 + 48 = 149', JSON.stringify(rw.reachable) + ' ' + rw.scored);
    ok((rw.carousels || []).some((c) => c.selector === '.owl-item.cloned' && c.count === 4 && c.paintedWords === 0) && (rw.carousels || []).some((c) => c.selector === '.owl-item:not(.cloned)' && c.count === 4 && c.painted === 1 && c.paintedElements === 1), 'P17: per-selector diagnostics agree with the accounting (4 clones unpainted, 1 of 4 real slides painted)', JSON.stringify(rw.carousels));
    // P16: the cross-host widget is attributed to its script host; the first-party injected line is not.
    ok(cr.injectHook === true && Array.isArray(cr.injected) && cr.injected.length === 1 && cr.injected[0].host === 'localhost' && cr.injected[0].id === 'crisp-chatbox' && /We are online/.test(cr.injected[0].lines.join(' ')) && !/first party injected/.test(JSON.stringify(cr.injected)), 'P16: a DOM insertion by a script from another host is attributed to that host; a first-party insertion is not', JSON.stringify(cr.injected));
    const cdiff = app.renderDiff({ servedBlocks: [], bodyText: 'one two three four five six seven eight nine ten' }, cr);
    ok(cdiff.volatile.some((v) => /We are online/.test(v.text) && v.host === 'localhost') && !cdiff.visibleNotServed.some((x) => /We are online|Chat with EnVue/.test(x.text)) && cdiff.visibleNotServed.some((x) => /first party injected/.test(x.text)), 'P16: widget lines classify VOLATILE with their host; the first-party injected line stays a script-injected page line', JSON.stringify({ v: cdiff.volatile, i: cdiff.visibleNotServed }));
    const vh = app.volatileHistory([{ stamp: 's1', volatile: ['We are online', 'Chat with EnVue Telematics'] }, { stamp: 's2', volatile: ['Chat with EnVue Telematics'] }], [{ text: 'Chat with EnVue Telematics', host: 'x', how: 'h', where: '' }]);
    ok(vh.scans === 3 && vh.rows.find((r) => /Chat with/.test(r.text)).seen === 3 && vh.rows.find((r) => /online/.test(r.text)).seen === 1 && vh.rows.find((r) => /online/.test(r.text)).present === false && vh.trackingSince === 's1', 'P16: seen-in-N-of-M counters, and a line absent this scan is listed as absent rather than dropped', JSON.stringify(vh));
    // P17 on the frozen EnVue rendered DOM: the 44 UE cards sit INSIDE the partner carousel's own
    // 44 Owl items, so the page has 60 carousel items in 2 containers — not 104.
    const b2 = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
    const pg2 = await b2.newPage({ javaScriptEnabled: false });
    await pg2.setContent(fs.readFileSync(path.join(__dirname, 'fixtures', 'envue-home.rendered.html'), 'utf8'), { waitUntil: 'domcontentloaded' });
    await pg2.evaluate(render.PAINT_INSTALL);
    const envAcc = await pg2.evaluate(() => window.__cgPaint.carousels(document.body, 'test'));
    await b2.close();
    const tot = envAcc.totals, tc = envAcc.containers.find((c) => /testemonial/.test(c.container)), pc = envAcc.containers.find((c) => /card_carousel/.test(c.container));
    ok(envAcc.containers.length === 2 && tot.items === 60 && tot.clones === 30 && (tot.clones + tot.painted + tot.reachable + tot.excluded) === 60 && tc && tc.items === 16 && tc.clones === 8 && pc && pc.items === 44 && pc.clones === 22, 'P17: EnVue rendered DOM = 2 Owl containers, 60 items (testimonials 16 = 8 clones + 8; partners 44 = 22 clones + 22 cards), all classified — the 44 .ue-carousel-item are nested inside those 44 partner Owl items', JSON.stringify(envAcc.containers.map((c) => [c.container.slice(0, 50), c.items, c.clones, c.painted, c.reachable, c.excluded])));
    // P13: score deltas decompose into rule / sample / page, summing exactly; the prior-rules recomputation is printed.
    ok(app.wordUnderRules('10.3', { served: 985, painted: 566 }) === 985 && app.wordUnderRules('10.4', { served: 985, painted: 566 }) === 566 && app.wordUnderRules('10.4', { served: 985, painted: 900 }) === 985 && app.wordUnderRules('10.5', { served: 985, painted: 566, reachable: 326, basis: 'served' }) === 985 && app.wordUnderRules('10.5', { served: 985, painted: 566, reachable: 326, basis: 'rendered' }) === 892, 'P13: the word figure each rules version scored is reproducible (10.3 served, 10.4 painted when >20% apart, 10.5 basis)');
    const m6 = app.medians([1, 2, 3, 4, 5, 6].map((i) => ({ wordCount: 1900 + i * 20, h2Count: 9, h3Count: 8, listCount: 5, statCount: 3, tableCount: 0, questionHeadingCount: 0, kwInTitle: true, kwInH1: true, kwInMeta: true, hasFaqSchema: false, hasProductSchema: false, entities: [] })));
    const m7 = app.medians([1, 2, 3, 4, 5, 6, 7].map((i) => ({ wordCount: 1900 + i * 40, h2Count: 9, h3Count: 8, listCount: 5, statCount: 3, tableCount: 0, questionHeadingCount: 0, kwInTitle: true, kwInH1: true, kwInMeta: true, hasFaqSchema: false, hasProductSchema: false, entities: [] })));
    const pageA = { httpTitle: 'T telematics', h1: ['H telematics'], metaDescription: 'telematics', kwInTitle: true, kwInH1: true, kwInMeta: true, wordCount: 985, wordCountServed: 985, wordPainted: 566, wordReachable: 326, wordScored: 'served', h2Count: 9, h3Count: 19, listCount: 13, tableCount: 0, statCount: 5, questionHeadingCount: 0, hasFaqSchema: true, hasProductSchema: true };
    const rendA = { ok: true, renderedWords: { main: 566, reachable: { main: 326 } }, hiddenContentCount: 0 };
    const snapCur = app.snapshotOf(pageA, rendA);
    // The previous scan ran under 10.4 (painted figure scored: 566) on a 6-page sample.
    const page104 = Object.assign({}, pageA, { wordCount: 566, wordScored: 'rendered' });
    const rank104 = app.scoreRank(page104, m6)[0], rankNow = app.scoreRank(pageA, m7)[0];
    const prevE = { version: '10.4', rank: rank104, answer: 40, snap: app.snapshotOf(page104, rendA), basis: 'rendered', fingerprint: 'same' };
    const curE = { version: '10.5', rank: rankNow, answer: 40, snap: snapCur, basis: 'served', fingerprint: 'same' };
    const at = app.attributeScore(prevE, curE, m7, false);
    const sum = at.lines.reduce((a, l) => a + l.delta, 0);
    const ruleOnly = rankNow - app.scoreRank(Object.assign({}, pageA, { wordCount: 566 }), m7)[0];
    ok(at && sum === at.delta && at.lines.find((l) => /rule/.test(l.cause)).delta === ruleOnly && /word basis 566 → 985/.test(at.lines.find((l) => /rule/.test(l.cause)).note) && at.lines.find((l) => /page content/.test(l.cause)).delta === 0 && at.recomputed && at.recomputed.version === '10.4' && at.recomputed.score === app.scoreRank(Object.assign({}, pageA, { wordCount: 566 }), m7)[0], 'P13: rule / sample / page deltas sum to the score delta, the rule line names the word basis change, and the prior-rules recomputation is stated', JSON.stringify(at));
    const atLines = app.attributionLines(at).join('\n');
    ok(/scoring rule change \(word basis 566 → 985, 10\.4/.test(atLines) && /competitor sample/.test(atLines) && /page content/.test(atLines) && /Recomputed under 10\.4 rules on today's sample: \d+\./.test(atLines), 'P13: the attribution prints as three cause lines plus the recomputation', atLines);
    // P15: Section B labels are a pure function of pts/hr; CRITICAL never appears in Section B; effort constant printed.
    const fxAll = app.buildFixes(pageA, m7, app.scoreRank(pageA, m7)[1], app.scoreAnswer(pageA, m7, { queries: 0, questions: [], domains: [], mine: 0, peerMedian: 1 }, [], null)[1], 'telematics', [], [], 'X', { missingInfo: [], wordCheck: app.wordCheck(pageA, { ok: true, renderedWords: { main: 566, page: 643, mainRegion: '<main>', reachable: { main: 326 }, scored: 892 } }) });
    const inS = fxAll.filter((f) => f._section === 'IN-SCORE');
    ok(inS.length > 0 && inS.every((f) => { const ph = f._pts / Math.max(f._hours, 0.15); const want = ph >= 10 ? 'HIGH' : ph >= 5 ? 'MEDIUM' : 'LOW'; return f.severity === want; }) && !inS.some((f) => f.severity === 'CRITICAL'), 'P15: every Section B label equals f(pts/hr) and none is CRITICAL', JSON.stringify(inS.map((f) => [f.key, f.severity, Math.round(f._pts / Math.max(f._hours, 0.15))])));
    const mpV2 = app.masterPrompt({ url: 'https://x.com/', keyword: 'telematics', brand: 'X', gl: 'us', hl: 'en', page: pageA, medians: m7, missing: [], missingInfo: [], rendered: null, diff: null, band: null, failed: [], rescued: [], depthRequested: 10, changes: { prevStamp: 'then', pageChanged: false, changedLines: [], versionChanged: true, prevVersion: '10.4', curVersion: '10.5', rank: [rank104, rankNow], answer: [40, 40], n: [6, 7], medianWords: [m6.wordCount, m7.wordCount], attribution: at, resolved: [], withdrawn: [], stillPresent: [], unverified: [], added: [], carried: 3 }, fixes: fxAll, stamp: 'now', rankScore: rankNow, answerScore: 40, wordCheck: null, basis: { kind: 'served', label: 'served HTML (regex parser)' } });
    ok(/Effort model: 1 day = 6 hours, half day = 3 hours/.test(mpV2) && /HIGH ≥ 10, MEDIUM ≥ 5, otherwise LOW/.test(mpV2) && !/UNRELIABLE/.test(mpV2) && /Rank Score \.\.\.\.\.\.\.\.\. \d+ → \d+[\s\S]*?scoring rule change \(word basis 566 → 985/.test(mpV2) && !/\[CRITICAL/.test(mpV2.slice(mpV2.indexOf('SECTION B'))), 'P15/P13/P14 in the work order: effort constant, label rule, attribution under the score line, no UNRELIABLE, no CRITICAL in Section B', mpV2.slice(mpV2.indexOf('Rank Score ......... '), mpV2.indexOf('Rank Score ......... ') + 420));
    ok(!/UNRELIABLE|LOW CONFIDENCE/.test(fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/not one unreliable number/, '')), 'P14: UNRELIABLE / LOW CONFIDENCE are gone from the report vocabulary');
  }

  console.log('\n13. Task-4 collision fix (real EnVue numbers), CONTAINER RELOCATED false-positive, over-median word count, score reconciliation');
  {
    const app = loadApp();
    const comp = (d, w, h2, h3, l, st, t, q, kt, kh, sc) => ({ domain: d, wordCount: w, h2Count: h2, h3Count: h3, listCount: l, statCount: st, tableCount: t, questionHeadingCount: q, kwInTitle: kt, kwInH1: kh, kwInMeta: true, hasFaqSchema: sc, hasProductSchema: sc, entities: ['GPS', 'ELD', 'Geotab', 'Internet of Things'] });
    const comps = [comp('a.com', 2100, 10, 8, 5, 3, 0, 3, true, true, true), comp('b.com', 1900, 9, 6, 4, 0, 0, 0, true, true, false), comp('c.com', 2400, 11, 9, 6, 1, 1, 4, true, true, false), comp('d.com', 1600, 8, 5, 3, 0, 0, 0, true, false, false), comp('e.com', 3300, 12, 12, 7, 5, 0, 5, true, true, true)];
    const m = app.medians(comps); // h3Count median = 8 → threshold = max(round(8*1.5)=12, 8+6=14) = 14

    // Tyler's real breakdown: 16 editorial H3s = 6 pillar sections + 4 counter-caption H3s + 6 question-shaped H3s, plus 3 template.
    const base = { httpTitle: 'Telematics | X', h1: ['Telematics'], metaDescription: 'x', wordCount: 1420, h2Count: 10, h3Count: 19, h3Editorial: 16, h3Template: 3, h3Unique: 16, headingDuplicates: [], headingDuplicateCount: 0, listCount: 5, tableCount: 1, statCount: 5, questionHeadingCount: 6, h3CounterCaptions: 4, questionHeadingCountH3: 6,
      counterCaptionHeadings: [{ level: 3, text: 'Reduction In Accidents' }, { level: 3, text: 'Fewer accidents per million miles' }, { level: 3, text: 'Improvement in MPG' }, { level: 3, text: 'Decrease in maintenance costs' }],
      kwInTitle: true, kwInH1: true, kwInMeta: true, hasFaqSchema: false, hasProductSchema: false, schemaTypes: [], schemaTopLevel: [], schemaClaims: [], schemaClaimsAbsent: 0, stats: ['a 31%'], entities: ['GPS', 'ELD'], bodyText: 'gps eld geotab', siteLinkText: '' };
    const attribution = [{ key: 'questionHeadings', delta: 20, cause: 'page (1 → 6)' }, { key: 'table', delta: 15, cause: 'page' }];
    const rr = app.scoreRank(base, m)[1];
    const an = app.scoreAnswer(base, m, { queries: 6, questions: [], domains: [], mine: 3, peerMedian: 3 }, [], null);
    const fixes = app.buildFixes(base, m, rr, an[1], 'telematics', [], an[2], 'EnVue', { missingInfo: [], attribution: attribution });

    const h3f = fixes.find((f) => f.key === 'h3Fragmented');
    ok(!h3f, '6 pillars + 4 counter captions + 6 question headings: with both protected the mergeable pool is 6 (under the threshold of 14), so the merge-to-median task does not fire', h3f && h3f.title);

    const cc = fixes.find((f) => f.key === 'counterCaptionHeadings');
    ok(cc && /Demote 4 counter captions? out of the heading outline/.test(cc.title) && /Reduction In Accidents/.test(cc.body) && /<div> or <span>/.test(cc.code) && /does not affect the pillars or question headings/.test(cc.body) && !/merge/i.test(cc.body), 'the honest Task 4: demote the 4 counter captions only — a widget/markup change that explicitly leaves the pillars and question headings untouched', cc && cc.title);

    // Control: strip the protection data off the identical page — the consolidation task must fire again, proving the suppression above is the new protection logic at work, not a fixture accident.
    const unprotected = Object.assign({}, base, { h3CounterCaptions: 0, questionHeadingCountH3: 0, counterCaptionHeadings: [] });
    const rrU = app.scoreRank(unprotected, m)[1];
    const anU = app.scoreAnswer(unprotected, m, { queries: 6, questions: [], domains: [], mine: 3, peerMedian: 3 }, [], null);
    const fixesU = app.buildFixes(unprotected, m, rrU, anU[1], 'telematics', [], anU[2], 'EnVue', { missingInfo: [] });
    const h3fU = fixesU.find((f) => f.key === 'h3Fragmented');
    ok(h3fU && /16 mergeable editorial H3s/.test(h3fU.body), 'control: with no counter-caption/question-heading data the identical page DOES trip the consolidation task at 16 mergeable H3s', h3fU && h3fU.title);

    // When the task still fires (more editorial H3s than Tyler's page), and this scan's own attribution just credited the question-heading gain, the body says so instead of protecting silently.
    const stillFragmented = Object.assign({}, base, { h3Editorial: 26, h3Count: 29 });
    const rr2 = app.scoreRank(stillFragmented, m)[1];
    const an2 = app.scoreAnswer(stillFragmented, m, { queries: 6, questions: [], domains: [], mine: 3, peerMedian: 3 }, [], null);
    const h3fCredited = app.buildFixes(stillFragmented, m, rr2, an2[1], 'telematics', [], an2[2], 'EnVue', { missingInfo: [], attribution: attribution }).find((f) => f.key === 'h3Fragmented');
    ok(h3fCredited && /this scan's own delta just credited the gain from adding them/.test(h3fCredited.body) && /protected/.test(h3fCredited.body), 'when this scan\'s delta just credited the question-heading gain, the consolidation task says so explicitly rather than silently protecting them', h3fCredited && h3fCredited.body);

    // P4 v2 — CONTAINER RELOCATED must only fire for a container whose OWN headings are confirmed painted elsewhere, never because some unrelated heading on the page relocated.
    const pTwoContainers = { outline: [
      { level: 3, text: 'Real Question Heading', hidden: true, hiddenBy: 'inline display:none on .relocated-wrap' },
      { level: 3, text: 'Unrelated Sidebar Heading', hidden: true, hiddenBy: 'hidden attribute on .unrelated-wrap' }
    ], hiddenContainers: [
      { tag: 'div', cls: 'relocated-wrap', reason: 'inline display:none', words: 50, headings: 1, headingTexts: ['H3 Real Question Heading'] },
      { tag: 'div', cls: 'unrelated-wrap', reason: 'hidden attribute', words: 20, headings: 1, headingTexts: ['H3 Unrelated Sidebar Heading'] }
    ] };
    const rTwoContainers = { ok: true, hiddenNow: [], headingList: [
      { level: 3, text: 'Real Question Heading', painted: true, top: 500, why: '' },
      { level: 3, text: 'Unrelated Sidebar Heading', painted: false, top: 0, why: 'visibility:hidden' }
    ] };
    const rc2 = app.reconcileHidden(pTwoContainers, rTwoContainers);
    ok(rc2.relocated.length === 1 && rc2.relocated[0].cls === 'relocated-wrap', 'CONTAINER RELOCATED fires only for the container whose own heading is confirmed painted elsewhere, not the unrelated hidden container beside it', JSON.stringify(rc2.relocated));
    ok(rc2.headingStates[app.foldT('Real Question Heading')] === 'RELOCATED_VISIBLE' && rc2.headingStates[app.foldT('Unrelated Sidebar Heading')] === 'HIDDEN', 'the two hidden headings classify independently — one relocated, one still genuinely hidden', JSON.stringify(rc2.headingStates));

    // P21 — asymmetric word-count flag: over median is a note, never a task, in either direction (Tyler's exact 1,420 vs 1,134 numbers).
    ok(app.overParityNote(1420, 1134) === '286 words OVER the median (1,420 vs 1,134) — parity is the target, not a floor. Not a task: whether to trim is a judgement call, not a ranking requirement.', 'the over-median word-count note reproduces Tyler\'s exact numbers and framing', app.overParityNote(1420, 1134));
    ok(app.overParityNote(900, 1134) === '' && app.overParityNote(1200, 1134) === '', 'no note when under the median or within the 15% parity band', JSON.stringify([app.overParityNote(900, 1134), app.overParityNote(1200, 1134)]));
    const mSmall = { kwInTitleN: 5, kwInH1N: 5, total: 5, wordCount: 1134, h3Count: 8, h2Count: 8, listCount: 4, faqN: 2, tableN: 2, statCount: 2, questionHeadingCount: 2, schemaN: 2 };
    const wcRow = app.scoreRank(Object.assign({}, base, { wordCount: 1420 }), mSmall)[1].find((r) => r.key === 'wordCount');
    ok(wcRow.note === app.overParityNote(1420, 1134) && wcRow.earned === 15, 'the note rides on the existing baseline row (no new row, no task) and full marks are still earned once mine ≥ target', JSON.stringify(wcRow));

    // P22 — score reconciliation: every missing point maps to a task or is declared residual, never silently dropped.
    const rcRows = [app.row('a', 'A metric', 10, 10, 15, 15), app.row('b', 'B metric', 5, 10, 5, 10), app.row('c', 'C metric', 8, 10, 8, 10), app.row('d', 'D metric', 0, 5, 0, 10)];
    const rcFixes = [{ key: 'b' }];
    const rc = app.scoreReconciliation(rcRows, rcFixes, 'Answer score');
    ok(rc.total === 45 && rc.earned === 28 && rc.missing === 17 && rc.mappedPts === 5 && rc.residualPts === 12 && rc.residual.length === 2, 'every point below full marks is split into mapped-to-a-task or residual, and the two totals add up to the full shortfall', JSON.stringify(rc));
    const rcTxt = app.reconcileText(rc);
    ok(/Answer score is 28\/45 \(17 points short of 100\)/.test(rcTxt) && /5 points claimed by a task above/.test(rcTxt) && /12 points declared unreachable this scan — no task exists for C metric \(80%, 2 pts short\), D metric \(0%, 10 pts short\)/.test(rcTxt), 'the reconciliation sentence names both the mapped and the residual points instead of letting a gap go unexplained', rcTxt);
    const rcFull = app.scoreReconciliation([app.row('a', 'A', 10, 10, 10, 10)], [], 'Rank score');
    ok(app.reconcileText(rcFull) === 'Rank score is 10/10 — every point earned, nothing to reconcile.', 'a fully-earned score reconciles to a clean one-liner, no phantom residual', app.reconcileText(rcFull));
  }

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
