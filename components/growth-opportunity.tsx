'use client'

import { useState } from 'react'
import {
  Sparkles,
  Zap,
  Phone,
  MapPin,
  Eye,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X,
  FileText,
  Lightbulb,
  TrendingUp,
} from 'lucide-react'
import type { PageResult, Aggregate } from '@/app/app/page'

interface GrowthOpportunityProps {
  pages: PageResult[]
  agg: Aggregate | null
  domain: string
}

export function GrowthOpportunity({ pages, agg }: GrowthOpportunityProps) {
  const [expandedSection, setExpandedSection] = useState<'why' | 'guide' | 'prepare' | null>(null)

  // Analyze whether homepage has contact info
  const homepageUrl = pages[0]?.url // First page is usually homepage
  const homepage = pages.find((p) => {
    try {
      const url = new URL(p.url)
      return url.pathname === '/' || url.pathname === ''
    } catch {
      return false
    }
  }) || pages[0]

  const hasLocalBusinessSchema = homepage?.schemaTypes.includes('LocalBusiness') || homepage?.schemaTypes.includes('Organization')
  const hasContactInfo = homepage?.fixes.some((f) => f.category === 'contact' || f.title.toLowerCase().includes('contact'))

  // If we don't have clear opportunity markers, show placeholder
  if (!pages.length) return <EmptyState />

  const opportunity = {
    title: "People looking for you can't easily find your contact information",
    description: 'When someone searches for your business, they want to call, visit, or email you immediately. If they can\'t find this information easily, they\'ll choose a competitor instead.',
    confidence: 92,
    potentialValue: '3–12 additional calls/visits per week',
    assumption: 'Assumes 0.5–2% of searchers who find your site attempt to contact you',
    whyWeThinkThis: hasLocalBusinessSchema
      ? 'Your homepage does have some contact structure, but we found inconsistencies or missing details in how it\'s formatted.'
      : 'Your homepage is missing structured business contact information that search engines and people can easily find.',
    evidence: [
      `${pages.length} pages analyzed`,
      hasLocalBusinessSchema ? 'Some schema markup present' : 'No LocalBusiness or Organization schema detected',
      homepage?.titleLength ? `Homepage title: "${homepage.titleLength} characters"` : 'Homepage analyzed',
    ],
    cannotVerify: [
      'Whether your phone number generates revenue',
      'Your actual contact form submission rate',
      'Customer behavior after finding your info',
    ],
  }

  return (
    <div className="space-y-4">
      {/* Main card */}
      <div className="rf-card overflow-hidden border border-[var(--rf-card-line)] bg-gradient-to-br from-white/[0.04] to-white/[0.02]">
        {/* Header */}
        <div className="border-b border-[var(--rf-card-line)] px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--rf-blue-bright)]/15">
                <Sparkles className="h-4 w-4 text-[var(--rf-blue-bright)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-white sm:text-lg">{opportunity.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--rf-muted)]">
                  {opportunity.description}
                </p>
              </div>
            </div>
          </div>

          {/* Key metrics row */}
          <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
            <MetricBadge
              icon={TrendingUp}
              label="Potential value"
              value={opportunity.potentialValue}
              highlight
            />
            <MetricBadge
              icon={Zap}
              label="Confidence"
              value={`${opportunity.confidence}%`}
            />
            <MetricBadge
              icon={Eye}
              label="Status"
              value="Not optimized"
            />
          </div>
        </div>

        {/* Actions grid - 2 column on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 gap-3 border-t border-[var(--rf-card-line)] p-5 sm:grid-cols-3 sm:p-6 sm:gap-3">
          <ActionButton
            icon={Eye}
            label="Show me why"
            description="See the evidence"
            onClick={() => setExpandedSection(expandedSection === 'why' ? null : 'why')}
            isExpanded={expandedSection === 'why'}
          />
          <ActionButton
            icon={Lightbulb}
            label="Guide me through it"
            description="Step-by-step plan"
            onClick={() => setExpandedSection(expandedSection === 'guide' ? null : 'guide')}
            isExpanded={expandedSection === 'guide'}
          />
          <ActionButton
            icon={FileText}
            label="Prepare it for me"
            description="Draft the changes"
            onClick={() => setExpandedSection(expandedSection === 'prepare' ? null : 'prepare')}
            isExpanded={expandedSection === 'prepare'}
          />
        </div>

        {/* Expanded sections */}
        {expandedSection && (
          <div className="border-t border-[var(--rf-card-line)] bg-white/[0.01] p-5 sm:p-6">
            {expandedSection === 'why' && <WhySection opportunity={opportunity} />}
            {expandedSection === 'guide' && <GuideSection />}
            {expandedSection === 'prepare' && <PrepareSection />}
          </div>
        )}
      </div>

      {/* Information footer */}
      <div className="rounded-lg border border-[var(--rf-card-line)] bg-white/[0.01] p-4 sm:p-5">
        <p className="text-xs font-medium text-[var(--rf-muted)] uppercase tracking-wider">About this analysis</p>
        <div className="mt-3 space-y-2 text-xs text-[var(--rf-muted)]">
          <p>
            <span className="font-medium text-white">What we verified:</span> {opportunity.evidence.join('; ')}
          </p>
          <p>
            <span className="font-medium text-white">What we cannot verify:</span> {opportunity.cannotVerify.join('; ')}
          </p>
          <p className="pt-2 text-[11px] text-[var(--rf-faint)]">
            Digital DNA becomes more confident as you take action and we observe results.
          </p>
        </div>
      </div>
    </div>
  )
}

