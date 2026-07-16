'use client'

import { useState } from 'react'
import {
  Bot, LayoutDashboard, Radar, FileText, Network, ShieldCheck, Code2, LineChart,
  Link2, Plug, FileBarChart, CheckCircle2, AlertCircle, Clock, TrendingUp,
  Sparkles, Zap, ArrowRight, Info, Search, BarChart3, type LucideIcon
} from 'lucide-react'
import { getDemoData, DEMO_PROJECTS, FEATURE_STATUS } from '@/lib/demo/demo-data-generator'

type ProjectKey = keyof typeof DEMO_PROJECTS

interface ReviewSection {
  id: string
  label: string
  icon: LucideIcon
}

const REVIEW_SECTIONS: { label: string; items: ReviewSection[] }[] = [
  {
    label: 'Review',
    items: [
      { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
      { id: 'demo-project', label: 'Demo Project', icon: Radar },
      { id: 'decision-engine', label: 'Decision Engine', icon: Bot },
      { id: 'operator', label: 'Operator', icon: Sparkles },
      { id: 'execution', label: 'Execution & Verification', icon: Zap },
    ]
  }
]

export default function ReviewPage() {
  const [section, setSection] = useState('overview')
  const [projectKey, setProjectKey] = useState<ProjectKey>('law_firm')
  const demoData = getDemoData(projectKey)
  const project = DEMO_PROJECTS[projectKey]

  const statusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string; icon: LucideIcon }> = {
      ready: { bg: 'bg-[var(--rf-green)]/15', text: 'text-[var(--rf-green)]', icon: CheckCircle2 },
      beta: { bg: 'bg-[var(--rf-amber)]/15', text: 'text-[var(--rf-amber)]', icon: Clock },
      notReady: { bg: 'bg-[var(--rf-red)]/15', text: 'text-[var(--rf-red)]', icon: AlertCircle },
    }
    const color = colors[status] || colors.notReady
    const Icon = color.icon
    const label = status === 'ready' ? 'Production Ready' : status === 'beta' ? 'Beta' : 'In Development'
    return <div className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${color.bg} ${color.text}`}><Icon className="h-3 w-3" />{label}</div>
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="rf-grid pointer-events-none fixed inset-0 -z-10 opacity-50" />
      <div className="rf-glow pointer-events-none fixed left-1/2 top-[-160px] -z-10 h-[420px] w-[760px] -translate-x-1/2 opacity-40" />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--rf-card-line)] bg-[rgba(5,7,14,0.8)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex items-center gap-3">
            <a href="/app" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--rf-blue-bright)] to-[var(--rf-blue)] shadow-[0_8px_24px_-8px_rgba(47,107,255,0.9)]">
                <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
              </span>
              <span className="text-[15px] font-semibold">RankForge<span className="text-[var(--rf-blue-bright)]"> AI</span></span>
            </a>
            <div className="hidden items-center gap-2 md:flex">
              <div className="h-1 w-1 rounded-full bg-[var(--rf-faint)]" />
              <span className="text-xs font-medium text-[var(--rf-muted)]">Platform Review</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={projectKey}
              onChange={(e) => setProjectKey(e.target.value as ProjectKey)}
              className="rf-card cursor-pointer bg-transparent px-3 py-2 text-sm text-white focus:outline-none"
            >
              {Object.entries(DEMO_PROJECTS).map(([key, proj]) => (
                <option key={key} className="bg-[#0b1120]" value={key}>
                  {proj.name} {key === 'law_firm' ? '(Demo)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        {/* Sidebar */}
        <nav className="hidden w-56 shrink-0 border-r border-[var(--rf-card-line)] p-3 md:block">
          {REVIEW_SECTIONS.map((grp) => (
            <div key={grp.label} className="mb-3">
              <p className="px-3 py-1.5 rf-mono text-[10px] uppercase tracking-[0.18em] text-[var(--rf-faint)]">{grp.label}</p>
              {grp.items.map((s) => {
                const Icon = s.icon
                const active = s.id === section
                return (
                  <button
                    key={s.id}
                    onClick={() => setSection(s.id)}
                    className={`mb-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? 'bg-white/[0.06] font-medium text-white'
                        : 'text-[var(--rf-muted)] hover:bg-white/[0.03] hover:text-white'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-[var(--rf-blue-bright)]' : ''}`} />
                    {s.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Main Content */}
        <div className="w-full min-w-0">
          <main className="p-4 sm:p-6">
            {/* Overview Section */}
            {section === 'overview' && (
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h1 className="text-3xl font-bold text-white">RankForge Platform Review</h1>
                  <p className="mt-2 text-sm text-[var(--rf-muted)]">
                    Complete demonstration of all major subsystems with realistic data
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    { label: 'Production Ready', value: '13/15', icon: CheckCircle2 },
                    { label: 'Beta Systems', value: '2', icon: Clock },
                    { label: 'Avg Completion', value: '88%', icon: TrendingUp },
                    { label: 'Major Subsystems', value: '15', icon: Sparkles },
                  ].map((stat, i) => {
                    const Icon = stat.icon
                    return (
                      <div key={i} className="rf-card rf-topline flex flex-col gap-2 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-[var(--rf-blue-bright)]" />
                          <span className="text-xs font-medium text-[var(--rf-muted)]">{stat.label}</span>
                        </div>
                        <span className="text-2xl font-bold text-white">{stat.value}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Subsystem Matrix */}
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-white">Subsystem Status</h2>
                  <div className="space-y-2">
                    {Object.entries(FEATURE_STATUS)
                      .sort((a, b) => b[1].completion - a[1].completion)
                      .map(([key, status]) => {
                        const title = key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (c) => c.toUpperCase())
                          .trim()

                        return (
                          <div key={key} className="rf-card flex items-center justify-between gap-4 px-4 py-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{title}</span>
                                {statusBadge(status.status)}
                              </div>
                              <div className="mt-2 flex items-center gap-3">
                                <div className="flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      status.completion >= 90
                                        ? 'bg-gradient-to-r from-[var(--rf-green)] to-[var(--rf-cyan)]'
                                        : status.completion >= 70
                                        ? 'bg-gradient-to-r from-[var(--rf-amber)] to-[var(--rf-blue)]'
                                        : 'bg-gradient-to-r from-[var(--rf-red)] to-[var(--rf-amber)]'
                                    }`}
                                    style={{ width: `${status.completion}%` }}
                                  />
                                </div>
                                <span className="rf-mono text-xs text-[var(--rf-muted)]">{status.completion}%</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* Demo Project Section */}
            {section === 'demo-project' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                  <p className="mt-2 text-sm text-[var(--rf-muted)]">{project.description}</p>
                </div>

                {/* Project Metrics */}
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    { label: 'Total Pages', value: project.pages, icon: FileText },
                    { label: 'Keywords', value: project.keywords, icon: Search },
                    { label: 'Competitors', value: project.competitors, icon: BarChart3 },
                    { label: 'Industry', value: project.industry, icon: TrendingUp },
                  ].map((metric, i) => (
                    <div key={i} className="rf-card rf-topline flex flex-col gap-2 px-4 py-3">
                      <span className="text-xs font-medium text-[var(--rf-muted)]">{metric.label}</span>
                      <span className="text-2xl font-bold text-white">{metric.value}</span>
                    </div>
                  ))}
                </div>

                {/* Crawl Data */}
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-white">Site Analysis</h2>
                  <div className="rf-card rf-topline space-y-4 px-4 py-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium text-[var(--rf-muted)]">Indexation Rate</p>
                        <p className="mt-1 text-2xl font-bold text-[var(--rf-green)]">
                          {((demoData.crawl.indexedPages / demoData.crawl.totalPages) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[var(--rf-muted)]">Broken Links</p>
                        <p className="mt-1 text-2xl font-bold text-[var(--rf-amber)]">{demoData.crawl.brokenLinks}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--rf-muted)]">Core Web Vitals</p>
                      <div className="mt-2 space-y-2">
                        {[
                          { label: 'LCP', value: `${demoData.crawl.coreWebVitals.lcp.value}s`, status: demoData.crawl.coreWebVitals.lcp.status },
                          { label: 'FID', value: `${demoData.crawl.coreWebVitals.fid.value}ms`, status: demoData.crawl.coreWebVitals.fid.status },
                          { label: 'CLS', value: demoData.crawl.coreWebVitals.cls.value, status: demoData.crawl.coreWebVitals.cls.status },
                        ].map((vit) => (
                          <div key={vit.label} className="flex items-center justify-between text-sm">
                            <span className="text-[var(--rf-muted)]">{vit.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{vit.value}</span>
                              <span
                                className={`text-xs font-medium ${
                                  vit.status === 'good' ? 'text-[var(--rf-green)]' : 'text-[var(--rf-amber)]'
                                }`}
                              >
                                {vit.status === 'good' ? 'Good' : 'Needs Improvement'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Pages */}
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-white">Top Pages by Traffic</h2>
                  <div className="space-y-2">
                    {demoData.crawl.topPages.map((page, i) => (
                      <div key={i} className="rf-card flex items-center justify-between px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-white">{page.url}</p>
                          <p className="text-xs text-[var(--rf-muted)]">{page.keywords} keywords</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[var(--rf-blue-bright)]">{page.visits.toLocaleString()}</p>
                          <p className="text-xs text-[var(--rf-muted)]">visits</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Decision Engine Section */}
            {section === 'decision-engine' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white">Decision Engine</h1>
                    {statusBadge(FEATURE_STATUS.decisionEngine.status)}
                  </div>
                  <p className="mt-2 text-sm text-[var(--rf-muted)]">
                    Multi-objective ranking system that balances SEO opportunity with business value
                  </p>
                </div>

                {/* Objectives */}
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-white">Business Objectives</h2>
                  <div className="space-y-2">
                    {demoData.decisionEngine.objectives.map((obj, i) => (
                      <div key={i} className="rf-card px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{obj.label}</span>
                          <span className="text-sm font-semibold text-[var(--rf-blue-bright)]">{(obj.weight * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--rf-blue-bright)] to-[var(--rf-cyan)]"
                            style={{ width: `${obj.weight * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-white">Top Recommendations</h2>
                  <div className="space-y-3">
                    {demoData.decisionEngine.recommendations.map((rec, i) => (
                      <div key={i} className="rf-card rf-topline px-4 py-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-white">{rec.type}</p>
                            <p className="text-xs text-[var(--rf-muted)] mt-0.5">{rec.page}</p>
                          </div>
                          <span className="inline-flex items-center rounded-lg bg-[var(--rf-amber)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--rf-amber)]">
                            Pending
                          </span>
                        </div>
                        <div className="grid gap-3 md:grid-cols-3">
                          <div>
                            <p className="text-xs font-medium text-[var(--rf-muted)]">Business Value</p>
                            <p className="mt-1 text-lg font-bold text-white">{rec.businessValue}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[var(--rf-muted)]">SEO Opportunity</p>
                            <p className="mt-1 text-lg font-bold text-white">{rec.seoOpportunity}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[var(--rf-muted)]">Priority</p>
                            <p className="mt-1 text-lg font-bold text-white">#{rec.priority}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Operator Section */}
            {section === 'operator' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white">Operator</h1>
                    {statusBadge(FEATURE_STATUS.operator.status)}
                  </div>
                  <p className="mt-2 text-sm text-[var(--rf-muted)]">
                    AI decision maker that evaluates candidates and selects the primary mission
                  </p>
                </div>

                {/* Primary Mission */}
                <div className="rf-card rf-topline bg-gradient-to-br from-[var(--rf-blue)]/10 to-[var(--rf-cyan)]/10 px-4 py-4 md:px-6 md:py-6">
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">🎯 Primary Mission</h2>
                    <span className="inline-flex items-center rounded-lg bg-[var(--rf-green)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--rf-green)]">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Selected
                    </span>
                  </div>
                  <p className="mb-4 text-white font-semibold">{demoData.operator.primaryMission.action}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-[var(--rf-muted)]">Expected Gain</p>
                      <p className="mt-1 text-lg font-bold text-[var(--rf-green)]">{demoData.operator.primaryMission.expectedGain}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--rf-muted)]">Timeframe</p>
                      <p className="mt-1 text-lg font-bold text-white">{demoData.operator.primaryMission.timeframe}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--rf-muted)]">Risk Level</p>
                      <p className="mt-1 text-lg font-bold text-[var(--rf-green)]">{demoData.operator.primaryMission.riskLevel}</p>
                    </div>
                  </div>
                </div>

                {/* Shortlist */}
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-white">Shortlisted Candidates</h2>
                  <div className="space-y-3">
                    {demoData.operator.candidates.map((cand, i) => (
                      <div key={i} className="rf-card px-4 py-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-white">{cand.type}</p>
                            <p className="text-xs text-[var(--rf-muted)] mt-0.5">{cand.page}</p>
                          </div>
                          <span className="inline-flex items-center rounded-lg bg-[var(--rf-blue)]/15 px-2 py-1 text-xs font-semibold text-[var(--rf-blue-bright)]">
                            {(cand.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="grid gap-2 md:grid-cols-2 text-xs">
                          <span className="text-[var(--rf-muted)]">
                            Impact: <span className="font-semibold text-white capitalize">{cand.impact}</span>
                          </span>
                          <span className="text-[var(--rf-muted)]">
                            Effort: <span className="font-semibold text-white capitalize">{cand.effort}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Execution Section */}
            {section === 'execution' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white">Execution & Verification</h1>
                    {statusBadge(FEATURE_STATUS.executionEngine.status)}
                  </div>
                  <p className="mt-2 text-sm text-[var(--rf-muted)]">
                    Complete deployment workflow with automated verification and rollback capability
                  </p>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    { label: 'Total Executions', value: demoData.executionHistory.total, color: 'text-white' },
                    { label: 'Successful', value: demoData.executionHistory.successful, color: 'text-[var(--rf-green)]' },
                    { label: 'Failed', value: demoData.executionHistory.failed, color: 'text-[var(--rf-red)]' },
                    { label: 'Rolled Back', value: demoData.executionHistory.rollback, color: 'text-[var(--rf-amber)]' },
                  ].map((stat, i) => (
                    <div key={i} className="rf-card rf-topline px-4 py-3">
                      <p className="text-xs font-medium text-[var(--rf-muted)]">{stat.label}</p>
                      <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Recent Executions */}
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-white">Recent Executions</h2>
                  <div className="space-y-2">
                    {demoData.executionHistory.recent.map((exec, i) => (
                      <div key={i} className="rf-card flex items-center justify-between px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white">{exec.type}</p>
                          <p className="text-xs text-[var(--rf-muted)]">{exec.page}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs text-[var(--rf-muted)]">{exec.changedAt}</p>
                            {exec.issue && <p className="text-xs text-[var(--rf-red)]">{exec.issue}</p>}
                          </div>
                          <span
                            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                              exec.status === 'verified'
                                ? 'bg-[var(--rf-green)]/15 text-[var(--rf-green)]'
                                : 'bg-[var(--rf-amber)]/15 text-[var(--rf-amber)]'
                            }`}
                          >
                            {exec.status === 'verified' ? '✓ Verified' : '↩ Rolled Back'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification */}
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-white">Verification System</h2>
                  <div className="rf-card rf-topline px-4 py-4">
                    <p className="text-sm text-white mb-3 font-medium">8+ Automated Checks</p>
                    <div className="space-y-2">
                      {[
                        'HTML Validity',
                        'Schema Markup',
                        'Link Integrity',
                        'SEO Compliance',
                        'WordPress Health',
                        'No Plugin Conflicts',
                        'Page Load Impact',
                        'Mobile Responsiveness',
                      ].map((check) => (
                        <div key={check} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--rf-green)]" />
                          <span className="text-[var(--rf-muted)]">{check}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-[var(--rf-card-line)]">
                      <p className="text-xs font-medium text-[var(--rf-muted)]">Pass Rate</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[var(--rf-green)] to-[var(--rf-cyan)] rounded-full" style={{ width: '98%' }} />
                        </div>
                        <span className="ml-3 text-sm font-bold text-[var(--rf-green)]">98%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
