// SiteGround's Node.js hosting puts each deploy in a new folder beside the
// last ones (".nodeapp/1790973536-im6ky2", the app itself running from its
// "app_source" folder) and never removes the old ones,
// so every update adds ~15,000 files toward the plan's inode limit. On
// start, remove old releases, keeping the one running now and the one before
// it (for a rollback). Anything else in the folder is left alone, and a
// failure here never stops the app from starting.

import { readdirSync, rmSync } from 'fs'
import { basename, dirname, join } from 'path'

const RELEASE = /^(\d{10})-[a-z0-9]{6}$/

export function pruneReleases(cwd = process.cwd()): string[] {
  const removed: string[] = []
  try {
    // The release folder is where the app runs, or the one just above it.
    const release = [cwd, dirname(cwd)].find((d) => RELEASE.test(basename(d)))
    if (!release) return removed
    const mine = basename(release).match(RELEASE)!
    const parent = dirname(release)
    const older = readdirSync(parent, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.isSymbolicLink())
      .map((d) => ({ name: d.name, at: Number(d.name.match(RELEASE)?.[1] ?? NaN) }))
      // Real deploy times only (after 2020): never SiteGround's own
      // "1234567890-origin" folder.
      .filter((d) => d.at > 1_600_000_000 && d.at < Number(mine[1]) && !d.name.endsWith('-origin'))
      .sort((a, b) => b.at - a.at)
    for (const old of older.slice(1)) {
      rmSync(join(parent, old.name), { recursive: true, force: true })
      removed.push(old.name)
      console.log(`[prune-releases] removed old release ${old.name}`)
    }
  } catch (e) {
    console.error('[prune-releases] skipped:', e instanceof Error ? e.message : e)
  }
  return removed
}
