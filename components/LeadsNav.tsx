// The small menu inside Leads: the pipeline, automations and integrations.
export function LeadsNav({ siteId, on }: { siteId: string; on: 'pipeline' | 'automations' | 'integrations' | 'report' }) {
  const base = `/dashboard/sites/${siteId}/leads`
  const items = [
    { key: 'pipeline', href: base, label: 'Pipeline' },
    { key: 'automations', href: `${base}/automations`, label: 'Automations' },
    { key: 'integrations', href: `${base}/integrations`, label: 'Integrations' },
    { key: 'report', href: `${base}/report`, label: 'Monthly report' },
  ] as const
  return (
    <nav className="leads-nav" aria-label="Leads">
      {items.map((i) => (
        <a key={i.key} href={i.href} aria-current={i.key === on ? 'page' : undefined}>
          {i.label}
        </a>
      ))}
    </nav>
  )
}
