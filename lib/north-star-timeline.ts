/**
 * The operational workflow timeline shown at the bottom of the Command
 * Center: Checking -> Understanding -> Deciding -> Preparing -> Waiting for
 * approval -> Completing -> Measuring -> Learning. States are derived
 * per-scenario from the same fields already driving the rest of the UI —
 * nothing here invents progress that isn't reflected elsewhere.
 */
import type { PreviewScenario } from './north-star-preview-data'

export type TimelineState = 'completed' | 'running' | 'waiting-approval' | 'failed' | 'blocked' | 'not-connected'

export interface TimelineStage {
  id: string
  label: string
  state: TimelineState
  note: string
}

export function timelineFor(scenario: PreviewScenario): TimelineStage[] {
  switch (scenario.id) {
    case 'opportunity-found':
      return [
        { id: 'checking', label: 'Checking', state: 'completed', note: `${scenario.pagesChecked} pages checked this morning.` },
        { id: 'understanding', label: 'Understanding', state: 'completed', note: 'Compared against your last check — no major changes.' },
        { id: 'deciding', label: 'Deciding', state: 'completed', note: 'Found one opportunity worth reviewing.' },
        { id: 'preparing', label: 'Preparing', state: 'blocked', note: 'Available once you choose "Prepare it for me".' },
        { id: 'approval', label: 'Waiting for approval', state: 'not-connected', note: 'Nothing prepared yet.' },
        { id: 'completing', label: 'Completing', state: 'not-connected', note: 'Not started.' },
        { id: 'measuring', label: 'Measuring', state: 'not-connected', note: 'Nothing to measure yet.' },
        { id: 'learning', label: 'Learning', state: 'completed', note: 'Digital DNA updated from this check.' },
      ]
    case 'no-changes':
      return [
        { id: 'checking', label: 'Checking', state: 'completed', note: `${scenario.pagesChecked} pages checked this morning.` },
        { id: 'understanding', label: 'Understanding', state: 'completed', note: 'No differences from yesterday.' },
        { id: 'deciding', label: 'Deciding', state: 'completed', note: 'Nothing rose to the level of your attention.' },
        { id: 'preparing', label: 'Preparing', state: 'not-connected', note: 'Nothing to prepare today.' },
        { id: 'approval', label: 'Waiting for approval', state: 'not-connected', note: 'Nothing pending.' },
        { id: 'completing', label: 'Completing', state: 'completed', note: 'Your earlier contact-info fix is confirmed live.' },
        { id: 'measuring', label: 'Measuring', state: 'completed', note: 'Confirmed the fix held on this check.' },
        { id: 'learning', label: 'Learning', state: 'completed', note: 'Digital DNA updated — conversion paths now well understood.' },
      ]
    case 'waiting-approval':
      return [
        { id: 'checking', label: 'Checking', state: 'completed', note: `${scenario.pagesChecked} pages checked this morning.` },
        { id: 'understanding', label: 'Understanding', state: 'completed', note: 'Found a holiday-hours mismatch.' },
        { id: 'deciding', label: 'Deciding', state: 'completed', note: 'Worth fixing — low risk, no spend required.' },
        { id: 'preparing', label: 'Preparing', state: 'completed', note: 'Draft update ready for your review.' },
        { id: 'approval', label: 'Waiting for approval', state: 'waiting-approval', note: 'Needs your go-ahead before publishing.' },
        { id: 'completing', label: 'Completing', state: 'blocked', note: 'Will run once approved.' },
        { id: 'measuring', label: 'Measuring', state: 'blocked', note: 'Starts after publishing.' },
        { id: 'learning', label: 'Learning', state: 'completed', note: 'Digital DNA updated from this check.' },
      ]
    case 'check-failed':
      return [
        { id: 'checking', label: 'Checking', state: 'failed', note: "Couldn't reach your website this morning." },
        { id: 'understanding', label: 'Understanding', state: 'blocked', note: 'Skipped — no successful check to compare.' },
        { id: 'deciding', label: 'Deciding', state: 'blocked', note: 'Blocked on a successful check.' },
        { id: 'preparing', label: 'Preparing', state: 'blocked', note: 'Blocked on a successful check.' },
        { id: 'approval', label: 'Waiting for approval', state: 'not-connected', note: 'Nothing pending.' },
        { id: 'completing', label: 'Completing', state: 'not-connected', note: 'Not started.' },
        { id: 'measuring', label: 'Measuring', state: 'not-connected', note: 'Not started.' },
        { id: 'learning', label: 'Learning', state: 'blocked', note: "Using your last successful check — not updated today." },
      ]
    case 'automation-not-connected':
      return [
        { id: 'checking', label: 'Checking', state: 'completed', note: `Last manual check: ${scenario.lastCheckedAt}.` },
        { id: 'understanding', label: 'Understanding', state: 'completed', note: 'Understood from your last manual check.' },
        { id: 'deciding', label: 'Deciding', state: 'completed', note: 'Found one opportunity, still open.' },
        { id: 'preparing', label: 'Preparing', state: 'blocked', note: 'Available once you choose "Prepare it for me".' },
        { id: 'approval', label: 'Waiting for approval', state: 'not-connected', note: 'Nothing pending.' },
        { id: 'completing', label: 'Completing', state: 'not-connected', note: 'Not started.' },
        { id: 'measuring', label: 'Measuring', state: 'not-connected', note: 'Not started.' },
        { id: 'learning', label: 'Learning', state: 'not-connected', note: 'Needs regular checks over time — turn on daily checks to enable.' },
      ]
    case 'first-visit':
      return [
        { id: 'checking', label: 'Checking', state: 'completed', note: 'Homepage checked. More pages queued for next check.' },
        { id: 'understanding', label: 'Understanding', state: 'not-connected', note: 'Not applicable yet — this is your first check.' },
        { id: 'deciding', label: 'Deciding', state: 'completed', note: 'Found one early opportunity worth reviewing.' },
        { id: 'preparing', label: 'Preparing', state: 'blocked', note: 'Available once you choose "Prepare it for me".' },
        { id: 'approval', label: 'Waiting for approval', state: 'not-connected', note: 'Nothing pending.' },
        { id: 'completing', label: 'Completing', state: 'not-connected', note: 'Not started.' },
        { id: 'measuring', label: 'Measuring', state: 'not-connected', note: 'Not started.' },
        { id: 'learning', label: 'Learning', state: 'running', note: 'Building your first Digital DNA picture now.' },
      ]
  }
}
