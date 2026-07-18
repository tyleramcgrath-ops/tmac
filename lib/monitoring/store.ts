// Persistence for the monitoring / Business Twin layer.
//
// Built on the existing Store.getSetting/setSetting key-value surface so it
// works identically on Postgres and the local file store — no schema changes.
// Domain objects are stored as namespaced JSON documents.

import { getStore } from '../db'
import type { ChangeProposal, MonitoredSite, MonitorRun, Snapshot } from './types'

const SITE_INDEX = 'monitor:sites:index' // string[] of site ids
const site = (id: string) => `monitor:site:${id}`
const runIndex = (siteId: string) => `monitor:runs:${siteId}` // string[] of run ids, newest last
const run = (id: string) => `monitor:run:${id}`
const snap = (id: string) => `monitor:snapshot:${id}`
const snapIndexForUrl = (siteId: string, url: string) => `monitor:snapindex:${siteId}:${hash(url)}`

function hash(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

async function readJson<T>(key: string): Promise<T | null> {
  const store = await getStore()
  const raw = await store.getSetting(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  const store = await getStore()
  await store.setSetting(key, JSON.stringify(value))
}

// ─── Sites ───────────────────────────────────────────────────────────────────

export async function listSites(): Promise<MonitoredSite[]> {
  const ids = (await readJson<string[]>(SITE_INDEX)) ?? []
  const sites = await Promise.all(ids.map((id) => readJson<MonitoredSite>(site(id))))
  return sites.filter((s): s is MonitoredSite => s !== null)
}

export async function getSite(id: string): Promise<MonitoredSite | null> {
  return readJson<MonitoredSite>(site(id))
}

export async function saveSite(s: MonitoredSite): Promise<void> {
  await writeJson(site(s.id), s)
  const ids = (await readJson<string[]>(SITE_INDEX)) ?? []
  if (!ids.includes(s.id)) await writeJson(SITE_INDEX, [...ids, s.id])
}

export async function deleteSite(id: string): Promise<boolean> {
  const existing = await getSite(id)
  if (!existing) return false
  const store = await getStore()
  await store.deleteSetting(site(id))
  const ids = (await readJson<string[]>(SITE_INDEX)) ?? []
  await writeJson(
    SITE_INDEX,
    ids.filter((x) => x !== id)
  )
  return true
}

// ─── Snapshots ─────────────────────────────────────────────────────────────��─

export async function saveSnapshot(s: Snapshot): Promise<void> {
  await writeJson(snap(s.id), s)
  const key = snapIndexForUrl(s.siteId, s.url)
  const ids = (await readJson<string[]>(key)) ?? []
  await writeJson(key, [...ids, s.id])
}

export async function getSnapshot(id: string): Promise<Snapshot | null> {
  return readJson<Snapshot>(snap(id))
}

/** Most recent snapshot for a tracked page, or null on the first ever run. */
export async function latestSnapshotForUrl(siteId: string, url: string): Promise<Snapshot | null> {
  const ids = (await readJson<string[]>(snapIndexForUrl(siteId, url))) ?? []
  if (ids.length === 0) return null
  return getSnapshot(ids[ids.length - 1])
}

// ─── Runs ──────────────────────────────────────────────────────────────────��─

export async function saveRun(r: MonitorRun): Promise<void> {
  await writeJson(run(r.id), r)
  const ids = (await readJson<string[]>(runIndex(r.siteId))) ?? []
  await writeJson(runIndex(r.siteId), [...ids, r.id])
}

export async function listRuns(siteId: string): Promise<MonitorRun[]> {
  const ids = (await readJson<string[]>(runIndex(siteId))) ?? []
  const runs = await Promise.all(ids.map((id) => readJson<MonitorRun>(run(id))))
  return runs.filter((x): x is MonitorRun => x !== null)
}

export async function getLatestRun(siteId: string): Promise<MonitorRun | null> {
  const ids = (await readJson<string[]>(runIndex(siteId))) ?? []
  if (ids.length === 0) return null
  return readJson<MonitorRun>(run(ids[ids.length - 1]))
}

export async function getPreviousRun(siteId: string): Promise<MonitorRun | null> {
  const ids = (await readJson<string[]>(runIndex(siteId))) ?? []
  if (ids.length < 2) return null
  return readJson<MonitorRun>(run(ids[ids.length - 2]))
}

// ─── Proposals (agentic fix loop) ────────────────────────────────────────────

const proposal = (id: string) => `monitor:proposal:${id}`
const proposalIndex = (siteId: string) => `monitor:proposals:${siteId}` // string[] of proposal ids

export async function saveProposal(p: ChangeProposal): Promise<void> {
  await writeJson(proposal(p.id), p)
  const ids = (await readJson<string[]>(proposalIndex(p.siteId))) ?? []
  if (!ids.includes(p.id)) await writeJson(proposalIndex(p.siteId), [...ids, p.id])
}

export async function getProposal(id: string): Promise<ChangeProposal | null> {
  return readJson<ChangeProposal>(proposal(id))
}

export async function listProposals(siteId: string): Promise<ChangeProposal[]> {
  const ids = (await readJson<string[]>(proposalIndex(siteId))) ?? []
  const items = await Promise.all(ids.map((id) => readJson<ChangeProposal>(proposal(id))))
  return items.filter((x): x is ChangeProposal => x !== null)
}
