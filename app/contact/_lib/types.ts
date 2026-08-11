// Domain types for the LLM visibility scanner. Shared by the workspace and
// the three AI routes so the model's output and the UI can never drift.

export type Intent = 'discovery' | 'comparison' | 'transactional' | 'reputation'

/** Which assistant a scan was run against. Declared here, not imported from
 *  the server module, so the client bundle never pulls in provider code. */
export type EngineId = 'claude' | 'gpt' | 'grok'

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'absent'

export interface ScanInput {
  brand: string
  domain: string
  /** What the brand actually sells — the category a buyer would search in. */
  category: string
  competitors: string[]
  market: string
}

/** One buyer question, and what the model said when asked it cold. */
export interface Probe {
  id: string
  prompt: string
  intent: Intent
  /** Why this question is worth tracking. */
  why: string
  status: 'pending' | 'running' | 'done' | 'error'
  /** The model's unprimed answer — it was never told which brand we track. */
  answer?: string
  mentioned?: boolean
  /** 1-based position in the answer's recommendations, null when absent. */
  position?: number | null
  sentiment?: Sentiment
  /** Every brand the answer named, in the order it named them. */
  brandsNamed?: string[]
  /** The sentence that mentions the brand, quoted from the answer. */
  evidence?: string
  /** One line on why it landed where it did. */
  note?: string
  error?: string
}

export interface Action {
  title: string
  why: string
  effort: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
}

export interface Plan {
  verdict: string
  actions: Action[]
}

export interface Scan {
  id: string
  createdAt: number
  engine?: EngineId
  input: ScanInput
  probes: Probe[]
  plan?: Plan
  model?: string
}

export interface Account {
  name: string
  email: string
  company: string
  createdAt: number
}

export const INTENT_LABEL: Record<Intent, string> = {
  discovery: 'Discovery',
  comparison: 'Comparison',
  transactional: 'Ready to buy',
  reputation: 'Reputation',
}

export const SENTIMENT_LABEL: Record<Sentiment, string> = {
  positive: 'Recommended',
  neutral: 'Listed',
  negative: 'Caveated',
  absent: 'Not mentioned',
}

/**
 * Visibility score, computed here rather than asked of the model — the same
 * inputs must always produce the same number.
 *
 * Each answered probe scores 0–100: presence is most of it, position is worth
 * a decreasing bonus, and the model's framing adjusts it either way.
 */
export function scoreProbe(probe: Probe): number {
  if (!probe.mentioned) return 0
  const position = probe.position ?? 4
  const placement = position <= 1 ? 40 : position === 2 ? 30 : position === 3 ? 22 : 14
  const framing =
    probe.sentiment === 'positive' ? 20 : probe.sentiment === 'negative' ? -10 : 8
  return Math.max(0, Math.min(100, 40 + placement + framing))
}

export function scoreScan(probes: Probe[]): number {
  const done = probes.filter((probe) => probe.status === 'done')
  if (done.length === 0) return 0
  return Math.round(done.reduce((total, probe) => total + scoreProbe(probe), 0) / done.length)
}

export function scoreBand(score: number): { label: string; tone: 'win' | 'warn' | 'miss' } {
  if (score >= 65) return { label: 'Strong', tone: 'win' }
  if (score >= 35) return { label: 'Patchy', tone: 'warn' }
  if (score > 0) return { label: 'Thin', tone: 'miss' }
  return { label: 'Invisible', tone: 'miss' }
}

/** Who the models actually recommend, counted across every answer. */
export function shareOfVoice(
  probes: Probe[],
  brand: string
): { name: string; count: number; isBrand: boolean }[] {
  const tally = new Map<string, number>()
  for (const probe of probes) {
    for (const named of probe.brandsNamed ?? []) {
      const key = named.trim()
      if (!key) continue
      tally.set(key, (tally.get(key) ?? 0) + 1)
    }
  }
  const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')
  const brandKey = normalise(brand)
  return [...tally.entries()]
    .map(([name, count]) => ({ name, count, isBrand: normalise(name) === brandKey }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 8)
}
