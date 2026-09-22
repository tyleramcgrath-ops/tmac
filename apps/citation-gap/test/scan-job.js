// The resumable scan, driven end to end against the same fixtures scan-flow.js uses.
//
// Three properties, and every one of them fails silently:
//
//   the job produces the browser's numbers   If the server-side pipeline drifts, a scheduled
//                                            scan still returns *a* score. The customer sees one
//                                            number in the app and another in their weekly email
//                                            and has no reason to trust either.
//   a tick does exactly one unit of work     A step that loops its fan-out still finishes — on a
//                                            fixture server in milliseconds. In production it
//                                            runs past the 60-second ceiling and the job is killed
//                                            mid-flight, forever, on every attempt.
//   a killed job resumes where it died       Resuming from the wrong place still completes. It
//                                            just silently re-fetches, double-counts, or skips.
//
// So each is asserted against a real run rather than reasoned about.
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
process.env.CHROME_PATH = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const pageHandler = require('../api/page.js'), renderHandler = require('../api/render.js');
const job = require('../lib/scan-job.js');

let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); } };

(async () => {
  let port = 0;
  // Identical fixture wiring to scan-flow.js, so "the same numbers" is a comparison against the
  // browser's own run on the same inputs rather than against a number written down once.
  const PAD = '<p>' + 'Fleet telematics prose about GPS tracking, ELD compliance and driver safety for this competitor page. '.repeat(30) + '</p>';
  const fixtures = { '/site/': 'fixture-render.html', '/comp/a': 'fixture-envue.html', '/comp/b': 'fixture-envue.html', '/comp/c': 'fixture-envue.html', '/comp/thin': 'fixture-render.html' };
  const JSPAGE = '<!doctype html><html><head><title>JS built</title></head><body><main id="m"><h1>Loading</h1></main><script>document.getElementById("m").innerHTML="<h1>Fleet telematics platform</h1><h2>Why fleets choose us</h2><p>"+"Fleet telematics prose about GPS tracking and ELD compliance for this competitor page. ".repeat(40)+"</p>";</script></body></html>';
  const serveFixture = (name, pad) => { let h = fs.readFileSync(path.join(__dirname, name), 'utf8'); if (pad) h = h.includes('</main>') ? h.replace('</main>', PAD + '</main>') : h.replace('</body>', PAD + '</body>'); return h; };

  const calls = { page: 0, serp: 0, render: 0 };
  const srv = http.createServer(async (req, res) => {
    const u = url.parse(req.url, true);
    const send = (o) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(o)); };
    if (u.pathname === '/site/') { res.setHeader('content-type', 'text/html'); return res.end(serveFixture('fixture-render.html', false)); }
    if (u.pathname === '/comp/js') { res.setHeader('content-type', 'text/html'); return res.end(JSPAGE); }
    if (fixtures[u.pathname]) { res.setHeader('content-type', 'text/html'); return res.end(serveFixture(fixtures[u.pathname], /^\/comp\/[abc]$/.test(u.pathname))); }
    if (u.pathname === '/api/serp') {
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
  const base = 'http://127.0.0.1:' + port;

  const get = async (p, q) => {
    const qs = new URLSearchParams(q).toString();
    const r = await fetch(base + p + '?' + qs);
    return r.json();
  };
  // The injected caller. Counting here is what makes "one unit of work per tick" measurable.
  const io = {
    page: (q) => { calls.page++; return get('/api/page', q); },
    serp: (q) => { calls.serp++; return get('/api/serp', q); },
    render: (q) => { calls.render++; return get('/api/render', q); }
  };
  const config = { url: base + '/site/', keyword: 'telematics', depth: 10, nq: 6, brand: 'EnVue' };
  const fresh = () => ({ step: 'target_page', cursor: 0, payload: { config } });

  try {
    console.log('\n1. A job runs to completion and produces the browser\'s numbers');
    var whole;
    {
      whole = await job.runToCompletion(fresh(), io, null);
      ok(!!whole.result, 'the scan finishes');
      // scan-flow.js drives the same fixtures through the browser and reports rank 20 / answer 15
      // with eleven fixes. The job is only correct if it lands on the same three.
      ok(whole.result.rank === 20, 'rank 20, the same as the browser on these fixtures', String(whole.result.rank));
      ok(whole.result.answer === 15, 'answer 15, likewise', String(whole.result.answer));
      ok(whole.result.findings.fixes.length === 11, 'and the same eleven tasks', String(whole.result.findings.fixes.length));
      ok(whole.result.findings.sample.used === 3, 'three competitors survive the content floor', String(whole.result.findings.sample.used));
      ok(!!whole.result.fingerprint, 'it carries a page fingerprint for the reuse path');
    }

    console.log('\n2. The excluded competitors are classified, not just dropped');
    {
      const byCode = {};
      for (const f of whole.result.findings.failed) byCode[f.code] = f.domain;
      ok(byCode.BELOW_MIN_CONTENT === 'thin.com', 'a genuinely thin page reads as below the floor', JSON.stringify(byCode));
      ok(byCode.BASIS_MISMATCH === 'jsbuilt.com',
         'a script-built page is reclassified by the rescue render — "built in JavaScript" is a different thing to be told than "could not read it"', JSON.stringify(byCode));
      ok(byCode.FAILED === 'blocked.com', 'a page that would not load reads as failed', JSON.stringify(byCode));
      const short = whole.result.findings.sample.dispositions.find((d) => d.code === 'SERP_SHORT');
      ok(short && short.count === 4, 'and the four slots Google never filled are accounted for', JSON.stringify(short));
    }

    console.log('\n3. Every tick does exactly one unit of work');
    {
      let j = fresh(), ticks = 0;
      const perTick = [];
      while (ticks < 100) {
        const before = calls.page + calls.serp + calls.render;
        const out = await job.stepOnce(j, io, null);
        perTick.push({ step: j.step, cursor: j.cursor, calls: (calls.page + calls.serp + calls.render) - before });
        j = { step: out.step, cursor: out.cursor, payload: out.payload };
        ticks++;
        if (out.done) break;
      }
      const worst = perTick.reduce((a, b) => (b.calls > a.calls ? b : a));
      // The competitor step fetches a batch of three, as the browser does; nothing fans out wider.
      ok(worst.calls <= job.BATCH, 'no tick makes more than the batch size (' + job.BATCH + ') calls',
         'worst was ' + worst.calls + ' at ' + worst.step + ' cursor ' + worst.cursor);
      const scoring = perTick.find((t) => t.step === 'score');
      ok(scoring && scoring.calls === 0, 'scoring makes no calls at all — it is pure');
      ok(ticks > job.STEPS.length, 'and the fan-out really is spread across ticks rather than looped inside one',
         ticks + ' ticks for ' + job.STEPS.length + ' steps');
    }

    console.log('\n4. A job killed mid-flight resumes where it died, and lands identically');
    {
      // Run until the job is deep inside the competitor fan-out, then throw the live object away
      // and rebuild it from nothing but what would have been written to the database.
      let j = fresh();
      for (let i = 0; i < 40; i++) {
        const out = await job.stepOnce(j, io, null);
        j = { step: out.step, cursor: out.cursor, payload: out.payload };
        if (j.step === 'competitor_pages' && j.cursor >= 3) break;
      }
      ok(j.step === 'competitor_pages' && j.cursor >= 3, 'the job is mid-way through the competitors', j.step + ' cursor ' + j.cursor);

      // This is the part that matters: only the serialized form survives. If anything the job
      // needs lives outside `payload`, the resume below fails or diverges.
      const persisted = JSON.parse(JSON.stringify({ step: j.step, cursor: j.cursor, payload: j.payload }));
      ok(persisted.payload.comps.length > 0, 'the work already done is in the payload, not in memory',
         String(persisted.payload.comps.length) + ' competitors banked');

      const resumed = await job.runToCompletion(persisted, io, null);
      ok(resumed.result.rank === whole.result.rank && resumed.result.answer === whole.result.answer,
         'resuming from the persisted row lands on the same two scores',
         resumed.result.rank + '/' + resumed.result.answer + ' vs ' + whole.result.rank + '/' + whole.result.answer);
      ok(JSON.stringify(resumed.result.findings.fixes) === JSON.stringify(whole.result.findings.fixes),
         'and the same work order, in the same order');
      ok(resumed.result.findings.sample.used === whole.result.findings.sample.used,
         'with the same competitors counted — not double-counted by the resume',
         resumed.result.findings.sample.used + ' vs ' + whole.result.findings.sample.used);
    }

    console.log('\n5. Resuming from any step at all gives the same answer');
    {
      // Kill and resume at every boundary, not just a convenient one: a payload that is complete
      // at competitor_pages but not at target_render would pass a single-point test.
      const seen = [];
      let j = fresh();
      for (let i = 0; i < 100; i++) {
        const out = await job.stepOnce(j, io, null);
        j = { step: out.step, cursor: out.cursor, payload: out.payload };
        if (out.done) break;
        if (!seen.includes(j.step) && j.step !== 'score') {
          seen.push(j.step);
          const snap = JSON.parse(JSON.stringify(j));
          const r = await job.runToCompletion(snap, io, null);
          ok(r.result.rank === whole.result.rank && r.result.answer === whole.result.answer,
             'resuming at ' + j.step + ' lands on ' + whole.result.rank + '/' + whole.result.answer,
             r.result.rank + '/' + r.result.answer);
        }
      }
      ok(seen.length >= 5, 'every boundary was exercised', seen.join(', '));
    }

    console.log('\n6. The payload survives a round trip through jsonb');
    {
      // perDomain was a Map in the browser. A Map serializes to {} and the coverage numbers
      // quietly become zero, which is exactly the kind of thing that still "works".
      let j = fresh();
      for (let i = 0; i < 100; i++) {
        const out = await job.stepOnce(j, io, null);
        j = JSON.parse(JSON.stringify({ step: out.step, cursor: out.cursor, payload: out.payload }));
        if (out.done) {
          ok(out.result.rank === whole.result.rank, 'a scan serialized at every single step still scores the same',
             String(out.result.rank));
          break;
        }
      }
      const cov = j.payload.cov;
      ok(cov && cov.queries > 0 && Array.isArray(cov.domains) && cov.domains.length > 0,
         'coverage survives the round trip with its domain counts intact', JSON.stringify(cov && { q: cov.queries, d: cov.domains.length, mine: cov.mine }));
    }

    console.log('\n7. A step that cannot do its job says so rather than scoring nothing');
    {
      const broken = { page: async () => ({ error: 'HTTP 500' }), serp: io.serp, render: io.render };
      let threw = null;
      try { await job.runToCompletion(fresh(), broken, null); } catch (e) { threw = e; }
      ok(threw && /Could not read your page/.test(threw.message),
         'a target page that will not load fails the scan instead of scoring an empty one', threw && threw.message);
    }
  } finally {
    srv.close();
  }

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
