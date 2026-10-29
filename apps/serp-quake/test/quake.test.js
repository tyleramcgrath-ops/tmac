'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const metrics = require('../lib/metrics');
const seismo = require('../lib/seismo');
const { simulate } = require('../lib/run');
const { overlapping } = require('../lib/google-status');
const { messagesFor } = require('../lib/alert');
const { dashboardHtml } = require('../bin/quake');
const report = require('../lib/report');
const stations = require('../stations.json').stations;

const L = (n, p = 'u') => Array.from({ length: n }, (_, i) => `${p}${i}`);
const serp = (urls, features = []) => ({ organic: urls.map((u, i) => ({ position: i + 1, url: `https://${u}.com/page`, domain: `${u}.com` })), features });

test('RBO: identical = 1, disjoint = 0, top swaps cost more than bottom swaps', () => {
  const a = L(10);
  assert.equal(metrics.rbo(a, a), 1);
  assert.equal(metrics.rbo(a, L(10, 'x')), 0);
  const topSwap = [a[1], a[0], ...a.slice(2)];
  const bottomSwap = [...a.slice(0, 8), a[9], a[8]];
  assert.ok(metrics.rbo(a, topSwap) < metrics.rbo(a, bottomSwap));
});

test('traffic shift: losing #1 moves far more clicks than losing #10', () => {
  const a = L(10);
  const lostTop = ['new', ...a.slice(1)];
  const lostBottom = [...a.slice(0, 9), 'new'];
  assert.ok(metrics.trafficShift(a, lostTop) > 5 * metrics.trafficShift(a, lostBottom));
  assert.equal(metrics.trafficShift(a, a), 0);
  assert.ok(Math.abs(metrics.trafficShift(a, L(10, 'x')) - 1) < 1e-9);
});

test('displacement: amplitude 0 for no change, 1 for total replacement of results and features', () => {
  const a = serp(L(10), ['ai_overview']);
  assert.equal(metrics.displacement(a, a).amplitude, 0);
  const d = metrics.displacement(a, serp(L(10, 'x'), ['local_pack']));
  assert.ok(Math.abs(d.amplitude - 1) < 1e-9);
});

test('magnitude: normal day is 2, every doubling adds 3, capped 0..10', () => {
  assert.equal(seismo.magnitudeOf(1), 2);
  assert.equal(seismo.magnitudeOf(2), 5);
  assert.equal(seismo.magnitudeOf(4), 8);
  assert.equal(seismo.magnitudeOf(1000), 10);
  assert.equal(seismo.magnitudeOf(0.01), 0);
  assert.equal(seismo.classify(7.2).name, 'Major');
  assert.equal(seismo.classify(1.9).name, 'Background');
});

test('interquartile mean ignores up to a quarter of wild values', () => {
  const xs = [...Array(80).fill(1), ...Array(20).fill(50)];
  assert.ok(Math.abs(seismo.interquartileMean(xs) - 1) < 1e-9);
});

test('malformed readings are rejected', () => {
  assert.match(seismo.malformed(serp(L(4))), /only 4/);
  assert.match(seismo.malformed(serp(Array(10).fill('same'))), /one domain/);
  assert.equal(seismo.malformed(serp(L(10))), null);
});

// A network where every keyword wobbles a little each sweep.
async function quietNetwork(n, sweeps) {
  const sts = Array.from({ length: n }, (_, i) => ({ id: 's' + i, vertical: 'v' + (i % 4), keyword: 'k' + i }));
  const state = seismo.emptyState();
  let t = Date.parse('2026-01-01T00:00:00Z');
  const base = sts.map((s) => L(12, s.id + '-'));
  for (let k = 0; k < sweeps; k++) {
    const readings = {};
    sts.forEach((s, i) => {
      const u = base[i].slice(0, 10);
      if ((k + i) % 2) [u[3], u[4]] = [u[4], u[3]];
      if ((k + i) % 3 === 0) u[9] = base[i][10];
      readings[s.id] = serp(u);
    });
    await seismo.processSweep(state, sts, readings, new Date(t).toISOString());
    t += 6 * 3600e3;
  }
  return { sts, state, base, t };
}

