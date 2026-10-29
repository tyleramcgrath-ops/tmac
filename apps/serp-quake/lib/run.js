// Drives sweeps: the live scan and the simulation share this so the simulated
// seismogram is produced by exactly the code that measures the real one.

'use strict';

const seismo = require('./seismo');
const sim = require('./simulate');

async function liveSweep(state, stations, providers, t, opts = {}) {
  const [primary, secondary] = providers;
  const byId = Object.fromEntries(stations.map((s) => [s.id, s]));
  const readings = {};
  const queue = stations.slice();
  const concurrency = opts.concurrency || 4;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const st = queue.shift();
      try { readings[st.id] = await primary.read(st); } catch (e) { readings[st.id] = { error: e.message }; }
    }
  }));
  const refetch = opts.noRefetch ? null : (id) => (secondary || primary).read(byId[id]);
  return seismo.processSweep(state, stations, readings, t, { refetch });
}

async function simulate(stations, scenario = sim.DEFAULT_SCENARIO, seed = 42) {
  const state = seismo.emptyState();
  const world = sim.createWorld(stations, scenario, seed);
  const t0 = Date.parse(scenario.start);
  const steps = Math.round((scenario.days * 24) / scenario.cadenceHours);
  for (let i = 0; i <= steps; i++) {
    const day = (i * scenario.cadenceHours) / 24;
    const { readings, refetch } = sim.step(world, day);
    await seismo.processSweep(state, stations, readings, new Date(t0 + day * 864e5).toISOString(), { refetch });
  }
  if (state.event) state.events.push({ ...state.event, end: null, ongoing: true });
  return { state, confirmed: sim.confirmedFor(scenario) };
}

module.exports = { liveSweep, simulate };
