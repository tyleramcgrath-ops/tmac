// AI Search Intelligence (Phase G §2). Provider abstraction over ChatGPT, Google
// AI Overviews, Perplexity, Gemini, and Claude (when their APIs permit).
// Tracks brand/entity mentions, citation frequency, missing citations, and
// competitor citations — each observation graded Observed / Estimated /
// Unavailable, NEVER blurred.

import type { Provider, ProviderConfig, ProviderOutcome, ProviderStatus } from '../types'
import { guard, statusFor } from './shared'

export type AiEngine = 'chatgpt' | 'ai-overviews' | 'perplexity' | 'gemini' | 'claude'

export interface AiVisibility {
  engine: AiEngine
  query: string
  brandMentioned: boolean
  entityMentions: string[]
  citationCount: number
  cited: boolean // was our domain cited as a source
  competitorCitations: string[] // competitor domains cited instead
}

export interface AiSearchProvider extends Provider {
  readonly kind: 'ai-search'
  readonly engine: AiEngine
  // Query an AI engine for visibility on a prompt about the brand/topic.
  probe(query: string): Promise<ProviderOutcome<AiVisibility>>
}

// The default: nothing connected → every probe is honestly Unavailable.
export class NullAiSearchProvider implements AiSearchProvider {
  readonly kind = 'ai-search' as const
  constructor(readonly id: string, readonly engine: AiEngine) {}
  status(): ProviderStatus {
    return statusFor(this.id, 'ai-search', { connected: false }, null)
  }
  async probe(): Promise<ProviderOutcome<AiVisibility>> {
    return { ok: false, reason: 'disconnected', detail: `${this.engine} AI-search provider not connected.` }
  }
}

// Deterministic mock for the test matrix (connected / partial / failures /
// credential rotation). Real engines would replace this behind the same
// interface; the consumer code never changes.
export class MockAiSearchProvider implements AiSearchProvider {
  readonly kind = 'ai-search' as const
  constructor(
    readonly id: string,
    readonly engine: AiEngine,
    private config: ProviderConfig,
    private readonly fixtures: Record<string, AiVisibility> = {},
    private readonly now = '2026-07-17T06:00:00Z'
  ) {}
  // Credential rotation: swap the config, status + outcomes update immediately.
  rotate(config: ProviderConfig) {
    this.config = config
  }
  status(): ProviderStatus {
    return statusFor(this.id, 'ai-search', this.config, this.now)
  }
  async probe(query: string): Promise<ProviderOutcome<AiVisibility>> {
    const blocked = guard<AiVisibility>(this.config)
    if (blocked) return blocked
    const fixture = this.fixtures[query] ?? {
      engine: this.engine, query, brandMentioned: false, entityMentions: [], citationCount: 0, cited: false, competitorCitations: [],
    }
    // A partial response omits competitor citations (a common real-world case).
    const data = this.config.partial ? { ...fixture, competitorCitations: [] } : fixture
    return { ok: true, data, grade: 'observed', source: `ai:${this.engine}`, fetchedAt: this.now, partial: this.config.partial }
  }
}
