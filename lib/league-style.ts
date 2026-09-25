// How an owner's standings are worded. The numbers are the same in every
// style; owners pick the voice that suits them.
// - classic: calm and professional.
// - market: a stock ticker. Positions, movers, market leaders.
// - arena: a leaderboard for the competitive, with streaks and ranks.

import type { TitleKey } from './league'
import { ordinal } from './league'

export const LEAGUE_STYLES = ['classic', 'market', 'arena'] as const
export type LeagueStyle = (typeof LEAGUE_STYLES)[number]

export interface LeagueTerms {
  name: string
  hint: string
  // "Plumbers" -> the heading for the group.
  group: (trade: string) => string
  thisWeek: string
  lastWeek: string
  position: (rank: number) => string
  of: (n: number) => string
  move: (points: number) => string
  titles: Record<TitleKey, string>
  streak: (weeks: number) => string
  climb: (points: number) => string
  leader: string
  ranked: string
  letterCta: string
  column: string
}

export const LEAGUE_TERMS: Record<LeagueStyle, LeagueTerms> = {
  classic: {
    name: 'Professional',
    hint: 'Calm and understated',
    group: (t) => t,
    thisWeek: 'This week',
    lastWeek: 'Last week’s standing',
    position: (n) => ordinal(n),
    of: (n) => `of ${n}`,
    move: (p) => (p ? `+${p}` : '0'),
    titles: { gain: 'Greatest gain', visibility: 'Highest visibility', growth: 'Fastest growth' },
    streak: (w) => `${w} consecutive weeks of gains`,
    climb: (p) => `${p} Visibility point${p === 1 ? '' : 's'} moves you up one position`,
    leader: 'You hold first position. Standings close Sunday at midnight UTC.',
    ranked: 'Ranked by weekly gain in organic visibility and traffic',
    letterCta: 'Your weekly standing has arrived · Open',
    column: 'Gain',
  },
  market: {
    name: 'Market',
    hint: 'Like a stock ticker',
    group: (t) => `${t} market`,
    thisWeek: 'Today’s market',
    lastWeek: 'Last week’s close',
    position: (n) => `No. ${n}`,
    of: (n) => `of ${n} listed`,
    move: (p) => (p ? `▲ ${p}` : '— 0'),
    titles: { gain: 'Top mover', visibility: 'Market leader', growth: 'Breakout' },
    streak: (w) => `Up ${w} weeks running`,
    climb: (p) => `${p} point${p === 1 ? '' : 's'} to overtake the next position`,
    leader: 'You’re the market leader. The market closes Sunday at midnight UTC.',
    ranked: 'Ranked by weekly movement: points gained plus traffic growth',
    letterCta: 'Your weekly market report is in · Open',
    column: 'Move',
  },
  arena: {
    name: 'Competitive',
    hint: 'Ranks, streaks and bragging rights',
    group: (t) => `${t} leaderboard`,
    thisWeek: 'Live this week',
    lastWeek: 'Last week you finished',
    position: (n) => `#${n}`,
    of: (n) => `of ${n}`,
    move: (p) => (p ? `+${p} pts` : '0 pts'),
    titles: { gain: 'Biggest climb', visibility: 'Top of the board', growth: 'Blowing up' },
    streak: (w) => `🔥 ${w}-week streak`,
    climb: (p) => `${p} point${p === 1 ? '' : 's'} and you pass the one above you`,
    leader: 'You’re #1. Hold it until Sunday midnight UTC.',
    ranked: 'Live ranks: points gained this week plus traffic growth',
    letterCta: 'Your result is in · Tap to reveal',
    column: 'Pts',
  },
}

export function leagueTerms(style: string | undefined): LeagueTerms {
  return LEAGUE_TERMS[(LEAGUE_STYLES as readonly string[]).includes(style ?? '') ? (style as LeagueStyle) : 'classic']
}
