import type { Role } from '@/lib/team'

type Tab = 'pipeline' | 'automations' | 'integrations' | 'intake' | 'team' | 'report'

// The small menu inside Leads. Staff see the pipeline and the report; the
// rest is the owner's.
export function LeadsNav({ siteId, on, role = 'owner' }: { siteId: string; on: Tab; role?: Role }) {
  const base = `/dashboard/sites/${siteId}/leads`
  const items: { key: Tab; href: string; label: string; owner?: boolean }[] = [
    { key: 'pipeline', href: base, label: 'Pipeline' },
    { key: 'automations', href: `${base}/automations`, label: 'Automations', owner: true },
    { key: 'intake', href: `${base}/intake`, label: 'Intake questions', owner: true },
    { key: 'integrations', href: `${base}/integrations`, label: 'Integrations', owner: true },
    { key: 'team', href: `${base}/team`, label: 'Team', owner: true },
    { key: 'report', href: `${base}/report`, label: 'Monthly report' },
  ]
  return (
    <nav className="leads-nav" aria-label="Leads">
      {items
        .filter((i) => role === 'owner' || !i.owner)
        .map((i) => (
          <a key={i.key} href={i.href} aria-current={i.key === on ? 'page' : undefined}>
            {i.label}
          </a>
        ))}
    </nav>
  )
}
