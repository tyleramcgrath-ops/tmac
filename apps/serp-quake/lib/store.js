// Flat-file storage, so the monitor runs anywhere (a laptop, a cron box, a
// GitHub Actions runner committing to a data branch) with no database.
//   state.json    stations' last accepted SERP + quiet history, open event
//   sweeps.jsonl  one line per sweep, append-only: the seismogram itself
//   events.json   closed events
//   confirmed.json  cached Google-confirmed updates

'use strict';

const fs = require('fs');
const path = require('path');
const { emptyState } = require('./seismo');

function load(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const read = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { return d; } };
  const state = read('state.json', null) || emptyState();
  state.events = read('events.json', []);
  state.sweeps = readSweeps(dir);
  return state;
}

function readSweeps(dir) {
  try {
    return fs.readFileSync(path.join(dir, 'sweeps.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  } catch (e) { return []; }
}

function save(dir, state, newSweeps) {
  fs.mkdirSync(dir, { recursive: true });
  const { sweeps, events, ...rest } = state;
  void sweeps;
  writeAtomic(path.join(dir, 'state.json'), JSON.stringify(rest));
  writeAtomic(path.join(dir, 'events.json'), JSON.stringify(events, null, 1));
  if (newSweeps && newSweeps.length) {
    fs.appendFileSync(path.join(dir, 'sweeps.jsonl'), newSweeps.map((s) => JSON.stringify(s)).join('\n') + '\n');
  }
}

function writeAtomic(file, text) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, file);
}

function readConfirmed(dir) {
  try { return JSON.parse(fs.readFileSync(path.join(dir, 'confirmed.json'), 'utf8')); } catch (e) { return []; }
}

function writeConfirmed(dir, list) {
  fs.mkdirSync(dir, { recursive: true });
  writeAtomic(path.join(dir, 'confirmed.json'), JSON.stringify(list, null, 1));
}

module.exports = { load, save, readSweeps, readConfirmed, writeConfirmed };
