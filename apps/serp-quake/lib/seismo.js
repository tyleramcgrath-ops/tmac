// The seismograph. Turns one sweep of station readings (every tracked keyword,
// read once) into a network magnitude, decides whether a quake is under way,
// and keeps the poisoned readings Google now feeds to scrapers out of the
// measurement. README.md walks through every constant here and why.

'use strict';

const { displacement } = require('./metrics');

const CONFIG = Object.freeze({
  // Station noise floor: median amplitude of a station's last N quiet readings
  // (30 days at the default 6h cadence). Readings taken while an event is
  // declared are left out, so a two-week core update can't recalibrate the
  // instrument to treat itself as normal.
  baselineWindow: 120,
  baselineMinReadings: 6,
  baselinePrior: 0.08,       // assumed noise floor until a station has history
  baselineFloor: 0.03,       // a dead-still keyword can't make a 1-result wobble look like a 20x quake
  // Magnitude: M = 2 + 3 * log2(R). Normal day R=1 -> 2.0; every +3 is a doubling.
  magnitudeBase: 2,
  magnitudePerDoubling: 3,
  // A station "triggers" (counts toward breadth) at 2x its own noise floor.
  stationTrigger: 2,
  // A vertical (fault line) is "active" when its median station is 1.5x normal.
  faultTrigger: 1.5,
  // STA/LTA event trigger, borrowed directly from seismology's standard
  // automatic picker: short-term average over ~24h vs long-term over ~14 days.
  staHours: 24,
  ltaHours: 24 * 14,
  triggerOn: 1.6,
  triggerOff: 1.15,
  triggerBreadth: 0.25,
  triggerMinMagnitude: 4,
  detriggerHours: 24,
  // Poisoning: a reading that replaces nearly the whole top 10 on its own is
  // held as suspect. Real updates move many keywords partway; poisoning flips
  // isolated keywords completely (Ahrefs, Oct 2026: 5-20% of results).
  suspectRank: 0.85,
  suspectDomain: 0.8,
  // ...unless so many stations flip at once that it can't be scattered
  // poisoning (Ahrefs' worst case is 20%), in which case it is a real quake.
  massReplacementShare: 0.3,
  // Above this share of rejected readings the instrument itself is suspect.
  interferenceShare: 0.2,
  warmupSweeps: 8,          // ~2 days at 6h before an event can be declared
  maxEventDays: 21,         // longer than any confirmed core-update rollout; stops a stuck trigger
  minOrganic: 5,             // some SERPs (e.g. heavy-feature how-tos) legitimately show only 6 organic results
  maxSameDomain: 6,
});

const SCALE = [
  { min: 9, name: 'Historic', note: 'Florida/Panda/Medic-class reshuffle of the whole index' },
  { min: 8, name: 'Great', note: 'the largest core updates' },
  { min: 7, name: 'Major', note: 'core-update territory' },
  { min: 6, name: 'Strong', note: 'a confirmed-size update (spam, reviews, helpful content)' },
  { min: 5, name: 'Moderate', note: 'something is rolling out or being tested' },
  { min: 4, name: 'Light', note: 'noticeable, often one vertical' },
  { min: 3, name: 'Minor', note: 'above normal churn, usually nothing' },
  { min: 0, name: 'Background', note: 'normal daily churn' },
];

const r4 = (x) => (x == null || !Number.isFinite(x) ? x : Math.round(x * 1e4) / 1e4);

function classify(m) {
  return SCALE.find((s) => m >= s.min);
}

function median(xs) {
  if (!xs.length) return NaN;
  const a = xs.slice().sort((x, y) => x - y);
  const h = a.length >> 1;
  return a.length % 2 ? a[h] : (a[h - 1] + a[h]) / 2;
}

function quantile(sorted, q) {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos); const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

// Interquartile mean: the mean of the middle 50%. Breaks down only when more
// than 25% of stations are corrupted in the same direction, which covers the
// 5-20% poisoning rate Ahrefs reports.
function interquartileMean(xs) {
  if (!xs.length) return NaN;
  const a = xs.slice().sort((x, y) => x - y);
  if (a.length < 4) return median(a);
  const lo = quantile(a, 0.25); const hi = quantile(a, 0.75);
  const mid = a.filter((x) => x >= lo && x <= hi);
  return mid.reduce((s, x) => s + x, 0) / mid.length;
}

