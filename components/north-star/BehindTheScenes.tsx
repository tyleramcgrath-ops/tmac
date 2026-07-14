import { Activity } from 'lucide-react'
import { HelixMotif } from './HelixMotif'
import { AgentActivityList } from './AgentActivity'
import { DigitalDNAList } from './DigitalDNASummary'
import type { ActivityItem, DigitalDnaArea } from '@/lib/north-star-preview-data'

/**
 * A single unified panel for "what North Star is doing" and "what North
 * Star understands" — previously two separate cards. Merged because both
 * answer the same underlying question (what is North Star up to right
 * now?) and John never needs to act on either without also seeing the
 * other, so splitting them into equal-weight cards only added scrolling.
 */
export function BehindTheScenes({
  activity,
  dnaAreas,
  pagesChecked,
}: {
  activity: ActivityItem[]
  dnaAreas: DigitalDnaArea[]
  pagesChecked: number
}) {
  return (
    <section aria-labelledby="behind-the-scenes-heading" className="ns-panel ns-fade-in relative overflow-hidden p-5 sm:p-7">
      <HelixMotif />
      <div className="relative flex items-center gap-2.5">
        <Activity className="h-4 w-4 text-[var(--rf-green)]" aria-hidden="true" />
        <h2 id="behind-the-scenes-heading" className="text-lg font-semibold text-white">Behind the scenes</h2>
      </div>
      <p className="relative mt-1 max-w-xl text-sm text-[var(--rf-muted)]">
        What North Star is doing right now, and what it understands about your business so far.
      </p>

      <div className="relative mt-6 grid gap-6 md:grid-cols-2 md:gap-8">
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--rf-faint)]">Right now</p>
          <AgentActivityList items={activity} />
        </div>
        <div className="border-t border-[var(--rf-card-line)] pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--rf-faint)]">Digital DNA</p>
          <DigitalDNAList areas={dnaAreas} pagesChecked={pagesChecked} />
        </div>
      </div>
    </section>
  )
}
