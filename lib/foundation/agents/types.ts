// Multi-Agent SEO Operating System (Phase F) — shared types.
//
// RankForge becomes a coordinated team of specialized agents rather than a
// single decision-maker. CRITICAL DESIGN CONSTRAINT: agents are ROLES over the
// ONE issue-evaluation pipeline hardened in D.6 (P3), not nine parallel rule
// engines. Multiple agents independently analyze the SAME finding, contribute a
// stance (support/concern) with confidence + evidence + assumptions, and a
// consensus is synthesized. Disagreement is surfaced, never hidden. No agent
// fabricates data — where a signal is unavailable (e.g. off-site backlinks),
// the agent reports "unknown", exactly as the rest of RankForge does.

export type AgentId =
  | 'scout'
  | 'strategist'
  | 'technical'
  | 'content'
  | 'local'
  | 'authority'
  | 'cro'
  | 'operator'
  | 'qa'

export interface AgentDef {
  id: AgentId
  name: string
  // The single sentence of responsibility (kept deliberately narrow).
  responsibility: string
  // What this agent must NEVER do (separation of duties).
  neverDoes: string
}

// One agent's position on a specific finding. This is the atomic unit of
// collaboration: every coordinated recommendation is a set of these.
export type Position = 'support' | 'concern' | 'neutral'

export interface AgentStance {
  agentId: AgentId
  position: Position
  // 0-100 — this agent's confidence in its own position, not the finding's.
  confidence: number
  // Concrete, verifiable evidence this agent rests on (never invented).
  evidence: string[]
  // Explicit assumptions — the raw material QA attacks.
  assumptions: string[]
  // One-line rationale for the position.
  note: string
}

export type ConsensusStatus = 'agree' | 'disagree' | 'needs-review' | 'human-required'

// Who touched a recommendation, in order. Every coordinated recommendation must
// carry a full chain — no recommendation appears without traceable ownership.
export interface Provenance {
  discoveredBy: AgentId // always 'scout' — facts come from the crawl
  analyzedBy: AgentId // the primary domain owner
  challengedBy: AgentId // always 'qa'
  prioritizedBy: AgentId // always 'strategist'
  approvedBy: string | null // human user id / 'policy' / null (not yet approved)
  deployedBy: AgentId | null // 'operator' once deployed, else null
  verifiedBy: AgentId | null // 'operator' once read-back verified, else null
}

// The synthesized multi-agent view attached to a recommendation.
export interface RecommendationCoordination {
  primaryOwner: AgentId
  stances: AgentStance[]
  consensus: ConsensusStatus
  consensusReason: string
  provenance: Provenance
  // Surfaced disagreement, in plain language (empty when all agree).
  disagreements: string[]
}

// An honest, advisory observation an agent makes that the core rule pipeline
// does not cover (e.g. Authority's linkable-asset candidates). NOT a fabricated
// recommendation — it is clearly scoped as an opportunity/observation and may
// explicitly say the data is unavailable.
export interface AgentObservation {
  agentId: AgentId
  kind: 'opportunity' | 'limitation' | 'note'
  title: string
  detail: string
  evidenceUrls: string[]
  // 'unknown' when the agent cannot assess without external data.
  confidence: number | 'unknown'
}

export interface AgentReport {
  agentId: AgentId
  name: string
  active: boolean // Local/Authority only activate when relevant
  ownedFindings: number // how many recommendations this agent primarily owns
  observations: AgentObservation[]
  summary: string
}

// A task one agent creates for another (the orchestrator materializes the
// canonical chain; agents can also raise ad-hoc tasks).
export type TaskKind =
  | 'analyze'
  | 'reprioritize'
  | 'challenge'
  | 'prepare-deploy'
  | 'verify'
  | 'record'
  | 'human-review'

export type TaskStatus = 'open' | 'done' | 'blocked'

export interface AgentTask {
  id: string
  issueId: string
  fromAgent: AgentId
  toAgent: AgentId
  kind: TaskKind
  status: TaskStatus
  note: string
}

// Per-agent memory — so no agent repeats the same mistake.
export interface AgentMemory {
  agentId: AgentId
  totalOwned: number
  accepted: number
  rejected: number // user disagreed → a "mistake" signal
  overridden: number // user changed the agent's status after the fact
  verified: number
  rolledBack: number // deployed then reverted → a strong mistake signal
  // Rolling confidence the agent's owned recs were correct (accepted+verified).
  reliability: number // 0-1
  // Bounded, deterministic self-adjustment the agent SHOULD apply next time.
  suggestedConfidenceNudge: number // [-0.15, +0.15]
  lessons: string[] // human-readable, e.g. "rolled back 2 canonical changes"
}
