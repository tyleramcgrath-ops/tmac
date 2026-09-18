// Fail-closed deploy guard and assembler.
//
// deploy_to_vercel replaces the whole deployment, and a payload that gets truncated in transit
// has taken this site down before. index.html is staged locally as several line-boundary parts
// (patches/srcparts/index-N.html), each small enough to embed and verify reliably, concatenated
// here at build time and checked against the sha256 recorded when the file was written. Every
// api file is hashed the same way. Any mismatch fails the build, so the previous production
// deployment stays live instead of a broken one going out.
//
// (Earlier versions fetched index.html from three remote preview URLs instead of local files.
// That worked but made every front-end change dependent on staging new preview deployments,
// which Vercel Authentication can block for a plain fetch() on a brand-new URL. Local file:
// parts have no such dependency, so the front end now ships the same way api/serp.js already
// does: inline, sha-verified, no network fetch required for this part of the build.)
const fs = require('fs'), crypto = require('crypto');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

// The deploy transport decodes JavaScript \uXXXX escapes inside string literals into the
// characters themselves. That is semantically identical JS (every escape in this file sits
// inside a string literal, none in a regex), so both sides are normalized the same way
// before hashing. Hashes below are of the normalized text.
const unesc = (b) => Buffer.from(b.toString('utf8').replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16))), 'utf8');

// index.html source, split at line boundaries into local files small enough to embed and
// verify reliably. Concatenated with '\n' between parts (the split points are line boundaries,
// so this reconstructs the original file exactly) and checked against INDEX_SHA.
const INDEX_PARTS = [
  { file: 'patches/srcparts/index-1.html', sha: '9c8eb17169ffd3b2a84c881e7f097c6f7eb1a2a5736a1f6136b652e215335120' },
  { file: 'patches/srcparts/index-2.html', sha: '10f7e83713c0393ad75f994eff00258a9959f81e43019a00c6c4c37ef2417cec' },
  { file: 'patches/srcparts/index-3.html', sha: '4ea99a5eedeff3dd6a50791ed58e653692f12249b4030162b6ca91063b65ada4' },
  { file: 'patches/srcparts/index-4.html', sha: 'c406a6e55fca050e9c7bd3b271495784b49305b92b11f5e9bc5f9adb9ab65443' },
  { file: 'patches/srcparts/index-5.html', sha: '1dba7cdb54aa29d633998ead0a5c9e8adff885ace46382556bfb9eef15604c9b' },
  { file: 'patches/srcparts/index-6.html', sha: 'f7bc6a602e041896206a33ecd7f78dbd1f6652060a6361d28782434119de9fab' },
  { file: 'patches/srcparts/index-7.html', sha: 'a29da3745cfc166c75c84376a8f6065a409b645d1a781532448cfe8468b19948' }
];
const INDEX_SHA = 'ee57b35d4e5759b2b4bf953d144a6387c906d14d68f2a319e242c78486cb535a';
const API_SHA = {
  'api/page.js':   '447508be2a80f0ee079f67c6993e681b7c3d7d80db099e75011cbc5146c1a5b7',
  'api/render.js': 'ae2c0b3433c050d86785546619a7fb3725babc2c42ec09efd3f60a7b20116e41',
  'api/serp.js':   '552381689142f313c8b522f4799315c8ff5c925aad76bbec1ee9805a9dcd1de2'
};
// Function bodies are staged on immutable preview deployments and written into api/ at build
// time (a file generated during the build step is traced into the function bundle). Each is
// hash-checked after \uXXXX normalisation; a mismatch fails the build. api/page.js and
// api/render.js are thin stubs that require these.
const IMPL = [
  { url: 'https://citation-6r07z65qj-tyleramcgrath-6624s-projects.vercel.app/page.impl.txt', file: 'api/page.impl.js', sha: '11a85b522b9a21cac6a681b94f63877d271d442342fb3aef92f82c69d100b85e',
    patches: [
      { url: 'https://citation-ifesjg0rf-tyleramcgrath-6624s-projects.vercel.app/page-v10.5.json', name: 'page-v10.5.json', sha: '456a67eac45b00c920d8ef2e66cc110eb3345e74560f8f916b06ccbec1d5fa59', result: '56ddbbb304d060490fe0e50d6c9849d33ff77b913f72cdf3a5a21a40669dd8b2' },
      // v10.6 — P4 v2 CONTAINER RELOCATED false-positive fix (each container's own headings must
      // be individually confirmed relocated) plus the counter-caption cross-reference used by the
      // heading-consolidation task. Shipped inline (file:), not staged (url:), per the v10.5 lesson:
      // a brand-new preview URL can be blocked by Vercel Authentication for a plain fetch.
      { file: 'patches/page-v10.6.json', sha: 'bb674e35b947dbeb2abbb8c41cb7cda495425d4006ba888f240ea92a6f0f5e73', result: '062f9c622d5ff96e0bfaa872d60269c0ca9c3df7c0e3063b2c159ec8411f2dee' }
    ] },
  // The render-v10.5.json patch was regenerated after a production bug (P16's hiddenNow loop
  // referenced PAINT_SKIP, a name private to PAINT_INSTALL's closure and invisible to INPAGE's
  // separate scope, throwing "PAINT_SKIP is not defined" on any page with a hidden container).
  // Fixed to reference INPAGE's own SKIP. Shipped inline (file:) rather than staged (url:)
  // because a brand-new preview URL can be blocked by Vercel Authentication for a plain fetch.
  { url: 'https://citation-4ttpqj1vs-tyleramcgrath-6624s-projects.vercel.app/render.impl.txt', file: 'api/render.impl.js', sha: '72f7d9a3c694e373f8733c63b3e934f84d388428c3a13628ced20edbdf25ccc7',
    patches: [{ file: 'patches/render-v10.5.json', sha: '95305ed056ebcf09ca03f0c3b12001087b69e7241300f00b0c582c93d63c1d21', result: '51ab73d7f3ee72af707e14149f360031ec681c33eb21c03461237055e953c612' }] }
];
function applyHunks(text, hunks) {
  const lines = text.split('\n'); const out = []; let pos = 0;
  for (const h of hunks) {
    if (h.at < pos || h.at + h.del > lines.length) throw new Error('hunk at ' + h.at + ' out of range');
    for (let i = pos; i < h.at; i++) out.push(lines[i]);
    for (const l of h.ins) out.push(l);
    pos = h.at + h.del;
  }
  for (let i = pos; i < lines.length; i++) out.push(lines[i]);
  return out.join('\n');
}

