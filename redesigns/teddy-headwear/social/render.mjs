// Teddy Headwear — 60-day social launch: post graphic renderer.
// Usage: node social/render.mjs            (all days)
//        node social/render.mjs 1 2 5      (only these days)
// Output: img/social/day-XX.webp (+ day-XX-sN.webp carousel slides)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, copyFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMG = join(ROOT, 'img');
const OUT = join(IMG, 'social');
const TMP = process.env.RENDER_TMP || join(tmpdir(), 'teddy-social-render');
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const plan = JSON.parse(readFileSync(join(ROOT, 'social/plan.json'), 'utf8'));
const only = process.argv.slice(2).map(Number).filter(Boolean);

// ---------- photo library ----------
const files = new Set(readdirSync(IMG).filter(f => f.endsWith('.webp')).map(f => f.replace(/\.webp$/, '')));
const dims = {};
for (const k of files) {
  const [w, h] = execFileSync('identify', ['-format', '%w %h', join(IMG, k + '.webp')]).toString().split(' ').map(Number);
  dims[k] = { w, h };
}
// Product shots sit on a near-white sweep; lift it to pure white so multiply-blending onto bone is seamless.
const lift = {};
function liftFor(k) {
  const f = k === 'studio' ? 'blank-cowboy-cream' : k;
  if (lift[f] == null) {
    const px = execFileSync('convert', [join(IMG, f + '.webp'), '-crop', '40x40+4+4', '+repage', '-resize', '1x1!', '-format', '%[fx:int(255*r)] %[fx:int(255*g)] %[fx:int(255*b)]', 'info:']).toString().split(' ').map(Number);
    lift[f] = Math.min(1.25, 256 / Math.max(1, Math.min(...px)));
  }
  return lift[f];
}
const NOIR = { 'life-1': 'noir-life-1', 'life-2': 'noir-life-2', 'life-3': 'noir-life-3', 'life-4': 'noir-life-4', 'life-5': 'noir-life-5', 'life-6': 'noir-life-6', 'cowboy-model': 'noir-cowboy-model' };
// Swap plain product shots on poster/cover posts for editorial scenes (same subject/city where possible).
const SCENE_SWAP = { 11: 'scene-jupiter-horse', 17: 'scene-studio-duo', 27: 'scene-nyc-night', 40: 'apparel-hoodie-model', 44: 'apparel-tee-black-model' };
function fileFor(key) {
  if (key === 'studio') return 'studio';
  const k = NOIR[key] && files.has(NOIR[key]) ? NOIR[key] : key;
  if (!files.has(k)) throw new Error('missing photo ' + key);
  return k;
}
const isLight = k => k === 'studio' || /^(cowboy|fedora|blank)-(t|f|ny|la|cowboy|fedora)-(cream|brown)$|^blank-|^apparel-(cord|crew|hoodie|rag|tee-black|tee-bone|tote|trucker)$|^tee$|^snapbacks$/.test(k);
const src = k => 'file://' + join(IMG, (k === 'studio' ? 'blank-cowboy-cream' : k) + '.webp');
const dim = k => dims[k === 'studio' ? 'blank-cowboy-cream' : k];
// focal points (fraction of natural image) for cover crops
const FOCUS = { hero: [0.54, 0.4], 'hero-noir': [0.5, 0.45], 'noir-cowboy-model': [0.5, 0.4], 'cowboy-model': [0.5, 0.4] };
// callouts for the detail template: [x, y, label] as fractions of the natural image
const CALLOUTS = {
  'detail-interior': [[0.6, 0.45, 'Gold silk lining'], [0.78, 0.56, 'Sweatband'], [0.13, 0.6, 'Woven label']],
  'detail-label': [[0.78, 0.555, 'Woven gold label'], [0.22, 0.49, 'Metal button'], [0.46, 0.395, 'Leather band']],
  'cowboy-t-cream': [[0.49, 0.6, 'Embroidered front'], [0.62, 0.735, 'Leather band'], [0.81, 0.675, 'Woven label']],
  'fedora-la-brown': [[0.64, 0.62, 'Original artwork'], [0.45, 0.73, 'Leather band'], [0.2, 0.8, '100% wool']],
  'apparel-rag': [[0.5, 0.48, 'Gold silk'], [0.8, 0.81, 'T monogram'], [0.24, 0.3, 'Tonal paisley']],
};
const MONO_POS = [0.49, 0.6]; // where the studio monogram sits on blank-cowboy-cream

