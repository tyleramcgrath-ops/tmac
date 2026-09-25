import ICONS from '@/lib/data/logo-icons.json'
import type { Milestone } from '@/lib/milestones'
import { MilestoneWatcher } from './MilestoneWatcher'

const ICON: Record<string, string> = {
  live: 'globe-hemisphere-west',
  logo: 'pen-nib',
  sofie: 'sparkle',
  photos: 'camera',
  visitor: 'eye',
  message: 'envelope',
  post: 'book-open',
  shop: 'shopping-bag',
  seo: 'star',
  domain: 'key',
}
const paths = ICONS as Record<string, string>

// A row of engraved marks: earned ones inked, the rest waiting with a hint.
export function Milestones({ siteId, siteName, domain, isNew, items }: { siteId: string; siteName: string; domain?: string; isNew: boolean; items: Milestone[] }) {
  const count = items.filter((i) => i.done).length
  return (
    <section className="card milestones" aria-label="Milestones">
      <div className="card-head">
        <h3>Milestones</h3>
        <span className="muted small">{count} of {items.length}</span>
      </div>
      <MilestoneWatcher siteId={siteId} siteName={siteName} domain={domain} isNew={isNew} items={items.map(({ id, done, caption }) => ({ id, done, caption }))}>
        <ol className="marks">
          {items.map((m) => (
            <li key={m.id} data-mark={m.id} className={m.done ? 'mark done' : 'mark'}>
              <a href={m.href} title={m.done ? m.label : m.hint}>
                <svg className="seal" viewBox="0 0 64 64" aria-hidden="true">
                  <circle className="seal-disc" cx="32" cy="32" r="30" />
                  <circle className="seal-ring" cx="32" cy="32" r="25.5" />
                  <path className="seal-icon" d={paths[ICON[m.id]] ?? ''} transform="translate(20 20) scale(0.09375)" />
                </svg>
                <span className="mark-label">{m.label}</span>
                {!m.done && <span className="mark-hint">{m.hint}</span>}
              </a>
            </li>
          ))}
        </ol>
      </MilestoneWatcher>
    </section>
  )
}
