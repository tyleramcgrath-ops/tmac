'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, TrendingUp, Target, AlertCircle, Zap, Users } from 'lucide-react'
import type { PageResult, Analytics } from '@/lib/demo-data'
import type { BusinessIntelligence } from '@/lib/business-intelligence'
import type { OrganicIntelligence } from '@/lib/organic-intelligence'
import { analyzeStrategicPosition } from '@/lib/strategic-planning'
import type { StrategicPlan } from '@/lib/strategic-planning'

export default function StrategicPage() {
  const [plan, setPlan] = useState<StrategicPlan | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDemo = async () => {
      const response = await fetch('/api/demo-data')
      const data = await response.json()

      const pages = data.pages as PageResult[]
      const analytics = data.analytics as Analytics
      const business = data.business as BusinessIntelligence
      const organic = data.organic as OrganicIntelligence

      const plan = analyzeStrategicPosition(
        pages,
        analytics,
        business,
        organic,
        'Example Business',
        5000,
        150
      )
      setPlan(plan)
      setLoading(false)
    }

    loadDemo()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-12 bg-slate-200 rounded animate-pulse" />
        <div className="h-80 bg-slate-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!plan) {
    return <div className="p-6 text-center text-slate-500">No strategic plan available</div>
  }

  const toggleSection = (section: string) => {
    const newSections = new Set(expandedSections)
    if (newSections.has(section)) {
      newSections.delete(section)
    } else {
      newSections.add(section)
    }
    setExpandedSections(newSections)
  }

  const Section = ({ id, title, icon: Icon, children }: any) => (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => toggleSection(id)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-150 border-b border-slate-200 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-500 transition-transform ${
            expandedSections.has(id) ? 'rotate-180' : ''
          }`}
        />
      </button>
      {expandedSections.has(id) && <div className="p-6 space-y-4">{children}</div>}
    </div>
  )

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-slate-900">Strategic Plan</h1>
        <p className="text-lg text-slate-600">12-month roadmap for company-wide growth</p>
      </div>

      {/* OVERVIEW */}
      <Section id="overview" title="Market Position & Maturity" icon={Target}>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-700 font-medium">Business Maturity</div>
            <div className="text-2xl font-bold text-blue-900 capitalize">{plan.maturity.businessMaturity}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-sm text-green-700 font-medium">Competitive Maturity</div>
            <div className="text-2xl font-bold text-green-900 capitalize">{plan.maturity.competitiveMaturity}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-sm text-purple-700 font-medium">Content Maturity</div>
            <div className="text-2xl font-bold text-purple-900 capitalize">{plan.maturity.contentMaturity}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-sm text-orange-700 font-medium">Authority Maturity</div>
            <div className="text-2xl font-bold text-orange-900 capitalize">{plan.maturity.authorityMaturity}</div>
          </div>
        </div>
        <p className="text-slate-700 mt-4">{plan.maturity.summary}</p>
      </Section>

      {/* SWOT */}
      <Section id="swot" title="SWOT Analysis" icon={AlertCircle}>
        <div className="grid grid-cols-2 gap-4">
          {/* Strengths */}
          <div>
            <h3 className="font-semibold text-green-900 mb-3">Strengths</h3>
            <ul className="space-y-2">
              {plan.swot.strengths.slice(0, 5).map((s, i) => (
                <li key={i} className="bg-green-50 p-3 rounded border border-green-200">
                  <div className="font-medium text-green-900">{s.title}</div>
                  <div className="text-sm text-green-700">{s.evidence}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div>
            <h3 className="font-semibold text-red-900 mb-3">Weaknesses</h3>
            <ul className="space-y-2">
              {plan.swot.weaknesses.slice(0, 5).map((w, i) => (
                <li key={i} className="bg-red-50 p-3 rounded border border-red-200">
                  <div className="font-medium text-red-900">{w.title}</div>
                  <div className="text-sm text-red-700">{w.evidence}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Opportunities */}
          <div>
            <h3 className="font-semibold text-blue-900 mb-3">Opportunities</h3>
            <ul className="space-y-2">
              {plan.swot.opportunities.slice(0, 5).map((o, i) => (
                <li key={i} className="bg-blue-50 p-3 rounded border border-blue-200">
                  <div className="font-medium text-blue-900">{o.title}</div>
                  <div className="text-sm text-blue-700">ROI: {Math.round(o.potentialROI)}%</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Threats */}
          <div>
            <h3 className="font-semibold text-amber-900 mb-3">Threats</h3>
            <ul className="space-y-2">
              {plan.swot.threats.slice(0, 5).map((t, i) => (
                <li key={i} className="bg-amber-50 p-3 rounded border border-amber-200">
                  <div className="font-medium text-amber-900">{t.title}</div>
                  <div className="text-sm text-amber-700">{t.evidence}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* GROWTH PLAN */}
      <Section id="growth" title="12-Month Growth Roadmap" icon={TrendingUp}>
        <div className="space-y-4">
          {Object.entries(plan.growthPlan.phases).map(([phaseKey, initiatives]: [string, any]) => (
            <div key={phaseKey} className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-slate-900 capitalize">
                {phaseKey.replace(/_/g, ' ')}
              </h3>
              <div className="mt-2 space-y-1">
                {initiatives.slice(0, 3).map((init: any, j: number) => (
                  <div key={j} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-blue-600 font-medium">•</span>
                    <span>{init.title}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-sm">
                <span className="text-green-700 font-medium">
                  Expected ROI: {initiatives.length > 0 ? '+' + Math.round(initiatives[0].expectedROI.revenue) : '0'}%
                </span>
              </div>
            </div>
          ))}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
            <div className="text-sm text-blue-700 font-medium">Total Plan ROI</div>
            <div className="text-3xl font-bold text-blue-900">
              +{plan.growthPlan.totalROI.revenue}%
            </div>
          </div>
        </div>
      </Section>

      {/* STRATEGIC INITIATIVES */}
      <Section id="initiatives" title="Strategic Initiatives" icon={Zap}>
        <div className="space-y-3">
          {/* Flatten all initiatives from all phases */}
          {Object.values(plan.growthPlan.phases)
            .flat()
            .slice(0, 8)
            .map((init: any, i: number) => (
              <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">{init.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{init.description}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {init.type}
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Priority {init.priority}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      +{init.expectedROI.revenue}%
                    </div>
                    <div className="text-xs text-slate-500">{init.timeline}</div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Section>

      {/* INVESTMENT PLANS */}
      <Section id="investment" title="Investment Plans (5 Budget Levels)" icon={Users}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plan.investmentPlans.map((inv, i) => (
            <div key={i} className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 capitalize">{inv.budget}</h3>
              <div className="mt-3 space-y-2">
                <div className="text-sm text-slate-700">
                  <span className="font-medium">Initiatives:</span> {inv.initiatives.length}
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-medium">Monthly Hours:</span> {inv.monthlyHours}
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-medium">Timeframe:</span> {inv.timeframe}
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-medium">Expected ROI:</span> +{inv.expectedROI.revenue}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* BUSINESS SCENARIOS */}
      <Section id="scenarios" title="What-If Business Scenarios" icon={Target}>
        <div className="space-y-3">
          {plan.scenarios.slice(0, 3).map((scenario, i) => (
            <div key={i} className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-900 capitalize">{scenario.name}</h3>
              <p className="text-sm text-purple-700 mt-1">{scenario.description}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div className="bg-white p-2 rounded border border-purple-100">
                  <div className="text-xs text-purple-600 font-medium">Traffic Change</div>
                  <div className="font-bold text-purple-900">{scenario.projectedOutcomes.trafficChange}%</div>
                </div>
                <div className="bg-white p-2 rounded border border-purple-100">
                  <div className="text-xs text-purple-600 font-medium">Revenue Change</div>
                  <div className="font-bold text-purple-900">{scenario.projectedOutcomes.revenueChange}%</div>
                </div>
                <div className="bg-white p-2 rounded border border-purple-100">
                  <div className="text-xs text-purple-600 font-medium">Confidence</div>
                  <div className="font-bold text-purple-900">{Math.round(scenario.projectedOutcomes.confidence * 100)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* QUARTERLY GOALS */}
      <Section id="quarterly" title="Quarterly Goals & KPIs" icon={Target}>
        <div className="grid grid-cols-2 gap-4">
          {plan.quarterlyGoals.map((goal, i) => (
            <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3">{goal.quarter}</h3>
              <div className="space-y-2">
                <div className="text-sm text-slate-700">
                  <span className="font-medium">Objective:</span> {goal.businessObjective}
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-medium">Expected ROI:</span> {goal.expectedROI}%
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-1">
                {goal.keyMetrics.slice(0, 3).map((km, j) => (
                  <div key={j}>
                    <span className="font-medium">{km.metric}:</span> {km.target} {km.unit}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* EXECUTIVE REPORTS */}
      <Section id="reports" title="Executive Reports" icon={Users}>
        <div className="space-y-4">
          {Object.values(plan.executiveReports).map((report: any, i: number) => (
            <div key={i} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 capitalize">{report.audience}</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white p-2 rounded border border-blue-100">
                  <div className="text-xs text-blue-600 font-medium">Revenue Generated</div>
                  <div className="font-bold text-blue-900">${report.businessImpact.revenueGenerated}k</div>
                </div>
                <div className="bg-white p-2 rounded border border-blue-100">
                  <div className="text-xs text-blue-600 font-medium">Traffic Gained</div>
                  <div className="font-bold text-blue-900">+{report.businessImpact.trafficGained}%</div>
                </div>
                <div className="bg-white p-2 rounded border border-blue-100">
                  <div className="text-xs text-blue-600 font-medium">Leads Generated</div>
                  <div className="font-bold text-blue-900">{report.businessImpact.leadsGenerated}</div>
                </div>
                <div className="bg-white p-2 rounded border border-blue-100">
                  <div className="text-xs text-blue-600 font-medium">ROI</div>
                  <div className="font-bold text-blue-900">{report.businessImpact.roi}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* COMPETITIVE PLAYBOOK */}
      <Section id="competitive" title="Competitive Playbook" icon={Users}>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Likely Competitors</h3>
            <div className="flex flex-wrap gap-2">
              {plan.competitivePlaybook.competitors.slice(0, 5).map((c, i) => (
                <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                  {c.name}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Strategic Advantages</h3>
            <ul className="space-y-1">
              {plan.competitivePlaybook.strategicAdvantages.slice(0, 5).map((item, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Threats to Monitor</h3>
            <ul className="space-y-1">
              {plan.competitivePlaybook.threatsToMonitor.slice(0, 3).map((item, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-amber-600 font-bold">⚠</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* STRATEGIC MEMORY */}
      <Section id="memory" title="Strategic Memory & Learning" icon={Target}>
        <div className="space-y-4">
          {plan.memory.length > 0 ? (
            <>
              <div>
                <h3 className="font-semibold text-green-900 mb-2">Initiative Status</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <div className="text-xs text-green-600 font-medium">Successful</div>
                    <div className="text-2xl font-bold text-green-900">
                      {plan.memory.filter(m => m.status === 'successful').length}
                    </div>
                  </div>
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <div className="text-xs text-red-600 font-medium">Failed</div>
                    <div className="text-2xl font-bold text-red-900">
                      {plan.memory.filter(m => m.status === 'failed').length}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Recent Initiatives</h3>
                <ul className="space-y-2">
                  {plan.memory.slice(0, 3).map((item, i) => (
                    <li key={i} className="text-sm bg-slate-50 p-3 rounded border border-slate-200">
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-600 mt-1">
                        Status: {item.status} | ROI: {item.actualROI}%
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-slate-600 text-sm">No strategic memory recorded yet</p>
          )}
        </div>
      </Section>
    </div>
  )
}