// tags for picking carousel slide photos
const LETTER = { t: 'T', f: 'F', ny: 'NY', la: 'LA' };
const TAGS = {};
for (const k of files) {
  let m;
  if ((m = k.match(/^(cowboy|fedora)-(t|f|ny|la)-(cream|brown)$/))) TAGS[k] = [m[1], m[3], 'hat', 'on bone', '@' + LETTER[m[2]]];
}
Object.assign(TAGS, {
  studio: ['studio', 'monogram studio', 'preview', 'letters', 'cursor', 'phone', 'initials', 'lettering', 'thread', 'screen', 'varsity', 'script', 'serif', 'western'],
  'detail-interior': ['lining', 'silk', 'sweatband', 'inside', 'interior', 'crown-down', 'upside down', 'flipped'],
  'detail-label': ['label', 'woven', 'brim', 'band', 'button', 'leather', 'side profile'],
  'noir-life-1': ['beach', 'man', 'cream t cowboy', 'shirtless', 'shadow', 'cream cowboy'],
  'noir-life-2': ['full length', 'standing', 'boots', 'outfit', 'white tee', 'denim', 'brown cowboy', 'coat'],
  'noir-life-3': ['seated', 'chair', 'linen', 'studio linen', 'tee'],
  'noir-life-4': ['beach', 'woman', 'sun', 'towel', 'cream'],
  'noir-life-5': ['woman', 'holding the brim', 'shadow', 'brim tipped', 'hard shadow', 'looking'],
  'noir-life-6': ['surf', 'surfboard', 'board', 'shorebreak', 'beach', 'waterline'],
  'noir-cowboy-model': ['brim low', 'brim tipped', 'shadow', 'eyes', 'dark'],
  'life-7': ['fedora', 'la', 'still'],
  'life-9': ['polaroid', 'photo', 'repost', 'tag', 'worn', 'community', 'comment'],
  'scene-jupiter-horse': ['horse', 'jupiter', 'sunrise', 'florida', 'waterline'],
  'scene-nyc-night': ['ny', 'new york', 'night', 'city', 'dark coat', 'street'],
  'scene-la-convertible': ['los angeles', 'car', 'palm', 'convertible', 'car seat'],
  'scene-texas-motel': ['texas', 'motel', 'truck', 'road'],
  'scene-studio-duo': ['side by side', 'both', 'two', 'pair', 'cream and brown', 'lineup', 'dark coat'],
  'apparel-hoodie': ['hoodie', 'frontier hoodie', 'forest green', 'folded'],
  'apparel-hoodie-model': ['hoodie', 'frontier hoodie', 'wear'],
  'apparel-crew': ['crewneck', 'saddle', 'crew', 'saddle brown'],
  'apparel-cord': ['corduroy', 'snapback', 'cord'],
  'apparel-rag': ['wild rag', 'silk wild rag', 'gold silk', 'swatch', 'rag'],
  'apparel-tee-black-model': ['script tee', 'tee', 'black', 'sunset'],
  tee: ['script tee', 'teddy script tee', 'black tee', 'faded black'],
  'apparel-tee-bone': ['monogram tee', 'bone swatch', 'tee'],
  'apparel-tote': ['tote', 'canvas tote', 'bag', 'sand', 'beach bag'],
  'apparel-trucker': ['trucker', 'teddy trucker', 'cap'],
  snapbacks: ['trucker', 'snapback', 'caps', 'teddy trucker'],
  'blank-cowboy-brown': ['blank', 'brown cowboy', 'cursor'],
  'blank-fedora-cream': ['blank', 'cream fedora'],
});
const PILLAR_POOL = {
  product: ['cowboy-t-cream', 'fedora-ny-cream', 'cowboy-la-brown', 'fedora-f-brown', 'scene-studio-duo'],
  monogram: ['studio', 'cowboy-ny-brown', 'fedora-t-cream', 'cowboy-f-cream', 'fedora-la-cream'],
  craft: ['detail-interior', 'detail-label', 'cowboy-t-cream', 'fedora-la-brown'],
  lifestyle: ['noir-life-1', 'noir-life-2', 'noir-life-5', 'scene-nyc-night', 'noir-cowboy-model', 'noir-life-6'],
  apparel: ['apparel-crew', 'apparel-hoodie', 'tee', 'apparel-rag', 'apparel-tote', 'snapbacks'],
  community: ['life-9', 'noir-life-4', 'noir-life-6', 'studio', 'noir-life-3'],
};
function pickPhoto(text, pillar, used) {
  const low = text.toLowerCase();
  let best = null, bestScore = -99;
  for (const [k, tags] of Object.entries(TAGS)) {
    if (k !== 'studio' && !files.has(k)) continue;
    let s = 0;
    for (const t of tags) {
      if (t.startsWith('@')) { if (new RegExp('\\b' + t.slice(1) + '\\b').test(text)) s += 1.5; }
      else if (low.includes(t)) s += 1;
    }
    if ((PILLAR_POOL[pillar] || []).includes(k)) s += 0.4;
    s -= (used.get(k) || 0) * 1.6;
    if (s > bestScore) { bestScore = s; best = k; }
  }
  used.set(best, (used.get(best) || 0) + 1);
  return best;
}

