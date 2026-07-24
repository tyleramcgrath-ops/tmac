// Command classification — deterministic pattern matching, never free-form
// model text executed as an instruction. This function either returns one of
// the enumerated, registered CommandActionType values or 'unsupported'. There
// is no fallback "improvised" behavior: an unrecognized command is always
// honestly reported as unsupported (see engine.ts).

import type { CommandActionType } from './types'

function norm(raw: string): string {
  return raw.toLowerCase().replace(/[?!.,]/g, ' ').replace(/\s+/g, ' ').trim()
}

const has = (n: string, ...words: string[]) => words.every((w) => n.includes(w))
const any = (n: string, ...words: string[]) => words.some((w) => n.includes(w))

interface Matcher {
  action: CommandActionType
  test: (n: string) => boolean
}

// Order matters — more specific patterns are checked first so, e.g., "deploy"
// alone doesn't misclassify "show recent deployments" as "deploy this".
const MATCHERS: Matcher[] = [
  { action: 'rollback-deployment', test: (n) => any(n, 'roll back', 'rollback', 'revert') },
  { action: 'list-deployments', test: (n) => has(n, 'deploy') && any(n, 'recent', 'show', 'list', 'history') },
  { action: 'deploy-mission', test: (n) => has(n, 'deploy') },
  { action: 'verify-deployment', test: (n) => has(n, 'verify') },
  { action: 'preview-change', test: (n) => has(n, 'preview') },
  { action: 'approve-mission', test: (n) => has(n, 'approve') },
  { action: 'retry-mission', test: (n) => has(n, 'retry') },
  { action: 'cancel-mission', test: (n) => has(n, 'cancel') },
  { action: 'pause-mission', test: (n) => has(n, 'pause') },
  { action: 'resume-mission', test: (n) => has(n, 'resume') },
  { action: 'prioritize-mission', test: (n) => any(n, 'prioriti') },
  { action: 'focus-mission', test: (n) => has(n, 'create') && has(n, 'mission') },
  { action: 'explain-mission', test: (n) => has(n, 'why') && any(n, 'blocked', 'stuck', 'waiting') },
  { action: 'mission-detail', test: (n) => has(n, 'mission') && any(n, 'show', 'detail', 'about', '#') },
  { action: 'list-blocked-missions', test: (n) => any(n, 'blocked') },
  { action: 'list-completed-today', test: (n) => has(n, 'completed') && has(n, 'today') },
  { action: 'list-failed', test: (n) => has(n, 'failed') || (has(n, 'what') && has(n, 'fail')) },
  { action: 'list-approvals', test: (n) => has(n, 'approval') },
  { action: 'scout-findings', test: (n) => has(n, 'scout') },
  { action: 'atlas-recommendation', test: (n) => has(n, 'atlas') },
  { action: 'next-best-action', test: (n) => any(n, 'what should i do', 'next best action', 'what next') },
  { action: 'summarize-project', test: (n) => any(n, 'summari', 'summary') },
  { action: 'list-active-missions', test: (n) => any(n, 'working on', 'in progress', 'active mission') },
]

export interface ClassifiedCommand {
  action: CommandActionType | 'unsupported'
  // A short fragment of the raw text that may name a mission by title, used
  // when no explicit missionId is supplied — e.g. "why is the meta
  // description mission blocked" -> "meta description". Best-effort only;
  // real resolution happens by fuzzy title match in the engine, never
  // fabricated.
  missionHint: string | null
}

export function classifyCommand(raw: string): ClassifiedCommand {
  const n = norm(raw)
  const match = MATCHERS.find((m) => m.test(n))
  const hintMatch = raw.match(/"([^"]+)"/)
  return {
    action: match?.action ?? 'unsupported',
    missionHint: hintMatch ? hintMatch[1] : null,
  }
}