test('scattered poisoning (15% of keywords fully replaced) is rejected and cannot fake a quake', async () => {
  const { sts, state, base, t } = await quietNetwork(40, 30);
  const before = state.sweeps[state.sweeps.length - 1];
  const readings = {};
  sts.forEach((s, i) => { readings[s.id] = i < 6 ? serp(L(10, 'junk' + i)) : serp(base[i].slice(0, 10)); });
  const sw = await seismo.processSweep(state, sts, readings, new Date(t).toISOString());
  assert.equal(sw.instrument.rejected, 6);
  assert.ok(sw.magnitude < 4, `poisoned sweep read M${sw.magnitude}`);
  assert.equal(sw.eventStarted, undefined);
  assert.ok(before.magnitude != null);
  // The poisoned reading must not become the station's new reference.
  assert.ok(state.stations.s0.last.organic[0].url.includes('s0-'));
});

test('re-fetch replaces a poisoned reading when the second look matches the old SERP', async () => {
  const { sts, state, base, t } = await quietNetwork(20, 20);
  const readings = {};
  sts.forEach((s, i) => { readings[s.id] = i === 0 ? serp(L(10, 'junk')) : serp(base[i].slice(0, 10)); });
  const sw = await seismo.processSweep(state, sts, readings, new Date(t).toISOString(), { refetch: async () => serp(base[0].slice(0, 10)) });
  assert.equal(sw.stations.s0.status, 'ok');
  assert.equal(sw.instrument.poisonCaught, 1);
});

test('mass replacement (40% of keywords at once) is treated as a real, violent update', async () => {
  const { sts, state, base, t } = await quietNetwork(40, 30);
  const readings = {};
  sts.forEach((s, i) => { readings[s.id] = i < 16 ? serp(L(10, 'new' + i)) : serp(base[i].slice(0, 10)); });
  const sw = await seismo.processSweep(state, sts, readings, new Date(t).toISOString());
  assert.ok(sw.instrument.massReplacement);
  assert.equal(sw.instrument.rejected, 0);
  assert.ok(sw.magnitude >= 6, `mass replacement read only M${sw.magnitude}`);
});

test('end to end on the simulated Google: quiet reads ~2, updates are caught, poisoning storm is not', async () => {
  for (const seed of [42, 7, 99]) {
    const { state, confirmed } = await simulate(stations, undefined, seed);
    const core = confirmed.find((u) => u.kind === 'core');
    const spam = confirmed.find((u) => u.kind === 'spam');
    const quiet = state.sweeps.filter((s) => s.m24 != null && !s.calibrating && !overlapping(confirmed, s.t, s.t).length && !s.inEvent).map((s) => s.m24).sort((a, b) => a - b);
    const med = quiet[Math.floor(quiet.length / 2)];
    assert.ok(med > 1.4 && med < 2.6, `seed ${seed}: quiet median M${med}`);
    const coreEv = state.events.find((e) => overlapping([core], e.start, e.end).length);
    assert.ok(coreEv, `seed ${seed}: core update missed`);
    assert.ok(coreEv.peak >= 7, `seed ${seed}: core peaked at only M${coreEv.peak}`);
    assert.ok(Date.parse(coreEv.start) - Date.parse(core.begin) <= 864e5, `seed ${seed}: core detected late`);
    assert.ok(state.events.find((e) => overlapping([spam], e.start, e.end).length), `seed ${seed}: spam update missed`);
    // Day 32 storm: 20% poisoning, no ranking change.
    const storm = { begin: '2026-09-02T00:00:00Z', end: '2026-09-03T00:00:00Z' };
    assert.equal(state.events.filter((e) => overlapping([storm], e.start, e.end).length).length, 0, `seed ${seed}: poisoning storm read as a quake`);
    assert.equal(state.events.length, 2, `seed ${seed}: unexpected extra events`);
  }
});

test('alerts fire on event start and end', async () => {
  const { state } = await simulate(stations, undefined, 42);
  const started = state.sweeps.find((s) => s.eventStarted);
  const ended = state.sweeps.find((s) => s.eventEnded);
  const fakeState = { event: { peak: 0 }, events: state.events };
  assert.match(messagesFor(started, fakeState)[0].text, /SERP quake detected: M\d/);
  assert.ok(messagesFor(ended, { event: null, events: state.events }).some((m) => /SERP quake over/.test(m.text)));
});

test('dashboard build embeds the payload safely', async () => {
  const { state, confirmed } = await simulate(stations, undefined, 42);
  const data = report.payload({ state, stations: [...stations, { id: 'x', vertical: 'x', keyword: '</script><b>' }], confirmed, mode: 'simulated' });
  const html = dashboardHtml(data);
  assert.ok(!html.includes('</script><b>'));
  const m = html.match(/<script id="quake-data" type="application\/json">([\s\S]*?)<\/script>/);
  const parsed = JSON.parse(m[1]);
  assert.equal(parsed.mode, 'simulated');
  assert.ok(parsed.explain && parsed.explain.R0 > 0);
});
