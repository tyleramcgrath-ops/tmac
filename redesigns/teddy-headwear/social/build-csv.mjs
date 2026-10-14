// Writes social/calendar.csv from social/plan.json.  Usage: node social/build-csv.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const plan = JSON.parse(readFileSync(join(ROOT, 'social/plan.json'), 'utf8'));
const cell = v => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const nn = n => String(n).padStart(2, '0');
const cols = ['day', 'week', 'phase', 'pillar', 'format', 'platforms', 'title', 'hook', 'caption', 'hashtags', 'cta', 'story', 'image path'];
const rows = [cols];
for (const d of plan.days) {
  const imgs = [`img/social/day-${nn(d.day)}.webp`];
  if (d.format === 'Carousel') for (let i = 1; i <= Math.min(d.script.length, 8); i++) imgs.push(`img/social/day-${nn(d.day)}-s${i}.webp`);
  for (const p of imgs) if (!existsSync(join(ROOT, p))) console.warn('missing image', p);
  rows.push([d.day, d.week, d.phase, d.pillar, d.format, d.platforms.join(' / '), d.title, d.hook, d.caption, d.hashtags.join(' '), d.cta, d.story, imgs.join(' | ')]);
}
writeFileSync(join(ROOT, 'social/calendar.csv'), '﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n') + '\r\n');
console.log('wrote social/calendar.csv with', rows.length - 1, 'rows');
