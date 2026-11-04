// Renders a 1200x630 hero/OG image for every Journal post (and the index)
// into public/blog/. Each image is a HUD-style composition in the studio's
// gold and cyan: a motif drawn for the topic, seeded by the slug so every
// post gets its own variation, over the studio's office photograph.
//   node scripts/blog-images.cjs            # all posts
//   node scripts/blog-images.cjs <slug>...  # just these
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "content/blog");
const OUT = path.join(ROOT, "public/blog");
const OFFICE = "data:image/webp;base64," + fs.readFileSync(path.join(ROOT, "public/art/studio-office.webp")).toString("base64");

function seeded(str) {
  let h = 2166136261;
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

const G = "#e3c27a";
const C = "#8fe6f2";

// Each motif draws into a 560x560 box centred at (280,280).
const MOTIFS = {
  orbit(r) {
    let s = `<circle cx="280" cy="280" r="34" fill="url(#core)"/>`;
    for (let i = 0; i < 4; i++) {
      const rx = 90 + i * 52, ry = rx * (0.32 + r() * 0.2), rot = -30 + r() * 60;
      s += `<ellipse cx="280" cy="280" rx="${rx}" ry="${ry}" transform="rotate(${rot} 280 280)" fill="none" stroke="${i % 2 ? C : G}" stroke-opacity="${0.75 - i * 0.12}" stroke-width="1.6"/>`;
      const a = r() * Math.PI * 2;
      const x = 280 + Math.cos(a) * rx, y = 280 + Math.sin(a) * ry;
      s += `<g transform="rotate(${rot} 280 280)"><circle cx="${x}" cy="${y}" r="${5 + r() * 5}" fill="${i % 2 ? C : G}" filter="url(#glow)"/></g>`;
    }
    return s;
  },
  network(r) {
    const pts = Array.from({ length: 16 }, () => [60 + r() * 440, 60 + r() * 440]);
    let s = "";
    pts.forEach((p, i) => pts.slice(i + 1).forEach((q) => {
      const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (d < 190) s += `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${C}" stroke-opacity="${0.55 - d / 450}" stroke-width="1.2"/>`;
    }));
    pts.forEach((p, i) => (s += `<circle cx="${p[0]}" cy="${p[1]}" r="${i === 0 ? 14 : 4 + r() * 5}" fill="${i % 4 ? C : G}" filter="url(#glow)"/>`));
    return s;
  },
  radar(r) {
    let s = "";
    for (let i = 1; i <= 5; i++) s += `<circle cx="280" cy="280" r="${i * 48}" fill="none" stroke="${C}" stroke-opacity="${0.5 - i * 0.06}" stroke-width="1.2"/>`;
    s += `<line x1="40" y1="280" x2="520" y2="280" stroke="${C}" stroke-opacity=".25"/><line x1="280" y1="40" x2="280" y2="520" stroke="${C}" stroke-opacity=".25"/>`;
    const a = r() * 360;
    s += `<path d="M280 280 L${280 + 240 * Math.cos((a * Math.PI) / 180)} ${280 + 240 * Math.sin((a * Math.PI) / 180)} A240 240 0 0 0 ${280 + 240 * Math.cos(((a - 50) * Math.PI) / 180)} ${280 + 240 * Math.sin(((a - 50) * Math.PI) / 180)} Z" fill="url(#sweep)"/>`;
    for (let i = 0; i < 7; i++) {
      const d = 50 + r() * 180, t = r() * Math.PI * 2;
      s += `<circle cx="${280 + d * Math.cos(t)}" cy="${280 + d * Math.sin(t)}" r="${3 + r() * 5}" fill="${i ? C : G}" filter="url(#glow)"/>`;
    }
    return s;
  },
  layers(r) {
    let s = "";
    for (let i = 0; i < 6; i++) {
      const y = 380 - i * 52, w = 360 - i * 18 + r() * 20;
      s += `<path d="M${280 - w / 2} ${y} L280 ${y - 70} L${280 + w / 2} ${y} L280 ${y + 70} Z" fill="${i === 5 ? G : C}" fill-opacity="${0.04 + i * 0.03}" stroke="${i === 5 ? G : C}" stroke-opacity="${0.35 + i * 0.1}" stroke-width="1.4"/>`;
    }
    return s;
  },
  bars(r) {
    let s = `<line x1="60" y1="470" x2="500" y2="470" stroke="${G}" stroke-opacity=".5"/>`;
    let pts = "";
    for (let i = 0; i < 9; i++) {
      const h = 60 + r() * 260 + i * 12, x = 72 + i * 48;
      s += `<rect x="${x}" y="${470 - h}" width="30" height="${h}" rx="3" fill="url(#bar)" stroke="${C}" stroke-opacity=".5"/>`;
      pts += `${x + 15},${470 - h - 20} `;
    }
    s += `<polyline points="${pts}" fill="none" stroke="${G}" stroke-width="2.4" filter="url(#glow)"/>`;
    return s;
  },
  grid(r) {
    let s = "";
    for (let i = 0; i <= 10; i++) {
      s += `<line x1="${60 + i * 44}" y1="60" x2="${60 + i * 44}" y2="500" stroke="${C}" stroke-opacity=".18"/>`;
      s += `<line x1="60" y1="${60 + i * 44}" x2="500" y2="${60 + i * 44}" stroke="${C}" stroke-opacity=".18"/>`;
    }
    for (let i = 0; i < 14; i++) {
      const x = 60 + Math.floor(r() * 10) * 44, y = 60 + Math.floor(r() * 10) * 44;
      s += `<rect x="${x + 4}" y="${y + 4}" width="36" height="36" rx="4" fill="${i % 5 ? C : G}" fill-opacity="${0.12 + r() * 0.3}" stroke="${i % 5 ? C : G}" stroke-opacity=".6"/>`;
    }
    s += `<circle cx="280" cy="280" r="10" fill="${G}" filter="url(#glow)"/>`;
    return s;
  },
  beam(r) {
    let s = "";
    for (let i = 0; i < 9; i++) {
      const y = 90 + i * 48 + r() * 10;
      s += `<path d="M40 280 L520 ${y}" stroke="${i % 3 ? C : G}" stroke-opacity="${0.2 + r() * 0.5}" stroke-width="${1 + r() * 2}"/>`;
      s += `<circle cx="520" cy="${y}" r="${3 + r() * 4}" fill="${i % 3 ? C : G}" filter="url(#glow)"/>`;
    }
    s += `<circle cx="40" cy="280" r="22" fill="url(#core)"/>`;
    return s;
  },
  nodes(r) {
    let s = `<circle cx="280" cy="280" r="42" fill="url(#core)"/>`;
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.3, x = 280 + Math.cos(a) * 150, y = 280 + Math.sin(a) * 150;
      s += `<line x1="280" y1="280" x2="${x}" y2="${y}" stroke="${G}" stroke-opacity=".55" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="20" fill="#0b1117" stroke="${C}" stroke-width="1.6"/>`;
      for (let j = 0; j < 3; j++) {
        const b = a + (j - 1) * 0.42, x2 = 280 + Math.cos(b) * 235, y2 = 280 + Math.sin(b) * 235;
        s += `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${C}" stroke-opacity=".35"/><circle cx="${x2}" cy="${y2}" r="5" fill="${C}" filter="url(#glow)"/>`;
      }
    }
    return s;
  },
  rings(r) {
    let s = "";
    for (let i = 1; i <= 6; i++) s += `<circle cx="280" cy="300" r="${i * 38}" fill="none" stroke="${i === 3 ? G : C}" stroke-opacity="${0.6 - i * 0.07}" stroke-width="${i === 3 ? 2.2 : 1.2}" stroke-dasharray="${i % 2 ? "0" : "4 8"}"/>`;
    s += `<path d="M280 150 C230 150 200 190 200 230 C200 290 280 360 280 360 C280 360 360 290 360 230 C360 190 330 150 280 150 Z" fill="${G}" fill-opacity=".16" stroke="${G}" stroke-width="2.4" filter="url(#glow)"/><circle cx="280" cy="228" r="26" fill="none" stroke="${G}" stroke-width="2.4"/>`;
    for (let i = 0; i < 6; i++) {
      const a = r() * Math.PI * 2, d = 90 + r() * 120;
      s += `<circle cx="${280 + Math.cos(a) * d}" cy="${300 + Math.sin(a) * d}" r="4" fill="${C}" filter="url(#glow)"/>`;
    }
    return s;
  },
  wave(r) {
    let s = "";
    for (let k = 0; k < 6; k++) {
      let d = `M40 ${280 + k * 8}`;
      const amp = 40 + r() * 70, f = 0.012 + r() * 0.01, ph = r() * 6;
      for (let x = 40; x <= 520; x += 8) d += ` L${x} ${280 + k * 14 - 35 + Math.sin(x * f + ph) * amp * (1 - k * 0.1)}`;
      s += `<path d="${d}" fill="none" stroke="${k ? C : G}" stroke-opacity="${k ? 0.55 - k * 0.07 : 0.95}" stroke-width="${k ? 1.4 : 2.6}" ${k ? "" : 'filter="url(#glow)"'}/>`;
    }
    return s;
  },
};

const escHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function page({ title, category, motif, seed, kicker }) {
  const r = seeded(seed);
  const art = (MOTIFS[motif] || MOTIFS.orbit)(r);
  const size = title.length > 70 ? 50 : title.length > 52 ? 58 : 66;
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&family=JetBrains+Mono:wght@500&family=DM+Sans:wght@500&display=swap" rel="stylesheet">
<style>
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;background:#04070a;color:#f1e7cb;font-family:'DM Sans'}
.bg{position:absolute;inset:0;background:url(${OFFICE}) center/cover;filter:blur(6px) brightness(.44) saturate(.85);transform:scale(1.06)}
.shade{position:absolute;inset:0;background:radial-gradient(700px 500px at 900px 315px,#0e2a3355,transparent 70%),linear-gradient(90deg,#04070af2 0%,#04070acc 45%,#04070a55 100%)}
.frame{position:absolute;inset:22px;border:1px solid #e3c27a40;border-radius:14px}
.frame:before,.frame:after{content:"";position:absolute;width:34px;height:34px;border:2px solid #e3c27a}
.frame:before{top:-2px;left:-2px;border-right:0;border-bottom:0;border-radius:14px 0 0 0}
.frame:after{bottom:-2px;right:-2px;border-left:0;border-top:0;border-radius:0 0 14px 0}
svg{position:absolute;right:20px;top:15px;width:600px;height:600px;filter:drop-shadow(0 0 18px #8fe6f233)}
.halo{position:absolute;right:70px;top:65px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,#e3c27a1f,#8fe6f20d 45%,transparent 70%)}
.text{position:absolute;left:76px;top:0;bottom:0;width:640px;display:flex;flex-direction:column;justify-content:center;gap:22px}
.cat{font-family:'JetBrains Mono';font-size:17px;letter-spacing:.22em;text-transform:uppercase;color:#8fe6f2}
h1{font-family:'Cormorant Garamond';font-weight:500;font-size:${size}px;line-height:1.04;letter-spacing:-.005em;text-shadow:0 2px 30px #000}
.by{display:flex;align-items:center;gap:14px;font-family:'JetBrains Mono';font-size:15px;letter-spacing:.2em;color:#e3c27a}
.by i{width:46px;height:1px;background:#e3c27a}
.scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,#ffffff05 0 1px,transparent 1px 4px)}
</style></head><body>
<div class="bg"></div><div class="shade"></div><div class="scan"></div><div class="halo"></div>
<svg viewBox="0 0 560 560"><defs>
<radialGradient id="core"><stop offset="0" stop-color="#fff6dc"/><stop offset=".35" stop-color="${G}"/><stop offset="1" stop-color="${G}" stop-opacity="0"/></radialGradient>
<radialGradient id="sweep" cx="0" cy="0" r="1"><stop offset="0" stop-color="${C}" stop-opacity=".45"/><stop offset="1" stop-color="${C}" stop-opacity="0"/></radialGradient>
<linearGradient id="bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C}" stop-opacity=".5"/><stop offset="1" stop-color="${C}" stop-opacity=".04"/></linearGradient>
<filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>${art}</svg>
<div class="frame"></div>
<div class="text"><span class="cat">${escHtml(kicker || category)}</span><h1>${escHtml(title)}</h1><span class="by"><i></i>TYLER McGRATH · THE JOURNAL</span></div>
</body></html>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const only = process.argv.slice(2);
  const jobs = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(DIR, f), "utf8").replace(/\r/g, "");
      const meta = JSON.parse(/^---\n([\s\S]*?)\n---\n/.exec(raw)[1]);
      const slug = f.replace(/\.md$/, "");
      return { slug, title: meta.imageTitle || meta.metaTitle, category: meta.category, motif: meta.imageMotif, seed: slug };
    })
    .filter((j) => !only.length || only.includes(j.slug));
  if (!only.length) jobs.push({ slug: "journal-og", title: "Get found in Google and in the answer.", kicker: "The Journal · SEO, GEO & AEO guides", motif: "orbit", seed: "journal" });

  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const j of jobs) {
    await pg.setContent(page(j), { waitUntil: "networkidle" });
    await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: path.join(OUT, `${j.slug}.jpg`), type: "jpeg", quality: 86 });
    console.log("rendered", j.slug);
  }
  await browser.close();
})();
