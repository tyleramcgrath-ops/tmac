#!/usr/bin/env node
// SERP Quake: a seismograph for Google's algorithm.
//
//   quake scan                 one live sweep of every station (needs SERPER_API_KEY or SERPAPI_KEY)
//   quake watch [--every 6h]   scan forever on a cadence and serve the live dashboard
//   quake serve [--port 8787]  serve the dashboard for the data already collected
//   quake status               print the latest reading, with the arithmetic shown
//   quake calibrate            compare magnitudes inside vs outside Google-confirmed updates
//   quake build [--out FILE]   write a standalone dashboard.html with the data embedded
//   quake simulate             fill a data dir with a synthetic 60-day seismogram (no keys needed)
//
// Common flags: --data DIR (default ./data), --stations FILE (default stations.json)

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const store = require('../lib/store');
const seismo = require('../lib/seismo');
const { configuredProviders } = require('../lib/providers');
const { fetchConfirmedUpdates } = require('../lib/google-status');
const { liveSweep, simulate } = require('../lib/run');
const report = require('../lib/report');
const alert = require('../lib/alert');

const ROOT = path.join(__dirname, '..');

function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) out[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) out[k] = argv[++i];
      else out[k] = true;
    } else out._.push(a);
  }
  return out;
}

function loadStations(file) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  return j.stations.map((s) => ({ gl: j.gl, hl: j.hl, ...s }));
}

function hours(spec) {
  const m = String(spec).match(/^(\d+(?:\.\d+)?)(m|h|d)?$/);
  if (!m) throw new Error(`bad interval: ${spec}`);
  const n = parseFloat(m[1]);
  return m[2] === 'm' ? n / 60 : m[2] === 'd' ? n * 24 : n;
}

function modeOf(dir) {
  try { return fs.readFileSync(path.join(dir, 'MODE'), 'utf8').trim(); } catch (e) { return 'live'; }
}

async function refreshConfirmed(dir) {
  try {
    const list = await fetchConfirmedUpdates();
    store.writeConfirmed(dir, list);
    return list;
  } catch (e) {
    console.error('Could not refresh Google-confirmed updates:', e.message);
    return store.readConfirmed(dir);
  }
}

async function scan(opts) {
  const dir = opts.data;
  if (modeOf(dir) === 'simulated') throw new Error(`${dir} holds simulated data; point --data somewhere else for live scans.`);
  const providers = configuredProviders();
  if (!providers.length) throw new Error('No SERP provider configured. Set SERPER_API_KEY (https://serper.dev) and/or SERPAPI_KEY (https://serpapi.com).');
  const stations = loadStations(opts.stations);
  const state = store.load(dir);
  const t = new Date().toISOString();
  const sweep = await liveSweep(state, stations, providers, t, { noRefetch: !!opts['no-refetch'] });
  if (sweep.instrument.errors === stations.length) {
    // Nothing was read (bad key, out of credits, provider down): don't record a
    // sweep that measured nothing, and fail so a scheduler shows it.
    const reason = Object.values(sweep.stations).map((x) => x.reason).find(Boolean);
    throw new Error(`Every station failed to read (${reason}). Nothing recorded.`);
  }
  const messages = alert.messagesFor(sweep, state);
  store.save(dir, state, [sweep]);
  await refreshConfirmed(dir);
  await alert.send(messages);
  printSweep(sweep, providers.map((p) => p.name));
  for (const m of messages) console.log('ALERT', m.text);
  return sweep;
}

function printSweep(s, providers) {
  const i = s.instrument;
  if (s.magnitude == null) {
    console.log(`${s.t}  seeded ${i.seeded} stations (first reading — magnitude starts on the next sweep)`);
    return;
  }
  const c = seismo.classify(s.m24 != null ? s.m24 : s.magnitude);
  console.log(`${s.t}  M24 ${fmt(s.m24)} (${c.name})  this sweep M ${fmt(s.magnitude)}  breadth ${pct(s.breadth)}  STA/LTA ${fmt(s.staLta)}`
    + `  measured ${i.measured}/${i.stations}, rejected ${i.rejected}, poison caught ${i.poisonCaught}, errors ${i.errors}`
    + (providers ? `  via ${providers.join('+')}` : '')
    + (s.calibrating ? '  [calibrating]' : '') + (s.inEvent ? '  [EVENT]' : '') + (i.interference ? '  [INTERFERENCE]' : ''));
}

