// Fail-closed deploy guard and assembler.
//
// What this protects against, in one line: a deployment that is missing a file, or carrying a
// stale one, going live anyway.
//
// History, because the shape of this file only makes sense with it. The site used to be shipped
// by a tool that replaced the entire deployment with an inline payload, and a payload truncated
// in transit took the site down more than once. The guard that fixed that split index.html into
// seven embeddable parts under patches/srcparts/, hashed each one, and re-fetched the two large
// api function bodies from pinned Vercel preview URLs at build time, patching them with line-hunk
// patches under patches/. It worked, but it meant the real index.html and the parts the build
// actually shipped could drift apart — and they did: the SaaS redesign and the marketing homepage
// went into index.html and never into the parts, so every build quietly shipped the old front end.
//
// The project is in git now, so the transport that motivated all of that is gone. index.html is
// the source of truth again, the function bodies are ordinary committed files, and the split
// parts and the spent patches have been deleted (they are in git history at the import commit).
// What survives is the part worth keeping: nothing ships unless every file is present and matches
// the hash recorded for it, so a missing or stale file fails the build and leaves the previous
// production deployment live.
//
//   node build.js          verify the manifest, then write public/index.html
//   node build.js --seal   re-record the hashes after an intentional change, and print the diff
//
// Sealing is a deliberate act: change a shipped file, run the tests, then seal and commit the
// manifest alongside the change. An unsealed change fails the build instead of shipping.
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const ROOT = __dirname;
const MANIFEST = path.join(ROOT, 'ship-manifest.json');
const OUT_DIR = path.join(ROOT, 'public');
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

// Everything a working deployment needs. A file listed here and missing from disk is a failed
// build, which is the specific failure this project kept shipping: a deploy with files left out.
const SHIPPED = [
  'index.html',        // the whole front end: app shell, scanner, marketing homepage
  'api/page.js',       // stub → page.impl.js
  'api/page.impl.js',  // fetch + parse any URL as served (v10.6)
  'api/render.js',     // stub → render.impl.js
  'api/render.impl.js',// headless Chromium render + paint measurement (v10.5)
  'api/serp.js',       // one Google query, normalized across SerpApi and Serper
  'package.json',
  'vercel.json'
];

function read(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p);
}

function measure() {
  const entries = {}, missing = [];
  for (const file of SHIPPED) {
    const buf = read(file);
    if (!buf) { missing.push(file); continue; }
    entries[file] = { sha256: sha(buf), bytes: buf.length };
  }
  return { entries, missing };
}

function seal() {
  const { entries, missing } = measure();
  if (missing.length) {
    console.error('SEAL FAIL: cannot seal a manifest with files missing: ' + missing.join(', '));
    process.exit(1);
  }
  let prev = {};
  try { prev = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).files || {}; } catch (e) {}
  // A seal that records nothing new leaves the file alone, so `--seal` on an unchanged tree does
  // not show up as a diff for a reviewer to wonder about.
  if (JSON.stringify(prev) === JSON.stringify(entries)) {
    console.log('nothing to seal; ' + rel(MANIFEST) + ' already matches all ' + SHIPPED.length + ' files');
    return;
  }
  for (const file of SHIPPED) {
    const was = prev[file], now = entries[file];
    if (!was) console.log('  + ' + file + ' (' + now.bytes + ' bytes)');
    else if (was.sha256 !== now.sha256) console.log('  ~ ' + file + ' ' + was.sha256.slice(0, 12) + ' → ' + now.sha256.slice(0, 12) + ' (' + was.bytes + ' → ' + now.bytes + ' bytes)');
  }
  for (const file of Object.keys(prev)) if (!entries[file]) console.log('  - ' + file + ' (no longer shipped)');
  fs.writeFileSync(MANIFEST, JSON.stringify({
    note: 'Written by `node build.js --seal`. build.js refuses to build if a shipped file is missing or does not match the hash here.',
    sealedAt: new Date().toISOString(),
    files: entries
  }, null, 2) + '\n');
  console.log('sealed ' + SHIPPED.length + ' files into ' + rel(MANIFEST));
}

function build() {
  if (!fs.existsSync(MANIFEST)) {
    console.error('INTEGRITY FAIL: ' + rel(MANIFEST) + ' is missing — run `node build.js --seal`');
    process.exit(1);
  }
  const want = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).files || {};
  let bad = 0;
  for (const file of SHIPPED) {
    const expected = want[file];
    if (!expected) { console.error('INTEGRITY FAIL: ' + file + ' is shipped but not in the manifest — run `node build.js --seal`'); bad++; continue; }
    const buf = read(file);
    if (!buf) { console.error('INTEGRITY FAIL: ' + file + ' is missing'); bad++; continue; }
    const got = sha(buf);
    if (got !== expected.sha256) { console.error('INTEGRITY FAIL: ' + file + ' sha256 ' + got + ' != ' + expected.sha256 + ' (' + buf.length + ' bytes, manifest says ' + expected.bytes + ')'); bad++; continue; }
    console.log('ok ' + file + ' (' + buf.length + ' bytes)');
  }
  // A file in the manifest that is no longer shipped means the two lists have drifted; say so
  // rather than quietly ignoring it.
  for (const file of Object.keys(want)) if (SHIPPED.indexOf(file) === -1) { console.error('INTEGRITY FAIL: ' + file + ' is in the manifest but not in the shipped list — run `node build.js --seal`'); bad++; }
  if (bad) { console.error(bad + ' problem(s); nothing written. The previous production deployment stays live.'); process.exit(1); }

  const index = read('index.html');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), index);
  const wrote = fs.readFileSync(path.join(OUT_DIR, 'index.html'));
  if (sha(wrote) !== want['index.html'].sha256) {
    console.error('INTEGRITY FAIL: public/index.html was written but reads back as sha256 ' + sha(wrote));
    process.exit(1);
  }
  console.log('integrity verified; public/index.html written (' + wrote.length + ' bytes, sha256 ' + sha(wrote) + ')');
}

process.argv.indexOf('--seal') !== -1 ? seal() : build();
