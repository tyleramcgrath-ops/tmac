import { LAW_FIRMS } from './law'
import { TRADES } from './trades'
import type { Industry } from './types'

export type { Industry } from './types'

// Law firms first: they have the most to gain from leaving expensive,
// locked-in legal website platforms.
export const INDUSTRIES: Industry[] = [LAW_FIRMS, ...TRADES]

export function industry(slug: string): Industry | undefined {
  return INDUSTRIES.find((i) => i.slug === slug)
}
