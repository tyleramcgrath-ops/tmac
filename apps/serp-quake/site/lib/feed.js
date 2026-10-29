// The seismograph's readings, as the monitor publishes them. The GitHub Actions
// scanner (.github/workflows/serp-quake.yml) writes data.json to the
// serp-quake-data branch after every sweep; this reads it, with a short cache so
// a busy dashboard costs one fetch per few minutes, not one per page view.
//
// QUAKE_DATA_URL overrides the source. QUAKE_DATA_TOKEN is sent as a bearer token
// when set, for a private repository.

const DEFAULT_URL = 'https://raw.githubusercontent.com/tyleramcgrath-ops/tmac/serp-quake-data/data.json';
const TTL_MS = 3 * 60 * 1000;
const KEY = '__serpQuakeFeed';

async function load({ fetchImpl = fetch, now = Date.now() } = {}) {
  // Local development: read a payload straight off disk (see dev-server.js).
  if (process.env.QUAKE_DATA_FILE) return JSON.parse(require('fs').readFileSync(process.env.QUAKE_DATA_FILE, 'utf8'));
  const cache = globalThis[KEY];
  if (cache && now - cache.at < TTL_MS) return cache.data;
  const headers = { accept: 'application/json' };
  if (process.env.QUAKE_DATA_TOKEN) headers.authorization = 'Bearer ' + process.env.QUAKE_DATA_TOKEN;
  const res = await fetchImpl(process.env.QUAKE_DATA_URL || DEFAULT_URL, { headers });
  if (!res.ok) {
    // A stale reading beats an error page while GitHub hiccups.
    if (cache) return cache.data;
    throw new Error('feed HTTP ' + res.status);
  }
  const data = await res.json();
  globalThis[KEY] = { at: now, data };
  return data;
}

const MOODS = [
  { min: 7, mood: 'panic', line: 'Core-update-level shaking. Richter is not okay.' },
  { min: 5, mood: 'nervous', line: 'Something big is rolling out. Richter is sweating.' },
  { min: 3, mood: 'alert', line: 'Above-normal churn. Richter has one eye open.' },
  { min: 0, mood: 'zen', line: 'Normal churn. Richter is chilling.' },
];
const moodOf = (m) => MOODS.find((x) => (m || 0) >= x.min);

// What anyone may see without an account: the needle, not the instrument.
function pulse(data) {
  const sw = data.sweeps || [];
  const last = sw[sw.length - 1] || null;
  const m = last ? (last.m24 != null ? last.m24 : last.m) : null;
  const cls = (data.scale || []).find((s) => (m || 0) >= s.min) || null;
  const ongoing = (data.events || []).find((e) => e.ongoing) || null;
  const t = last ? Date.parse(last.t) : 0;
  const spark = sw.filter((s) => Date.parse(s.t) >= t - 7 * 864e5).map((s) => (s.m24 != null ? Math.round(s.m24 * 10) / 10 : null));
  const mood = moodOf(m);
  return {
    t: last ? last.t : null,
    mode: data.mode,
    magnitude: m == null ? null : Math.round(m * 10) / 10,
    class: cls ? cls.name : null,
    mood: mood.mood,
    line: mood.line,
    calibrating: !!(last && last.calibrating),
    quake: ongoing ? { since: ongoing.start, peak: Math.round(ongoing.peak * 10) / 10, confirmed: ongoing.confirmed || [] } : null,
    spark,
  };
}

module.exports = { load, pulse, moodOf, DEFAULT_URL };
