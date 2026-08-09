// robots.txt parsing, scoped to one question: may a given AI crawler fetch
// this site at all?
//
// This is the part a GEO audit cannot fake. Schema coverage we already know
// from the crawl (PageSignals.schemaTypes); whether GPTBot is blocked is only
// knowable by reading the site's robots.txt and applying the real matching
// rules. A "GEO engine" that takes crawler permissions as an input has
// skipped the only hard part.
//
// Implements the subset of the robots.txt convention that decides root
// access: grouped user-agent blocks, longest-match Allow/Disallow, and the
// `*` fallback group. Deliberately not a general-purpose path matcher — it
// answers "can this bot reach /" and nothing more.

export const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'meta-externalagent',
  'Bytespider',
] as const

export type AiCrawler = (typeof AI_CRAWLERS)[number]

export type CrawlerAccess = 'allowed' | 'blocked' | 'unlisted'

export interface CrawlerVerdict {
  bot: AiCrawler
  access: CrawlerAccess
  // Which line decided it, so the finding can be shown rather than asserted.
  matchedRule?: string
  // The group the rule came from — a bot blocked by `*` is a different
  // conversation from one singled out by name.
  matchedGroup?: string
}

interface Group {
  agents: string[]
  rules: { allow: boolean; path: string }[]
}

// robots.txt groups run: one or more consecutive User-agent lines, then the
// rules that apply to all of them. A User-agent line appearing *after* a rule
// starts a new group — that boundary is what makes naive line-by-line parsing
// wrong.
export function parseRobots(text: string): Group[] {
  const groups: Group[] = []
  let current: Group | null = null
  let lastWasAgent = false

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim()
    if (!line) continue

    const idx = line.indexOf(':')
    if (idx === -1) continue
    const field = line.slice(0, idx).trim().toLowerCase()
    const value = line.slice(idx + 1).trim()

    if (field === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] }
        groups.push(current)
      }
      current.agents.push(value.toLowerCase())
      lastWasAgent = true
      continue
    }

    if (field === 'allow' || field === 'disallow') {
      if (!current) continue // rules before any user-agent line apply to nobody
      lastWasAgent = false
      current.rules.push({ allow: field === 'allow', path: value })
    }
  }

  return groups
}

function groupFor(groups: Group[], bot: string): { group: Group; named: boolean } | null {
  const needle = bot.toLowerCase()
  // An exact name always beats the wildcard, even when the wildcard group is
  // more restrictive — that is the whole point of naming a bot.
  const named = groups.find((g) => g.agents.includes(needle))
  if (named) return { group: named, named: true }
  const wildcard = groups.find((g) => g.agents.includes('*'))
  if (wildcard) return { group: wildcard, named: false }
  return null
}

// Longest-match wins, and Allow wins ties. `Disallow:` with an empty value
// means "nothing is disallowed" and is not a match for anything.
function decideRoot(group: Group): { allowed: boolean; rule?: string } {
  let best: { allow: boolean; path: string } | null = null
  for (const rule of group.rules) {
    if (rule.path === '') continue
    if (!'/'.startsWith(rule.path) && rule.path !== '/') continue
    if (!best || rule.path.length > best.path.length || (rule.path.length === best.path.length && rule.allow)) {
      best = rule
    }
  }
  if (!best) return { allowed: true }
  return {
    allowed: best.allow,
    rule: `${best.allow ? 'Allow' : 'Disallow'}: ${best.path}`,
  }
}

export function crawlerVerdicts(robotsTxt: string | null): CrawlerVerdict[] {
  // No robots.txt at all means nothing is restricted — that is the standard's
  // default, not an unknown, so it is reported as allowed rather than hedged.
  if (robotsTxt === null) {
    return AI_CRAWLERS.map((bot) => ({ bot, access: 'allowed' as const, matchedRule: 'no robots.txt' }))
  }

  const groups = parseRobots(robotsTxt)
  return AI_CRAWLERS.map((bot) => {
    const found = groupFor(groups, bot)
    if (!found) {
      return { bot, access: 'unlisted' as const }
    }
    const { allowed, rule } = decideRoot(found.group)
    return {
      bot,
      access: allowed ? ('allowed' as const) : ('blocked' as const),
      matchedRule: rule,
      matchedGroup: found.named ? bot : '*',
    }
  })
}
