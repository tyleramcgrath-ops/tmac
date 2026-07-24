// Command Bar — shared domain types (Engine -> API -> UI). The Command Bar
// is a control surface with an enumerable, registered set of actions, not a
// chatbot: only these action types can ever execute, and only through the
// existing real pipelines (recommendations, operator, mission queue).

export type CommandRiskLevel = 'read-only' | 'reversible' | 'consequential'

export type CommandActionType =
  // Level 1 — read-only, execute immediately
  | 'summarize-project'
  | 'list-approvals'
  | 'list-active-missions'
  | 'list-blocked-missions'
  | 'list-completed-today'
  | 'explain-mission'
  | 'scout-findings'
  | 'atlas-recommendation'
  | 'list-deployments'
  | 'list-failed'
  | 'mission-detail'
  | 'next-best-action'
  | 'preview-change'
  | 'verify-deployment'
  // Level 2 — reversible internal change, confirm then execute
  | 'prioritize-mission'
  | 'pause-mission'
  | 'resume-mission'
  | 'focus-mission'
  // Level 3 — external/consequential, explicit confirmation required
  | 'approve-mission'
  | 'deploy-mission'
  | 'retry-mission'
  | 'cancel-mission'
  | 'rollback-deployment'

export type CommandExecutionStatus =
  | 'pending-confirmation'
  | 'executed'
  | 'rejected-permission'
  | 'rejected-unsupported'
  | 'rejected-invalid'
  | 'failed'

export interface CommandRequest {
  commandId: string
  raw: string
  projectId: string
  // A mission the user has already focused (e.g. by selecting it in the
  // Mission Queue panel) — preferred over fuzzy title matching in the text.
  missionId?: string | null
  // true only on the second call, after the user has explicitly confirmed a
  // Level 2/3 plan. Never inferred from the wording of `raw`.
  confirmed?: boolean
  params?: Record<string, unknown>
}

export interface CommandResult {
  commandId: string
  raw: string
  intent: CommandActionType | 'unsupported'
  riskLevel: CommandRiskLevel | null
  projectId: string
  missionId: string | null
  targetResource: string | null
  requestedParams: Record<string, unknown>
  permission: 'allowed' | 'denied'
  confirmationRequired: boolean
  status: CommandExecutionStatus
  message: string
  evidence: unknown
  auditedAt: string | null
}