const fmt = (x) => (x == null ? '—' : x.toFixed(2));
const pct = (x) => (x == null ? '—' : Math.round(x * 100) + '%');

function buildPayload(opts) {
  const state = store.load(opts.data);
  const stations = loadStations(opts.stations);
  return report.payload({ state, stations, confirmed: store.readConfirmed(opts.data), mode: modeOf(opts.data) });
}

function dashboardHtml(data) {
  const tpl = fs.readFileSync(path.join(ROOT, 'dashboard', 'index.html'), 'utf8');
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return tpl.replace('<script id="quake-data" type="application/json">null</script>', `<script id="quake-data" type="application/json">${json}</script>`);
}

function serve(opts) {
  const port = Number(opts.port || 8787);
  const server = http.createServer((req, res) => {
    try {
      if (req.url.startsWith('/data.json')) {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(buildPayload(opts)));
      } else if (req.url === '/' || req.url.startsWith('/?')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(fs.readFileSync(path.join(ROOT, 'dashboard', 'index.html')));
      } else { res.writeHead(404); res.end('not found'); }
    } catch (e) { res.writeHead(500); res.end(e.message); }
  });
  server.listen(port, () => console.log(`Seismograph at http://localhost:${port}  (data: ${path.resolve(opts.data)})`));
  return server;
}

async function watch(opts) {
  const every = hours(opts.every || process.env.QUAKE_EVERY || '6h');
  serve(opts);
  const tick = async () => {
    try { await scan(opts); } catch (e) { console.error(new Date().toISOString(), 'sweep failed:', e.message); }
  };
  // Don't double-read right after a restart: wait out the rest of the cadence.
  const sweeps = store.readSweeps(opts.data);
  const last = sweeps.length ? Date.parse(sweeps[sweeps.length - 1].t) : 0;
  const wait = Math.max(0, last + every * 3600e3 - Date.now());
  console.log(`Sweeping every ${every}h; next sweep in ${Math.round(wait / 60000)} min.`);
  setTimeout(function loop() { tick().finally(() => setTimeout(loop, every * 3600e3)); }, wait);
}

