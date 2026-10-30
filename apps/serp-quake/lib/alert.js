// Optional push alerts when the ground starts (and stops) shaking. Posts to a
// Slack incoming webhook (QUAKE_SLACK_WEBHOOK_URL — its own name, so it never posts into the repo's lead-alert channel) and/or any URL that takes JSON
// (QUAKE_WEBHOOK_URL). Neither set = no alerts, the dashboard still updates.

'use strict';

const { classify } = require('./seismo');

function messagesFor(sweep, state) {
  const out = [];
  const fmt = (m) => (m == null ? '?' : m.toFixed(1));
  if (sweep.eventStarted) {
    const f = Object.entries(sweep.faults).filter(([, x]) => x.active).map(([v]) => v);
    out.push({ kind: 'event_started', text: `SERP quake detected: M${fmt(sweep.m24)} (${classify(sweep.m24 || 0).name}) — ${Math.round(sweep.breadth * 100)}% of keywords shaking at 2x+ normal${f.length ? `, fault lines: ${f.join(', ')}` : ''}.` });
  } else if (state.event && sweep.m24 != null && Math.floor(sweep.m24) > Math.floor(state.event.lastAlerted || 0) && sweep.m24 >= state.event.peak) {
    out.push({ kind: 'event_intensified', text: `SERP quake intensifying: now M${fmt(sweep.m24)} (${classify(sweep.m24).name}).` });
  }
  if (state.event && sweep.m24 != null) state.event.lastAlerted = Math.max(state.event.lastAlerted || 0, sweep.m24);
  if (sweep.eventEnded) {
    const ev = state.events[state.events.length - 1];
    out.push({ kind: 'event_ended', text: `SERP quake over: peaked at M${fmt(ev.peak)} (${classify(ev.peak).name}) on ${ev.peakAt.slice(0, 10)}, ${ev.start.slice(0, 10)} → ${ev.end.slice(0, 10)}.` });
  }
  if (sweep.instrument.interference) {
    out.push({ kind: 'interference', text: `SERP quake monitor: ${Math.round(sweep.instrument.rejectedShare * 100)}% of readings rejected as malformed or poisoned — Google may be feeding scrapers altered results. Readings are held, not alarmed on.` });
  }
  return out;
}

async function send(messages, env = process.env) {
  for (const m of messages) {
    if (env.QUAKE_SLACK_WEBHOOK_URL) await post(env.QUAKE_SLACK_WEBHOOK_URL, { text: m.text });
    if (env.QUAKE_WEBHOOK_URL) await post(env.QUAKE_WEBHOOK_URL, m);
  }
}

async function post(url, body) {
  try {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch (e) {
    console.error('alert failed:', e.message);
  }
}

module.exports = { messagesFor, send };
