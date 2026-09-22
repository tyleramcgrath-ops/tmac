// Regenerates the three binary/vector assets the page links but cannot express inline:
// the social card, the favicon and the iOS home-screen icon.
//
//   node tools/make-assets.js
//
// It exists because a committed PNG with no way to rebuild it is a liability: the next person
// to change the headline has no path back to a matching card. Everything here is derived from
// the same palette and wordmark the homepage uses, so the card cannot drift from the site by
// accident — only by someone changing one and not re-running this.
//
// The fonts are fetched from Google and inlined as data URIs rather than linked, because the
// renderer must not depend on network timing: a card that renders before a webfont arrives is
// a card in Times New Roman, and it would ship looking fine in the one browser that had it
// cached. Fetching happens here, once, at authoring time — never at build time.
const fs = require('fs'), path = require('path'), https = require('https');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

// The homescreen's palette, copied from index.html's .homescreen block. Kept as one object so a
// change here is one change, not six.
const C = { paper:'#F5F2EC', paper2:'#EDE8DE', ink:'#15130F', ink2:'#46423A', quiet:'#7D7666',
            rule:'#D5CEBE', rule2:'#C3BAA6', rank:'#0C5A6B', answer:'#A2560A', pass:'#2C6647' };

// The wordmark, as the header draws it.
const DISH = '<svg viewBox="0 0 24 24" fill="none" stroke="PAPER" stroke-width="2" stroke-linecap="round">'
  + '<path d="M4 20 L11 13"/><circle cx="12.5" cy="11.5" r="3.4" fill="PAPER" stroke="none"/>'
  + '<path d="M14.5 6.2a7 7 0 0 1 3.3 3.3M16.2 2.6a11 11 0 0 1 5.2 5.2"/></svg>';

const get = (url) => new Promise((res, rej) => {
  https.get(url, { headers: { 'User-Agent': UA } }, (r) => {
    if (r.statusCode !== 200) return rej(new Error(url + ' -> ' + r.statusCode));
    const chunks = []; r.on('data', (c) => chunks.push(c)); r.on('end', () => res(Buffer.concat(chunks)));
  }).on('error', rej);
});

// Only the latin block of each face: the card has no Cyrillic or Vietnamese on it, and pulling
// every subset would triple the inlined bytes for glyphs nothing renders.
async function faces() {
  const families = ['Instrument+Serif:ital,wght@0,400;1,400', 'Archivo:wght@700;800', 'IBM+Plex+Mono:wght@400;500'];
  let css = '';
  for (const f of families) css += (await get('https://fonts.googleapis.com/css2?family=' + f + '&display=swap')).toString() + '\n';
  const out = [];
  for (const block of css.split('@font-face').slice(1)) {
    const range = (block.match(/unicode-range:\s*([^;]+);/) || [])[1] || '';
    if (!/U\+0000-00FF/.test(range)) continue;               // latin only
    const family = (block.match(/font-family:\s*'([^']+)'/) || [])[1];
    const style = (block.match(/font-style:\s*(\w+)/) || [])[1] || 'normal';
    const weight = (block.match(/font-weight:\s*(\d+)/) || [])[1] || '400';
    const url = (block.match(/url\((https:[^)]+\.woff2)\)/) || [])[1];
    if (!family || !url) continue;
    const buf = await get(url);
    out.push(`@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};`
      + `src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2')}`);
  }
  if (!out.length) throw new Error('no latin faces resolved — the Google Fonts CSS shape changed');
  return out.join('\n');
}

