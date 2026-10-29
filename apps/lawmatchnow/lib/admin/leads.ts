// Leads: stored in Postgres with a simple pipeline, notes and the traffic
// source that brought each one in.

import { hasDb, q } from './db'

export const STAGES = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'matched', label: 'Matched with attorney' },
  { key: 'won', label: 'Retained' },
  { key: 'lost', label: 'Closed / lost' },
  { key: 'spam', label: 'Spam' },
] as const
export type Stage = (typeof STAGES)[number]['key']
export const stageLabel = (k: string) => STAGES.find((s) => s.key === k)?.label ?? k

export const KIND_LABEL: Record<string, string> = {
  evaluation: 'Case review',
  'contact-attorney': 'Message to attorney',
  claim: 'Profile claim',
  general: 'Contact form',
}

export type Activity = { at: string; kind: 'note' | 'stage' | 'email'; text: string }
export type Source = { source?: string; landing?: string; referrer?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_term?: string; gclid?: string; first?: string }
export type Lead = {
  id: string
  created_at: string
  kind: string
  name: string
  email: string
  phone: string
  location: string
  practice: string
  message: string
  page: string
  stage: Stage
  data: Record<string, string>
  source: Source
  activity: Activity[]
  delivered: Record<string, boolean>
}

export async function saveLead(l: Omit<Lead, 'id' | 'created_at' | 'stage' | 'activity' | 'delivered'>): Promise<string | null> {
  if (!hasDb()) return null
  const [row] = await q<{ id: string }>(
    `INSERT INTO lmn_leads (kind, name, email, phone, location, practice, message, page, data, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [l.kind, l.name, l.email, l.phone, l.location, l.practice, l.message, l.page, JSON.stringify(l.data), JSON.stringify(l.source)],
  )
  return row.id
}

export async function markDelivered(id: string, delivered: Record<string, boolean>) {
  if (hasDb()) await q('UPDATE lmn_leads SET delivered = $2 WHERE id = $1', [id, JSON.stringify(delivered)])
}

export async function listLeads({ stage, kind, search, limit = 200 }: { stage?: string; kind?: string; search?: string; limit?: number } = {}) {
  if (!hasDb()) return []
  const where: string[] = [], params: unknown[] = []
  if (stage) { params.push(stage); where.push(`stage = $${params.length}`) }
  else where.push(`stage <> 'spam'`)
  if (kind) { params.push(kind); where.push(`kind = $${params.length}`) }
  if (search) { params.push(`%${search}%`); where.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR phone ILIKE $${params.length} OR location ILIKE $${params.length})`) }
  params.push(limit)
  return q<Lead>(`SELECT * FROM lmn_leads ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT $${params.length}`, params)
}

export async function getLead(id: string) {
  if (!hasDb() || !/^\d+$/.test(id)) return null
  const [row] = await q<Lead>('SELECT * FROM lmn_leads WHERE id = $1', [id])
  return row ?? null
}

export async function addActivity(id: string, a: Omit<Activity, 'at'>, stage?: Stage) {
  const entry = JSON.stringify([{ ...a, at: new Date().toISOString() }])
  if (stage) await q('UPDATE lmn_leads SET stage = $2, activity = activity || $3::jsonb WHERE id = $1', [id, stage, entry])
  else await q('UPDATE lmn_leads SET activity = activity || $2::jsonb WHERE id = $1', [id, entry])
}

export async function leadStats(days: number) {
  if (!hasDb()) return null
  const [totals] = await q<{ total: string; prev: string; new: string; won: string }>(
    `SELECT
       count(*) FILTER (WHERE created_at > now() - make_interval(days => $1)) AS total,
       count(*) FILTER (WHERE created_at <= now() - make_interval(days => $1) AND created_at > now() - make_interval(days => $1 * 2)) AS prev,
       count(*) FILTER (WHERE stage = 'new') AS new,
       count(*) FILTER (WHERE stage = 'won' AND created_at > now() - make_interval(days => $1)) AS won
     FROM lmn_leads WHERE stage <> 'spam'`, [days])
  const byDay = await q<{ day: string; n: string }>(
    `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, count(*) AS n FROM lmn_leads
     WHERE stage <> 'spam' AND created_at > now() - make_interval(days => $1) GROUP BY 1 ORDER BY 1`, [days])
  const group = (col: string) => q<{ k: string; n: string }>(
    `SELECT coalesce(nullif(${col}, ''), '(none)') AS k, count(*) AS n FROM lmn_leads
     WHERE stage <> 'spam' AND created_at > now() - make_interval(days => $1) GROUP BY 1 ORDER BY 2 DESC LIMIT 12`, [days])
  return {
    total: Number(totals.total), prev: Number(totals.prev), open: Number(totals.new), won: Number(totals.won),
    byDay: byDay.map((r) => ({ day: r.day, n: Number(r.n) })),
    byPractice: (await group('practice')).map((r) => ({ k: r.k, n: Number(r.n) })),
    byLocation: (await group('location')).map((r) => ({ k: r.k, n: Number(r.n) })),
    bySource: (await group(`source->>'source'`)).map((r) => ({ k: r.k, n: Number(r.n) })),
    byLanding: (await group(`source->>'landing'`)).map((r) => ({ k: r.k, n: Number(r.n) })),
    byKind: (await group('kind')).map((r) => ({ k: KIND_LABEL[r.k] ?? r.k, n: Number(r.n) })),
  }
}

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

export function leadsCsv(leads: Lead[]) {
  const cols = ['id', 'created_at', 'kind', 'stage', 'name', 'email', 'phone', 'location', 'practice', 'message', 'page', 'source', 'landing', 'utm_campaign']
  const rows = leads.map((l) => [l.id, l.created_at, l.kind, l.stage, l.name, l.email, l.phone, l.location, l.practice, l.message, l.page, l.source?.source, l.source?.landing, l.source?.utm_campaign].map(csvCell).join(','))
  return [cols.join(','), ...rows].join('\n') + '\n'
}