// ---------- html helpers ----------
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function headline(text) {
  const words = String(text).trim().split(/\s+/);
  const last = words.pop();
  return (words.length ? esc(words.join(' ')) + ' ' : '') + `<em>${esc(last)}</em>`;
}
// Place an image "stage" with the image's own aspect ratio inside a box, cover or contain.
function stage(key, boxW, boxH, fit = 'cover', inner = '', cls = '') {
  const d = dim(key);
  const s = fit === 'cover' ? Math.max(boxW / d.w, boxH / d.h) : Math.min(boxW / d.w, boxH / d.h);
  const w = d.w * s, h = d.h * s;
  const [fx, fy] = FOCUS[key] || [0.5, 0.5];
  let left = (boxW - w) / 2, top = (boxH - h) / 2;
  if (fit === 'cover') {
    left = Math.min(0, Math.max(boxW - w, boxW / 2 - fx * w));
    top = Math.min(0, Math.max(boxH - h, boxH / 2 - fy * h));
  }
  const mono = key === 'studio'
    ? `<span class="mono-stitch" style="left:${MONO_POS[0] * 100}%;top:${MONO_POS[1] * 100}%;font-size:${(w * 0.105).toFixed(1)}px">JB</span>` : '';
  return `<div class="stage ${cls}" style="left:${left.toFixed(1)}px;top:${top.toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px"><img src="${src(key)}" alt=""${isLight(key) ? ` style="filter:brightness(${liftFor(key).toFixed(3)})"` : ''}>${mono}${inner}</div>`;
}
const logo = (ink = false, w = 230) => ink
  ? `<div class="logo-ink" style="width:${w}px;height:${Math.round(w * 84 / 450)}px"></div>`
  : `<img class="logo" src="${src('logo')}" style="width:${w}px" alt="Teddy">`;
const nn = n => String(n).padStart(2, '0');

const CSS = (W, H) => `
:root{--felt:#12281C;--felt-2:#1B3A29;--ink-black:#0B1510;--bone:#E9E6DD;--bone-2:#F4F2EC;--gold:#E5A823;--gold-deep:#B07A0C;--gold-ink:#2A1E05;--saddle:#9C7044;--muted:#5E6A60}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:var(--felt)}
.c{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:var(--felt);color:var(--bone);font-family:Archivo,sans-serif;-webkit-font-smoothing:antialiased}
.stage{position:absolute}.stage img{display:block;width:100%;height:100%}
.mono-stitch{position:absolute;transform:translate(-50%,-50%);font-family:'Pinyon Script',cursive;color:#D9A21E;line-height:1;white-space:nowrap;text-shadow:0 1px 0 rgba(90,60,0,.35),0 0 1px rgba(90,60,0,.4)}
.h{font-family:Archivo,sans-serif;font-variation-settings:"wdth" 125;font-stretch:125%;font-weight:800;text-transform:uppercase;line-height:.9;letter-spacing:-.012em;overflow-wrap:normal;word-break:normal}
.h em{font-family:'Bodoni Moda',serif;font-style:italic;font-weight:500;text-transform:none;color:var(--gold);letter-spacing:-.01em;font-size:1.1em;line-height:.8;font-variation-settings:normal}
.on-bone .h em{color:var(--gold-deep)}
.sub{font-family:Archivo,sans-serif;font-variation-settings:"wdth" 100;font-weight:400;font-size:34px;line-height:1.3;letter-spacing:.005em}
.mono{font-family:'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:.14em;font-weight:500;font-size:22px}
.pill{display:inline-flex;align-items:center;gap:12px;padding:13px 24px 12px;border-radius:999px;background:var(--gold);color:var(--gold-ink);font-size:22px;white-space:nowrap}
.pill.ghost{background:rgba(11,21,16,.5);color:var(--bone);border:1.5px solid rgba(233,230,221,.6)}
.pill.felt{background:var(--felt);color:var(--bone)}
.logo{display:block;height:auto;filter:drop-shadow(0 2px 10px rgba(0,0,0,.35))}
.logo-ink{background:var(--felt);-webkit-mask:url(${src('logo')}) left center/contain no-repeat;mask:url(${src('logo')}) left center/contain no-repeat}
.abs{position:absolute}
.row{display:flex;align-items:center;justify-content:space-between}
.rule{height:2px;background:var(--gold);width:96px}
.on-bone{background:var(--bone-2);color:var(--felt)}
.on-bone .stage img{mix-blend-mode:multiply}
.on-gold{background:var(--gold);color:var(--felt)}
.on-gold .h em{color:var(--felt)}
`;

