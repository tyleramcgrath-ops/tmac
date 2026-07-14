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

  // Find homepage
  const homepage = pages.find((p) => {
    try {
      const url = new URL(p.url)
      return url.pathname === '/' || url.pathname === ''
    } catch {
      return false
    }
  }) || pages[0]

  // Detect what's actually in the crawl data
  const hasLocalBusinessSchema = homepage?.schemaTypes.includes('LocalBusiness')
  const hasOrganizationSchema = homepage?.schemaTypes.includes('Organization')
  const missingContactIssue = homepage?.fixes.some((f) => f.title.toLowerCase().includes('contact') || f.title.toLowerCase().includes('phone'))

  // If we don't have clear opportunity markers, show placeholder
  if (!pages.length) return <EmptyState />

  const opportunity = {
    title: 'Customers may have difficulty reaching you from important pages',
    description: 'Visitors who want to call, book, or request information need quick access to your contact methods. We checked whether your contact information is structured in a way search engines and people can easily discover.',
    verified: missingContactIssue
      ? 'Your homepage is missing or unclear contact information (phone, email, or contact action)'
      : 'Contact information structure is incomplete or unstructured on your homepage',
    businessEffect: 'Visitors who cannot quickly call, book, or request information may leave without contacting you.',
    cannotMeasure: [
      'Actual number of lost contacts, calls, or visits',
      'Percentage of visitors who attempt to contact you',
      'Revenue impact of missing or unclear contact info',
      'Whether visitors actually see the contact information that exists',
    ],
    confidenceNote: 'Confidence increases as we observe user behavior and outcomes. We can only verify what appears in your HTML; we cannot measure visitor intent or actions.',
    evidence: [
      `${pages.length} pages crawled`,
      hasLocalBusinessSchema ? 'LocalBusiness schema detected' : 'No LocalBusiness schema detected',
      hasOrganizationSchema ? 'Organization schema detected' : 'No Organization schema detected',
      missingContactIssue ? 'Contact issues flagged in crawl analysis' : 'No contact issues flagged',
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
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4">
            <MetricBadge
              icon={Eye}
              label="What we verified"
              value={`${pages.length} pages analyzed`}
            />
            <MetricBadge
              icon={AlertCircle}
              label="Status"
              value={missingContactIssue ? 'Issue found' : 'Incomplete data'}
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
            <span className="font-medium text-white">What we cannot measure:</span> {opportunity.cannotMeasure.join('; ')}
          </p>
          <p className="pt-2 text-[11px] text-[var(--rf-faint)]">
            {opportunity.confidenceNote}
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
          What we verified
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--rf-muted)]">
          {opportunity.verified}
        </p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-white">Possible business effect</h4>
        <p className="mt-2 text-sm text-[var(--rf-muted)]">{opportunity.businessEffect}</p>
      </div>

      <div>
        <h4 className="text-sm font-medium text-white">Evidence from crawl</h4>
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
        <h4 className="text-sm font-medium text-white">What we cannot measure yet</h4>
        <ul className="mt-2 space-y-2">
          {opportunity.cannotMeasure.map((item: string, i: number) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--rf-muted)]">
              <span className="mt-1.5 block h-1.5 w-1.5 rounded-full bg-[var(--rf-muted)]/30 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-[var(--rf-blue-bright)]/20 bg-[var(--rf-blue-bright)]/5 p-3">
        <p className="text-xs text-[var(--rf-blue-bright)]">
          {opportunity.confidenceNote}
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
          Improve contact information discoverability
        </h3>
        <p className="mt-2 text-sm text-[var(--rf-muted)]">
          The goal is to make it effortless for visitors to call, visit, or email you.
        </p>
      </div>

      <div className="space-y-3">
        {[
          {
            step: 1,
            title: 'Audit where contact info appears',
            description: 'Check your homepage, main pages, and footer. Note where phone, address, and contact form are (or are not) visible.',
          },
          {
            step: 2,
            title: 'Make contact information immediately visible',
            description: 'Place phone and/or email in header, hero section, or navigation. Visitors should find it without scrolling.',
          },
          {
            step: 3,
            title: 'Use consistent contact details across all pages',
            description: 'Same phone number, address, and email everywhere. Inconsistent info confuses both people and search engines.',
          },
          {
            step: 4,
            title: 'Test your contact methods',
            description: 'Verify your phone number works, emails arrive, and contact forms submit successfully. Respond to inquiries promptly.',
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
          After implementing changes, we can revisit this opportunity to measure whether it improved visitor behavior. Without conversion tracking or call tracking, we cannot know the business impact until you verify it.
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
          <FileText className="h-4 w-4 text-[var(--rf-blue-bright)]" />
          Contact information checklist
        </h3>
        <p className="mt-2 text-sm text-[var(--rf-muted)]">Review and improve how customers find your contact methods:</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border border-[var(--rf-card-line)] bg-white/[0.01] p-4">
          <p className="text-xs font-medium text-[var(--rf-muted)] uppercase tracking-wider">Visible contact information</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--rf-muted)]">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-muted)]" />
              <span>Phone number visible on homepage (header, hero, or top navigation)</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-muted)]" />
              <span>Business address or location clearly displayed</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rf-muted)]" />
              <span>Contact form or email address accessible</span>
            </li>
          </ul>
        </div>

        <div className="rounded-lg border border-[var(--rf-card-line)] bg-white/[0.01] p-4">
          <p className="text-xs font-medium text-[var(--rf-muted)] uppercase tracking-wider">Structured data (optional)</p>
          <p className="mt-2 text-sm text-[var(--rf-muted)]">
            If you add LocalBusiness schema markup, search engines can display your contact information more prominently. This requires your actual business name, phone, address, and hours—do not use placeholder values.
          </p>
          <p className="mt-2 text-xs text-[var(--rf-faint)]">
            Your website builder likely has a UI for this rather than requiring manual code editing.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--rf-blue-bright)]/20 bg-[var(--rf-blue-bright)]/5 p-3">
        <p className="text-xs text-[var(--rf-blue-bright)]">
          After making changes, revisit this section in a few weeks. As we observe how visitors interact with your updated contact information, Digital DNA will learn whether this change improves your business outcomes.
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
