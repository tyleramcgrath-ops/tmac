// What the dashboard and `quake status` read: the stored seismogram, trimmed
// to what's drawn, plus a worked example of the latest magnitude so every
// number on screen can be traced back to the readings that produced it.

'use strict';

const { CONFIG, SCALE, classify } = require('./seismo');
const { WEIGHTS, CTR, RBO_P } = require('./metrics');
const { overlapping } = require('./google-status');

function round(x, d = 3) {
  return x == null || !Number.isFinite(x) ? null : Math.round(x * 10 ** d) / 10 ** d;
}

function compactSweep(s) {
  return {
    t: s.t,
    m: round(s.magnitude, 2),
    m24: round(s.m24, 2),
    R: round(s.R),
    breadth: round(s.breadth),
    staLta: round(s.staLta),
    inEvent: s.inEvent,
    calibrating: s.calibrating,
    rejectedShare: round(s.instrument.rejectedShare),
    poisonCaught: s.instrument.poisonCaught,
    interference: s.instrument.interference,
    st: Object.fromEntries(Object.entries(s.stations).map(([id, x]) => [id, x.status === 'ok' ? round(x.ratio, 2) : x.status[0]])),
  };
}

function explain(latest, stations) {
  if (!latest || latest.magnitude == null) return null;
  const ok = Object.entries(latest.stations).filter(([, x]) => x.status === 'ok');
  const kw = Object.fromEntries(stations.map((s) => [s.id, s]));
  const pick = (list) => list.map(([id, x]) => ({
    id, keyword: kw[id] ? kw[id].keyword : id, vertical: kw[id] ? kw[id].vertical : '',
    components: Object.fromEntries(Object.entries(x.components).map(([k, v]) => [k, round(v)])),
    amplitude: round(x.amplitude), baseline: round(x.baseline), ratio: round(x.ratio, 2),
  }));
  const sorted = ok.slice().sort((a, b) => b[1].ratio - a[1].ratio);
  const mid = sorted[Math.floor(sorted.length / 2)];
  const cls = classify(latest.m24 != null ? latest.m24 : latest.magnitude);
  return {
    t: latest.t,
    components: Object.fromEntries(Object.entries(latest.components).map(([k, v]) => [k, round(v)])),
    mostShaken: pick(sorted.slice(0, 3)),
    typical: mid ? pick([mid])[0] : null,
    rawR: round(latest.rawR),
    R0: round(latest.R0),
    R: round(latest.R),
    magnitude: round(latest.magnitude, 2),
    m24: round(latest.m24, 2),
    sta: round(latest.sta),
    lta: round(latest.lta),
    staLta: round(latest.staLta),
    breadth: round(latest.breadth),
    faults: latest.faults,
    instrument: latest.instrument,
    calibrating: latest.calibrating,
    inEvent: latest.inEvent,
    category: cls,
  };
}

function payload({ state, stations, confirmed, mode }) {
  const latest = state.sweeps[state.sweeps.length - 1] || null;
  const events = state.events.concat(state.event ? [{ ...state.event, end: null, ongoing: true }] : []).map((e) => ({
    ...e,
    category: classify(e.peak || 0).name,
    confirmed: overlapping(confirmed, e.start, e.end || (latest && latest.t)).map((u) => u.name),
  }));
  return {
    generatedAt: new Date().toISOString(),
    mode,
    config: CONFIG,
    weights: WEIGHTS,
    ctr: CTR,
    rboP: RBO_P,
    scale: SCALE,
    stations: stations.map((s) => ({ id: s.id, vertical: s.vertical, keyword: s.keyword })),
    sweeps: state.sweeps.map(compactSweep),
    events,
    confirmed,
    explain: explain(latest, stations),
  };
}

// Magnitude inside vs outside Google's confirmed rollout windows: the check
// that the scale means something, once there's enough history to run it.
function calibration(state, confirmed) {
  const inside = []; const outside = [];
  for (const s of state.sweeps) {
    if (s.m24 == null || s.calibrating) continue;
    const hits = overlapping(confirmed, s.t, s.t);
    (hits.length ? inside : outside).push({ m: s.m24, kinds: hits.map((h) => h.kind) });
  }
  const med = (xs) => { const a = xs.slice().sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : null; };
  const byKind = {};
  for (const x of inside) for (const k of x.kinds) (byKind[k] = byKind[k] || []).push(x.m);
  const perUpdate = confirmed.map((u) => {
    const ms = state.sweeps.filter((s) => s.m24 != null && !s.calibrating && overlapping([u], s.t, s.t).length).map((s) => s.m24);
    return { name: u.name, kind: u.kind, sweeps: ms.length, peak: ms.length ? Math.max(...ms) : null, median: med(ms) };
  }).filter((u) => u.sweeps);
  const quiet = outside.map((x) => x.m);
  const unconfirmed = state.events.filter((e) => !overlapping(confirmed, e.start, e.end).length).length;
  return {
    sweepsInside: inside.length,
    sweepsOutside: outside.length,
    medianOutside: med(quiet),
    p95Outside: quiet.length ? quiet.slice().sort((a, b) => a - b)[Math.floor(quiet.length * 0.95)] : null,
    medianInsideByKind: Object.fromEntries(Object.entries(byKind).map(([k, xs]) => [k, med(xs)])),
    perUpdate,
    eventsTotal: state.events.length,
    // Not false alarms: Google confirms only some of the updates it ships.
    eventsUnconfirmed: unconfirmed,
  };
}

module.exports = { payload, calibration, explain, compactSweep };
