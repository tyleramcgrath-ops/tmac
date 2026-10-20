// How a state's rule compares with other states, from the same verified data.

import { STATES, stateByCode } from '@/lib/geo'
import { type FieldKey, allStates, fact } from './facts'

// States sharing a land border (D.C. with MD and VA).
const NEIGHBORS: Record<string, string[]> = {
  AL: ['FL', 'GA', 'MS', 'TN'], AK: [], AZ: ['CA', 'CO', 'NV', 'NM', 'UT'], AR: ['LA', 'MS', 'MO', 'OK', 'TN', 'TX'],
  CA: ['AZ', 'NV', 'OR'], CO: ['AZ', 'KS', 'NE', 'NM', 'OK', 'UT', 'WY'], CT: ['MA', 'NY', 'RI'], DE: ['MD', 'NJ', 'PA'],
  DC: ['MD', 'VA'], FL: ['AL', 'GA'], GA: ['AL', 'FL', 'NC', 'SC', 'TN'], HI: [], ID: ['MT', 'NV', 'OR', 'UT', 'WA', 'WY'],
  IL: ['IN', 'IA', 'KY', 'MO', 'WI'], IN: ['IL', 'KY', 'MI', 'OH'], IA: ['IL', 'MN', 'MO', 'NE', 'SD', 'WI'],
  KS: ['CO', 'MO', 'NE', 'OK'], KY: ['IL', 'IN', 'MO', 'OH', 'TN', 'VA', 'WV'], LA: ['AR', 'MS', 'TX'], ME: ['NH'],
  MD: ['DE', 'DC', 'PA', 'VA', 'WV'], MA: ['CT', 'NH', 'NY', 'RI', 'VT'], MI: ['IN', 'OH', 'WI'], MN: ['IA', 'ND', 'SD', 'WI'],
  MS: ['AL', 'AR', 'LA', 'TN'], MO: ['AR', 'IL', 'IA', 'KS', 'KY', 'NE', 'OK', 'TN'], MT: ['ID', 'ND', 'SD', 'WY'],
  NE: ['CO', 'IA', 'KS', 'MO', 'SD', 'WY'], NV: ['AZ', 'CA', 'ID', 'OR', 'UT'], NH: ['ME', 'MA', 'VT'], NJ: ['DE', 'NY', 'PA'],
  NM: ['AZ', 'CO', 'OK', 'TX', 'UT'], NY: ['CT', 'MA', 'NJ', 'PA', 'VT'], NC: ['GA', 'SC', 'TN', 'VA'], ND: ['MN', 'MT', 'SD'],
  OH: ['IN', 'KY', 'MI', 'PA', 'WV'], OK: ['AR', 'CO', 'KS', 'MO', 'NM', 'TX'], OR: ['CA', 'ID', 'NV', 'WA'],
  PA: ['DE', 'MD', 'NJ', 'NY', 'OH', 'WV'], RI: ['CT', 'MA'], SC: ['GA', 'NC'], SD: ['IA', 'MN', 'MT', 'NE', 'ND', 'WY'],
  TN: ['AL', 'AR', 'GA', 'KY', 'MS', 'MO', 'NC', 'VA'], TX: ['AR', 'LA', 'NM', 'OK'], UT: ['AZ', 'CO', 'ID', 'NV', 'NM', 'WY'],
  VT: ['MA', 'NH', 'NY'], VA: ['DC', 'KY', 'MD', 'NC', 'TN', 'WV'], WA: ['ID', 'OR'], WV: ['KY', 'MD', 'OH', 'PA', 'VA'],
  WI: ['IL', 'IA', 'MI', 'MN'], WY: ['CO', 'ID', 'MT', 'NE', 'SD', 'UT'],
}

export const neighbors = (code: string) => (NEIGHBORS[code] ?? []).map((c) => stateByCode(c)!).filter(Boolean)

/** Neighboring states' value for the same fact (only where verified). */
export function neighborValues(code: string, key: FieldKey) {
  return neighbors(code)
    .map((s) => ({ s, f: fact(s.code, key) }))
    .filter((r) => r.f)
}

/** One sentence placing a state's deadline (or other numeric fact) among all states. */
export function rankSentence(code: string, key: FieldKey, noun: string): string | null {
  const mine = fact(code, key)
  if (mine?.years == null) return null
  const all = allStates(key).filter((r) => r.f.years != null)
  if (all.length < 30) return null
  const shorter = all.filter((r) => r.f.years! < mine.years!).length
  const longer = all.filter((r) => r.f.years! > mine.years!).length
  const same = all.length - shorter - longer - 1
  const name = stateByCode(code)!.name
  if (shorter === 0) return `${name}'s ${noun} (${mine.value}) is the shortest in the country${same ? `, shared with ${same} other jurisdictions` : ''}; ${longer} of ${all.length} allow longer.`
  if (longer === 0) return `${name}'s ${noun} (${mine.value}) is the longest in the country${same ? `, shared with ${same} other jurisdictions` : ''}.`
  return `${name}'s ${noun} (${mine.value}) is longer than in ${shorter} jurisdictions and shorter than in ${longer}${same ? `; ${same} others use the same deadline` : ''}.`
}

/** "Florida is one of 12 states with ..." for category facts like the negligence rule. */
export function shareSentence(code: string, key: FieldKey, describe: (value: string) => string): string | null {
  const mine = fact(code, key)
  if (!mine?.value) return null
  const all = allStates(key)
  if (all.length < 30) return null
  const norm = (s: string) => s.toLowerCase().replace(/\s*\(.*\)$/, '').trim()
  const peers = all.filter((r) => r.code !== code && norm(r.f.value!) === norm(mine.value!))
  const name = stateByCode(code)!.name
  if (!peers.length) return `${name} is the only jurisdiction with ${describe(mine.value)}.`
  const sample = peers.slice(0, 6).map((r) => stateByCode(r.code)!.name)
  return `${name} is one of ${peers.length + 1} jurisdictions with ${describe(mine.value)}${peers.length <= 6 ? `, along with ${list(sample)}` : `, including ${list(sample)}`}.`
}

const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`)

export const ALL_STATES = STATES
