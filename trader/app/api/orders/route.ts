import { NextResponse } from 'next/server'
import { getStore } from '@/lib/db'
import { confirmOrder } from '@/lib/engine'
import { audit } from '@/lib/engine/audit-logger'

export const dynamic = 'force-dynamic'

// Confirm or cancel staged orders (live confirmation-mode workflow).
export async function POST(req: Request) {
  const { action, orderId } = (await req.json().catch(() => ({}))) as {
    action?: string
    orderId?: string
  }
  const store = await getStore()
  const state = store.get()
  try {
    if (action === 'confirm' && orderId) {
      const outcome = await confirmOrder(state, orderId)
      store.schedulePersist()
      if (!outcome) return NextResponse.json({ error: 'Order not pending' }, { status: 400 })
      return NextResponse.json({ ok: true })
    }
    if (action === 'cancel' && orderId) {
      const order = state.orders.find((o) => o.id === orderId)
      if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (order.status === 'pending' || order.status === 'submitted') {
        order.status = 'cancelled'
        order.updatedAt = Date.now()
        audit(state, 'order', `Order cancelled by user: ${order.symbol}`, { orderId })
        store.schedulePersist()
        return NextResponse.json({ ok: true })
      }
      return NextResponse.json({ error: 'Order not cancellable' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 })
  }
}
