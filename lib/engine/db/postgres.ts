import { Pool } from 'pg'
import type { Report, ReportSummary } from '../types'
import type { Store } from './index'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS reports (
  id            TEXT PRIMARY KEY,
  user_url      TEXT NOT NULL,
  keyword       TEXT NOT NULL,
  location      TEXT NOT NULL,
  device        TEXT NOT NULL,
  language      TEXT,
  status        TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL,
  completed_at  TIMESTAMPTZ,
  overall_score INTEGER,
  error         TEXT,
  steps_json    JSONB NOT NULL DEFAULT '[]',
  results_json  JSONB
);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports (created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`

export class PostgresStore implements Store {
  private pool: Pool

  constructor(connectionString: string) {
    // Hosted Postgres (Neon, Vercel Postgres, Supabase, RDS) requires TLS.
    // Enable it for anything that isn't an explicit local/disabled connection.
    const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString)
    const sslDisabled = /sslmode=disable/.test(connectionString)
    const ssl = isLocal || sslDisabled ? undefined : { rejectUnauthorized: false }
    this.pool = new Pool({ connectionString, max: 5, ssl })
  }

  async init(): Promise<void> {
    await this.pool.query(SCHEMA)
  }

  async saveReport(r: Report): Promise<void> {
    await this.pool.query(
      `INSERT INTO reports (id, user_url, keyword, location, device, language, status,
                            created_at, completed_at, overall_score, error, steps_json, results_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         completed_at = EXCLUDED.completed_at,
         overall_score = EXCLUDED.overall_score,
         error = EXCLUDED.error,
         steps_json = EXCLUDED.steps_json,
         results_json = EXCLUDED.results_json`,
      [
        r.id,
        r.input.url,
        r.input.keyword,
        r.input.country,
        r.input.device,
        r.input.language ?? null,
        r.status,
        r.createdAt,
        r.completedAt,
        r.overallScore,
        r.error,
        JSON.stringify(r.steps),
        r.results ? JSON.stringify(r.results) : null,
      ]
    )
  }

  async getReport(id: string): Promise<Report | null> {
    const { rows } = await this.pool.query('SELECT * FROM reports WHERE id = $1', [id])
    if (rows.length === 0) return null
    return rowToReport(rows[0])
  }

  async listReports(): Promise<ReportSummary[]> {
    const { rows } = await this.pool.query(
      `SELECT id, user_url, keyword, location, device, language, status, created_at, overall_score
       FROM reports ORDER BY created_at DESC LIMIT 200`
    )
    return rows.map((row) => ({
      id: row.id,
      input: {
        url: row.user_url,
        keyword: row.keyword,
        country: row.location,
        device: row.device,
        language: row.language ?? undefined,
      },
      status: row.status,
      createdAt: toIso(row.created_at),
      overallScore: row.overall_score,
    }))
  }

  async deleteReport(id: string): Promise<boolean> {
    const res = await this.pool.query('DELETE FROM reports WHERE id = $1', [id])
    return (res.rowCount ?? 0) > 0
  }

  async getSetting(key: string): Promise<string | null> {
    const { rows } = await this.pool.query('SELECT value FROM settings WHERE key = $1', [key])
    return rows[0]?.value ?? null
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, value]
    )
  }

  async deleteSetting(key: string): Promise<void> {
    await this.pool.query('DELETE FROM settings WHERE key = $1', [key])
  }
}

function toIso(v: unknown): string {
  return v instanceof Date ? v.toISOString() : String(v)
}

function rowToReport(row: Record<string, unknown>): Report {
  return {
    id: row.id as string,
    input: {
      url: row.user_url as string,
      keyword: row.keyword as string,
      country: row.location as string,
      device: row.device as 'desktop' | 'mobile',
      language: (row.language as string | null) ?? undefined,
    },
    status: row.status as Report['status'],
    steps: (row.steps_json ?? []) as Report['steps'],
    error: (row.error as string | null) ?? null,
    createdAt: toIso(row.created_at),
    completedAt: row.completed_at ? toIso(row.completed_at) : null,
    overallScore: (row.overall_score as number | null) ?? null,
    results: (row.results_json ?? null) as Report['results'],
  }
}