function status(opts) {
  const data = buildPayload(opts);
  const e = data.explain;
  if (!e) { console.log('No magnitude yet: a station needs two readings. Run `quake scan` again after the next cadence.'); return; }
  const W = data.weights;
  const lines = [];
  lines.push(`SERP Quake — ${e.t}${data.mode === 'simulated' ? '  (SIMULATED DATA)' : ''}`);
  lines.push(`  Magnitude (24h): M ${fmt(e.m24)}  → ${e.category.name}: ${e.category.note}`);
  lines.push(`  This sweep:      M ${fmt(e.magnitude)}${e.calibrating ? '  (instrument still calibrating — no events can trigger yet)' : ''}`);
  lines.push('');
  lines.push('  1. Ground motion per keyword (median across stations this sweep):');
  lines.push(`       rank shift (1 − RBO, p=${data.rboP})  ${fmt(e.components.rank)}  × ${W.rank}`);
  lines.push(`       click share moved (CTR-weighted)   ${fmt(e.components.traffic)}  × ${W.traffic}`);
  lines.push(`       domain turnover (Jaccard)          ${fmt(e.components.domain)}  × ${W.domain}`);
  lines.push(`       SERP-feature change (Jaccard)      ${fmt(e.components.feature)}  × ${W.feature}`);
  if (e.typical) lines.push(`     typical station "${e.typical.keyword}": amplitude ${fmt(e.typical.amplitude)} vs its normal ${fmt(e.typical.baseline)} = ${fmt(e.typical.ratio)}x`);
  for (const s of e.mostShaken) lines.push(`     most shaken "${s.keyword}" (${s.vertical}): ${fmt(s.amplitude)} vs ${fmt(s.baseline)} = ${fmt(s.ratio)}x`);
  lines.push(`  2. Network shaking: interquartile mean of ratios ${fmt(e.rawR)} ÷ network quiet level ${fmt(e.R0)} = R ${fmt(e.R)}`);
  lines.push(`  3. Magnitude: M = 2 + 3·log2(R) = 2 + 3·log2(${fmt(e.R)}) = ${fmt(e.magnitude)}   (every +3 = shaking doubled)`);
  lines.push(`  4. 24h average R ${fmt(e.sta)} vs 14-day quiet average ${fmt(e.lta)}: STA/LTA ${fmt(e.staLta)} (event trigger ≥ ${data.config.triggerOn}, ends < ${data.config.triggerOff})`);
  lines.push(`     breadth ${pct(e.breadth)} of keywords at ≥2x normal (trigger ≥ ${pct(data.config.triggerBreadth)})`);
  const faults = Object.entries(e.faults).sort((a, b) => b[1].median - a[1].median).map(([v, f]) => `${v} ${fmt(f.median)}x${f.active ? '*' : ''}`);
  lines.push(`     fault lines (median ratio, * = active): ${faults.join(', ')}`);
  const i = e.instrument;
  lines.push(`  5. Instrument: ${i.measured}/${i.stations} measured, ${i.rejected} rejected, ${i.poisonCaught} poisoned readings caught by re-fetch, ${i.errors} errors${i.interference ? '  — INTERFERENCE' : ''}`);
  lines.push('');
  const open = data.events.find((x) => x.ongoing);
  if (open) lines.push(`  EVENT IN PROGRESS since ${open.start}: peak M ${fmt(open.peak)} (${open.category})${open.confirmed.length ? ' — Google confirmed: ' + open.confirmed.join(', ') : ' — not (yet) confirmed by Google'}`);
  for (const ev of data.events.filter((x) => !x.ongoing).slice(-5)) lines.push(`  past event ${ev.start.slice(0, 10)} → ${ev.end.slice(0, 10)}: peak M ${fmt(ev.peak)} (${ev.category})${ev.confirmed.length ? ' — ' + ev.confirmed.join(', ') : ' — unconfirmed'}`);
  console.log(lines.join('\n'));
}

async function main() {
  const o = args(process.argv.slice(2));
  const cmd = o._[0] || 'help';
  o.data = o.data || process.env.QUAKE_DATA || path.join(process.cwd(), 'data');
  o.stations = o.stations || path.join(ROOT, 'stations.json');

  if (cmd === 'scan') await scan(o);
  else if (cmd === 'watch') await watch(o);
  else if (cmd === 'serve') serve(o);
  else if (cmd === 'status') status(o);
  else if (cmd === 'calibrate') console.log(JSON.stringify(report.calibration(store.load(o.data), store.readConfirmed(o.data)), null, 2));
  else if (cmd === 'build') {
    const out = o.out || path.join(o.data, 'index.html');
    fs.writeFileSync(out, dashboardHtml(buildPayload(o)));
    console.log('wrote', out);
  } else if (cmd === 'simulate') {
    const dir = o.data;
    if (fs.existsSync(path.join(dir, 'sweeps.jsonl')) && modeOf(dir) !== 'simulated') throw new Error(`${dir} already holds live data; pick an empty --data dir.`);
    fs.rmSync(dir, { recursive: true, force: true });
    const stations = loadStations(o.stations);
    const { state, confirmed } = await simulate(stations, undefined, Number(o.seed || 42));
    const open = state.events.find((e) => e.ongoing);
    if (open) { state.events = state.events.filter((e) => !e.ongoing); state.event = open; }
    store.save(dir, state, state.sweeps);
    store.writeConfirmed(dir, confirmed);
    fs.writeFileSync(path.join(dir, 'MODE'), 'simulated\n');
    console.log(`Simulated ${state.sweeps.length} sweeps × ${stations.length} stations into ${dir}; ${state.events.length} events.`);
    for (const e of state.events) console.log(`  ${e.start} → ${e.end}  peak M ${fmt(e.peak)} (${seismo.classify(e.peak).name})`);
  } else {
    console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 13).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  }
}

if (require.main === module) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}

module.exports = { dashboardHtml, buildPayload, loadStations };
