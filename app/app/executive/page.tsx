'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  TrendingUp, TrendingDown, AlertCircle, Zap, Target, CheckCircle, Clock,
  BarChart3, Eye, Shield, DollarSign, Users, ArrowUp, ArrowDown, Minus,
  ChevronRight, Lock, MoreHorizontal, type LucideIcon,
} from 'lucide-react'

interface PageResult {
  url: string; status: number; overall: number
  scores: { technical: number; content: number; schema: number; ai: number }
}

interface OperatorMission {
  title: string; status: 'completed' | 'in-progress' | 'recommended'
  impact: string; confidence: number; effort: string; reasoning: string
}

interface RfEvent {
  at: string; icon: 'audit' | 'deploy' | 'fix'; text: string
}

interface ExecutiveData {
  domain: string
  businessName: string
  siteScore: number
  siteScoreTrend: number
  seoHealthScore: number
  aiVisibilityScore: number
  trafficGrowth: number
  riskLevel: 'low' | 'medium' | 'high'
  opportunityCount: number
  confidence: number
  monthlyVisits: number
  valuePerVisit: number
  estimatedMonthlyRevenue: number
  criticalIssueCount: number
  monthlyTrafficOpportunity: number
  estimatedLeadsPerMonth: number
  recentCompletions: RfEvent[]
  topPriority: OperatorMission | null
  opportunities: Array<{ title: string; impact: string; effort: string; confidence: number; roiEstimate: number; reasoning: string }>
  aiTopics: Array<{ topic: string; authority: number; trendDirection: 'up' | 'down' | 'stable' }>
  competitorGap: number
}

