// A synthetic Google for testing the instrument end to end, with no API keys.
// Each keyword has a pool of candidate pages with a latent "quality" score;
// the SERP is the top 10 by score plus a mean-reverting wobble, so normal days
// churn without drifting. An update is a large one-off shock to the scores of the
// keywords it touches, spread over its rollout. Poisoning swaps a random
// share of reads for an unrelated fake top 10 that doesn't persist.
// Everything here is synthetic and labelled as such wherever it is shown.

'use strict';

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(r) {
  return Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
}

const FEATURES = ['ai_overview', 'featured_snippet', 'people_also_ask', 'videos', 'local_pack', 'forums'];

const DEFAULT_SCENARIO = {
  days: 60,
  cadenceHours: 6,
  start: '2026-08-01T00:00:00Z',
  poisonRate: [0.05, 0.15],
  updates: [
    { name: 'Simulated spam update', kind: 'spam', day: 24, rolloutDays: 1.5, reach: 0.3, force: 2.2 },
    { name: 'Simulated poisoning storm (no update)', kind: 'none', day: 32, rolloutDays: 1, poisonRate: 0.2 },
    { name: 'Simulated core update', kind: 'core', day: 40, rolloutDays: 12, reach: 0.8, force: 2.4, frontLoad: 0.6 },
  ],
};

function createWorld(stations, scenario = DEFAULT_SCENARIO, seed = 42) {
  const r = rng(seed);
  const world = stations.map((st, si) => {
    const volatility = 0.08 + r() * 0.22; // some keywords naturally churn more
    // base = the page's standing in the algorithm (only updates move it);
    // noise = day-to-day wobble that always reverts (fresh crawls, tests, freshness).
    const pages = Array.from({ length: 30 }, (_, i) => ({
      url: `https://site${si}-${i}.example${i % 7}.com/${st.id}/${i}`,
      base: 10 - i * 0.35 + gauss(r) * 0.3,
      noise: 0,
    }));
    const features = FEATURES.filter(() => r() < 0.4);
    const mean = pages.reduce((a, p) => a + p.base, 0) / pages.length;
    const spread = Math.sqrt(pages.reduce((a, p) => a + (p.base - mean) ** 2, 0) / pages.length);
    return { st, pages, features, volatility, mean, spread };
  });
  return { r, world, scenario };
}

function updateAt(scenario, day) {
  return scenario.updates.filter((u) => day >= u.day && day < u.day + u.rolloutDays);
}

// Advance one sweep and return { readings, refetch } exactly like a live scan.
function step(sim, day) {
  const { r, world, scenario } = sim;
  const dt = scenario.cadenceHours / 24;
  const active = updateAt(scenario, day);
  let poisonRate = scenario.poisonRate[0] + r() * (scenario.poisonRate[1] - scenario.poisonRate[0]);
  for (const u of active) if (u.poisonRate) poisonRate = u.poisonRate;

  for (const w of world) {
    for (const p of w.pages) p.noise = p.noise * 0.6 + gauss(r) * w.volatility;
    if (r() < 0.01) w.features = FEATURES.filter(() => r() < 0.4);
    for (const u of active) {
      if (!u.force) continue;
      if (w.hit === undefined) w.hit = {};
      if (w.hit[u.name] === undefined) w.hit[u.name] = r() < u.reach;
      if (!w.hit[u.name]) continue;
      // Spread the update's force over its rollout, front-loaded for core updates.
      const into = (day - u.day) / u.rolloutDays;
      const share = u.frontLoad ? (into < 0.25 ? u.frontLoad / 0.25 : (1 - u.frontLoad) / 0.75) : 1;
      const f = (u.force * share * dt) / u.rolloutDays;
      // Variance-preserving reshuffle: blend each page's standing toward a fresh
      // draw, so an update re-ranks pages without spreading them further apart.
      const c = Math.max(0, 1 - f * 0.5);
      for (const p of w.pages) p.base = w.mean + (p.base - w.mean) * c + gauss(r) * w.spread * Math.sqrt(1 - c * c);
      if (r() < 0.15 * share * dt * 4) w.features = FEATURES.filter(() => r() < 0.45);
    }
  }

  const truth = (w) => {
    const ranked = w.pages.map((p) => ({ p, s: p.base + p.noise })).sort((a, b) => b.s - a.s).slice(0, 10);
    return {
      organic: ranked.map(({ p }, i) => ({ position: i + 1, url: p.url, domain: new URL(p.url).hostname.replace(/^www\./, ''), title: '' })),
      features: w.features.slice(),
      provider: 'simulated',
    };
  };
  const poison = (w) => ({
    organic: Array.from({ length: 10 }, (_, i) => {
      const url = `https://junk${Math.floor(r() * 1e6)}.poison${i}.net/${w.st.id}`;
      return { position: i + 1, url, domain: new URL(url).hostname, title: '' };
    }),
    features: FEATURES.filter(() => r() < 0.3),
    provider: 'simulated-poisoned',
  });

  const readings = {};
  const byId = {};
  for (const w of world) {
    byId[w.st.id] = w;
    readings[w.st.id] = r() < poisonRate ? poison(w) : truth(w);
  }
  // A re-fetch is poisoned at the same rate, independently.
  const refetch = async (id) => (r() < poisonRate ? poison(byId[id]) : truth(byId[id]));
  return { readings, refetch, poisonRate, active };
}

function confirmedFor(scenario) {
  const t0 = Date.parse(scenario.start);
  return scenario.updates.filter((u) => u.kind !== 'none').map((u, i) => ({
    id: 'sim-' + i,
    name: u.name,
    kind: u.kind,
    begin: new Date(t0 + u.day * 864e5).toISOString(),
    end: new Date(t0 + (u.day + u.rolloutDays) * 864e5).toISOString(),
  }));
}

module.exports = { rng, createWorld, step, confirmedFor, DEFAULT_SCENARIO };