function magnitudeOf(R) {
  if (!(R > 0)) return 0;
  const m = CONFIG.magnitudeBase + CONFIG.magnitudePerDoubling * Math.log2(R);
  return Math.max(0, Math.min(10, m));
}

// Structural checks for a reading that is broken rather than merely different.
function malformed(reading) {
  if (!reading || !Array.isArray(reading.organic)) return 'no results';
  if (reading.organic.length < CONFIG.minOrganic) return `only ${reading.organic.length} organic results`;
  const counts = {};
  for (const o of reading.organic.slice(0, 10)) counts[o.domain] = (counts[o.domain] || 0) + 1;
  const top = Math.max(...Object.values(counts));
  if (top > CONFIG.maxSameDomain) return `${top} of 10 results from one domain`;
  return null;
}

function querySignature(st) {
  return [st.keyword, st.gl || 'us', st.hl || 'en', st.location || ''].join('|');
}

function stationBaseline(history) {
  let xs = history.filter((h) => !h.inEvent).slice(-CONFIG.baselineWindow).map((h) => h.amplitude);
  // Not enough quiet history (a keyword added mid-quake): use everything rather
  // than staying on the prior forever.
  if (xs.length < CONFIG.baselineMinReadings) xs = history.slice(-CONFIG.baselineWindow).map((h) => h.amplitude);
  if (xs.length < CONFIG.baselineMinReadings) return { value: CONFIG.baselinePrior, n: xs.length, prior: true };
  return { value: Math.max(CONFIG.baselineFloor, median(xs)), n: xs.length, prior: false };
}

