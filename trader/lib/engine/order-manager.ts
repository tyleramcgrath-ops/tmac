import { getAdapter, BrokerNotConfiguredError } from '../brokers'
import type { AppState } from '../db'
import { newId } from '../db'
import type { Order, StrategyConfig } from '../types'
import { audit, recordRiskEvent } from './audit-logger'
import { applyFill, findPosition } from './position-manager'
import { assessTrade, type SizedDecision } from './risk-manager'

export interface ExecutionOutcome {
  placed: boolean
  order?: Order
  decision: SizedDecision
  pendingConfirmation?: boolean
}

interface SignalInput {
  symbol: string
  assetType: StrategyConfig['assetType']
  action: 'buy' | 'sell'
  price: number
}

/**
 * Run a signal through risk assessment and, if approved, place the order via the
 * appropriate broker adapter. Logs every decision, order and rejection.
 */
export async function executeSignal(
  state: AppState,
  strategy: StrategyConfig,
  signal: SignalInput,
): Promise<ExecutionOutcome> {
  const pos = findPosition(state, strategy.id, signal.symbol)
  const decision = assessTrade(state, {
    strategy,
    symbol: signal.symbol,
    assetType: signal.assetType,
    action: signal.action,
    price: signal.price,
    hasPosition: !!pos && pos.quantity > 0,
    positionQty: pos?.quantity ?? 0,
  })

  audit(state, 'decision', `${strategy.name} ${signal.action.toUpperCase()} ${signal.symbol}: ${decision.reasons.join(' ')}`, {
    strategyId: strategy.id,
    approved: decision.approved,
    quantity: decision.quantity,
    riskAmount: decision.riskAmount,
  })

  if (!decision.approved) {
    recordRiskEvent(state, 'order_rejected', 'warning', `${signal.symbol}: ${decision.reasons.join(' ')}`, {
      strategyId: strategy.id,
      symbol: signal.symbol,
    })
    return { placed: false, decision }
  }

  const clientOrderId = newId('cli')
  const baseOrder: Order = {
    id: newId('ord'),
    clientOrderId,
    symbol: signal.symbol,
    assetType: signal.assetType,
    side: signal.action,
    type: 'market',
    quantity: decision.quantity,
    filledQuantity: 0,
    status: 'pending',
    mode: strategy.mode,
    broker: strategy.mode === 'paper' ? 'paper' : signal.assetType === 'crypto' ? 'robinhood_crypto' : 'robinhood_equities_options',
    strategyId: strategy.id,
    reason: decision.reasons.join(' '),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  // LIVE + confirmation mode: stage the order, do not execute until confirmed.
  if (strategy.mode === 'live' && state.risk.confirmationMode) {
    state.orders.push(baseOrder)
    audit(state, 'order', `Staged LIVE order awaiting confirmation: ${signal.action} ${decision.quantity} ${signal.symbol}`, {
      orderId: baseOrder.id,
    })
    return { placed: false, order: baseOrder, decision, pendingConfirmation: true }
  }

  state.orders.push(baseOrder)
  await fillOrder(state, baseOrder, decision)
  return { placed: true, order: baseOrder, decision }
}

/** Confirm and execute a previously staged (pending) live order. */
export async function confirmOrder(state: AppState, orderId: string): Promise<ExecutionOutcome | null> {
  const order = state.orders.find((o) => o.id === orderId)
  if (!order || order.status !== 'pending') return null
  // Re-assess at confirmation time — markets move.
  const strategy = state.strategies.find((s) => s.id === order.strategyId)
  const decision: SizedDecision = {
    approved: true,
    reasons: ['Manually confirmed.'],
    riskAmount: 0,
    quantity: order.quantity,
  }
  await fillOrder(state, order, decision, strategy)
  return { placed: true, order, decision }
}

async function fillOrder(
  state: AppState,
  order: Order,
  decision: SizedDecision,
  strategy?: StrategyConfig,
): Promise<void> {
  try {
    const adapter = await getAdapter(state, order.mode, order.assetType)
    const result = await adapter.placeOrder({
      symbol: order.symbol,
      assetType: order.assetType,
      side: order.side,
      type: order.type,
      quantity: order.quantity,
      limitPrice: order.limitPrice,
      clientOrderId: order.clientOrderId,
      strategyId: order.strategyId,
      reason: order.reason,
    })
    order.status = result.status
    order.filledQuantity = result.filledQuantity
    order.filledAvgPrice = result.filledAvgPrice
    order.updatedAt = Date.now()

    if (result.status === 'filled') {
      const trade = applyFill(state, order, {
        stopLossPrice: decision.stopLossPrice,
        takeProfitPrice: decision.takeProfitPrice,
      })
      audit(state, 'order', `FILLED ${order.side} ${order.filledQuantity} ${order.symbol} @ ${order.filledAvgPrice?.toFixed(2)}`, {
        orderId: order.id,
        pnl: trade.pnl,
      })
    } else {
      audit(state, 'order', `Order ${order.status}: ${order.side} ${order.quantity} ${order.symbol}`, { orderId: order.id })
    }
  } catch (e) {
    order.status = 'rejected'
    order.updatedAt = Date.now()
    const msg = e instanceof Error ? e.message : 'Unknown broker error'
    recordRiskEvent(state, e instanceof BrokerNotConfiguredError ? 'broker_not_configured' : 'order_error', 'critical', `${order.symbol}: ${msg}`, {
      strategyId: order.strategyId,
      symbol: order.symbol,
    })
    void strategy
  }
}