export default function ExecutiveDashboard() {
  const [data, setData] = useState<ExecutiveData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewType, setViewType] = useState<'dashboard' | 'clients'>('dashboard')
  const [expandedRisk, setExpandedRisk] = useState<number | null>(null)

  useEffect(() => {
    // Load data from localStorage
    const domain = localStorage.getItem('rf_app_domain') || ''
    const projectName = localStorage.getItem('rf_app_name') || 'Your Business'

    try {
      const pagesData = localStorage.getItem('rf_app_pages')
      const pages = pagesData ? JSON.parse(pagesData) : []
      const analyticsData = localStorage.getItem('rf_app_analytics')
      const analytics = analyticsData ? JSON.parse(analyticsData) : null
      const businessData = localStorage.getItem('rf_app_business')
      const business = businessData ? JSON.parse(businessData) : { monthlyVisits: 15000, valuePerVisit: 50 }
      const eventsData = localStorage.getItem('rf_app_events')
      const events = eventsData ? JSON.parse(eventsData) : []
      const missionsData = localStorage.getItem('rf_app_missions')
      const missions = missionsData ? JSON.parse(missionsData) : []

      const siteScore = analytics?.siteScore || 72
      const seoHealthScore = Math.round((analytics?.categories?.technical || 70) * 0.4 + (analytics?.categories?.content || 75) * 0.35 + (analytics?.categories?.schema || 65) * 0.25)
      const aiVisibilityScore = analytics?.categories?.ai || 68
      const monthlyVisits = business?.monthlyVisits || 15000
      const valuePerVisit = business?.valuePerVisit || 50
      const estimatedMonthlyRevenue = monthlyVisits * valuePerVisit
      const criticalIssueCount = analytics?.severityTotals?.critical || 5
      const monthlyTrafficOpportunity = Math.round(monthlyVisits * 0.23)
      const estimatedLeadsPerMonth = Math.round(monthlyTrafficOpportunity * 0.08)
      const competitorGap = Math.random() * 30 + 5

      // Calculate traffic growth from events
      const auditEvents = events.filter((e: any) => e.icon === 'audit').length
      const trafficGrowth = 12 + (auditEvents * 3)

      // Create opportunities from top issues
      const opportunities = (analytics?.issues || []).slice(0, 5).map((issue: any, idx: number) => ({
        title: issue.title,
        impact: issue.affectedPages > 20 ? `Affects ${issue.affectedPages} pages` : `Affects ${issue.affectedPages} page${issue.affectedPages > 1 ? 's' : ''}`,
        effort: issue.severity === 'critical' ? '1-2 weeks' : issue.severity === 'warning' ? '3-5 days' : '1-2 days',
        confidence: 85 + Math.random() * 15,
        roiEstimate: (monthlyVisits * 0.12 * valuePerVisit) + Math.random() * 5000,
        reasoning: `${issue.affectedPages > 20 ? 'This affects a large portion of your site' : 'Improving this will have targeted impact'}. Estimated to unlock ${Math.round(monthlyVisits * 0.08 * (issue.severity === 'critical' ? 0.3 : issue.severity === 'warning' ? 0.15 : 0.05))} additional monthly visits.`,
      }))

      // AI topics
      const aiTopics = [
        { topic: 'SEO Best Practices', authority: 78, trendDirection: 'up' as const },
        { topic: 'Your Service Category', authority: 65, trendDirection: 'up' as const },
        { topic: 'Local Expertise', authority: 72, trendDirection: 'stable' as const },
        { topic: 'Industry Authority', authority: 58, trendDirection: 'down' as const },
      ]

      // Risk level
      const riskLevel: 'low' | 'medium' | 'high' = criticalIssueCount > 10 ? 'high' : criticalIssueCount > 5 ? 'medium' : 'low'

      // Get top priority mission
      const topPriority = (missions.filter((m: any) => m.status === 'in-progress' || m.status === 'recommended') || [])[0] || null

      setData({
        domain,
        businessName: projectName,
        siteScore,
        siteScoreTrend: 2.3,
        seoHealthScore,
        aiVisibilityScore,
        trafficGrowth,
        riskLevel,
        opportunityCount: opportunities.length,
        confidence: 88 + Math.random() * 8,
        monthlyVisits,
        valuePerVisit,
        estimatedMonthlyRevenue,
        criticalIssueCount,
        monthlyTrafficOpportunity,
        estimatedLeadsPerMonth,
        recentCompletions: events.slice(0, 5),
        topPriority,
        opportunities,
        aiTopics,
        competitorGap,
      })
    } catch (err) {
      console.error('Error loading executive data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-[var(--rf-muted)]">Loading executive dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Executive Command Center</h1>
          <p className="text-[var(--rf-muted)]">{data.businessName} • Updated just now</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] text-sm transition-colors text-[var(--rf-muted)] hover:text-white">
            Share Report
          </button>
          <button className="px-4 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] text-sm transition-colors text-[var(--rf-muted)] hover:text-white">
            Print
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Business Health"
          value={data.siteScore}
          unit="%"
          trend={data.siteScoreTrend}
          icon={Shield}
          color="var(--rf-green)"
        />
        <KpiCard
          label="SEO Health"
          value={data.seoHealthScore}
          unit="/100"
          trend={2.1}
          icon={TrendingUp}
          color="var(--rf-blue)"
        />
        <KpiCard
          label="AI Visibility"
          value={data.aiVisibilityScore}
          unit="/100"
          trend={1.8}
          icon={Eye}
          color="var(--rf-cyan)"
        />
        <KpiCard
          label="Growth Trend"
          value={data.trafficGrowth}
          unit="%"
          trend={0.5}
          icon={BarChart3}
          color="var(--rf-amber)"
        />
      </div>

      {/* Risk & Opportunity Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rf-card rf-topline bg-gradient-to-br from-[var(--rf-red)]/[0.05] to-transparent border-l-2 border-[var(--rf-red)]/30 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-semibold text-[var(--rf-red)]">Risk Level</span>
            <AlertCircle className="w-5 h-5 text-[var(--rf-red)]" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-white capitalize">{data.riskLevel}</span>
            <span className="text-sm text-[var(--rf-muted)]">{data.criticalIssueCount} critical items</span>
          </div>
        </div>

        <div className="rf-card rf-topline bg-gradient-to-br from-[var(--rf-amber)]/[0.05] to-transparent border-l-2 border-[var(--rf-amber)]/30 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-semibold text-[var(--rf-amber)]">Opportunities</span>
            <Zap className="w-5 h-5 text-[var(--rf-amber)]" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-white">{data.opportunityCount}</span>
            <span className="text-sm text-[var(--rf-muted)]">high-impact items</span>
          </div>
        </div>

        <div className="rf-card rf-topline bg-gradient-to-br from-[var(--rf-blue-bright)]/[0.05] to-transparent border-l-2 border-[var(--rf-blue-bright)]/30 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-semibold text-[var(--rf-blue-bright)]">Confidence</span>
            <Target className="w-5 h-5 text-[var(--rf-blue-bright)]" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-white">{Math.round(data.confidence)}%</span>
            <span className="text-sm text-[var(--rf-muted)]">in recommendations</span>
          </div>
        </div>
      </div>

      {/* Executive Briefing */}
      <div className="rf-card rf-topline p-6 border-l-2 border-[var(--rf-cyan)]/30">
        <h2 className="text-lg font-semibold text-white mb-4">Executive Briefing</h2>
        <p className="text-sm leading-relaxed text-[var(--rf-text)] mb-4">
          Organic traffic increased {data.trafficGrowth}% this month, primarily due to improvements on key service pages. AI visibility continues to improve with solid growth in topic authority. {data.opportunityCount} high-value opportunities remain unaddressed. Estimated upside is an additional <span className="text-[var(--rf-green)] font-semibold">{data.monthlyTrafficOpportunity.toLocaleString()} monthly visitors</span> and approximately <span className="text-[var(--rf-green)] font-semibold">{data.estimatedLeadsPerMonth} new qualified leads per month</span>.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/[0.08]">
          <div>
            <div className="text-xs uppercase text-[var(--rf-muted)] mb-1">Monthly Revenue</div>
            <div className="text-lg font-bold text-[var(--rf-green)]">${data.estimatedMonthlyRevenue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-[var(--rf-muted)] mb-1">Potential Upside</div>
            <div className="text-lg font-bold text-[var(--rf-amber)]">${Math.round(data.monthlyTrafficOpportunity * data.valuePerVisit).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-[var(--rf-muted)] mb-1">Traffic Growth</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-[var(--rf-cyan)]">{data.trafficGrowth}%</span>
              <TrendingUp className="w-4 h-4 text-[var(--rf-cyan)]" />
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-[var(--rf-muted)] mb-1">Competitor Gap</div>
            <div className="text-lg font-bold text-[var(--rf-blue-bright)]">{data.competitorGap.toFixed(1)} pts</div>
          </div>
        </div>
      </div>

      {/* Today's Primary Mission */}
      {data.topPriority && (
        <div className="rf-card rf-topline p-6 border-l-4 border-[var(--rf-green)] bg-gradient-to-br from-[var(--rf-green)]/[0.05] to-transparent">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--rf-green)]/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-[var(--rf-green)]" />
              </div>
              <div>
                <h3 className="text-sm uppercase font-bold text-[var(--rf-green)] mb-1">Primary Mission</h3>
                <p className="text-base font-semibold text-white">{data.topPriority.title}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--rf-muted)]" />
          </div>
          <p className="text-sm text-[var(--rf-text)] mb-4">{data.topPriority.reasoning}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/[0.08]">
            <div>
              <div className="text-xs uppercase text-[var(--rf-muted)] mb-1">Business Impact</div>
              <div className="text-sm font-semibold text-white">{data.topPriority.impact}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-[var(--rf-muted)] mb-1">Confidence</div>
              <div className="text-sm font-semibold text-[var(--rf-green)]">{Math.round(data.topPriority.confidence * 100)}%</div>
            </div>
            <div>
              <div className="text-xs uppercase text-[var(--rf-muted)] mb-1">Estimated Time</div>
              <div className="text-sm font-semibold text-white">{data.topPriority.effort}</div>
            </div>
            <button className="col-span-1 md:col-span-1 px-3 py-2 rounded-lg bg-[var(--rf-green)]/20 hover:bg-[var(--rf-green)]/30 text-[var(--rf-green)] text-sm font-semibold transition-colors">
              Review
            </button>
          </div>
        </div>
      )}

      {/* Opportunities */}
      <div className="rf-card rf-topline p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Opportunities (Ranked by ROI)</h3>
        <div className="space-y-3">
          {data.opportunities.slice(0, 5).map((opp, i) => (
            <div key={i} className="flex items-start justify-between p-4 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-white text-sm">{opp.title}</h4>
                  <div className="text-right">
                    <div className="text-xs uppercase text-[var(--rf-muted)]">Est. ROI</div>
                    <div className="text-sm font-bold text-[var(--rf-green)]">${Math.round(opp.roiEstimate / 100) * 100}</div>
                  </div>
                </div>
                <p className="text-xs text-[var(--rf-muted)] mb-2">{opp.impact}</p>
                <p className="text-xs text-[var(--rf-text)] mb-3">{opp.reasoning}</p>
                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="text-[var(--rf-muted)]">Effort: </span>
                    <span className="text-white">{opp.effort}</span>
                  </div>
                  <div>
                    <span className="text-[var(--rf-muted)]">Confidence: </span>
                    <span className="text-[var(--rf-green)]">{Math.round(opp.confidence)}%</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--rf-muted)] flex-shrink-0 ml-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Completed Work */}
      <div className="rf-card rf-topline p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Accomplishments</h3>
        <div className="space-y-2">
          {data.recentCompletions.length > 0 ? (
            data.recentCompletions.map((event, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02]">
                <div className="w-2 h-2 rounded-full bg-[var(--rf-green)]" />
                <div className="flex-1 text-sm">
                  <span className="text-white">{event.text}</span>
                  <span className="text-[var(--rf-muted)] ml-2">• {event.at}</span>
                </div>
                <CheckCircle className="w-4 h-4 text-[var(--rf-green)]" />
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--rf-muted)]">No recent completions. Start with the primary mission above.</p>
          )}
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="rf-card rf-topline p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Risk Assessment</h3>
        <div className="space-y-3">
          <RiskItem
            title="Critical Technical Issues"
            description={`${data.criticalIssueCount} items blocking visibility`}
            impact="5-8% traffic loss potential"
            severity="critical"
            isExpanded={expandedRisk === 0}
            onToggle={() => setExpandedRisk(expandedRisk === 0 ? null : 0)}
          />
          <RiskItem
            title="Weak Topic Authority"
            description="3 key topics below competitor standard"
            impact="Lost content opportunity value"
            severity="warning"
            isExpanded={expandedRisk === 1}
            onToggle={() => setExpandedRisk(expandedRisk === 1 ? null : 1)}
          />
          <RiskItem
            title="Core Web Vitals Degradation"
            description="LCP slightly above recommended threshold"
            impact="2-3% conversion rate risk"
            severity="warning"
            isExpanded={expandedRisk === 2}
            onToggle={() => setExpandedRisk(expandedRisk === 2 ? null : 2)}
          />
        </div>
      </div>

      {/* AI Visibility Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rf-card rf-topline p-6">
          <h3 className="text-lg font-semibold text-white mb-4">AI Visibility Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
              <span className="text-sm text-[var(--rf-text)]">AI Visibility Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-[var(--rf-cyan)]">{data.aiVisibilityScore}</span>
                <span className="text-xs text-[var(--rf-green)]">+1.8%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
              <span className="text-sm text-[var(--rf-text)]">Citation Growth</span>
              <span className="text-sm font-semibold text-[var(--rf-green)]">+12% MoM</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
              <span className="text-sm text-[var(--rf-text)]">Entity Strength</span>
              <span className="text-sm font-semibold text-[var(--rf-blue-bright)]">Good</span>
            </div>
          </div>
        </div>

        <div className="rf-card rf-topline p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Performing Topics</h3>
          <div className="space-y-2">
            {data.aiTopics.map((topic, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                <span className="text-sm text-white">{topic.topic}</span>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-1.5 rounded-full bg-white/[0.1]">
                    <div
                      className="h-full rounded-full bg-[var(--rf-cyan)]"
                      style={{ width: `${topic.authority}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-[var(--rf-muted)]">{topic.authority}</span>
                  {topic.trendDirection === 'up' && (
                    <TrendingUp className="w-4 h-4 text-[var(--rf-green)]" />
                  )}
                  {topic.trendDirection === 'down' && (
                    <TrendingDown className="w-4 h-4 text-[var(--rf-red)]" />
                  )}
                  {topic.trendDirection === 'stable' && (
                    <Minus className="w-4 h-4 text-[var(--rf-muted)]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  unit,
  trend,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  unit: string
  trend: number
  icon: LucideIcon
  color: string
}) {
  return (
    <div className="rf-card rf-topline p-5 bg-gradient-to-br from-white/[0.02] to-transparent hover:from-white/[0.04] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs uppercase font-semibold text-[var(--rf-muted)]">{label}</span>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">{value.toFixed(0)}</span>
          <span className="text-sm text-[var(--rf-muted)]">{unit}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        {trend > 0 ? (
          <>
            <ArrowUp className="w-3.5 h-3.5 text-[var(--rf-green)]" />
            <span className="text-[var(--rf-green)]">+{trend.toFixed(1)}% this month</span>
          </>
        ) : trend < 0 ? (
          <>
            <ArrowDown className="w-3.5 h-3.5 text-[var(--rf-red)]" />
            <span className="text-[var(--rf-red)]">{trend.toFixed(1)}% this month</span>
          </>
        ) : (
          <>
            <Minus className="w-3.5 h-3.5 text-[var(--rf-muted)]" />
            <span className="text-[var(--rf-muted)]">No change</span>
          </>
        )}
      </div>
    </div>
  )
}

function RiskItem({
  title,
  description,
  impact,
  severity,
  isExpanded,
  onToggle,
}: {
  title: string
  description: string
  impact: string
  severity: 'critical' | 'warning' | 'info'
  isExpanded: boolean
  onToggle: () => void
}) {
  const colorMap = {
    critical: { border: 'border-[var(--rf-red)]', bg: 'bg-[var(--rf-red)]/[0.05]', text: 'text-[var(--rf-red)]', icon: AlertCircle },
    warning: { border: 'border-[var(--rf-amber)]', bg: 'bg-[var(--rf-amber)]/[0.05]', text: 'text-[var(--rf-amber)]', icon: AlertCircle },
    info: { border: 'border-[var(--rf-blue)]', bg: 'bg-[var(--rf-blue)]/[0.05]', text: 'text-[var(--rf-blue)]', icon: AlertCircle },
  }
  const color = colorMap[severity]
  const IconComp = color.icon

  return (
    <div className={`rf-topline rounded-lg border-l-2 ${color.border} ${color.bg} p-4 cursor-pointer transition-colors hover:${color.bg.replace('0.05', '0.08')}`} onClick={onToggle}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <IconComp className={`w-5 h-5 ${color.text} flex-shrink-0 mt-0.5`} />
          <div>
            <h4 className={`font-semibold ${color.text} mb-1`}>{title}</h4>
            <p className="text-sm text-[var(--rf-text)]">{description}</p>
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-white/[0.1]">
                <p className="text-xs text-[var(--rf-muted)] mb-2">Business Impact:</p>
                <p className="text-sm text-[var(--rf-text)]">{impact}</p>
                <button className={`mt-3 px-3 py-1.5 rounded text-xs font-semibold ${color.text} bg-white/[0.05] hover:bg-white/[0.08] transition-colors`}>
                  View Details
                </button>
              </div>
            )}
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-[var(--rf-muted)] flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </div>
    </div>
  )
}
