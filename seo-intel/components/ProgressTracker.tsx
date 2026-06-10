import { PIPELINE_STEPS, type StepProgress } from '@/lib/types'

const STEP_LABELS = Object.fromEntries(PIPELINE_STEPS.map((s) => [s.id, s.label]))

function StepIcon({ state }: { state: StepProgress['state'] }) {
  switch (state) {
    case 'done':
      return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">✓</span>
    case 'running':
      return <span className="flex h-6 w-6 items-center justify-center"><span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></span>
    case 'error':
      return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">✕</span>
    case 'skipped':
      return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-400">–</span>
    default:
      return <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-200" />
  }
}

export function ProgressTracker({ steps }: { steps: StepProgress[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step) => (
        <li key={step.id} className="flex items-center gap-3">
          <StepIcon state={step.state} />
          <div>
            <p className={`text-sm font-medium ${step.state === 'pending' ? 'text-slate-400' : 'text-slate-800'}`}>
              {STEP_LABELS[step.id]}
            </p>
            {step.detail && <p className="text-xs text-slate-400">{step.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