// ---------- templates (each returns inner HTML for .c) ----------
function tPosterDark(d, k, W, H) {
  return `<div class="c">${stage(k, W, H)}
  <div class="abs" style="inset:0;background:linear-gradient(180deg,rgba(11,21,16,.62) 0%,rgba(11,21,16,0) 20%,rgba(11,21,16,0) 40%,rgba(11,21,16,.78) 68%,rgba(11,21,16,.96) 100%)"></div>
  <div class="abs row" style="left:64px;right:64px;top:60px">${logo()}<span class="mono" style="color:var(--bone)">N° ${nn(d.day)} / 60</span></div>
  <div class="abs" style="left:64px;right:64px;bottom:64px">
    <span class="pill mono">${esc(d.asset.tag)}</span>
    <h1 class="h" data-fit="${W - 128},380,150,64" style="margin:30px 0 26px">${headline(d.asset.headline)}</h1>
    <p class="sub" style="max-width:820px;color:var(--bone)">${esc(d.asset.sub)}</p>
    <div class="row" style="margin-top:40px;border-top:1px solid rgba(233,230,221,.25);padding-top:24px"><span class="mono" style="font-size:19px;opacity:.75">teddyheadwear.com</span><span class="mono" style="font-size:19px;color:var(--gold)">A New Frontier</span></div>
  </div></div>`;
}
function tProduct(d, k, W, H) {
  const box = 1000, top = 150;
  return `<div class="c on-bone">
  <div class="abs" style="left:40px;top:${top}px;width:${box}px;height:${box * 0.78}px">${stage(k, box, box * 0.78, 'contain')}</div>
  <div class="abs row" style="left:64px;right:64px;top:60px">${logo(true)}<span class="mono" style="color:var(--felt)">N° ${nn(d.day)} / 60</span></div>
  <div class="abs" style="left:64px;right:64px;bottom:64px">
    <div class="row" style="align-items:flex-end;margin-bottom:22px"><span class="pill mono">${esc(d.asset.tag)}</span><span class="mono" style="font-size:19px;color:var(--muted)">100% wool · gold silk</span></div>
    <h1 class="h" data-fit="${W - 128},250,128,60" style="margin-bottom:22px">${headline(d.asset.headline)}</h1>
    <div class="row" style="border-top:1.5px solid var(--felt);padding-top:22px;align-items:flex-start;gap:40px"><p class="sub" style="font-size:30px;max-width:720px">${esc(d.asset.sub)}</p><span class="mono" style="font-size:19px;white-space:nowrap;padding-top:6px">teddyheadwear.com</span></div>
  </div></div>`;
}
function tQuote(d, k, W, H) {
  return `<div class="c" style="background:var(--felt)">
  <div class="abs" style="inset:0;opacity:.18;filter:grayscale(1) contrast(1.25)">${stage(k, W, H)}</div>
  <div class="abs" style="inset:0;background:radial-gradient(120% 80% at 30% 60%,rgba(18,40,28,0) 0%,rgba(11,21,16,.55) 100%)"></div>
  <div class="abs row" style="left:64px;right:64px;top:60px">${logo()}<span class="mono">N° ${nn(d.day)} / 60</span></div>
  <div class="abs" style="left:64px;right:64px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">
    <div style="font-family:'Bodoni Moda',serif;font-style:italic;color:var(--gold);font-size:220px;line-height:.6;height:110px">“</div>
    <h1 class="h" data-fit="${W - 128},640,168,70" style="margin:10px 0 40px">${headline(d.asset.headline)}</h1>
    <div class="rule"></div>
    <p class="sub" style="margin-top:28px;max-width:800px;font-size:36px;opacity:.92">${esc(d.asset.sub)}</p>
  </div>
  <div class="abs row" style="left:64px;right:64px;bottom:60px"><span class="pill mono">${esc(d.asset.tag)}</span><span class="mono" style="font-size:19px;opacity:.7">teddyheadwear.com</span></div>
  </div>`;
}
const keyLabel = k => {
  let m;
  if ((m = k.match(/^(cowboy|fedora)-(t|f|ny|la)-(cream|brown)$/))) return `${m[1]} · ${LETTER[m[2]]} · ${m[3]}`;
  return ({ 'apparel-crew': 'Saddle Crewneck', 'apparel-cord': 'Corduroy Snapback', 'apparel-rag': 'Silk Wild Rag', snapbacks: 'Teddy Trucker', tee: 'Script Tee', 'apparel-hoodie': 'Frontier Hoodie', 'apparel-tote': 'Canvas Tote', 'apparel-tee-bone': 'Monogram Tee' })[k] || k.replace(/-/g, ' ');
};
function tSplit(d, k1, k2, W, H) {
  const half = W / 2, bandH = 360, bandTop = (H - bandH) / 2 + 150;
  const pane = (k, x) => `<div class="abs ${isLight(k) ? 'on-bone' : ''}" style="left:${x}px;top:0;width:${half}px;height:${H}px;overflow:hidden;${isLight(k) ? 'background:' + (x ? 'var(--bone)' : 'var(--bone-2)') : ''}">
    ${isLight(k) ? `<div class="abs" style="left:0;top:110px;width:${half}px;height:${bandTop - 110}px">${stage(k, half, bandTop - 110, 'contain', '', 'zoom')}</div>` : stage(k, half, H)}
    <span class="mono abs" style="left:32px;bottom:44px;font-size:18px;color:${isLight(k) ? 'var(--felt)' : 'var(--bone)'}">${String.fromCharCode(65 + (x ? 1 : 0))} — ${esc(keyLabel(k))}</span></div>`;
  return `<div class="c">${pane(k1, 0)}${pane(k2, half)}
  <div class="abs" style="left:${half - 0.75}px;top:0;width:1.5px;height:${H}px;background:rgba(18,40,28,.25)"></div>
  <div class="abs row" style="left:56px;right:56px;top:56px">${isLight(k1) ? logo(true, 200) : logo(false, 200)}<span class="mono" style="color:${isLight(k2) ? 'var(--felt)' : 'var(--bone)'}">N° ${nn(d.day)}</span></div>
  <div class="abs" style="left:0;right:0;top:${bandTop}px;height:${bandH}px;background:var(--felt);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 60px;box-shadow:0 30px 60px rgba(11,21,16,.25)">
    <span class="pill mono">${esc(d.asset.tag)}</span>
    <h1 class="h" data-fit="${W - 120},170,124,56" style="margin:24px 0 16px;width:100%">${headline(d.asset.headline)}</h1>
    <p class="sub" style="font-size:27px;opacity:.85">${esc(d.asset.sub)}</p>
  </div></div>`;
}
function dots(k) {
  return (CALLOUTS[k] || []).map(([x, y, label], i) => `<div class="dot" style="left:${x * 100}%;top:${y * 100}%"><b>${i + 1}</b><span class="mono ${x > 0.62 ? 'lft' : ''}">${esc(label)}</span></div>`).join('');
}
const DOT_CSS = `.dot{position:absolute;width:0;height:0}.dot b{position:absolute;left:-26px;top:-26px;width:52px;height:52px;border-radius:50%;background:var(--gold);color:var(--gold-ink);font:600 22px 'IBM Plex Mono',monospace;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 10px rgba(229,168,35,.28),0 6px 20px rgba(0,0,0,.35)}
.dot span{position:absolute;left:44px;top:-19px;white-space:nowrap;background:rgba(11,21,16,.86);color:var(--bone);padding:9px 14px 8px;font-size:17px;border-left:2px solid var(--gold)}
.dot span.lft{left:auto;right:44px;border-left:0;border-right:2px solid var(--gold)}`;
function tDetail(d, k, W, H) {
  if (isLight(k)) {
    const bw = W, bh = 900;
    return `<div class="c on-bone"><style>${DOT_CSS}</style>
    <div class="abs" style="left:0;top:80px;width:${bw}px;height:${bh}px">${stage(k, bw, bh, 'contain', dots(k))}</div>
    <div class="abs row" style="left:64px;right:64px;top:60px">${logo(true)}<span class="mono">N° ${nn(d.day)} / 60</span></div>
    <div class="abs" style="left:64px;right:64px;bottom:64px"><span class="pill mono">${esc(d.asset.tag)}</span>
      <h1 class="h" data-fit="${W - 128},200,120,56" style="margin:24px 0 18px">${headline(d.asset.headline)}</h1>
      <p class="sub" style="font-size:30px">${esc(d.asset.sub)}</p></div></div>`;
  }
  return `<div class="c"><style>${DOT_CSS}</style>${stage(k, W, H, 'cover', dots(k))}
  <div class="abs" style="inset:0;background:linear-gradient(180deg,rgba(11,21,16,.6) 0%,rgba(11,21,16,0) 18%,rgba(11,21,16,0) 58%,rgba(11,21,16,.9) 84%,rgba(11,21,16,.97) 100%);pointer-events:none"></div>
  <div class="abs row" style="left:64px;right:64px;top:60px">${logo()}<span class="mono">N° ${nn(d.day)} / 60</span></div>
  <div class="abs" style="left:64px;right:64px;bottom:64px"><span class="pill mono">${esc(d.asset.tag)}</span>
    <h1 class="h" data-fit="${W - 128},230,130,56" style="margin:24px 0 18px">${headline(d.asset.headline)}</h1>
    <p class="sub" style="font-size:31px">${esc(d.asset.sub)}</p></div></div>`;
}
// Reel cover: 1080x1920. Text only between y=220 and y=1500; headline inside the middle third (640–1280).
function tCover(d, k, W, H) {
  const tagRow = `<div class="abs row" style="left:72px;right:72px;top:250px">${isLight(k) ? logo(true, 250) : logo(false, 250)}<span class="pill mono ${isLight(k) ? 'felt' : 'ghost'}" style="font-size:21px">▶ Reel</span></div>`;
  if (isLight(k)) {
    return `<div class="c on-bone">
    <div class="abs" style="left:0;top:1080px;width:${W}px;height:760px">${stage(k, W, 760, 'contain')}</div>
    ${tagRow}
    <div class="abs" style="left:72px;right:72px;top:600px;height:480px;display:flex;flex-direction:column;justify-content:center">
      <span class="mono" style="color:var(--saddle)">Day ${nn(d.day)} — ${esc(d.asset.tag)}</span>
      <h1 class="h" data-fit="${W - 144},300,150,70" style="margin:22px 0 20px">${headline(d.asset.headline)}</h1>
      <p class="sub" style="font-size:34px">${esc(d.asset.sub)}</p></div></div>`;
  }
  return `<div class="c">${stage(k, W, H)}
  <div class="abs" style="inset:0;background:linear-gradient(180deg,rgba(11,21,16,.55) 0%,rgba(11,21,16,.05) 20%,rgba(11,21,16,.35) 34%,rgba(11,21,16,.7) 50%,rgba(11,21,16,.35) 68%,rgba(11,21,16,.15) 80%,rgba(11,21,16,.6) 100%)"></div>
  ${tagRow}
  <div class="abs" style="left:72px;right:72px;top:640px;height:640px;display:flex;flex-direction:column;justify-content:center">
    <span class="mono" style="color:var(--gold)">Day ${nn(d.day)} — ${esc(d.asset.tag)}</span>
    <h1 class="h" data-fit="${W - 144},360,170,72" style="margin:24px 0 24px;text-shadow:0 4px 30px rgba(0,0,0,.35)">${headline(d.asset.headline)}</h1>
    <div class="rule" style="margin-bottom:24px"></div>
    <p class="sub" style="font-size:36px;text-shadow:0 2px 16px rgba(0,0,0,.5)">${esc(d.asset.sub)}</p></div></div>`;
}

