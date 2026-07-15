'use client'

import { AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react'
import type { ActivityItem } from '@/lib/north-star-preview-data'

const statusIcons = {
  waiting: Clock,
  checking: Zap,
  understanding: Zap,
  preparing: Zap,
  finished: CheckCircle2,
  'needs-attention': AlertCircle,
  'waiting-approval': Clock,
}

const statusLabels = {
  waiting: 'Waiting',
  checking: 'Checking',
  understanding: 'Understanding',
  preparing: 'Preparing',
  finished: 'Finished',
  'needs-attention': 'Attention needed',
  'waiting-approval': 'Awaiting approval',
}

export function NSWorking({ activity }: { activity: ActivityItem[] }) {
  const activeWork = activity.filter((a) => a.status !== 'finished')
  const finishedWork = activity.filter((a) => a.status === 'finished')

  if (!activity.length) {
    return null
  }

  return (
    <section className="ns-working-section border-t border-[var(--rf-card-line)]/30 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl">
        {/* Section header */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-light text-white">North Star is working</h2>
        </div>

        {/* Active work */}
        {activeWork.length > 0 && (
          <div className="mb-12 space-y-3">
            {activeWork.map((item) => {
              const IconComponent = statusIcons[item.status] || Clock
              const isAnimated = item.status === 'checking' || item.status === 'understanding' || item.status === 'preparing'

              return (
                <div key={item.id} className="rounded-lg border border-[var(--rf-card-line)]/50 bg-white/3 backdrop-blur-sm p-4 sm:p-5 hover:border-[var(--rf-blue-bright)]/30 transition-all">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 mt-0.5 ${isAnimated ? 'animate-pulse' : ''}`}>
                      <IconComponent className="h-5 w-5 text-[var(--rf-blue-bright)]" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-baseline gap-2">
                        <p className="font-medium text-white text-sm">{item.label}</p>
                        <span className="text-xs text-[var(--rf-faint)]">{statusLabels[item.status]}</span>
                      </div>
                      {item.finding && (
                        <p className="text-sm text-[var(--rf-text-secondary)]">{item.finding}</p>
                      )}
                      {item.actionRequired && (
                        <p className="text-xs text-amber-400 font-medium">Action required from you</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Finished work */}
        {finishedWork.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--rf-faint)] mb-4">
              Completed
            </p>
            <div className="space-y-2">
              {finishedWork.map((item) => (
                <div key={item.id} className="flex items-start gap-4 rounded-lg p-3 hover:bg-white/2 transition-colors">
                  <CheckCircle2 className="h-5 w-5 text-[var(--rf-green)] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-white">{item.label}</p>
                    {item.finishedAt && (
                      <p className="text-xs text-[var(--rf-faint)] mt-1">
                        Done {new Date(item.finishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Persistence note */}
        <div className="mt-8 pt-8 border-t border-[var(--rf-card-line)]/30 text-xs text-[var(--rf-faint)]">
          <p>North Star runs continuously. Checks are automated; no manual scheduling required.</p>
        </div>
      </div>

      <style>{`
        .ns-working-section {
          animation: working-fade-in 0.8s ease-out 0.9s both;
        }

        @keyframes working-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  )
}
