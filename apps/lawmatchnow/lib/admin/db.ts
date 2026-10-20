// Postgres storage for leads, traffic and SEO results. Set DATABASE_URL (the
// SaySites database works: every table here is prefixed lmn_). Tables create
// themselves on first use. Without a database, the site still runs and leads
// are still emailed; the dashboard has no leads or traffic to show,
// though SEO results are kept in a local file (see kvGet).

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { Pool, types } from 'pg'

// Return timestamps and dates as ISO strings, as the rest of the site expects.
types.setTypeParser(1184, (v) => new Date(v).toISOString())
types.setTypeParser(1114, (v) => new Date(`${v}Z`).toISOString())
types.setTypeParser(1082, (v) => v)

const SCHEMA = `
CREATE TABLE IF NOT EXISTS lmn_leads (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  practice TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  page TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'new',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  source JSONB NOT NULL DEFAULT '{}'::jsonb,
  activity JSONB NOT NULL DEFAULT '[]'::jsonb,
  delivered JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS lmn_leads_created ON lmn_leads (created_at DESC);
CREATE TABLE IF NOT EXISTS lmn_visits (
  day DATE NOT NULL, path TEXT NOT NULL, views INT NOT NULL DEFAULT 0, visitors INT NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
);
CREATE TABLE IF NOT EXISTS lmn_referrers (
  day DATE NOT NULL, source TEXT NOT NULL, visits INT NOT NULL DEFAULT 0,
  PRIMARY KEY (day, source)
);
CREATE TABLE IF NOT EXISTS lmn_events (
  day DATE NOT NULL, name TEXT NOT NULL, label TEXT NOT NULL DEFAULT '', count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (day, name, label)
);
CREATE TABLE IF NOT EXISTS lmn_kv (
  key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`

let pool: Pool | null = null
let ready: Promise<void> | null = null

export const hasDb = () => !!process.env.DATABASE_URL

function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set')
  if (!pool) {
    // Hosted Postgres often hands out ?sslmode=require; pg treats that loosely,
    // so ask for full verification instead.
    const url = process.env.DATABASE_URL.replace(/sslmode=require\b/, 'sslmode=verify-full')
    pool = new Pool({ connectionString: url, max: 3 })
  }
  return pool
}

export async function q<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const p = getPool()
  ready ??= p.query(SCHEMA).then(() => undefined).catch((err) => { ready = null; throw err })
  await ready
  const r = await p.query(sql, params)
  return r.rows as T[]
}

// Without a database, small settings and SEO results (audits, PageSpeed runs)
// go to a JSON file in the home folder, outside SiteGround's release folders
// so it survives deploys. LMN_DATA_DIR overrides the location.
type KvFile = Record<string, { value: unknown; updated_at: string }>
const kvPath = () => join(process.env.LMN_DATA_DIR || join(homedir(), 'lmn-data'), 'kv.json')
function readKvFile(): KvFile {
  try { return JSON.parse(readFileSync(kvPath(), 'utf8')) as KvFile } catch { return {} }
}
function writeKvFile(data: KvFile) {
  const file = kvPath()
  mkdirSync(join(file, '..'), { recursive: true })
  writeFileSync(`${file}.tmp`, JSON.stringify(data))
  renameSync(`${file}.tmp`, file)
}

export async function kvGet<T>(key: string): Promise<{ value: T; updated_at: string } | null> {
  if (!hasDb()) return (readKvFile()[key] as { value: T; updated_at: string } | undefined) ?? null
  const [row] = await q<{ value: T; updated_at: string }>('SELECT value, updated_at FROM lmn_kv WHERE key = $1', [key])
  return row ?? null
}

export async function kvSet(key: string, value: unknown) {
  if (!hasDb()) {
    try { writeKvFile({ ...readKvFile(), [key]: { value, updated_at: new Date().toISOString() } }) } catch (err) { console.error('[kv]', (err as Error).message) }
    return
  }
  await q('INSERT INTO lmn_kv (key, value, updated_at) VALUES ($1, $2, now()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()', [key, JSON.stringify(value)])
}
