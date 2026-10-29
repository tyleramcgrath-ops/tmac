// Settings saved from the dashboard instead of environment variables, for
// values too long for SiteGround's variable fields (a Google key file is
// ~2,300 characters). Kept in the home folder, outside SiteGround's release
// folders, so they survive deploys; readable only by the app's own user.

import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const dataDir = () => process.env.LMN_DATA_DIR || join(homedir(), 'lmn-data')

export type LocalConf = { googleKey?: string; ga4PropertyId?: string; gscSiteUrl?: string }

const file = () => join(dataDir(), 'settings.json')

export function readConf(): LocalConf {
  try { return JSON.parse(readFileSync(file(), 'utf8')) as LocalConf } catch { return {} }
}

export function writeConf(patch: LocalConf) {
  const next = { ...readConf(), ...patch }
  mkdirSync(dataDir(), { recursive: true, mode: 0o700 })
  writeFileSync(`${file()}.tmp`, JSON.stringify(next), { mode: 0o600 })
  renameSync(`${file()}.tmp`, file())
  chmodSync(file(), 0o600)
}
