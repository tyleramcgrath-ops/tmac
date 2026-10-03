// The deploy guard is the thing that was silently wrong: the build kept succeeding while the
// front end it shipped was a stale copy of index.html, and deploys kept going out with files
// missing. So the guard gets its own test — a clean build must reproduce index.html byte for
// byte, and a missing, tampered-with, or unsealed file must fail the build rather than ship.
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
let pass = 0, fail = 0;
const ok = (cond, name, extra) => { if (cond) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); } };

// Every case runs against a throwaway copy of the project, so a test can break the tree it is
// handed without touching the real one.
function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-build-'));
  // The file list comes from the manifest rather than being repeated here. It used to be a
  // literal, and adding a shipped file then broke this fixture with an error about the new file
  // being "missing" — which is the exact drift between two lists that the guard under test
  // exists to catch, reproduced inside its own test. Reading the manifest means the sandbox can
  // never fall behind what is shipped.
  const shipped = Object.keys(JSON.parse(
    fs.readFileSync(path.join(ROOT, 'ship-manifest.json'), 'utf8')).files || {});
  for (const f of ['build.js', 'ship-manifest.json'].concat(shipped)) {
    const dst = path.join(dir, f);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(path.join(ROOT, f), dst);
  }
  // api/ has subdirectories now (api/auth/*), so this copies the tree rather than its top level.
  fs.cpSync(path.join(ROOT, 'api'), path.join(dir, 'api'), { recursive: true });
  // lib/ holds the implementation modules the api/ stubs require; a sandbox without it fails the
  // build for a reason that has nothing to do with the case under test.
  fs.cpSync(path.join(ROOT, 'lib'), path.join(dir, 'lib'), { recursive: true });
  return dir;
}
function run(dir, args) {
  try { return { code: 0, out: execFileSync(process.execPath, ['build.js'].concat(args || []), { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; }
  catch (e) { return { code: e.status === undefined ? 1 : e.status, out: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('\n1. A clean build reproduces index.html exactly');
{
  const dir = sandbox();
  const r = run(dir);
  const out = path.join(dir, 'public', 'index.html');
  ok(r.code === 0, 'the build succeeds', r.out);
  ok(fs.existsSync(out), 'public/index.html is written');
  ok(fs.existsSync(out) && sha(fs.readFileSync(out)) === sha(fs.readFileSync(path.join(ROOT, 'index.html'))),
    'the shipped front end is byte-for-byte the index.html the tests run against');
  ok(/integrity verified/.test(r.out), 'the build log says integrity verified');
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log('\n2. A missing file fails the build instead of shipping without it');
for (const victim of ['index.html', 'lib/render.impl.js', 'api/serp.js']) {
  const dir = sandbox();
  fs.unlinkSync(path.join(dir, victim));
  const r = run(dir);
  ok(r.code !== 0 && new RegExp(victim.replace('.', '\\.') + ' is missing').test(r.out), 'a deploy missing ' + victim + ' fails the build', r.out.trim().split('\n').pop());
  ok(!fs.existsSync(path.join(dir, 'public', 'index.html')), 'nothing is written when ' + victim + ' is missing');
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log('\n3. A file that changed without being re-sealed fails the build');
{
  const dir = sandbox();
  fs.appendFileSync(path.join(dir, 'lib', 'page.impl.js'), '\n// drifted\n');
  const r = run(dir);
  ok(r.code !== 0 && /INTEGRITY FAIL: lib\/page\.impl\.js sha256/.test(r.out), 'an unsealed edit to a function body fails the build', r.out.trim().split('\n')[0]);
  fs.rmSync(dir, { recursive: true, force: true });
}
{
  // The exact drift that shipped for weeks: index.html moves ahead of what the build ships.
  const dir = sandbox();
  fs.writeFileSync(path.join(dir, 'index.html'), fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace('</body>', '<!-- a redesign nobody sealed --></body>'));
  const r = run(dir);
  ok(r.code !== 0 && /INTEGRITY FAIL: index\.html sha256/.test(r.out), 'an unsealed front-end change fails the build rather than shipping the old one');
  ok(!fs.existsSync(path.join(dir, 'public', 'index.html')), 'and nothing is written');
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log('\n4. Sealing re-records the change, and the build then ships the new bytes');
{
  const dir = sandbox();
  const changed = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace('</body>', '<!-- sealed change --></body>');
  fs.writeFileSync(path.join(dir, 'index.html'), changed);
  const s = run(dir, ['--seal']);
  ok(s.code === 0 && /~ index\.html/.test(s.out), 'seal reports index.html changed', s.out);
  const r = run(dir);
  ok(r.code === 0, 'the build succeeds after sealing', r.out);
  ok(fs.readFileSync(path.join(dir, 'public', 'index.html'), 'utf8') === changed, 'and it ships the new bytes, not the old ones');
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log('\n5. Sealing an unchanged tree leaves the manifest alone');
{
  const dir = sandbox();
  const before = fs.readFileSync(path.join(dir, 'ship-manifest.json'), 'utf8');
  const r = run(dir, ['--seal']);
  ok(r.code === 0 && /nothing to seal/.test(r.out), 'a no-op seal says so', r.out);
  ok(fs.readFileSync(path.join(dir, 'ship-manifest.json'), 'utf8') === before, 'and does not rewrite the file, so it is not a diff to explain');
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log('\n6. A missing manifest fails closed');
{
  const dir = sandbox();
  fs.unlinkSync(path.join(dir, 'ship-manifest.json'));
  const r = run(dir);
  ok(r.code !== 0 && /ship-manifest\.json is missing/.test(r.out), 'no manifest means no build');
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log('\n7. The serverless function ceiling is enforced before a deploy can hit it');
{
  const dir = sandbox();
  const r = run(dir);
  ok(r.code === 0 && /ok \d+\/12 serverless functions/.test(r.out), 'the build counts them and says so', r.out);
  const n = Number((r.out.match(/ok (\d+)\/12 serverless functions/) || [])[1]);
  ok(n > 0 && n <= 12, 'and the count is within what the Hobby plan allows', String(n));
  fs.rmSync(dir, { recursive: true, force: true });
}
{
  // Thirteen is the number that was actually rejected, after a build and a test run both went
  // green. Padding api/ to that count here proves the guard catches it at build time instead.
  const dir = sandbox();
  for (let i = 0; i < 13; i++) fs.writeFileSync(path.join(dir, 'api', 'pad' + i + '.js'), 'module.exports=()=>{};\n');
  const r = run(dir);
  ok(r.code !== 0 && /serverless functions under api\//.test(r.out),
     'too many functions fails the build rather than the deployment', r.out.trim().split('\n').pop());
  ok(!fs.existsSync(path.join(dir, 'public', 'index.html')), 'and nothing is written');
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log('\n8. score.js ships, and the two ways it is loaded give the same answers');
{
  const dir = sandbox();
  const r = run(dir);
  ok(r.code === 0 && /ok score\.js/.test(r.out), 'the build verifies score.js', r.out);
  // The page asks for /score.js. A public/ holding the page but not the script is a site that
  // loads and then does nothing — the exact shape of failure this guard exists to catch.
  ok(fs.existsSync(path.join(dir, 'public', 'score.js')), 'and writes it into public/ alongside the page');
  ok(fs.readFileSync(path.join(dir, 'public', 'score.js'), 'utf8') === fs.readFileSync(path.join(ROOT, 'score.js'), 'utf8'),
     'byte for byte');
  fs.rmSync(dir, { recursive: true, force: true });
}
{
  const dir = sandbox();
  fs.unlinkSync(path.join(dir, 'score.js'));
  const r = run(dir);
  ok(r.code !== 0 && /score\.js is missing/.test(r.out), 'a deploy without score.js fails instead of shipping a dead page', r.out);
  fs.rmSync(dir, { recursive: true, force: true });
}
{
  const dir = sandbox();
  fs.appendFileSync(path.join(dir, 'score.js'), '\n// tampered\n');
  const r = run(dir);
  ok(r.code !== 0 && /INTEGRITY FAIL: score\.js sha256/.test(r.out), 'an unsealed edit to score.js fails the build', r.out);
  fs.rmSync(dir, { recursive: true, force: true });
}
{
  // The reason this file exists at all: a scheduled scan and a scan the customer is watching must
  // produce the same numbers. The browser gets these names as globals from a classic script; the
  // scan job gets them off module.exports. If those two surfaces ever diverge, the scores diverge,
  // so the equivalence is asserted rather than assumed.
  const vm = require('vm');
  const src = fs.readFileSync(path.join(ROOT, 'score.js'), 'utf8');
  const ctx = { console, document: {}, window: {}, localStorage: {}, navigator: {} };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  const node = require(path.join(ROOT, 'score.js'));

  const exported = Object.keys(node);
  ok(exported.length > 50, 'the module exports the scoring surface (' + exported.length + ' names)');
  const missing = exported.filter((n) => vm.runInContext('typeof ' + n, ctx) === 'undefined');
  ok(missing.length === 0, 'every exported name is also a global when loaded as a classic script', missing.join(', '));

  // `$` is the browser's DOM helper. Exporting it would invite the scan job to call it, so its
  // absence from the module surface is the point, not an oversight.
  ok(exported.indexOf('$') === -1, 'the DOM helper is deliberately not on the server-side surface');

  // Same inputs through both surfaces, same output — the property that actually matters.
  const p = { wordCount: 900, h2Count: 5, h3Count: 4, listCount: 3, statCount: 6, questionHeadingCount: 3,
              kwInTitle: true, kwInH1: true, kwInMeta: true, schemaTopLevel: ['FAQPage'], schemaClaims: [],
              tableCount: 1, entities: [], counters: [], jsHiddenStats: [], jsHiddenStatCount: 0 };
  const m = { wordCount: 800, h2Count: 4, h3Count: 3, listCount: 2, statCount: 5, questionHeadingCount: 2 };
  const viaNode = JSON.stringify(node.scoreRank(p, m));
  ctx.__p = p; ctx.__m = m;
  const viaBrowser = vm.runInContext('JSON.stringify(scoreRank(__p, __m))', ctx);
  ok(viaNode === viaBrowser, 'scoreRank gives an identical result through both', viaNode + ' vs ' + viaBrowser);

  const cov = { mine: 4, queries: 6, peerMedian: 3 };
  const cats = [{ canonical: 'fleet telematics', variants: ['telematics'] }, { canonical: 'driver safety', variants: [] }];
  ctx.__cov = cov; ctx.__cats = cats;
  const aNode = JSON.stringify(node.scoreAnswer(p, m, cov, cats, null));
  const aBrowser = vm.runInContext('JSON.stringify(scoreAnswer(__p, __m, __cov, __cats, null))', ctx);
  ok(aNode === aBrowser, 'and so does scoreAnswer, entity matching and all', aNode.slice(0, 80) + ' vs ' + aBrowser.slice(0, 80));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
