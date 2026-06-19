import type { AppState } from '../db'
import { newId } from '../db'
import type { AuditLog, RiskEvent } from '../types'

// Trade audit logger. Every signal, decision, order, rejection and risk event
// is recorded so the operator has full visibility into why the engine acted.

export function audit(
  state: AppState,
  category: AuditLog['category'],
  message: string,
  data?: Record<string, unknown>,
): AuditLog {
  const entry: AuditLog = {
    id: newId('log'),
    category,
    message,
    data,
    createdAt: Date.now(),
  }
  state.auditLogs.push(entry)
  return entry
}

export function recordRiskEvent(
  state: AppState,
  type: string,
  severity: RiskEvent['severity'],
  message: string,
  extra?: { strategyId?: string; symbol?: string },
): RiskEvent {
  const event: RiskEvent = {
    id: newId('risk'),
    type,
    severity,
    message,
    strategyId: extra?.strategyId,
    symbol: extra?.symbol,
    createdAt: Date.now(),
  }
  state.riskEvents.push(event)
  audit(state, 'risk', `[${severity}] ${type}: ${message}`, extra)
  return event
}