(async () => {
  let bad = 0;
  for (const [file, want] of Object.entries(API_SHA)) {
    if (!fs.existsSync(file)) { console.error('INTEGRITY FAIL: ' + file + ' is missing'); bad++; continue; }
    const got = sha(fs.readFileSync(file));
    if (got !== want) { console.error('INTEGRITY FAIL: ' + file + ' sha256 ' + got + ' != ' + want + ' (' + fs.statSync(file).size + ' bytes)'); bad++; }
    else console.log('ok ' + file);
  }
  for (const im of IMPL) {
    const r = await fetch(im.url, { headers: { 'Cache-Control': 'no-cache' } });
    if (!r.ok) { console.error('FETCH FAIL: ' + im.url + ' -> HTTP ' + r.status); bad++; continue; }
    let buf = unesc(Buffer.from(await r.arrayBuffer()));
    if (sha(buf) !== im.sha) {
      const noNl = buf.length && buf[buf.length - 1] === 0x0a ? buf.subarray(0, buf.length - 1) : buf;
      const hit = [noNl, Buffer.concat([buf, Buffer.from('\n')])].find((c) => sha(c) === im.sha);
      if (hit) buf = hit; else { console.error('INTEGRITY FAIL: ' + im.file + ' sha256 ' + sha(buf) + ' != ' + im.sha + ' (' + buf.length + ' bytes)'); bad++; continue; }
    }
    // A staged body can be updated by line-hunk patches: each patch is hashed, applied, and the
    // result hashed, so a wrong patch fails the build.
    let pbad = false;
    for (const p of (im.patches || [])) {
      const label = p.file || p.name;
      let raw;
      if (p.url) {
        const r2 = await fetch(p.url, { headers: { 'Cache-Control': 'no-cache' } });
        if (!r2.ok) { console.error('FETCH FAIL: ' + p.url + ' -> HTTP ' + r2.status); bad++; pbad = true; break; }
        raw = unesc(Buffer.from(await r2.arrayBuffer()));
      } else {
        if (!fs.existsSync(p.file)) { console.error('INTEGRITY FAIL: ' + p.file + ' is missing'); bad++; pbad = true; break; }
        raw = unesc(fs.readFileSync(p.file));
      }
      if (sha(raw) !== p.sha) { console.error('INTEGRITY FAIL: ' + label + ' sha256 ' + sha(raw) + ' != ' + p.sha + ' (' + raw.length + ' bytes)'); bad++; pbad = true; break; }
      const patched = Buffer.from(applyHunks(buf.toString('utf8'), JSON.parse(raw.toString('utf8')).hunks), 'utf8');
      if (sha(patched) !== p.result) { console.error('INTEGRITY FAIL: after ' + label + ' ' + im.file + ' sha256 ' + sha(patched) + ' != ' + p.result); bad++; pbad = true; break; }
      buf = patched;
      console.log('ok ' + label + ' applied to ' + im.file + ' (' + buf.length + ' bytes)');
    }
    if (pbad) continue;
    fs.writeFileSync(im.file, buf);
    console.log('ok ' + im.file + ' written (' + buf.length + ' bytes)');
  }
  // index.html: read each local part, verify it individually, then verify the assembled whole.
  const idxParts = [];
  for (const part of INDEX_PARTS) {
    if (!fs.existsSync(part.file)) { console.error('INTEGRITY FAIL: ' + part.file + ' is missing'); bad++; continue; }
    const buf = fs.readFileSync(part.file);
    if (sha(buf) !== part.sha) { console.error('INTEGRITY FAIL: ' + part.file + ' sha256 ' + sha(buf) + ' != ' + part.sha + ' (' + buf.length + ' bytes)'); bad++; continue; }
    console.log('ok ' + part.file + ' (' + buf.length + ' bytes)');
    idxParts.push(buf);
  }
  if (bad) process.exit(1);
  const index = Buffer.concat(idxParts.flatMap((b, i) => i === 0 ? [b] : [Buffer.from('\n'), b]));
  if (sha(index) !== INDEX_SHA) { console.error('INTEGRITY FAIL: assembled index.html sha256 ' + sha(index) + ' != ' + INDEX_SHA + ' (' + index.length + ' bytes)'); process.exit(1); }
  console.log('ok index.html assembled (' + index.length + ' bytes)');
  fs.mkdirSync('public', { recursive: true });
  fs.writeFileSync('public/index.html', index);
  console.log('integrity verified; public/index.html written (' + index.length + ' bytes)');
})().catch((e) => { console.error('BUILD ERROR: ' + (e && e.stack || e)); process.exit(1); });
