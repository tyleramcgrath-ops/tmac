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
  for (const f of ['build.js', 'ship-manifest.json', 'index.html', 'package.json', 'vercel.json']) {
    fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
  }
  fs.mkdirSync(path.join(dir, 'api'));
  for (const f of fs.readdirSync(path.join(ROOT, 'api'))) fs.copyFileSync(path.join(ROOT, 'api', f), path.join(dir, 'api', f));
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
for (const victim of ['index.html', 'api/render.impl.js', 'api/serp.js']) {
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
  fs.appendFileSync(path.join(dir, 'api', 'page.impl.js'), '\n// drifted\n');
  const r = run(dir);
  ok(r.code !== 0 && /INTEGRITY FAIL: api\/page\.impl\.js sha256/.test(r.out), 'an unsealed edit to a function body fails the build', r.out.trim().split('\n')[0]);
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

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
