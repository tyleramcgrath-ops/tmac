// Types for the vendored score.js (apps/citation-gap). Only what SaySites uses.
export interface ScoreRow { key: string; label: string; mine: string | number; target: string | number; earned: number; weight: number; pct: number; note: string }
export interface Fix { key: string; number: number; title: string; body?: string; code?: string; severity: string; effort: string; engine: string; _section?: string }
/* eslint-disable @typescript-eslint/no-explicit-any */
export function medians(comps: any[]): any
export function categoryEntities(comps: any[], ownDomain: string): any
export function scoreRank(mine: any, m: any): [number, ScoreRow[]]
export function scoreAnswer(mine: any, m: any, cov: any, cats: any, vis: any): [number, ScoreRow[], string[]]
export function looBand(comps: any[], mine: any, cov: any, ownDomain: string, vis: any): any
export function buildFixes(mine: any, m: any, rr: ScoreRow[], ar: ScoreRow[], kw: string, cats: any, missing: string[], brand: string, opts?: any): Fix[]
