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
//   node build.js          verify the manifest, then write the static files into public/
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
// Vercel turns every .js under api/ into a serverless function, and the Hobby plan allows
// twelve per deployment. Implementation modules are not endpoints, so they live in lib/ and the
// stubs in api/ reach across to them: seven functions instead of thirteen. test/build-guard.js
// asserts the count, because exceeding it fails at deploy time rather than at build time — the
// build goes green, the tests go green, and the deployment is rejected afterwards.
const SHIPPED = [
  'index.html',        // the whole front end: app shell, scanner, marketing homepage
  'score.js',          // scoring/history/prompts, shared by the browser and the scan job
  'og.png',            // the social card; rebuilt by tools/make-assets.js, never by hand
  'icon.svg',          // the wordmark's dish, as the favicon
  'apple-touch-icon.png', // the same mark for an iOS home screen, which ignores SVG favicons
  'api/page.js',       // endpoint → lib/page.impl.js
  'api/render.js',     // endpoint → lib/render.impl.js
  'api/serp.js',       // one Google query, normalized across SerpApi and Serper
  'api/auth/request.js',  // POST  ask for a link
  'api/auth/redeem.js',   // GET   open the link, mint the session
  'api/auth/me.js',       // GET   who the cookie belongs to
  'api/auth/logout.js',   // POST  end the session
  'api/projects.js',      // GET/POST/PATCH/DELETE  projects, ?id= rather than a dynamic route
  'api/scans.js',         // GET/POST              the history behind a project
  'api/tick.js',          // POST                  queue a scan, and move the queue along
  'api/account.js',       // GET/POST/DELETE       the account and the search key it scans with
  'lib/page.impl.js',  // fetch + parse any URL as served (v10.6)
  'lib/render.impl.js',// headless Chromium render + paint measurement (v10.5)
  'lib/db.js',         // one pool, sized for serverless, pointed at Neon's pooled endpoint
  'lib/auth.js',       // magic-link auth: token issue, single-use redemption, sessions, cookie
  'lib/mail.js',       // sends the login link via Resend
  'lib/store.js',      // projects and scans; ownership lives in every WHERE clause
  'lib/keys.js',       // the customer's own search key, encrypted with a secret outside the db
  'lib/scan-job.js',   // the resumable scan: eight phases, one unit of work at a time
  'lib/tick.js',       // claiming, banking, resuming, backing off and giving up
  'package.json',
  'vercel.json'
];

// The ceiling Vercel enforces at deploy time, asserted here so it is caught before a merge.
const MAX_FUNCTIONS = 12;

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

// Every .js anywhere under api/, which is exactly what Vercel counts.
function countFunctions(dir) {
  let n = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) n += countFunctions(p);
    else if (entry.name.endsWith('.js')) n++;
  }
  return n;
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
  // Counted from disk rather than from SHIPPED: a stray .js dropped into api/ becomes a function
  // whether or not anyone remembered to ship it, and it is the count on disk that Vercel rejects.
  const fnCount = countFunctions(path.join(ROOT, 'api'));
  if (fnCount > MAX_FUNCTIONS) {
    console.error('INTEGRITY FAIL: ' + fnCount + ' serverless functions under api/, and Vercel\'s '
      + 'Hobby plan allows ' + MAX_FUNCTIONS + '. The deployment would be rejected after a green '
      + 'build. Move whatever is not an endpoint into lib/.');
    bad++;
  } else {
    console.log('ok ' + fnCount + '/' + MAX_FUNCTIONS + ' serverless functions under api/');
  }

  if (bad) { console.error(bad + ' problem(s); nothing written. The previous production deployment stays live.'); process.exit(1); }

  // Everything the page loads over the network has to reach public/, not just the page itself.
  // index.html asks for /score.js; a public/ that has the page but not the script is a site that
  // loads and then does nothing, which is exactly the class of failure this guard exists to stop.
  // index.html links all of these by absolute path, so each one has to land in public/ beside
  // the page. A card the crawler 404s on is worse than no card at all: the share renders blank
  // and the failure is invisible from inside the app.
  const STATIC = ['index.html', 'score.js', 'og.png', 'icon.svg', 'apple-touch-icon.png'];
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const written = [];
  for (const file of STATIC) {
    const out = path.join(OUT_DIR, file);
    fs.writeFileSync(out, read(file));
    // Read it back rather than trusting the write: this is the last point where a truncated or
    // partial file can still be caught before it goes live.
    const wrote = fs.readFileSync(out);
    if (sha(wrote) !== want[file].sha256) {
      console.error('INTEGRITY FAIL: public/' + file + ' was written but reads back as sha256 ' + sha(wrote));
      process.exit(1);
    }
    written.push('public/' + file + ' (' + wrote.length + ' bytes, sha256 ' + sha(wrote) + ')');
  }
  console.log('integrity verified; ' + written.join('; ') + ' written');
}

process.argv.indexOf('--seal') !== -1 ? seal() : build();
