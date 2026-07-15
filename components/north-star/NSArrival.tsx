'use client'

import { type PreviewScenario } from '@/lib/north-star-preview-data'

export function NSArrival({ scenario }: { scenario: PreviewScenario }) {
  const ownerName = scenario.business.ownerFirstName

  const getStatusLine = () => {
    if (scenario.lastCheckStatus === 'never') {
      return 'Ready for your first check.'
    }

    const lastCheck = scenario.lastCheckedAt
      ? new Date(scenario.lastCheckedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'recently'

    if (scenario.briefing.materialChange) {
      return `Checked ${lastCheck} — something changed.`
    }
    if (scenario.briefing.actionRequired) {
      return `Checked ${lastCheck} — one thing needs your attention.`
    }
    return `Checked ${lastCheck} — no material changes.`
  }

  const getSubtitle = () => {
    if (scenario.lastCheckStatus === 'never') {
      return "Let's see what's happening with your business."
    }
    if (scenario.briefing.materialChange) {
      return "Your business has shifted. Let's look at what changed."
    }
    if (scenario.briefing.actionRequired) {
      return "There's one opportunity worth your time today."
    }
    return 'Everything is tracking as expected.'
  }

  return (
    <section className="ns-arrival-section relative min-h-[100dvh] overflow-hidden bg-gradient-to-b from-[#0a0e1a] via-[#0f1420] to-[#1a1f2e] px-4 py-20 sm:px-6 sm:py-32">
      {/* Subtle animated background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[var(--rf-blue-bright)]/5 via-transparent to-transparent"
          style={{
            animation: 'subtle-pulse 20s ease-in-out infinite',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-2xl">
        {/* North Star presence indicator */}
        <div className="mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-3 rounded-full border border-[var(--rf-blue-bright)]/20 bg-[var(--rf-blue-bright)]/5 px-3 py-1.5 backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-[var(--rf-blue-bright)] animate-pulse" />
            <span className="text-xs font-medium text-[var(--rf-blue-bright)]">North Star</span>
          </div>
        </div>

        {/* Primary message - the moment of clarity */}
        <div className="mb-16 space-y-6 sm:mb-20">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light leading-tight text-white">
            <span className="block">Good morning,</span>
            <span className="block bg-gradient-to-r from-[var(--rf-blue-bright)] to-[var(--rf-blue-bright)]/60 bg-clip-text text-transparent">{ownerName}.</span>
          </h1>

          <p className="text-lg sm:text-xl text-[var(--rf-text-secondary)] leading-relaxed font-light">
            I checked your business. {scenario.lastCheckStatus === 'never' ? getSubtitle() : "Here's what matters today."}
          </p>
        </div>

        {/* Status summary - quiet, not overwhelming */}
        <div className="space-y-4 rounded-lg border border-[var(--rf-card-line)]/50 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
          {/* Last check status */}
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--rf-faint)]">Last check</span>
            <span className="text-sm text-white">{getStatusLine()}</span>
          </div>

          {/* Pages checked */}
          {scenario.pagesChecked > 0 && (
            <div className="flex items-baseline justify-between border-t border-[var(--rf-card-line)]/30 pt-4">
              <span className="text-xs font-medium uppercase tracking-wide text-[var(--rf-faint)]">Pages reviewed</span>
              <span className="text-sm text-white">{scenario.pagesChecked} pages</span>
            </div>
          )}

          {/* Automation status */}
          <div className="flex items-baseline justify-between border-t border-[var(--rf-card-line)]/30 pt-4">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--rf-faint)]">Automation</span>
            <span className={`text-sm ${scenario.briefing.automationConnected ? 'text-[var(--rf-green)]' : 'text-[var(--rf-faint)]'}`}>
              {scenario.briefing.automationConnected ? 'Connected' : 'Not connected'}
            </span>
          </div>
        </div>

        {/* Current focus indicator */}
        {scenario.briefing.actionRequired && (
          <div className="mt-12 sm:mt-16">
            <p className="text-sm text-[var(--rf-blue-bright)] font-medium tracking-wide uppercase">
              One thing deserves your attention below
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes subtle-pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.5;
          }
        }

        .ns-arrival-section {
          animation: arrival-fade-in 0.8s ease-out;
        }

        @keyframes arrival-fade-in {
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