function mainPhoto(d) {
  let k = fileFor(d.asset.photo);
  if (SCENE_SWAP[d.day] && files.has(SCENE_SWAP[d.day])) k = SCENE_SWAP[d.day];
  return k;
}
function mainHTML(d) {
  const reel = d.format === 'Reel', W = 1080, H = reel ? 1920 : 1350;
  const k = mainPhoto(d), t = d.asset.template;
  let body;
  if (reel || t === 'cover') body = reel ? tCover(d, k, W, H) : tPosterDark(d, k, W, H);
  else if (t === 'poster') body = isLight(k) ? tProduct(d, k, W, H) : tPosterDark(d, k, W, H);
  else if (t === 'product') body = isLight(k) ? tProduct(d, k, W, H) : tPosterDark(d, k, W, H);
  else if (t === 'quote') body = tQuote(d, k, W, H);
  else if (t === 'split') body = tSplit(d, k, fileFor(d.asset.photo2 || d.asset.photo), W, H);
  else if (t === 'detail') body = tDetail(d, k, W, H);
  else body = tPosterDark(d, k, W, H);
  return { W, H, body };
}

// ---------- carousel slides ----------
function splitOn(s) {
  const lines = String(s).split('\n').map(x => x.trim()).filter(Boolean);
  let num = '';
  const m = lines[0] && lines[0].match(/^(\d{2})\s+(.*)$/);
  if (m) { num = m[1]; lines[0] = m[2]; }
  return { num, head: lines[0] || '', rest: lines.slice(1) };
}
function slideHTML(d, i, n, entry, photoKey) {
  const W = 1080, H = 1350, { num, head, rest } = splitOn(entry.onscreen || d.asset.headline);
  const counter = `<span class="mono">${nn(i)} / ${nn(n)}</span>`;
  const restHTML = rest.map(r => `<p class="sub" style="font-size:38px;margin-top:10px">${esc(r)}</p>`).join('');
  if (i === n) { // CTA slide
    return `<div class="c on-gold">
      <div class="abs row" style="left:64px;right:64px;top:60px">${logo(true)}${counter}</div>
      <div class="abs" style="left:64px;right:64px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">
        <h1 class="h" data-fit="${W - 128},520,140,60" style="margin-bottom:24px">${headline(head)}</h1>${restHTML}
        <div style="height:2px;background:var(--felt);width:96px;margin:40px 0"></div>
        <span class="pill mono felt" style="align-self:flex-start;font-size:24px;padding:18px 30px">${esc(d.cta)}</span></div>
      <div class="abs row" style="left:64px;right:64px;bottom:60px"><span class="mono" style="font-size:19px">teddyheadwear.com</span><span class="mono" style="font-size:19px">Save · Share</span></div></div>`;
  }
  if (i % 2 === 0) { // photo-led
    const k = photoKey;
    if (isLight(k)) {
      return `<div class="c on-bone">
        <div class="abs" style="left:40px;top:120px;width:1000px;height:820px">${stage(k, 1000, 820, 'contain')}</div>
        <div class="abs row" style="left:64px;right:64px;top:60px">${logo(true, 190)}${counter}</div>
        <div class="abs" style="left:64px;right:64px;bottom:72px">${num ? `<span class="mono" style="color:var(--saddle)">Detail ${num}</span>` : ''}
          <h1 class="h" data-fit="${W - 128},250,100,48" style="margin-top:14px">${headline(head)}</h1>${restHTML.replace(/font-size:38px/g, 'font-size:34px')}</div></div>`;
    }
    return `<div class="c">${stage(k, W, H)}
      <div class="abs" style="inset:0;background:linear-gradient(180deg,rgba(11,21,16,.5) 0%,rgba(11,21,16,0) 18%,rgba(11,21,16,0) 50%,rgba(11,21,16,.9) 85%,rgba(11,21,16,.96) 100%)"></div>
      <div class="abs row" style="left:64px;right:64px;top:60px">${logo(false, 190)}${counter}</div>
      <div class="abs" style="left:64px;right:64px;bottom:72px">${num ? `<span class="mono" style="color:var(--gold)">Detail ${num}</span>` : ''}
        <h1 class="h" data-fit="${W - 128},300,110,48" style="margin-top:14px">${headline(head)}</h1>${restHTML}</div></div>`;
  }
  // typographic
  const bone = (i % 4 === 1);
  return `<div class="c ${bone ? 'on-bone' : ''}">
    <div class="abs row" style="left:64px;right:64px;top:60px">${logo(bone, 190)}${counter}</div>
    <div class="abs" style="right:40px;bottom:-60px;font-family:'Bodoni Moda',serif;font-style:italic;font-size:560px;line-height:1;color:${bone ? 'rgba(156,112,68,.13)' : 'rgba(229,168,35,.09)'}">${num || nn(i)}</div>
    <div class="abs" style="left:64px;right:64px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">
      <span class="mono" style="color:${bone ? 'var(--saddle)' : 'var(--gold)'};margin-bottom:30px">${esc(d.asset.tag)}${num ? ' — ' + num : ''}</span>
      <h1 class="h" data-fit="${W - 128},620,180,56">${headline(head)}</h1>
      <div class="rule" style="margin:40px 0 10px;${bone ? 'background:var(--felt)' : ''}"></div>${restHTML}</div>
    <div class="abs row" style="left:64px;right:64px;bottom:60px"><span class="mono" style="font-size:19px;opacity:.7">${esc(d.title)}</span><span class="mono" style="font-size:19px;opacity:.7">Swipe →</span></div></div>`;
}