// state: { stations: { [id]: { last: reading, history: [{t, amplitude, inEvent}] } },
//          sweeps: [...], event: null | {...}, events: [...] }
// readings: { [stationId]: reading | { error } }, with optional refetch(stationId)
// used to re-read a suspect station once.
async function processSweep(state, stations, readings, t, opts = {}) {
  const refetch = opts.refetch || null;
  const results = {};

  // Pass 1: displacement per station, structural rejection, suspect flagging.
  for (const st of stations) {
    const cur = readings[st.id];
    const slot = state.stations[st.id] || (state.stations[st.id] = { last: null, history: [] });
    // Changing what a station asks Google (keyword, country, language, city)
    // makes it a different instrument: start it over instead of reading the
    // switch as a quake.
    const sig = querySignature(st);
    // State saved before signatures existed was always read without a location.
    const prevSig = slot.sig !== undefined ? slot.sig : slot.last ? querySignature({ ...st, location: '' }) : sig;
    if (prevSig !== sig) { slot.last = null; slot.history = []; }
    slot.sig = sig;
    const r = { vertical: st.vertical, keyword: st.keyword };
    results[st.id] = r;
    if (!cur || cur.error) { r.status = 'error'; r.reason = (cur && cur.error) || 'no reading'; continue; }
    const bad = malformed(cur);
    if (bad) { r.status = 'rejected'; r.reason = bad; continue; }
    if (!slot.last) { r.status = 'seed'; r.reading = cur; continue; }
    const d = displacement(slot.last, cur);
    Object.assign(r, d, { reading: cur, status: 'ok' });
    if (d.components.rank >= CONFIG.suspectRank && d.components.domain >= CONFIG.suspectDomain) {
      r.status = 'suspect';
      if (refetch) {
        const again = await refetch(st.id).catch((e) => ({ error: e.message }));
        if (again && !again.error && !malformed(again)) {
          const vsOld = displacement(slot.last, again);
          const vsNew = displacement(cur, again);
          if (vsOld.components.rank < 0.5) {
            // Second look matches what we had: the first reading was poisoned.
            Object.assign(r, vsOld, { reading: again, status: 'ok', reason: 'poisoned reading replaced by re-fetch' });
            r.poisonCaught = true;
          } else if (vsNew.components.rank < 0.3) {
            r.status = 'ok'; r.reason = 'total replacement confirmed by re-fetch';
          } else {
            r.status = 'rejected'; r.reason = 'unstable: re-fetch disagreed with both readings';
          }
        }
      }
    }
  }

  // Pass 2: suspects stand or fall together. Scattered total replacements are
  // poisoning; a large share at once is a real, violent update.
  const measured = Object.values(results).filter((r) => r.status === 'ok' || r.status === 'suspect');
  const suspects = measured.filter((r) => r.status === 'suspect');
  const suspectShare = measured.length ? suspects.length / measured.length : 0;
  const massReplacement = suspectShare >= CONFIG.massReplacementShare;
  for (const r of suspects) {
    if (massReplacement) { r.status = 'ok'; r.reason = 'total replacement, but too widespread to be poisoning'; }
    else { r.status = 'rejected'; r.reason = 'isolated total replacement (likely poisoned result)'; }
  }

  // Pass 3: ratios against each station's own noise floor.
  for (const st of stations) {
    const r = results[st.id];
    if (r.status !== 'ok') continue;
    const base = stationBaseline(state.stations[st.id].history);
    r.baseline = base.value; r.baselinePrior = base.prior;
    r.ratio = r.amplitude / base.value;
  }

  const ok = Object.entries(results).filter(([, r]) => r.status === 'ok');
  const ratios = ok.map(([, r]) => r.ratio);
  // Warm-up: until most stations have a real noise floor and the network has
  // a quiet level to compare against, readings are shown but can't trigger.
  const priorShare = ok.length ? ok.filter(([, r]) => r.baselinePrior).length / ok.length : 1;
  const calibrated = state.sweeps.filter((s) => s.rawR != null && s.priorShare <= 0.5).length;
  const calibrating = priorShare > 0.5 || calibrated < CONFIG.warmupSweeps;
  // Two-stage normalization. Each station was divided by its own noise floor;
  // now the network's interquartile mean is divided by its own quiet level
  // (R0), because a skewed ratio distribution doesn't average to exactly 1 on a
  // calm day. After this, R = 1 means "an ordinary day" by construction.
  const rawR = ratios.length ? interquartileMean(ratios) : NaN;
  const R0 = networkBaseline(state.sweeps);
  const R = rawR / R0;
  const magnitude = ratios.length ? magnitudeOf(R) : null;
  const breadth = ratios.length ? ratios.filter((x) => x >= CONFIG.stationTrigger).length / ratios.length : 0;

  const byVertical = {};
  for (const [, r] of ok) (byVertical[r.vertical] = byVertical[r.vertical] || []).push(r.ratio);
  const faults = Object.fromEntries(Object.entries(byVertical).map(([v, xs]) => {
    const m = median(xs);
    return [v, { median: m, magnitude: magnitudeOf(m), active: m >= CONFIG.faultTrigger, n: xs.length }];
  }));

  const comp = {};
  for (const k of ['rank', 'traffic', 'domain', 'feature']) comp[k] = median(ok.map(([, r]) => r.components[k]));

  const counted = Object.values(results).filter((r) => r.status !== 'seed');
  const rejected = counted.filter((r) => r.status === 'rejected').length;
  const errors = counted.filter((r) => r.status === 'error').length;
  const instrument = {
    stations: stations.length,
    measured: ok.length,
    rejected,
    errors,
    seeded: Object.values(results).filter((r) => r.status === 'seed').length,
    poisonCaught: Object.values(results).filter((r) => r.poisonCaught).length,
    rejectedShare: counted.length ? rejected / counted.length : 0,
    suspectShare,
    massReplacement,
  };
  instrument.interference = instrument.rejectedShare >= CONFIG.interferenceShare;

  const sweep = {
    t,
    R: Number.isFinite(R) ? R : null,
    rawR: Number.isFinite(rawR) ? rawR : null,
    R0,
    calibrating,
    priorShare,
    magnitude,
    breadth,
    faults,
    components: comp,
    instrument,
    stations: Object.fromEntries(Object.entries(results).map(([id, r]) => [id, r.status === 'ok' ? {
      status: r.status,
      reason: r.reason,
      amplitude: r4(r.amplitude),
      ratio: r4(r.ratio),
      baseline: r4(r.baseline),
      components: Object.fromEntries(Object.entries(r.components).map(([k, v]) => [k, r4(v)])),
    } : { status: r.status, reason: r.reason }])),
  };

  updateEvent(state, sweep);
  sweep.inEvent = !!state.event;
  sweep.sta = state._lastSta; sweep.lta = state._lastLta;
  delete state._lastSta; delete state._lastLta;

  // Commit: accepted readings become each station's new reference; their
  // amplitude joins the station history (flagged if taken during an event).
  for (const st of stations) {
    const r = results[st.id];
    const slot = state.stations[st.id];
    if (r.status === 'ok' || r.status === 'seed') {
      slot.last = { organic: r.reading.organic.map((o) => ({ url: o.url, domain: o.domain })), features: r.reading.features || [] };
    }
    if (r.status === 'ok') {
      slot.history.push({ t, amplitude: r4(r.amplitude), inEvent: sweep.inEvent });
      if (slot.history.length > CONFIG.baselineWindow * 3) slot.history.splice(0, slot.history.length - CONFIG.baselineWindow * 3);
    }
  }

  state.sweeps.push(sweep);
  return sweep;
}