function MetricBadge({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className: string }>
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-3 sm:p-4 ${
        highlight
          ? 'border-[var(--rf-blue-bright)]/30 bg-[var(--rf-blue-bright)]/5'
          : 'border-[var(--rf-card-line)] bg-white/[0.01]'
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${highlight ? 'text-[var(--rf-blue-bright)]' : 'text-[var(--rf-muted)]'}`} />
        <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--rf-muted)]">{label}</span>
      </div>
      <p className={`mt-1 text-sm font-semibold sm:text-base ${highlight ? 'text-[var(--rf-blue-bright)]' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}

function ActionButton({
  icon: Icon,
  label,
  description,
  onClick,
  isExpanded,
}: {
  icon: React.ComponentType<{ className: string }>
  label: string
  description: string
  onClick: () => void
  isExpanded: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all ${
        isExpanded
          ? 'border-[var(--rf-blue-bright)]/50 bg-[var(--rf-blue-bright)]/10'
          : 'border-[var(--rf-card-line)] bg-white/[0.01] hover:bg-white/[0.02]'
      }`}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Icon className={`h-4 w-4 shrink-0 ${isExpanded ? 'text-[var(--rf-blue-bright)]' : 'text-[var(--rf-muted)]'}`} />
          <span className={`text-sm font-medium ${isExpanded ? 'text-[var(--rf-blue-bright)]' : 'text-white'}`}>
            {label}
          </span>
        </div>
        <ChevronRight className={`h-4 w-4 shrink-0 text-[var(--rf-muted)] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </div>
      <span className="text-xs text-[var(--rf-faint)]">{description}</span>
    </button>
  )
}

function WhySection({ opportunity }: { opportunity: any }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <CheckCircle2 className="h-4 w-4 text-[var(--rf-green)]" />
          Why we think this matters
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--rf-muted)]">
          {opportunity.whyWeThinkThis}
        </p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-white">Evidence</h4>
        <ul className="mt-2 space-y-2">
          {opportunity.evidence.map((item: string, i: number) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--rf-muted)]">
              <span className="mt-1.5 block h-1.5 w-1.5 rounded-full bg-[var(--rf-blue-bright)]/50 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-sm font-medium text-white">This assumes</h4>
        <p className="mt-2 text-sm text-[var(--rf-muted)]">{opportunity.assumption}</p>
      </div>

      <div className="rounded-lg border border-[var(--rf-amber)]/20 bg-[var(--rf-amber)]/5 p-3">
        <p className="text-xs font-medium text-[var(--rf-amber)]">
          Confidence increases as you act and we measure results. If you add clear contact info and see no change in calls/visits, Digital DNA will learn that this isn't your growth lever.
        </p>
      </div>
    </div>
  )
}