function page(W, H, body) {
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,300..900;1,62..125,300..900&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..700&family=IBM+Plex+Mono:wght@400;500;600&family=Pinyon+Script&display=block">
<style>${CSS(W, H)}</style></head><body>${body}</body></html>`;
}

const FIT_JS = async () => {
  await Promise.all([
    document.fonts.load('800 100px Archivo'), document.fonts.load('italic 500 100px "Bodoni Moda"'),
    document.fonts.load('500 20px "IBM Plex Mono"'), document.fonts.load('40px "Pinyon Script"'),
  ]);
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.complete ? (i.decode ? i.decode().catch(() => {}) : 0) : new Promise(r => { i.onload = i.onerror = r; })));
  for (const el of document.querySelectorAll('[data-fit]')) {
    const [maxW, maxH, start, min] = el.dataset.fit.split(',').map(Number);
    el.style.width = maxW + 'px';
    let s = start; el.style.fontSize = s + 'px';
    while (s > min && (el.scrollWidth > maxW + 1 || el.offsetHeight > maxH)) { s -= 2; el.style.fontSize = s + 'px'; }
  }
  const bad = [...document.images].filter(i => !i.naturalWidth).map(i => i.src);
  return { bad, fonts: document.fonts.check('800 20px Archivo') && document.fonts.check('italic 20px "Bodoni Moda"') };
};

async function shot(pg, W, H, body, outWebp, size) {
  const html = join(TMP, 'p.html');
  writeFileSync(html, page(W, H, body));
  await pg.setViewportSize({ width: W, height: H });
  await pg.goto('file://' + html, { waitUntil: 'networkidle' });
  const r = await pg.evaluate(FIT_JS);
  if (r.bad.length || !r.fonts) console.warn('  WARN', outWebp, JSON.stringify(r));
  const png = join(TMP, 'p.png');
  await pg.screenshot({ path: png, clip: { x: 0, y: 0, width: W, height: H } });
  execFileSync('convert', [png, '-resize', size, '-quality', '80', outWebp]);
  unlinkSync(png);
}

const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const ctx = await browser.newContext({ deviceScaleFactor: 1, ignoreHTTPSErrors: true });
const pg = await ctx.newPage();
let count = 0;
for (const d of plan.days) {
  if (only.length && !only.includes(d.day)) continue;
  const { W, H, body } = mainHTML(d);
  const main = join(OUT, `day-${nn(d.day)}.webp`);
  await shot(pg, W, H, body, main, d.format === 'Reel' ? '720x1280!' : '864x1080!');
  count++;
  if (d.format === 'Carousel') {
    const n = Math.min(d.script.length, 8);
    const used = new Map([[mainPhoto(d), 0.4]]);
    copyFileSync(main, join(OUT, `day-${nn(d.day)}-s1.webp`)); count++;
    for (let i = 2; i <= n; i++) {
      const e = d.script[i - 1];
      const pk = (i % 2 === 0 && i !== n) ? pickPhoto(`${e.shot} ${e.onscreen}`, d.pillar, used) : null;
      await shot(pg, 1080, 1350, slideHTML(d, i, n, e, pk), join(OUT, `day-${nn(d.day)}-s${i}.webp`), '864x1080!');
      count++;
    }
  }
  console.log('day', d.day, 'done');
}
await browser.close();
console.log('rendered', count, 'images');