function networkBaseline(sweeps) {
  // Only sweeps measured against real station baselines say what normal is.
  const measured = sweeps.filter((s) => s.rawR != null && !s.calibrating);
  let xs = measured.filter((s) => !s.inEvent).slice(-CONFIG.baselineWindow).map((s) => s.rawR);
  if (xs.length < CONFIG.baselineMinReadings) xs = measured.slice(-CONFIG.baselineWindow).map((s) => s.rawR);
  if (xs.length < CONFIG.baselineMinReadings) return 1;
  return Math.max(0.2, median(xs));
}

function windowMean(sweeps, fromMs, toMs) {
  const xs = sweeps.filter((s) => s.R != null && Date.parse(s.t) > fromMs && Date.parse(s.t) <= toMs).map((s) => s.R);
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
}

function updateEvent(state, sweep) {
  const now = Date.parse(sweep.t);
  const all = state.sweeps.concat([sweep]);
  const sta = windowMean(all, now - CONFIG.staHours * 3600e3, now);
  // LTA: the 14 days *before* the STA window, quiet sweeps only. Fall back to
  // the definition of normal (R = 1) until there's enough history.
  const quiet = state.sweeps.filter((s) => !s.inEvent);
  let lta = windowMean(quiet, now - (CONFIG.staHours + CONFIG.ltaHours) * 3600e3, now - CONFIG.staHours * 3600e3);
  if (!Number.isFinite(lta)) lta = 1;
  state._lastSta = Number.isFinite(sta) ? sta : null;
  state._lastLta = lta;
  const ratio = Number.isFinite(sta) ? sta / lta : 0;
  sweep.staLta = ratio;
  // The headline number: magnitude of the last 24h of shaking. A single sweep
  // is one sample of a noisy signal; seismologists report an event's magnitude
  // from sustained amplitude, not from one wiggle of the needle.
  sweep.m24 = Number.isFinite(sta) ? magnitudeOf(sta) : null;

  if (sweep.magnitude == null) return;
  const ev = state.event;
  if (!ev) {
    if (!sweep.calibrating && ratio >= CONFIG.triggerOn && sweep.breadth >= CONFIG.triggerBreadth && sweep.magnitude >= CONFIG.triggerMinMagnitude && !sweep.instrument.interference) {
      state.event = {
        id: 'evt-' + sweep.t.slice(0, 13).replace(/[^0-9]/g, ''),
        start: sweep.t,
        peak: sweep.m24,
        peakAt: sweep.t,
        peakBreadth: sweep.breadth,
        faults: activeFaults(sweep),
        quietSince: null,
        sweeps: 1,
      };
      sweep.eventStarted = state.event.id;
    }
    return;
  }
  ev.sweeps++;
  if (sweep.m24 > ev.peak) { ev.peak = sweep.m24; ev.peakAt = sweep.t; }
  ev.peakBreadth = Math.max(ev.peakBreadth, sweep.breadth);
  for (const f of activeFaults(sweep)) if (!ev.faults.includes(f)) ev.faults.push(f);
  const tooLong = now - Date.parse(ev.start) >= CONFIG.maxEventDays * 864e5;
  if (ratio < CONFIG.triggerOff || tooLong) {
    ev.quietSince = ev.quietSince || sweep.t;
    if (tooLong) ev.capped = true;
    if (tooLong || now - Date.parse(ev.quietSince) >= CONFIG.detriggerHours * 3600e3) {
      ev.end = sweep.t;
      state.events.push(ev);
      state.event = null;
      sweep.eventEnded = ev.id;
    }
  } else ev.quietSince = null;
}

function activeFaults(sweep) {
  return Object.entries(sweep.faults).filter(([, f]) => f.active).map(([v]) => v);
}

function emptyState() {
  return { version: 1, stations: {}, sweeps: [], event: null, events: [] };
}

module.exports = { CONFIG, SCALE, classify, median, interquartileMean, magnitudeOf, malformed, stationBaseline, processSweep, emptyState };