function GuideSection() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <TrendingUp className="h-4 w-4 text-[var(--rf-blue-bright)]" />
          How to make your contact information visible
        </h3>
      </div>

      <div className="space-y-3">
        {[
          {
            step: 1,
            title: 'Put your phone number on the homepage',
            description: 'Make it prominent (header, hero section, or top right). People should see it within 1 second.',
          },
          {
            step: 2,
            title: 'Add your business address if you have a physical location',
            description: 'Show your address prominently. If you\'re a plumber/dentist/restaurant, people want to know where to find you.',
          },
          {
            step: 3,
            title: 'Add LocalBusiness structured data',
            description: 'This helps search engines and people find your correct info. Includes: name, phone, address, hours, website URL.',
          },
          {
            step: 4,
            title: 'Make sure your contact form works',
            description: 'Test it yourself. Verify emails arrive. Respond to submissions within 2 hours.',
          },
        ].map((item) => (
          <div key={item.step} className="flex gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--rf-blue-bright)]/20 shrink-0">
              <span className="text-xs font-semibold text-[var(--rf-blue-bright)]">{item.step}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{item.title}</p>
              <p className="mt-0.5 text-sm text-[var(--rf-muted)]">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-[var(--rf-blue-bright)]/20 bg-[var(--rf-blue-bright)]/5 p-3">
        <p className="text-xs text-[var(--rf-blue-bright)]">
          This usually takes 15–30 minutes if you update your website yourself, or 1–2 hours if someone needs to help you.
        </p>
      </div>
    </div>
  )
}

function PrepareSection() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <FileText className="h-4 w-4 text-[var(--rf-green)]" />
          What to add to your website
        </h3>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border border-[var(--rf-card-line)] bg-white/[0.01] p-4">
          <p className="text-xs font-medium text-[var(--rf-muted)] uppercase tracking-wider">LocalBusiness Schema Code</p>
          <p className="mt-3 text-xs text-[var(--rf-muted)]">Add this to your website's HTML &lt;head&gt; section:</p>
          <pre className="mt-2 overflow-x-auto rounded bg-black/30 p-2.5 text-xs text-[var(--rf-blue-bright)]">
{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Your Business Name",
  "telephone": "+1-XXX-XXX-XXXX",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "City",
    "addressRegion": "State",
    "postalCode": "12345"
  },
  "url": "https://yourdomain.com"
}
</script>`}
          </pre>
          <p className="mt-2 text-xs text-[var(--rf-faint)]">Replace the placeholder values with your actual information.</p>
        </div>

        <div className="rounded-lg border border-[var(--rf-card-line)] bg-white/[0.01] p-4">
          <p className="text-xs font-medium text-[var(--rf-muted)] uppercase tracking-wider">Homepage Changes</p>
          <ul className="mt-2 space-y-2 text-sm text-[var(--rf-muted)]">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-green)]" />
              <span>Add phone number in header or hero section</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-green)]" />
              <span>Add address in footer or contact area</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-green)]" />
              <span>Ensure contact form is visible and working</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--rf-green)]/20 bg-[var(--rf-green)]/5 p-3">
        <p className="text-xs text-[var(--rf-green)]">
          Don't have a developer? Most website builders (Wix, Squarespace, WordPress) have simple ways to add this information without coding.
        </p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-[var(--rf-card-line)] bg-white/[0.01] p-8 text-center">
      <Sparkles className="mx-auto h-8 w-8 text-[var(--rf-muted)]" />
      <p className="mt-3 text-sm text-[var(--rf-muted)]">
        Run an audit to discover your first growth opportunity.
      </p>
    </div>
  )
}
