import { getStore } from '../db'
import type { CitationSnapshot } from './types'

const snap = (id: string) => `cite:snapshot:${id}`
const index = (siteId: string) => `cite:index:${siteId}` // string[] of snapshot ids, oldest→newest

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await (await getStore()).getSetting(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}
async function writeJson(key: string, value: unknown): Promise<void> {
  await (await getStore()).setSetting(key, JSON.stringify(value))
}

export async function saveCitationSnapshot(s: CitationSnapshot): Promise<void> {
  await writeJson(snap(s.id), s)
  const ids = (await readJson<string[]>(index(s.siteId))) ?? []
  await writeJson(index(s.siteId), [...ids, s.id])
}

export async function listCitationSnapshots(siteId: string): Promise<CitationSnapshot[]> {
  const ids = (await readJson<string[]>(index(siteId))) ?? []
  const items = await Promise.all(ids.map((id) => readJson<CitationSnapshot>(snap(id))))
  return items.filter((x): x is CitationSnapshot => x !== null)
}

export async function latestCitationSnapshot(siteId: string): Promise<CitationSnapshot | null> {
  const ids = (await readJson<string[]>(index(siteId))) ?? []
  if (ids.length === 0) return null
  return readJson<CitationSnapshot>(snap(ids[ids.length - 1]))
}

export async function previousCitationSnapshot(siteId: string): Promise<CitationSnapshot | null> {
  const ids = (await readJson<string[]>(index(siteId))) ?? []
  if (ids.length < 2) return null
  return readJson<CitationSnapshot>(snap(ids[ids.length - 2]))
}
