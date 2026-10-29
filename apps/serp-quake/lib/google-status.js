// Google's own record of confirmed ranking updates, from the Search Status
// Dashboard's public incident feed. Google confirms only some updates, late,
// and its "severity" field says nothing about size, so this is used as ground
// truth for calibration and as labels on the seismograph, never as a reading.

'use strict';

const FEED = 'https://status.search.google.com/incidents.json';

function kindOf(name) {
  const n = name.toLowerCase();
  if (n.includes('core')) return 'core';
  if (n.includes('spam')) return 'spam';
  if (n.includes('review')) return 'reviews';
  if (n.includes('helpful')) return 'helpful-content';
  if (n.includes('discover')) return 'discover';
  return 'other';
}

async function fetchConfirmedUpdates() {
  const r = await fetch(FEED);
  if (!r.ok) throw new Error(`status feed HTTP ${r.status}`);
  const list = await r.json();
  return list
    .filter((i) => i.service_name === 'Ranking')
    .map((i) => ({ id: i.id, name: i.external_desc, kind: kindOf(i.external_desc), begin: i.begin, end: i.end || null }))
    .sort((a, b) => a.begin.localeCompare(b.begin));
}

// The confirmed update (if any) whose rollout window overlaps [start, end].
function overlapping(updates, start, end) {
  const s = Date.parse(start); const e = Date.parse(end || start);
  return updates.filter((u) => Date.parse(u.begin) <= e && (u.end ? Date.parse(u.end) : Infinity) >= s);
}

module.exports = { FEED, fetchConfirmedUpdates, overlapping, kindOf };
