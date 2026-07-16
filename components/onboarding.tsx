'use client'

import { useState } from 'react'
import {
  Sparkles, Building2, ShoppingCart, MapPin, Briefcase, Code2,
  ArrowRight, Check, ChevronRight, X,
} from 'lucide-react'

interface OnboardingProps {
  onSelectDemo: (demoType: string) => void
  onSkipToRealSite: () => void
}

const DEMOS = [
  {
    id: 'law',
    icon: Building2,
    name: 'Law Firm',
    company: 'Mitchell & Associates',
    description: 'Legal services with schema optimization opportunities',
    issues: ['Missing attorney schema', 'Technical SEO gaps', 'Core Web Vitals'],
    domain: 'mitchelllaw.example.com',
  },
  {
    id: 'saas',
    icon: Code2,
    name: 'SaaS',
    company: 'CloudSync Pro',
    description: 'Growing cloud storage with content strategy gaps',
    issues: ['Missing comparison content', 'Internal linking needed', 'Conversion optimization'],
    domain: 'cloudsyncdemo.example.com',
  },
  {
    id: 'ecommerce',
    icon: ShoppingCart,
    name: 'Ecommerce',
    company: 'TechGear Shop',
    description: 'Product site with duplicate content and review optimization needs',
    issues: ['Duplicate variants', 'Weak descriptions', 'Review schema'],
    domain: 'techgearshop.example.com',
  },
  {
    id: 'local',
    icon: MapPin,
    name: 'Local Business',
    company: 'Bella Salon & Spa',
    description: 'Beauty salon with mobile performance and schema issues',
    issues: ['Incomplete LocalBusiness schema', 'Mobile speed', 'Service pages'],
    domain: 'bellasalonandspa.example.com',
  },
  {
    id: 'agency',
    icon: Briefcase,
    name: 'Marketing Agency',
    company: 'Growth Labs',
    description: 'B2B agency with strong SEO but case study optimization gaps',
    issues: ['Case study metrics', 'Thought leadership content', 'Lead capture'],
    domain: 'growthlabsagency.example.com',
  },
]

