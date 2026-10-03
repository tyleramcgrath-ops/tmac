// What's on the hosting account, for the admin "Hosting health" page.
// SiteGround caps files and folders (inodes); every deploy adds a full copy
// of the app, and when the cap is hit, deploys fail and Site Tools locks.
// This counts what each folder beside the running release holds, so we can
// see what prune-releases removes and what it doesn't. Read-only.

import { readdirSync } from 'fs'
import { basename, dirname, join } from 'path'

export interface FolderCount {
  name: string
  path: string
  // Files and folders inside (each one inode). Capped; see `capped`.
  inodes: number
  capped: boolean
  current: boolean
}

const CAP = 300_000

// Counts every file and folder under `dir`, without following links, up to
// `cap` entries or `ms` milliseconds, whichever comes first.
export function countInodes(dir: string, cap = CAP, ms = 4000): { inodes: number; capped: boolean } {
  const stack = [dir]
  let inodes = 0
  const stop = Date.now() + ms
  while (stack.length) {
    if (inodes >= cap || Date.now() > stop) return { inodes, capped: true }
    const d = stack.pop()!
    let entries
    try {
      entries = readdirSync(d, { withFileTypes: true })
    } catch {
      continue
    }
    for (const e of entries) {
      inodes++
      if (e.isDirectory() && !e.isSymbolicLink()) stack.push(join(d, e.name))
    }
  }
  return { inodes, capped: inodes >= cap }
}

// The folders beside the running app (where SiteGround keeps each release),
// and the folders one level up (where other build copies may live).
export function hostingFolders(cwd = process.cwd()): { cwd: string; levels: { path: string; folders: FolderCount[] }[] } {
  const levels: { path: string; folders: FolderCount[] }[] = []
  // The whole count stays under ~15 seconds, however big the account is.
  const deadline = Date.now() + 15_000
  for (const dir of [dirname(cwd), dirname(dirname(cwd))]) {
    let names: string[] = []
    try {
      names = readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.isSymbolicLink()).map((d) => d.name)
    } catch {
      continue
    }
    const folders = names.slice(0, 40).map((name) => {
      const path = join(dir, name)
      const { inodes, capped } = countInodes(path, CAP, Math.max(0, Math.min(2500, deadline - Date.now())))
      return { name, path, inodes, capped, current: path === cwd || cwd.startsWith(`${path}/`) }
    })
    folders.sort((a, b) => b.inodes - a.inodes)
    levels.push({ path: dir, folders })
  }
  return { cwd: basename(cwd) ? cwd : '/', levels }
}

// Set by the scheduler (instrumentation.ts) each time it runs.
const g = globalThis as { __ssSchedulerRuns?: { at: string; sent: number; error?: string }[] }
export function recordSchedulerRun(sent: number, error?: string): void {
  g.__ssSchedulerRuns = [...(g.__ssSchedulerRuns ?? []), { at: new Date().toISOString(), sent, ...(error ? { error } : {}) }].slice(-5)
}
export const schedulerRuns = () => g.__ssSchedulerRuns ?? []