const cardHtml = (fontCss) => `<!doctype html><meta charset="utf-8"><style>
${fontCss}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1200px;height:630px}
body{background:${C.paper};color:${C.ink};font-family:'IBM Plex Sans',sans-serif;position:relative;overflow:hidden}
/* the same drafting grid the hero is plotted on, fading from the top right */
.grid{position:absolute;inset:0;opacity:.55;
  background-image:linear-gradient(${C.rule} 1px,transparent 1px),linear-gradient(90deg,${C.rule} 1px,transparent 1px);
  background-size:64px 64px;
  -webkit-mask-image:radial-gradient(120% 90% at 78% 0%,#000 0%,transparent 72%)}
.pad{position:relative;height:100%;padding:56px 64px;display:flex;flex-direction:column;justify-content:space-between}
.brand{display:flex;align-items:center;gap:14px}
.dish{width:44px;height:44px;border-radius:10px;background:${C.ink};display:grid;place-items:center}
.dish svg{width:25px;height:25px;display:block}
.word{font-family:Archivo,sans-serif;font-weight:800;font-size:23px;letter-spacing:.15em;text-transform:uppercase}
.word i{font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-weight:400;
  color:${C.rank};letter-spacing:.02em;text-transform:none;font-size:29px}
.body{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,.62fr);gap:56px;align-items:end}
h1{font-family:'Instrument Serif',Georgia,serif;font-weight:400;font-size:72px;line-height:1.05;
  letter-spacing:-.012em}
/* the hero's running spec, so the card carries the same evidence the page opens with */
.sp{border-top:1px solid ${C.ink};padding-top:12px}
.sp .row{display:flex;justify-content:space-between;gap:16px;padding:7.5px 0;
  border-bottom:1px solid ${C.rule};font-family:'IBM Plex Mono',monospace;font-size:13px}
.sp .row dt{color:${C.quiet};letter-spacing:.05em;text-transform:uppercase;font-size:11.5px;padding-top:2px}
.sp .row dd{color:${C.ink};text-align:right}
h1 .gapword{font-style:italic;color:${C.rank};position:relative;white-space:nowrap}
h1 .gapword::after{content:"";position:absolute;left:0;right:0;bottom:.09em;height:3px;background:${C.answer}}
.foot{display:flex;align-items:flex-end;justify-content:space-between;gap:28px;
  border-top:1px solid ${C.ink};padding-top:15px}
.spec{font-family:'IBM Plex Mono',monospace;font-size:14.5px;letter-spacing:.055em;
  text-transform:uppercase;color:${C.quiet};display:flex;gap:11px;align-items:center}
.spec b{color:${C.ink};font-weight:500}
.spec .dot{width:7px;height:7px;border-radius:50%;background:${C.pass};display:block}
.host{font-family:'IBM Plex Mono',monospace;font-size:14.5px;color:${C.ink};letter-spacing:.03em}
</style>
<div class="grid"></div>
<div class="pad">
  <div class="brand">
    <span class="dish">${DISH.replace(/PAPER/g, C.paper)}</span>
    <span class="word">Citation <i>Gap</i></span>
  </div>
  <div class="body">
    <h1>You rank third.<br>The answer box <span class="gapword">quotes someone else</span>.</h1>
    <dl class="sp">
      <div class="row"><dt>Measures</dt><dd>Rank + answer layer</dd></div>
      <div class="row"><dt>Sample</dt><dd>Live top 10</dd></div>
      <div class="row"><dt>Render check</dt><dd>Headless Chromium</dd></div>
      <div class="row"><dt>Output</dt><dd>Ranked work order</dd></div>
    </dl>
  </div>
  <div class="foot">
    <div class="spec"><i class="dot"></i><b>Free on your own search key</b> &nbsp;·&nbsp; ~60 seconds a scan</div>
    <div class="host">citation-gap.vercel.app</div>
  </div>
</div>`;

// The favicon is the wordmark's dish on the wordmark's square — the same mark the header shows,
// so a pinned tab and the page agree. Written as SVG so it stays sharp at every size.
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Citation Gap">
<rect width="64" height="64" rx="14" fill="${C.ink}"/>
<g transform="translate(9.5 9.5) scale(1.85)" fill="none" stroke="${C.paper}" stroke-width="2" stroke-linecap="round">
<path d="M4 20 L11 13"/><circle cx="12.5" cy="11.5" r="3.4" fill="${C.paper}" stroke="none"/>
<path d="M14.5 6.2a7 7 0 0 1 3.3 3.3M16.2 2.6a11 11 0 0 1 5.2 5.2"/></g></svg>`;

(async () => {
  const chromium = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')).chromium;
  const fontCss = await faces();
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(cardHtml(fontCss), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(ROOT, 'og.png') });
  await page.close();

  fs.writeFileSync(path.join(ROOT, 'icon.svg'), iconSvg + '\n');

  // iOS ignores SVG favicons, so the home-screen icon is a PNG of the same mark.
  const ip = await browser.newPage({ viewport: { width: 180, height: 180 } });
  await ip.setContent(`<!doctype html><meta charset="utf-8"><style>*{margin:0;padding:0}
    html,body{width:180px;height:180px;background:${C.ink}}svg{width:180px;height:180px;display:block}</style>`
    + iconSvg, { waitUntil: 'load' });
  await ip.screenshot({ path: path.join(ROOT, 'apple-touch-icon.png') });
  await ip.close();

  await browser.close();
  for (const f of ['og.png', 'icon.svg', 'apple-touch-icon.png']) {
    console.log('wrote ' + f + ' (' + fs.statSync(path.join(ROOT, f)).size + ' bytes)');
  }
})().catch((e) => { console.error(e); process.exit(1); });