export function Onboarding({ onSelectDemo, onSkipToRealSite }: OnboardingProps) {
  const [stage, setStage] = useState<'welcome' | 'demo-choice' | 'explanation'>('welcome')
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null)

  const handleSelectDemo = (demoId: string) => {
    setSelectedDemo(demoId)
    setStage('explanation')
  }

  const handleConfirmDemo = () => {
    if (selectedDemo) {
      onSelectDemo(selectedDemo)
    }
  }

  const demo = DEMOS.find(d => d.id === selectedDemo)

  if (stage === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--rf-blue)]/5 to-transparent flex items-center justify-center px-4">
        <div className="max-w-2xl w-full space-y-8 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-3xl bg-[var(--rf-blue)]/20 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-[var(--rf-blue-bright)]" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white">Welcome to RankForge</h1>
            <p className="text-lg text-[var(--rf-muted)]">
              Your AI-powered SEO command center. Transform your site's visibility in Google and AI search.
            </p>
          </div>

          <div className="space-y-4 pt-8">
            <p className="text-sm text-[var(--rf-muted)]">
              Let's get started. What would you like to do?
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={() => setStage('demo-choice')}
                className="rf-btn-primary rounded-xl px-6 py-4 flex items-center justify-center gap-2 text-base font-semibold transition-all hover:shadow-lg hover:shadow-[var(--rf-blue)]/20"
              >
                <Sparkles className="h-5 w-5" />
                Try Demo Project
              </button>
              <button
                onClick={onSkipToRealSite}
                className="rf-btn-ghost rounded-xl px-6 py-4 flex items-center justify-center gap-2 text-base font-semibold transition-all hover:bg-white/[0.04]"
              >
                Analyze My Site
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-[var(--rf-card-line)]">
            <p className="text-xs text-[var(--rf-faint)] mb-6">Why use a demo?</p>
            <div className="grid sm:grid-cols-3 gap-6 text-left">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-[var(--rf-green)]/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-[var(--rf-green)]" />
                </div>
                <p className="font-medium text-sm text-white">Learn the product</p>
                <p className="text-xs text-[var(--rf-muted)]">See how RankForge works with real data</p>
              </div>
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-[var(--rf-green)]/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-[var(--rf-green)]" />
                </div>
                <p className="font-medium text-sm text-white">Understand the Decision Engine</p>
                <p className="text-xs text-[var(--rf-muted)]">See reasoning behind each recommendation</p>
              </div>
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-[var(--rf-green)]/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-[var(--rf-green)]" />
                </div>
                <p className="font-medium text-sm text-white">Explore your niche</p>
                <p className="text-xs text-[var(--rf-muted)]">See a site like yours with recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (stage === 'demo-choice') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--rf-blue)]/5 to-transparent px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Choose Your Demo Project</h1>
            <p className="text-[var(--rf-muted)]">Each project shows real SEO challenges and how RankForge helps solve them</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMOS.map(d => {
              const Icon = d.icon
              return (
                <button
                  key={d.id}
                  onClick={() => handleSelectDemo(d.id)}
                  className="group rf-card rf-topline p-6 text-left transition-all hover:bg-white/[0.03] hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-[var(--rf-blue)]/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-[var(--rf-blue-bright)]" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-[var(--rf-muted)] group-hover:text-[var(--rf-blue)]" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{d.name}</h3>
                  <p className="text-sm text-[var(--rf-muted)] mb-3">{d.company}</p>
                  <p className="text-xs text-[var(--rf-faint)] mb-4">{d.description}</p>
                  <div className="space-y-2">
                    {d.issues.map((issue, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[var(--rf-muted)]">
                        <div className="h-1 w-1 rounded-full bg-[var(--rf-amber)]" />
                        {issue}
                      </div>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-12 pt-12 border-t border-[var(--rf-card-line)]">
            <button
              onClick={onSkipToRealSite}
              className="inline-flex items-center gap-2 text-sm text-[var(--rf-muted)] hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
              Skip demo, analyze my own site
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (stage === 'explanation' && demo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--rf-blue)]/5 to-transparent flex items-center justify-center px-4">
        <div className="max-w-2xl w-full space-y-6">
          <button
            onClick={() => setStage('demo-choice')}
            className="inline-flex items-center gap-2 text-sm text-[var(--rf-muted)] hover:text-white mb-6"
          >
            ← Back to projects
          </button>

          <div className="rf-card rf-topline p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-[var(--rf-blue)]/10 flex items-center justify-center">
                {(() => {
                  const Icon = DEMOS.find(d => d.id === selectedDemo)?.icon
                  return Icon ? <Icon className="h-8 w-8 text-[var(--rf-blue-bright)]" /> : null
                })()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{demo.name}: {demo.company}</h2>
                <p className="text-[var(--rf-muted)] mt-1">{demo.domain}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">About this demo:</h3>
                <p className="text-[var(--rf-muted)]">{demo.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-3">What you'll see:</h3>
                <ul className="space-y-2">
                  {demo.issues.map((issue, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-[var(--rf-green)]" />
                      <span className="text-[var(--rf-muted)]">{issue}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-3 text-sm pt-2 border-t border-[var(--rf-card-line)]">
                    <Check className="h-4 w-4 text-[var(--rf-green)]" />
                    <span className="text-[var(--rf-muted)]">Full Decision Engine with reasoning for each recommendation</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-[var(--rf-green)]" />
                    <span className="text-[var(--rf-muted)]">Operator recommendations and task history</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-[var(--rf-green)]" />
                    <span className="text-[var(--rf-muted)]">Knowledge Graph showing content relationships</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--rf-card-line)] space-y-3">
              <button
                onClick={handleConfirmDemo}
                className="w-full rf-btn-primary rounded-xl px-6 py-3 text-base font-semibold transition-all hover:shadow-lg"
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Load {demo.company} Demo
                </div>
              </button>
              <button
                onClick={() => setStage('demo-choice')}
                className="w-full rf-btn-ghost rounded-xl px-6 py-3 text-base font-semibold"
              >
                Choose different project
              </button>
            </div>

            <p className="text-xs text-center text-[var(--rf-faint)]">
              Demo data is not real — it's realistic example data to help you learn RankForge.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
