type Tab = 'home' | 'orders' | 'products' | 'discounts' | 'customers' | 'settings'

// The small menu inside the Store tab.
export function StoreNav({ siteId, on, toSend = 0 }: { siteId: string; on: Tab; toSend?: number }) {
  const base = `/dashboard/sites/${siteId}/store`
  const items: { key: Tab; href: string; label: string; badge?: number }[] = [
    { key: 'home', href: base, label: 'Home' },
    { key: 'orders', href: `${base}/orders`, label: 'Orders', badge: toSend },
    { key: 'products', href: `${base}/products`, label: 'Products' },
    { key: 'discounts', href: `${base}/discounts`, label: 'Discounts' },
    { key: 'customers', href: `${base}/customers`, label: 'Customers' },
    { key: 'settings', href: `${base}/settings`, label: 'Settings' },
  ]
  return (
    <nav className="leads-nav" aria-label="Store">
      {items.map((i) => (
        <a key={i.key} href={i.href} aria-current={i.key === on ? 'page' : undefined}>
          {i.label}
          {i.badge ? <span className="badge" aria-label={`${i.badge} to send`}>{i.badge}</span> : null}
        </a>
      ))}
    </nav>
  )
}

const NOTES: Record<string, string> = {
  saved: 'Saved.',
  added: 'Added. It’s on your website now unless it’s a draft.',
  deleted: 'Deleted.',
  copied: 'Copied as a draft. Change what you need, then set it to Active.',
  stock: 'Stock updated.',
  updated: 'Order updated.',
  noted: 'Note added.',
  refunded: 'Refunded through your Stripe account.',
  open: 'Your shop is taking orders.',
  paused: 'Checkout is paused. Your products still show, with a note to get in touch.',
  connected: 'Stripe is connected. Customers can pay you now.',
}

// The note an action leaves after it redirects back.
export function Flash({ m, e }: { m?: string; e?: string }) {
  if (e) return <p className="notice bad" role="alert">{e.slice(0, 300)}</p>
  if (m && NOTES[m]) return <p className="notice good" role="status">{NOTES[m]}</p>
  return null
}
